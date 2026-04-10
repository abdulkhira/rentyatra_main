const RentalRequest = require('../models/RentalRequest');
const { cloudinary, deleteImage, extractPublicId } = require('../config/cloudinary');
const mongoose = require('mongoose');

// @desc    Get all public approved rental requests (for regular users)
// @route   GET /api/rental-requests
// @access  Public
const getPublicRentalRequests = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      category,
      city,
      userLat,
      userLng,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query - only show approved rental requests
    const query = {
      status: 'approved'
    };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'location.city': { $regex: search, $options: 'i' } },
        { 'location.state': { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      // If category is provided, we need to find the category by name first
      const Category = require('../models/Category');
      const categoryDoc = await Category.findOne({ name: { $regex: category, $options: 'i' } });
      if (categoryDoc) {
        query.category = categoryDoc._id;
      } else {
        // If category not found, return empty results
        query.category = null;
      }
    }

    if (city) {
      query['location.city'] = { $regex: city, $options: 'i' };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query with location-based filtering if user coordinates provided
    let requests;
    if (userLat && userLng) {
      console.log('Using location-based filtering in getPublicRentalRequests:', { userLat, userLng });

      // Use findNearbyRequests to filter by each product's serviceRadius
      requests = await RentalRequest.findNearbyRequests(
        parseFloat(userLat),
        parseFloat(userLng),
        50 // Maximum distance limit (actual filtering uses each product's serviceRadius)
      )
        .where(query) // Apply additional filters (search, category, city)
        .populate('user', 'name email')
        .populate('product', 'name')
        .populate('category', 'name')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .select('-reviewedBy -reviewedAt -rejectionReason');
    } else {
      // Regular query without location filtering
      requests = await RentalRequest.find(query)
        .populate('user', 'name email')
        .populate('product', 'name')
        .populate('category', 'name')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .select('-reviewedBy -reviewedAt -rejectionReason');
    }

    // Exclude listings whose owner/user no longer exists or is inactive/blocked
    const invalidRequests = requests.filter(req => !req.user || !req.user._id);
    if (invalidRequests.length > 0) {
      console.warn(`⚠️ Found ${invalidRequests.length} rental requests with invalid/missing users in getPublicRentalRequests`);
    }
    requests = requests.filter(req => req.user && req.user._id);

    const total = await RentalRequest.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        requests,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalRequests: total,
          hasNext: skip + requests.length < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching public rental requests:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching rental requests',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get single public rental request (for regular users)
// @route   GET /api/rental-requests/:id
// @access  Public
const getPublicRentalRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query; // Optional: to check if user owns the request

    console.log('Debug - getPublicRentalRequest called with:', { id, userId });

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('Debug - Invalid ObjectId format for id:', id);
      return res.status(400).json({
        success: false,
        message: 'Invalid rental request ID format'
      });
    }

    // Build query - show approved requests or user's own requests
    const query = {
      _id: id,
      $or: [
        { status: 'approved' }, // Show approved requests to everyone
        ...(userId ? [{ user: mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId, status: { $in: ['pending', 'approved', 'rejected'] } }] : []) // Show user's own requests regardless of status
      ]
    };

    console.log('Debug - Query:', JSON.stringify(query, null, 2));

    const request = await RentalRequest.findOne(query)
      .populate('user', 'name email')
      .populate('product', 'name')
      .populate('category', 'name')
      .select('-reviewedBy -reviewedAt -rejectionReason'); // Exclude admin-specific fields

    console.log('Debug - Found request:', request ? 'Yes' : 'No');
    if (request) {
      console.log('Debug - Request status:', request.status);
      console.log('Debug - Request user:', request.user?._id);
    }

    // If owner no longer exists, don't expose the listing
    if (!request || !request.user) {
      // Fallback: Check if request exists at all (for debugging)
      const anyRequest = await RentalRequest.findById(id);
      console.log('Debug - Request exists in DB:', anyRequest ? 'Yes' : 'No');
      if (anyRequest) {
        console.log('Debug - Request status in DB:', anyRequest.status);
        console.log('Debug - Request user in DB:', anyRequest.user);
      }

      return res.status(404).json({
        success: false,
        message: 'Rental request not found or not available'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        request
      }
    });

  } catch (error) {
    console.error('Error fetching public rental request:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching rental request',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get featured rental requests (for homepage)
// @route   GET /api/rental-requests/featured
// @access  Public
const getFeaturedRentalRequests = async (req, res) => {
  // Check MongoDB connection before proceeding
  const mongoose = require('mongoose');
  if (mongoose.connection.readyState !== 1) {
    console.error('❌ MongoDB not connected, cannot fetch featured rental requests');
    return res.status(503).json({
      success: false,
      message: 'Database service unavailable. Please try again later.',
      error: 'MongoDB connection not established'
    });
  }

  try {
    // Increase default limit to show more rentals, or use a very high limit
    const { limit = 1000, city, userLat, userLng, serviceRadius = 7 } = req.query;

    // Build query - only show approved rental requests (all approved rentals should show)
    const query = {
      status: 'approved'
    };

    // Add city filter if provided (but don't restrict if not provided)
    if (city) {
      query['location.city'] = { $regex: city, $options: 'i' };
    }

    let requests;

    // If user coordinates are provided, use location-based filtering
    if (userLat && userLng) {
      console.log('Using location-based filtering based on each product\'s serviceRadius:', { userLat, userLng });

      // Use the findNearbyRequests static method for location-based filtering
      // This will filter products where user is within each product's individual serviceRadius
      // maxDistanceKm parameter is now a safety limit (50km), actual filtering uses product.serviceRadius
      requests = await RentalRequest.findNearbyRequests(
        parseFloat(userLat),
        parseFloat(userLng),
        50 // Maximum distance limit for safety (actual filtering uses each product's serviceRadius)
      )
        .populate('user', 'name email')
        .populate('product', 'name')
        .populate('category', 'name')
        .sort({ isBoosted: -1, boostedAt: -1, createdAt: -1 })
        .limit(parseInt(limit))
        .select('-reviewedBy -reviewedAt -rejectionReason');

      console.log(`After location filtering (user must be within each product's serviceRadius), found: ${requests.length} requests`);

      // Exclude listings whose owner/user no longer exists
      const invalidRequests = requests.filter(req => !req.user || !req.user._id);
      if (invalidRequests.length > 0) {
        // Only log in development or if there are many orphaned requests
        if (process.env.NODE_ENV === 'development' || invalidRequests.length > 5) {
          console.warn(`⚠️ Found ${invalidRequests.length} orphaned rental requests (users don't exist). Use /api/admin/rental-requests/cleanup-orphaned to clean them up.`);
        }
      }

      requests = requests.filter(req => req.user && req.user._id);

      console.log('After filtering invalid users, found:', requests.length, 'requests');
    } else {
      console.log('Using regular query without location filtering - fetching ALL approved rentals');
      console.log('Query:', JSON.stringify(query, null, 2));

      // Regular query without location filtering - fetch all approved rentals
      // Sort by boosted first, then by creation date (newest first)
      requests = await RentalRequest.find(query)
        .populate('user', 'name email')
        .populate('product', 'name')
        .populate('category', 'name')
        .sort({ isBoosted: -1, boostedAt: -1, createdAt: -1 })
        .limit(parseInt(limit))
        .select('-reviewedBy -reviewedAt -rejectionReason');

      console.log('After regular query, found:', requests.length, 'requests');

      // Exclude listings whose owner/user no longer exists
      const invalidRequests = requests.filter(req => !req.user || !req.user._id);
      if (invalidRequests.length > 0) {
        // Only log once per hour to reduce log noise in production
        // Log full details only in development
        if (process.env.NODE_ENV === 'development') {
          console.warn(`⚠️ Found ${invalidRequests.length} orphaned rental requests (users don't exist). Use /api/admin/rental-requests/cleanup-orphaned to clean them up.`);
          console.warn('Orphaned requests:', invalidRequests.map(req => ({
            requestId: req._id,
            title: req.title,
            userId: req.user ? req.user._id : 'MISSING',
            status: req.status
          })));
        } else {
          // In production, only log a summary (not full list)
          console.warn(`⚠️ Found ${invalidRequests.length} orphaned rental requests. These are filtered out. Use admin cleanup endpoint to remove them.`);
        }
      }

      requests = requests.filter(req => req.user && req.user._id);

      console.log('After filtering invalid users, found:', requests.length, 'requests');
      if (invalidRequests.length > 0 && process.env.NODE_ENV === 'development') {
        console.log(`⚠️ Removed ${invalidRequests.length} orphaned rental requests (users don't exist)`);
      }
      console.log('All approved rentals are being included in featured listings');
    }

    console.log(`Found ${requests.length} featured rental requests (all approved rentals included)`);

    res.status(200).json({
      success: true,
      data: {
        requests
      }
    });

  } catch (error) {
    console.error('Error fetching featured rental requests:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching featured rental requests',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Create rental request (for regular users)
// @route   POST /api/rental-requests
// @access  Private (User)

const createRentalRequest = async (req, res) => {
  try {
    console.log('=== Create Rental Request Started ===');
    
    // 1. Authenticated User Check
    const userId = req.user?.userId || req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({ success: false, message: 'User account not found' });
    }

    // 2. Extract Fields from Request Body
    const {
      title,
      description,
      pricePerDay,
      priceAmount,
      pricePeriod,
      product,
      category,
      location, // This might be the address string from frontend
      address,
      city,
      state,
      pincode,
      coordinates,
      serviceRadius,
      condition,
      features,
      tags,
      startDate,
      phone,
      email,
      alternatePhone
    } = req.body;

    // 3. Basic Validation
    if (!title || !description || !(pricePerDay || priceAmount) || !category || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, description, price, category, or phone'
      });
    }

    // --- 4. UNIVERSAL SAFE PARSING (Handles JSON or FormData strings) ---

    const safeParse = (data, defaultVal = null) => {
      if (!data) return defaultVal;
      if (typeof data === 'string') {
        try { return JSON.parse(data); } catch (e) { return defaultVal; }
      }
      return data;
    };

    // Images Processing
    const rawImages = safeParse(req.body.images, []);
    const images = rawImages.map((img, index) => ({
      url: img.url,
      publicId: img.publicId || "",
      isPrimary: img.isPrimary || index === 0,
      uploadedAt: new Date()
    }));

    // Video Processing
    const rawVideo = safeParse(req.body.video);
    const video = rawVideo?.url ? {
      url: rawVideo.url,
      publicId: rawVideo.publicId || "",
      uploadedAt: new Date()
    } : null;

    // Coordinates Mapping
    const rawCoords = safeParse(coordinates);
    const parsedCoordinates = {
      latitude: rawCoords?.lat || rawCoords?.latitude || 22.9676,
      longitude: rawCoords?.lng || rawCoords?.longitude || 76.0508
    };

    // Arrays (Features & Tags)
    const featuresArray = Array.isArray(features) ? features : safeParse(features, []);
    const tagsArray = Array.isArray(tags) ? tags : safeParse(tags, []);

    // 5. Construct Schema-Compliant Data Object
    const rentalRequestData = {
      title: title.trim(),
      description: description.trim(),
      location: {
        address: address || location,
        city: city || 'Not specified',
        state: state || 'Not specified',
        pincode: pincode || '000000',
        coordinates: parsedCoordinates,
        serviceRadius: parseInt(serviceRadius) || 7,
        locationType: req.body.locationType || 'residential'
      },
      price: {
        pricePerDay: parseFloat(pricePerDay || priceAmount),
        amount: parseFloat(priceAmount || pricePerDay),
        currency: req.body.currency || 'INR',
        period: pricePeriod || 'daily'
      },
      product,
      category,
      condition: condition || 'good',
      features: featuresArray,
      tags: tagsArray,
      images,
      video,
      user: userId,
      contactInfo: {
        phone: phone,
        email: email || userExists.email,
        alternatePhone: alternatePhone || null
      },
      availability: {
        startDate: startDate ? new Date(startDate) : new Date(),
        isAvailable: true
      },
      status: 'pending'
    };

    // 6. Save to Database
    const rentalRequest = new RentalRequest(rentalRequestData);
    await rentalRequest.save();

    console.log('✅ Listing saved:', rentalRequest._id);

    // 7. Update Subscription Counter
    try {
      let subscription = await Subscription.findOne({
        userId: userId,
        status: 'active',
        endDate: { $gt: new Date() }
      });

      if (!subscription) {
        // Create default plan if none exists
        subscription = new Subscription({
          userId: userId,
          planId: 'free_tier',
          planName: 'Free Tier',
          status: 'active',
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          maxListings: 2,
          currentListings: 0
        });
      }

      subscription.currentListings += 1;
      await subscription.save();
    } catch (subErr) {
      console.error('⚠️ Subscription update failed (Non-critical):', subErr.message);
    }

    // 8. Final Response
    res.status(201).json({
      success: true,
      message: 'Rental request submitted successfully and is pending review.',
      data: rentalRequest
    });

  } catch (error) {
    console.error('❌ Controller Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while creating listing',
      error: error.message
    });
  }
};

const createRentalRequest2 = async (req, res) => {
  try {
    console.log('=== Create Rental Request ===');
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);
    console.log('User info:', req.user);

    // Validate that user exists in database before creating rental request
    const User = require('../models/User');
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Verify user exists in database
    const userExists = await User.findById(userId).select('_id');
    if (!userExists) {
      console.error('❌ User not found in database:', userId);
      return res.status(404).json({
        success: false,
        message: 'User account not found. Please login again.'
      });
    }

    console.log('✅ User verified in database:', userId);

    // Debug specific fields
    console.log('Debug fields:', {
      title: req.body.title,
      description: req.body.description,
      priceAmount: req.body.priceAmount,
      pricePeriod: req.body.pricePeriod,
      product: req.body.product,
      category: req.body.category,
      location: req.body.location,
      address: req.body.address,
      city: req.body.city,
      state: req.body.state,
      pincode: req.body.pincode,
      phone: req.body.phone,
      email: req.body.email,
      userId: req.user?.userId
    });

    const {
      title,
      description,
      pricePerDay,
      priceAmount,
      pricePeriod,
      product,
      category,
      location,
      address,
      city,
      state,
      pincode,
      coordinates,
      serviceRadius,
      condition,
      features,
      tags,
      startDate,
      phone,
      email,
      alternatePhone
    } = req.body;

    // Validate required fields
    if (!title || !description || !(pricePerDay || priceAmount) || !category || !location || !phone || !email) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, description, price, category, location, phone, email'
      });
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(product)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID'
      });
    }

    // Process uploaded files (images and videos)
    let videoUrl = null;
    let videoPublicId = null;

    /**
     * ✅ FORCE SAFE PARSING
     */

  let images = [];
let video = null;

// IMAGES
if (req.body.images) {
  try {
    const parsed = JSON.parse(req.body.images);

    images = parsed
      .filter(img => img && img.url) // 🔥 IMPORTANT
      .map((img, index) => ({
        url: img.url,
        publicId: img.publicId || "",
        isPrimary: index === 0,
        uploadedAt: new Date()
      }));

  } catch (err) {
    console.error("❌ Images parse failed:", err);
  }
}

// VIDEO
if (req.body.video) {
  try {
    const parsed = JSON.parse(req.body.video);

    if (parsed?.url) {
      video = {
        url: parsed.url,
        publicId: parsed.publicId || "",
        uploadedAt: new Date()
      };
    }

  } catch (err) {
    console.error("❌ Video parse failed:", err);
  }
}
    // Parse features and tags if they are strings
    let featuresArray = [];
    let tagsArray = [];

    if (features) {
      try {
        featuresArray = typeof features === 'string' ? JSON.parse(features) : features;
      } catch (e) {
        featuresArray = features.split(',').map(f => f.trim());
      }
    }

    if (tags) {
      try {
        tagsArray = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch (e) {
        tagsArray = tags.split(',').map(t => t.trim());
      }
    }

    // Parse coordinates if provided
    let parsedCoordinates = null;
    if (coordinates) {
      try {
        parsedCoordinates = typeof coordinates === 'string'
          ? JSON.parse(coordinates)
          : coordinates;
      } catch (e) {
        console.log('Invalid coordinates format, ignoring:', coordinates);
      }
    }

    // Parse service radius
    console.log('Debug - serviceRadius from req.body:', serviceRadius);
    console.log('Debug - typeof serviceRadius:', typeof serviceRadius);
    const parsedServiceRadius = serviceRadius ? parseInt(serviceRadius) : 7;
    console.log('Debug - parsedServiceRadius:', parsedServiceRadius);
    if (parsedServiceRadius < 1 || parsedServiceRadius > 50) {
      return res.status(400).json({
        success: false,
        message: 'Service radius must be between 1 and 50 km'
      });
    }

    // Create rental request data
    const rentalRequestData = {
      title: title.trim(),
      description: description.trim(),
      location: {
        address: address || location,
        city: city || 'Not specified',
        state: state || 'Not specified',
        pincode: pincode || '000000',
        coordinates: parsedCoordinates ? {
          latitude: parsedCoordinates.lat || parsedCoordinates.latitude,
          longitude: parsedCoordinates.lng || parsedCoordinates.longitude
        } : {
          latitude: 22.9676, // Default to Dewas coordinates
          longitude: 76.0508
        },
        serviceRadius: parsedServiceRadius,
        locationType: 'residential'
      },
      price: {
        pricePerDay: parseFloat(pricePerDay || priceAmount),
        amount: parseFloat(pricePerDay || priceAmount),
        currency: 'INR',
        period: pricePeriod || 'daily'
      },
      product: product,
      category: category,
      condition: condition || 'good',
      features: featuresArray || [],
      images: images || [],
      video: video || null,
      user: req.user.userId,
      contactInfo: {
        phone: phone,
        email: email,
        alternatePhone: alternatePhone || null
      },
      availability: {
        startDate: startDate ? new Date(startDate) : new Date(),
        isAvailable: true
      },
      tags: tagsArray || [],
      status: 'pending' // New requests start as pending
    };

    console.log('Rental request data to save:', JSON.stringify(rentalRequestData, null, 2));

    // Create the rental request
    const rentalRequest = new RentalRequest(rentalRequestData);

    // Validate the document before saving
    const validationError = rentalRequest.validateSync();
    if (validationError) {
      console.error('Validation error details:', {
        message: validationError.message,
        errors: validationError.errors,
        name: validationError.name
      });

      // Log each validation error
      for (const field in validationError.errors) {
        const error = validationError.errors[field];
        console.error(`Field ${field}:`, {
          message: error.message,
          value: error.value,
          path: error.path,
          kind: error.kind
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationError.errors
      });
    }

    await rentalRequest.save();
    console.log('Rental request saved successfully:', rentalRequest._id);

    // Update subscription counters
    try {
      console.log('=== Subscription Update Process ===');
      console.log('User ID from request:', req.user.userId);
      console.log('User ID type:', typeof req.user.userId);

      const Subscription = require('../models/Subscription');
      let subscription = await Subscription.findOne({
        userId: req.user.userId,
        status: 'active',
        endDate: { $gt: new Date() }
      });

      console.log('Found existing subscription:', subscription);

      // If no active subscription found, create a default one for new users
      if (!subscription) {
        console.log('No active subscription found, creating default subscription for new user');

        // Create a default subscription for new users (2 post ads)
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 365); // 1 year default

        subscription = new Subscription({
          userId: req.user.userId,
          planId: 'new_user_default',
          planName: 'New User Default',
          status: 'active',
          startDate: startDate,
          endDate: endDate,
          price: 0, // Free for new users
          paymentStatus: 'paid',
          paymentCompletedAt: new Date(),
          currentListings: 0,
          totalViews: 0,
          totalRevenue: 0,
          maxListings: 2, // 2 post ads for new users
          maxPhotos: 10
        });

        await subscription.save();
        console.log('Default subscription created for new user:', subscription._id);
      }

      // Update the subscription counter
      subscription.currentListings += 1;
      await subscription.save();
      console.log('Subscription counters updated - currentListings:', subscription.currentListings);
      console.log('Remaining post ads:', subscription.maxListings - subscription.currentListings);

    } catch (subscriptionError) {
      console.error('Error updating subscription counters:', subscriptionError);
      console.error('Subscription error details:', {
        message: subscriptionError.message,
        stack: subscriptionError.stack,
        name: subscriptionError.name
      });
      // Continue without failing the rental request creation
    }

    // Populate fields for response
    try {
      await rentalRequest.populate([
        { path: 'user', select: 'name email' },
        { path: 'category', select: 'name' }
      ]);
      console.log('Rental request populated successfully');
    } catch (populateError) {
      console.error('Error populating rental request:', populateError);
      // Continue without population - the request was saved successfully
    }

    res.status(201).json({
      success: true,
      message: 'Rental request submitted successfully. It will be reviewed by our admin team.',
      data: {
        rentalRequest
      }
    });

  } catch (error) {
    console.error('=== Error creating rental request ===');
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause
    });
    console.error('Full error object:', error);

    // If there's an error and images were uploaded, clean them up
    if (req.files) {
      try {
        console.log('Cleaning up uploaded files...');

        // Clean up images
        if (req.files.images && Array.isArray(req.files.images) && req.files.images.length > 0) {
          for (const file of req.files.images) {
            if (file && file.publicId) {
              try {
                await cloudinary.uploader.destroy(file.publicId);
              } catch (deleteError) {
                console.error('Error deleting image:', deleteError);
              }
            }
          }
        }

        // Clean up video
        if (req.files.video && Array.isArray(req.files.video) && req.files.video.length > 0) {
          for (const file of req.files.video) {
            if (file && file.publicId) {
              try {
                await cloudinary.uploader.destroy(file.publicId, { resource_type: 'video' });
              } catch (deleteError) {
                console.error('Error deleting video:', deleteError);
              }
            }
          }
        }

        console.log('Files cleaned up successfully');
      } catch (cleanupError) {
        console.error('Error cleaning up uploaded files:', cleanupError);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Error creating rental request',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get user's own rental requests
// @route   GET /api/rental-requests/my-requests
// @access  Private (User)
const getUserRentalRequests = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status = ''
    } = req.query;

    // Build query - only show user's own requests
    const query = {
      user: req.user.userId
    };

    if (status) {
      query.status = status;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const requests = await RentalRequest.find(query)
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await RentalRequest.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        requests,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalRequests: total,
          hasNext: skip + requests.length < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching user rental requests:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user rental requests',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Update user's own rental request
// @route   PUT /api/rental-requests/:id
// @access  Private (User)
const updateRentalRequest = async (req, res) => {
  try {
    console.log('=== Update Rental Request ===');
    console.log('Request params:', req.params);
    console.log('Request body:', req.body);
    console.log('User info:', req.user);

    const { id } = req.params;
    const { description, priceAmount, serviceRadius } = req.body;

    // Validate required fields
    if (!description && !priceAmount && !serviceRadius) {
      return res.status(400).json({
        success: false,
        message: 'At least one field (description, priceAmount, or serviceRadius) is required to update'
      });
    }

    // Find the rental request
    const rentalRequest = await RentalRequest.findById(id);

    if (!rentalRequest) {
      return res.status(404).json({
        success: false,
        message: 'Rental request not found'
      });
    }

    // Check if the user owns this rental request
    console.log('Debug user ID comparison:', {
      rentalRequestUserId: rentalRequest.user,
      rentalRequestUserIdString: rentalRequest.user.toString(),
      reqUserId: req.user.userId,
      reqUserIdString: req.user.userId.toString(),
      areEqual: rentalRequest.user.toString() === req.user.userId.toString()
    });

    if (rentalRequest.user.toString() !== req.user.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own rental requests'
      });
    }

    // Check if the rental request is in a state that allows updates
    if (rentalRequest.status === 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update rejected rental requests'
      });
    }

    // Validate service radius if provided
    if (serviceRadius !== undefined) {
      const parsedServiceRadius = parseInt(serviceRadius);
      if (isNaN(parsedServiceRadius) || parsedServiceRadius < 1 || parsedServiceRadius > 50) {
        return res.status(400).json({
          success: false,
          message: 'Service radius must be a number between 1 and 50 km'
        });
      }
    }

    // Update fields
    const updateData = {};

    if (description !== undefined) {
      updateData.description = description.trim();
    }

    if (priceAmount !== undefined) {
      updateData['price.amount'] = parseFloat(priceAmount);
    }

    if (serviceRadius !== undefined) {
      updateData['location.serviceRadius'] = parseInt(serviceRadius);
    }

    // Update the rental request
    const updatedRequest = await RentalRequest.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('category', 'name');

    console.log('Rental request updated successfully:', updatedRequest._id);

    res.status(200).json({
      success: true,
      message: 'Rental request updated successfully',
      data: {
        rentalRequest: updatedRequest
      }
    });

  } catch (error) {
    console.error('=== Error updating rental request ===');
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    res.status(500).json({
      success: false,
      message: 'Error updating rental request',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Boost a rental request
// @route   POST /api/rental-requests/:id/boost
// @access  Private (User)
const boostRentalRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Find the rental request
    const rentalRequest = await RentalRequest.findOne({
      _id: id,
      user: userId,
      status: 'approved'
    });

    if (!rentalRequest) {
      return res.status(404).json({
        success: false,
        message: 'Rental request not found or not approved'
      });
    }

    // Find the user and check boost credits
    const User = require('../models/User');
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Initialize boostCredits if it doesn't exist
    if (!user.boostCredits) {
      user.boostCredits = {
        freeBoosts: 2,
        purchasedBoosts: 0,
        usedBoosts: 0,
        remainingBoosts: 2
      };
    }

    // Check if user has remaining boost credits
    if (user.boostCredits.remainingBoosts <= 0) {
      return res.status(400).json({
        success: false,
        message: 'No boost credits remaining. Please purchase more boosts.'
      });
    }

    // Deduct one boost credit
    user.boostCredits.usedBoosts += 1;
    user.boostCredits.remainingBoosts = user.boostCredits.freeBoosts + user.boostCredits.purchasedBoosts - user.boostCredits.usedBoosts;

    await user.save();

    // Also update BoostPackage if user has active packages
    const BoostPackage = require('../models/BoostPackage');
    console.log('🔍 Looking for active boost packages for user:', userId);

    const activePackage = await BoostPackage.findOne({
      user: userId,
      status: 'active',
      validUntil: { $gt: new Date() },
      remainingBoosts: { $gt: 0 }
    }).sort({ createdAt: -1 }); // Get the most recent active package

    console.log('📦 Found active package:', activePackage ? {
      id: activePackage._id,
      packageName: activePackage.packageName,
      usedBoosts: activePackage.usedBoosts,
      remainingBoosts: activePackage.remainingBoosts,
      boostCount: activePackage.boostCount
    } : 'No active package found');

    if (activePackage) {
      console.log('⚡ Using boost from package:', activePackage._id);
      // Use boost from the package
      await activePackage.useBoost();
      console.log('✅ Boost used successfully. New state:', {
        usedBoosts: activePackage.usedBoosts,
        remainingBoosts: activePackage.remainingBoosts
      });
    } else {
      console.log('❌ No active boost package found to update');
    }

    // Update the rental request with boost information
    rentalRequest.isBoosted = true;
    rentalRequest.boostedAt = new Date();
    rentalRequest.boostCount = (rentalRequest.boostCount || 0) + 1;

    await rentalRequest.save();

    res.status(200).json({
      success: true,
      message: 'Rental request boosted successfully',
      data: {
        rentalId: rentalRequest._id,
        title: rentalRequest.title,
        boostedAt: rentalRequest.boostedAt,
        boostCount: rentalRequest.boostCount,
        remainingBoosts: user.boostCredits.remainingBoosts
      }
    });

  } catch (error) {
    console.error('Error boosting rental request:', error);
    res.status(500).json({
      success: false,
      message: 'Error boosting rental request',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  getPublicRentalRequests,
  getPublicRentalRequest,
  getFeaturedRentalRequests,
  createRentalRequest,
  getUserRentalRequests,
  updateRentalRequest,
  boostRentalRequest
};