const Product = require('../models/Product');
const Category = require('../models/Category');

// Search products and categories by name, description, or tags
const searchProducts = async (req, res) => {
  try {
    console.log('🔍 Search products and categories called');
    
    const { q, category, location, minPrice, maxPrice, page = 1, limit = 20 } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    // Build search query for products
    let productSearchQuery = {
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $regex: q, $options: 'i' } }
      ],
      status: 'active'
    };

    // Build search query for categories
    let categorySearchQuery = {
      $or: [
        { name: { $regex: q, $options: 'i' } }
      ],
      status: 'active'
    };

    // Add category filter if provided
    if (category && category !== 'all') {
      productSearchQuery.tags = { $regex: category, $options: 'i' };
    }

    // Add location filter if provided
    if (location && location !== 'all') {
      productSearchQuery.location = { $regex: location, $options: 'i' };
    }

    // Add price filters if provided
    if (minPrice || maxPrice) {
      productSearchQuery.price = {};
      if (minPrice) productSearchQuery.price.$gte = parseFloat(minPrice);
      if (maxPrice) productSearchQuery.price.$lte = parseFloat(maxPrice);
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute search for both products and categories
    const [products, categories] = await Promise.all([
      Product.find(productSearchQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Category.find(categorySearchQuery)
        .populate('product', 'name images')
        .sort({ createdAt: -1 })
        .limit(5) // Limit categories to 5
        .lean()
    ]);

    // Get total count for pagination
    const totalCount = await Product.countDocuments(productSearchQuery);

    // Get categories for filter options - using tags from products instead
    const categoryTags = await Product.distinct('tags', { status: 'active' });
    const filterCategories = categoryTags.filter(tag => tag && tag.trim().length > 0).map(tag => ({ name: tag }));

    // Get unique locations from products
    const locations = await Product.distinct('location', { status: 'active' });

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / parseInt(limit));
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.status(200).json({
      success: true,
      data: {
        products,
        categories,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          hasNextPage,
          hasPrevPage,
          limit: parseInt(limit)
        },
        filters: {
          categories: filterCategories,
          locations: locations.filter(loc => loc && loc.trim().length > 0)
        },
        searchQuery: q
      }
    });

  } catch (error) {
    console.error('❌ Error searching products and categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching products and categories',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get search suggestions
const getSearchSuggestions = async (req, res) => {
  try {
    console.log('💡 Get search suggestions called');
    
    const { q } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(200).json({
        success: true,
        data: {
          suggestions: []
        }
      });
    }

    // Get product name suggestions with more details
    const productSuggestions = await Product.find({
      name: { $regex: q, $options: 'i' },
      status: 'active'
    })
    .select('name _id images price')
    .limit(5)
    .lean();

    // Get category suggestions from Category model
    const categorySuggestions = await Category.find({
      name: { $regex: q, $options: 'i' },
      status: 'active'
    })
    .select('name _id images')
    .limit(3)
    .lean();

    // Get tag suggestions from products
    const tagSuggestions = await Product.distinct('tags', {
      tags: { $regex: q, $options: 'i' },
      status: 'active'
    });

    // Combine and format suggestions with more details
    const suggestions = [
      ...productSuggestions.map(p => ({ 
        type: 'product', 
        text: p.name,
        id: p._id,
        image: p.images?.[0]?.url,
        price: p.price,
        subtitle: `₹${p.price}/day`
      })),
      ...categorySuggestions.map(c => ({ 
        type: 'category', 
        text: c.name,
        id: c._id,
        image: c.images?.[0]?.url,
        subtitle: 'Category'
      })),
      ...tagSuggestions.slice(0, 2).map(tag => ({ 
        type: 'tag', 
        text: tag,
        subtitle: 'Tag'
      }))
    ].slice(0, 8); // Limit to 8 suggestions

    res.status(200).json({
      success: true,
      data: {
        suggestions
      }
    });

  } catch (error) {
    console.error('❌ Error getting search suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting search suggestions',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Handle specific search redirect (for direct product/category access)
const handleSearchRedirect = async (req, res) => {
  try {
    console.log('🔍 Handle search redirect called');
    
    const { q, type } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    let result = null;
    let redirectType = null;

    // If type is specified, search in that specific type
    if (type === 'product') {
      const product = await Product.findOne({
        name: { $regex: q, $options: 'i' },
        status: 'active'
      }).lean();
      
      if (product) {
        result = product;
        redirectType = 'product';
      }
    } else if (type === 'category') {
      const category = await Category.findOne({
        name: { $regex: q, $options: 'i' },
        status: 'active'
      }).lean();
      
      if (category) {
        result = category;
        redirectType = 'category';
      }
    } else {
      // Auto-detect type - prioritize exact matches
      const [exactProduct, exactCategory] = await Promise.all([
        Product.findOne({
          name: { $regex: `^${q}$`, $options: 'i' },
          status: 'active'
        }).lean(),
        Category.findOne({
          name: { $regex: `^${q}$`, $options: 'i' },
          status: 'active'
        }).lean()
      ]);

      if (exactProduct) {
        result = exactProduct;
        redirectType = 'product';
      } else if (exactCategory) {
        result = exactCategory;
        redirectType = 'category';
      } else {
        // Fallback to partial matches
        const [partialProduct, partialCategory] = await Promise.all([
          Product.findOne({
            name: { $regex: q, $options: 'i' },
            status: 'active'
          }).lean(),
          Category.findOne({
            name: { $regex: q, $options: 'i' },
            status: 'active'
          }).lean()
        ]);

        if (partialProduct) {
          result = partialProduct;
          redirectType = 'product';
        } else if (partialCategory) {
          result = partialCategory;
          redirectType = 'category';
        }
      }
    }

    if (result) {
      res.status(200).json({
        success: true,
        data: {
          result,
          type: redirectType,
          redirectUrl: redirectType === 'product' 
            ? `/category?productId=${result._id}` 
            : `/category?categoryId=${result._id}`
        }
      });
    } else {
      // No exact match found, return search results
      res.status(200).json({
        success: true,
        data: {
          result: null,
          type: 'search',
          redirectUrl: `/category?tag=${encodeURIComponent(q)}`
        }
      });
    }

  } catch (error) {
    console.error('❌ Error handling search redirect:', error);
    res.status(500).json({
      success: false,
      message: 'Error handling search redirect',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  searchProducts,
  getSearchSuggestions,
  handleSearchRedirect
};
