const RentalRequest = require('../models/RentalRequest');
const { cloudinary, deleteImage, extractPublicId } = require('../config/cloudinary');
const { sendPushNotification } = require('../services/firebaseAdmin');
const User = require('../models/User');

// @desc    Get all rental requests (Admin)
// @route   GET /api/admin/rental-requests
// @access  Private (Admin)
// const getAllRentalRequests = async (req, res) => {
//   try {
//     console.log('=== Get All Rental Requests (Admin) ===');
//     console.log('Request query:', req.query);
//     console.log('Request user:', req.user);

//     const {
//       page = 1,
//       limit = 10,
//       status,
//       search,
//       category,
//       city,
//       sortBy = 'createdAt',
//       sortOrder = 'desc'
//     } = req.query;

//     // Build query
//     const query = {};

//     if (status) {
//       query.status = status;
//     }

//     if (category) {
//       query.category = category;
//     }

//     if (city) {
//       query['location.city'] = { $regex: city, $options: 'i' };
//     }

//     if (search) {
//       query.$or = [
//         { title: { $regex: search, $options: 'i' } },
//         { description: { $regex: search, $options: 'i' } },
//         { 'location.city': { $regex: search, $options: 'i' } },
//         { 'location.state': { $regex: search, $options: 'i' } }
//       ];
//     }

//     // Build sort object
//     const sort = {};
//     sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

//     // Calculate pagination
//     const skip = (parseInt(page) - 1) * parseInt(limit);

//     console.log('Final query:', query);
//     console.log('Sort:', sort);
//     console.log('Skip:', skip, 'Limit:', parseInt(limit));

//     // Execute query
//     let requests = await RentalRequest.find(query)
//       .populate('user', 'name email phone')
//       .populate('product', 'name')
//       .populate('category', 'name')
//       .populate('reviewedBy', 'name email')
//       .sort(sort)
//       .skip(skip)
//       .limit(parseInt(limit));

//     // Filter out orphaned requests (where user doesn't exist)
//     const beforeFilterCount = requests.length;
//     const invalidRequests = requests.filter(req => !req.user || !req.user._id);

//     // Auto-cleanup orphaned requests silently (only log once to avoid spam)
//     if (invalidRequests.length > 0) {
//       // Only log warning once per server session to avoid log spam
//       if (!global._orphanedRequestsLogged) {
//         // Find ALL orphaned requests in database (not just current page)
//         Promise.all([
//           RentalRequest.find({}).select('_id user').lean(),
//           User.find({}).select('_id').lean()
//         ])
//           .then(([allRequests, allUsers]) => {
//             const existingUserIds = new Set(allUsers.map(u => u._id.toString()));
//             const orphanedRequestIds = allRequests
//               .filter(req => !req.user || !existingUserIds.has(req.user.toString()))
//               .map(req => req._id);

//             if (orphanedRequestIds.length > 0) {
//               console.warn(`⚠️ Found ${orphanedRequestIds.length} orphaned rental requests (users deleted). Auto-cleaning up...`);

//               // Auto-cleanup ALL orphaned requests in background (non-blocking)
//               return RentalRequest.deleteMany({ _id: { $in: orphanedRequestIds } });
//             }
//             return Promise.resolve({ deletedCount: 0 });
//           })
//           .then(result => {
//             if (result.deletedCount > 0) {
//               console.log(`✅ Auto-cleaned up ${result.deletedCount} orphaned rental requests`);
//             }
//           })
//           .catch(err => {
//             console.error('❌ Error auto-cleaning orphaned requests:', err.message);
//           });

//         global._orphanedRequestsLogged = true; // Mark as logged to avoid spam
//       }
//     }

//     // Filter out orphaned requests from response
//     requests = requests.filter(req => req.user && req.user._id);

//     // Note: Total count should only include valid requests, but we'll calculate it separately
//     // to avoid performance issues with large datasets
//     const total = await RentalRequest.countDocuments(query);

//     console.log('Found requests:', requests.length, `(filtered from ${beforeFilterCount} total)`);
//     console.log('Total count in DB:', total);

//     res.status(200).json({
//       success: true,
//       data: {
//         requests,
//         pagination: {
//           currentPage: parseInt(page),
//           totalPages: Math.ceil(total / parseInt(limit)),
//           totalRequests: total,
//           hasNext: skip + requests.length < total,
//           hasPrev: parseInt(page) > 1
//         }
//       }
//     });

//   } catch (error) {
//     console.error('=== Error fetching rental requests ===');
//     console.error('Error details:', {
//       message: error.message,
//       stack: error.stack,
//       name: error.name
//     });
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching rental requests',
//       error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
//     });
//   }
// };

const getAllRentalRequests = async (req, res) => {
  try {
    const {
      status,
      search,
      category,
      city,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};

    if (status) query.status = status;
    if (category) query.category = category;
    if (city) query['location.city'] = { $regex: city, $options: 'i' };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'location.city': { $regex: search, $options: 'i' } },
        { 'location.state': { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query to get ALL data
    let requests = await RentalRequest.find(query)
      .populate('user', 'name email phone')
      .populate('product', 'name')
      .populate('category', 'name')
      .populate('reviewedBy', 'name email')
      .sort(sort);

    // Filter out orphaned requests (where user no longer exists)
    requests = requests.filter(r => r.user && r.user._id);

    res.status(200).json({
      success: true,
      data: {
        requests,
        totalRequests: requests.length
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching rental requests',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get single rental request (Admin)
// @route   GET /api/admin/rental-requests/:id
// @access  Private (Admin)
const getRentalRequest = async (req, res) => {
  try {
    const request = await RentalRequest.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('category', 'name')
      .populate('reviewedBy', 'name email');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Rental request not found'
      });
    }

    // Check if user exists (not orphaned)
    if (!request.user || !request.user._id) {
      console.warn(`⚠️ Rental request ${request._id} has invalid/missing user`);
      return res.status(404).json({
        success: false,
        message: 'Rental request user not found (user may have been deleted)'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        request
      }
    });

  } catch (error) {
    console.error('Error fetching rental request:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching rental request',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Update rental request status (Admin)
// @route   PUT /api/admin/rental-requests/:id/status
// @access  Private (Admin)
const updateRentalRequestStatus = async (req, res) => {
  try {
    const { status, rejectionReason, notificationMessage } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const validStatuses = ['pending', 'approved', 'rejected', 'expired'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      });
    }

    const request = await RentalRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Rental request not found'
      });
    }

    // Store old status to check if it's a new approval
    const oldStatus = request.status;

    // Update status using the model method
    await request.updateStatus(status, req.admin._id, rejectionReason);

    // Populate fields for response
    await request.populate([
      { path: 'user', select: 'name email phone' },
      { path: 'product', select: 'name' },
      { path: 'category', select: 'name' },
      { path: 'reviewedBy', select: 'name email' }
    ]);

    // Log when a request becomes visible to users
    if (status === 'approved') {
      console.log(`✅ Rental request "${request.title}" (ID: ${request._id}) has been approved and is now visible to all users in featured listings!`);

      // Send push notification to user when rental is approved
      // Try to find user by multiple methods
      let user = null;
      let userId = null;

      // Method 1: Use populated user if available
      if (request.user && request.user._id) {
        userId = request.user._id;
        user = await User.findById(userId);
      }
      // Method 2: Use user field directly (ObjectId) if populate failed
      else if (request.user) {
        userId = request.user;
        user = await User.findById(userId);
      }
      // Method 3: Try to find user by email from contactInfo
      else if (request.contactInfo && request.contactInfo.email) {
        console.log('⚠️ User field is null, trying to find user by email:', request.contactInfo.email);
        user = await User.findOne({ email: request.contactInfo.email.toLowerCase() });
        if (user) {
          userId = user._id;
          console.log('✅ Found user by email:', user._id);
        }
      }
      // Method 4: Try to find user by phone from contactInfo
      else if (request.contactInfo && request.contactInfo.phone) {
        console.log('⚠️ User field is null, trying to find user by phone:', request.contactInfo.phone);
        const cleanPhone = request.contactInfo.phone.replace(/\D/g, '');
        const formattedPhone = cleanPhone.length === 10 ? `+91${cleanPhone}` : request.contactInfo.phone;
        user = await User.findOne({ phone: formattedPhone });
        if (user) {
          userId = user._id;
          console.log('✅ Found user by phone:', user._id);
        }
      }

      if (user && userId) {
        try {
          // Check if user has FCM tokens
          if (user.fcmTokens?.length > 0 || user.fcmTokenMobile?.length > 0) {
            // Combine web and mobile tokens, remove duplicates
            const webTokens = user.fcmTokens || [];
            const mobileTokens = user.fcmTokenMobile || [];
            const allTokensSet = new Set([...webTokens, ...mobileTokens]);
            const allTokens = Array.from(allTokensSet);

            const rentalTitle = request.title || 'Your rental listing';
            const rentalId = request._id.toString();

            // Use custom message if provided, otherwise use default
            const defaultMessage = `Your rental "${rentalTitle.substring(0, 50)}" has been approved and is now live!`;
            const notificationBody = notificationMessage || defaultMessage;

            const payload = {
              title: '🎉 Rental Listing Approved!',
              body: notificationBody,
              data: {
                type: 'rental_approved',
                rentalId: rentalId,
                rentalTitle: rentalTitle,
                handlerName: 'rental',
                link: `/rentals/${rentalId}` || '/rentals'
              },
              handlerName: 'rental',
              link: `/rentals/${rentalId}` || '/rentals',
              icon: '/favicon.png'
            };

            console.log('📤 Sending rental approval notification:', {
              userId: user._id.toString(),
              rentalId: rentalId,
              tokenCount: allTokens.length
            });

            if (allTokens.length > 0) {
              const result = await sendPushNotification(allTokens, payload);
              if (result.success) {
                console.log('✅ Rental approval notification sent successfully:', {
                  successCount: result.successCount,
                  failureCount: result.failureCount
                });
              } else {
                console.error('❌ Rental approval notification failed:', result.message);
              }
            } else {
              console.log('⚠️ User has no FCM tokens, skipping rental approval notification');
            }
          } else {
            console.log('⚠️ User found but has no FCM tokens registered');
          }
        } catch (notificationError) {
          console.error('⚠️ Error sending rental approval notification:', notificationError.message);
          // Don't throw - notification failure shouldn't break approval process
        }
      } else {
        console.log('⚠️ Could not find user for rental request. User field is null and could not find user by email/phone.');
        console.log('Rental request contactInfo:', {
          email: request.contactInfo?.email,
          phone: request.contactInfo?.phone
        });
      }
    } else if (status === 'rejected') {
      console.log(`❌ Rental request "${request.title}" (ID: ${request._id}) has been rejected and will not be visible to users.`);
    }

    res.status(200).json({
      success: true,
      message: `Rental request ${status} successfully`,
      data: {
        request
      }
    });

  } catch (error) {
    console.error('Error updating rental request status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating rental request status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Delete rental request (Admin)
// @route   DELETE /api/admin/rental-requests/:id
// @access  Private (Admin)
const deleteRentalRequest = async (req, res) => {
  try {
    const request = await RentalRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Rental request not found'
      });
    }

    // Delete images from Cloudinary
    if (request.images && request.images.length > 0) {
      try {
        for (const image of request.images) {
          await deleteImage(image.publicId);
        }
      } catch (imageError) {
        console.error('Error deleting images from Cloudinary:', imageError);
        // Continue with request deletion even if image deletion fails
      }
    }

    // Delete the request
    await RentalRequest.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Rental request deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting rental request:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting rental request',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get rental request statistics (Admin)
// @route   GET /api/admin/rental-requests/stats
// @access  Private (Admin)
const getRentalRequestStats = async (req, res) => {
  try {
    const stats = await RentalRequest.getRequestStats();
    const categoryStats = await RentalRequest.getRequestsByCategory();

    res.status(200).json({
      success: true,
      data: {
        stats: stats[0] || {
          totalRequests: 0,
          pendingRequests: 0,
          approvedRequests: 0,
          rejectedRequests: 0,
          totalViews: 0,
          totalInquiries: 0
        },
        categoryStats
      }
    });

  } catch (error) {
    console.error('Error fetching rental request stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching rental request statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Bulk update rental request status (Admin)
// @route   PUT /api/admin/rental-requests/bulk-status
// @access  Private (Admin)
const bulkUpdateRentalRequestStatus = async (req, res) => {
  try {
    const { requestIds, status, rejectionReason } = req.body;

    if (!requestIds || !Array.isArray(requestIds) || requestIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Request IDs array is required'
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const validStatuses = ['pending', 'approved', 'rejected', 'expired'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      });
    }

    // Update multiple requests
    const updateData = {
      status,
      reviewedBy: req.admin._id,
      reviewedAt: new Date()
    };

    if (status === 'rejected' && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    const result = await RentalRequest.updateMany(
      { _id: { $in: requestIds } },
      updateData
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} rental requests updated successfully`,
      data: {
        modifiedCount: result.modifiedCount,
        matchedCount: result.matchedCount
      }
    });

  } catch (error) {
    console.error('Error bulk updating rental request status:', error);
    res.status(500).json({
      success: false,
      message: 'Error bulk updating rental request status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Cleanup orphaned rental requests (Admin)
// @route   POST /api/admin/rental-requests/cleanup-orphaned
// @access  Private (Admin)
const cleanupOrphanedRentalRequests = async (req, res) => {
  try {
    console.log('=== Cleanup Orphaned Rental Requests (Admin) ===');

    const User = require('../models/User');
    const { dryRun = false } = req.body;

    // Find all rental requests
    const allRequests = await RentalRequest.find({}).select('_id title user status createdAt');
    console.log(`📊 Total rental requests in database: ${allRequests.length}`);

    // Get all user IDs that exist
    const existingUserIds = new Set();
    const users = await User.find({}).select('_id');
    users.forEach(user => existingUserIds.add(user._id.toString()));
    console.log(`📊 Total users in database: ${existingUserIds.size}`);

    // Find orphaned requests
    const orphanedRequests = [];

    for (const request of allRequests) {
      const userId = request.user ? request.user.toString() : null;

      if (!userId || !existingUserIds.has(userId)) {
        orphanedRequests.push({
          _id: request._id,
          title: request.title,
          userId: userId || 'MISSING',
          status: request.status,
          createdAt: request.createdAt
        });
      }
    }

    console.log(`⚠️  Found ${orphanedRequests.length} orphaned rental requests`);

    if (orphanedRequests.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No orphaned rental requests found. Database is clean!',
        data: {
          orphanedCount: 0,
          deletedCount: 0
        }
      });
    }

    // Status breakdown
    const statusBreakdown = {};
    orphanedRequests.forEach(req => {
      statusBreakdown[req.status] = (statusBreakdown[req.status] || 0) + 1;
    });

    if (dryRun) {
      return res.status(200).json({
        success: true,
        message: `Dry run completed. Found ${orphanedRequests.length} orphaned rental requests.`,
        data: {
          orphanedCount: orphanedRequests.length,
          deletedCount: 0,
          statusBreakdown,
          orphanedRequests: orphanedRequests.slice(0, 50) // Return first 50 for preview
        }
      });
    }

    // Actually delete orphaned requests
    const idsToDelete = orphanedRequests.map(req => req._id);
    const result = await RentalRequest.deleteMany({ _id: { $in: idsToDelete } });

    console.log(`✅ Successfully deleted ${result.deletedCount} orphaned rental requests`);

    res.status(200).json({
      success: true,
      message: `Successfully cleaned up ${result.deletedCount} orphaned rental requests`,
      data: {
        orphanedCount: orphanedRequests.length,
        deletedCount: result.deletedCount,
        statusBreakdown
      }
    });

  } catch (error) {
    console.error('Error cleaning up orphaned rental requests:', error);
    res.status(500).json({
      success: false,
      message: 'Error cleaning up orphaned rental requests',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get rental requests by user (Admin)
// @route   GET /api/admin/rental-requests/user/:userId
// @access  Private (Admin)
const getRentalRequestsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      page = 1,
      limit = 10,
      status
    } = req.query;

    // Build query
    const query = { user: userId };

    if (status) {
      query.status = status;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    let requests = await RentalRequest.find(query)
      .populate('user', 'name email phone')
      .populate('category', 'name')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Filter out orphaned requests (where user doesn't exist)
    const invalidRequests = requests.filter(req => !req.user || !req.user._id);
    if (invalidRequests.length > 0) {
      console.warn(`⚠️ Found ${invalidRequests.length} orphaned rental requests for user ${userId}`);
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
    console.error('Error fetching rental requests by user:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching rental requests by user',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  getAllRentalRequests,
  getRentalRequest,
  updateRentalRequestStatus,
  deleteRentalRequest,
  getRentalRequestStats,
  bulkUpdateRentalRequestStatus,
  getRentalRequestsByUser,
  cleanupOrphanedRentalRequests
};
