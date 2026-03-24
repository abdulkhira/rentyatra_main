const User = require('../models/User');
const Product = require('../models/Product');
const BoostPackage = require('../models/BoostPackage');
const RentalRequest = require('../models/RentalRequest');
const Subscription = require('../models/Subscription');

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    console.log('📊 Admin getDashboardStats called');

    // Get total users count
    const totalUsers = await User.countDocuments();
    
    // Get active users (users who logged in within last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeUsers = await User.countDocuments({
      lastLogin: { $gte: thirtyDaysAgo }
    });

    // Get total products count
    const totalProducts = await Product.countDocuments();
    
    // Get active products (products with status 'active')
    const activeProducts = await Product.countDocuments({ status: 'active' });

    // Get total boost orders
    const totalBoostOrders = await BoostPackage.countDocuments();
    
    // Get active boost orders
    const activeBoostOrders = await BoostPackage.countDocuments({ status: 'active' });

    // Get total revenue from boost orders
    const boostRevenueData = await BoostPackage.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, totalBoostRevenue: { $sum: '$totalAmount' } } }
    ]);
    const totalBoostRevenue = boostRevenueData.length > 0 ? boostRevenueData[0].totalBoostRevenue : 0;

    // Get total revenue from subscriptions
    const subscriptionRevenueData = await Subscription.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, totalSubscriptionRevenue: { $sum: '$price' } } }
    ]);
    const totalSubscriptionRevenue = subscriptionRevenueData.length > 0 ? subscriptionRevenueData[0].totalSubscriptionRevenue : 0;

    // Calculate total revenue (boost + subscription)
    const totalRevenue = totalBoostRevenue + totalSubscriptionRevenue;

    // Get monthly revenue (current month) - boost + subscription
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    
    const monthlyBoostRevenueData = await BoostPackage.aggregate([
      { 
        $match: { 
          paymentStatus: 'paid',
          createdAt: { $gte: currentMonth }
        } 
      },
      { $group: { _id: null, monthlyBoostRevenue: { $sum: '$totalAmount' } } }
    ]);
    const monthlyBoostRevenue = monthlyBoostRevenueData.length > 0 ? monthlyBoostRevenueData[0].monthlyBoostRevenue : 0;

    const monthlySubscriptionRevenueData = await Subscription.aggregate([
      { 
        $match: { 
          paymentStatus: 'paid',
          createdAt: { $gte: currentMonth }
        } 
      },
      { $group: { _id: null, monthlySubscriptionRevenue: { $sum: '$price' } } }
    ]);
    const monthlySubscriptionRevenue = monthlySubscriptionRevenueData.length > 0 ? monthlySubscriptionRevenueData[0].monthlySubscriptionRevenue : 0;

    const monthlyRevenue = monthlyBoostRevenue + monthlySubscriptionRevenue;

    // Get total rental requests
    const totalRentalRequests = await RentalRequest.countDocuments();
    
    // Get pending rental requests
    const pendingRentalRequests = await RentalRequest.countDocuments({ status: 'pending' });

    // Get completed rental requests
    const completedRentalRequests = await RentalRequest.countDocuments({ status: 'completed' });

    // Get new users this month
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: currentMonth }
    });

    // Get boost packages sold this month
    const boostPackagesThisMonth = await BoostPackage.countDocuments({
      createdAt: { $gte: currentMonth }
    });

    // Calculate conversion rate (completed rentals / total rentals)
    const conversionRate = totalRentalRequests > 0 
      ? ((completedRentalRequests / totalRentalRequests) * 100).toFixed(1)
      : 0;

    // Get recent activities (last 10)
    const recentActivities = await BoostPackage.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('packageName totalAmount status createdAt user');

    const stats = {
      users: {
        total: totalUsers,
        active: activeUsers,
        newThisMonth: newUsersThisMonth
      },
      products: {
        total: totalProducts,
        active: activeProducts
      },
      revenue: {
        total: totalRevenue,
        monthly: monthlyRevenue,
        boost: {
          total: totalBoostRevenue,
          monthly: monthlyBoostRevenue
        },
        subscription: {
          total: totalSubscriptionRevenue,
          monthly: monthlySubscriptionRevenue
        }
      },
      boosts: {
        total: totalBoostOrders,
        active: activeBoostOrders,
        soldThisMonth: boostPackagesThisMonth
      },
      rentals: {
        total: totalRentalRequests,
        pending: pendingRentalRequests,
        completed: completedRentalRequests,
        conversionRate: parseFloat(conversionRate)
      },
      recentActivities: recentActivities.map(activity => ({
        id: activity._id,
        type: 'boost_purchase',
        description: `${activity.user?.name || 'Unknown User'} purchased ${activity.packageName}`,
        amount: activity.totalAmount,
        status: activity.status,
        date: activity.createdAt
      }))
    };

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('❌ Error getting dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  getDashboardStats
};
