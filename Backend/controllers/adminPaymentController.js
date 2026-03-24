const BoostPackage = require('../models/BoostPackage');
const Subscription = require('../models/Subscription');
const User = require('../models/User');

// Get all payments (subscription + boost)
const getAllPayments = async (req, res) => {
  try {
    console.log('💳 Admin getAllPayments called');

    // Get all boost payments
    const boostPayments = await BoostPackage.find({ paymentStatus: 'paid' })
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .select('packageName totalAmount paymentStatus paymentDetails createdAt user status');

    // Get all subscription payments
    const subscriptionPayments = await Subscription.find({ paymentStatus: 'paid' })
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .select('planName price paymentStatus paymentId paymentCompletedAt createdAt userId status');

    // Transform boost payments
    const transformedBoostPayments = boostPayments.map(payment => ({
      _id: payment._id,
      type: 'boost',
      user: {
        _id: payment.user?._id,
        name: payment.user?.name || 'Unknown User',
        email: payment.user?.email || 'No Email',
        phone: payment.user?.phone || 'No Phone'
      },
      packageName: payment.packageName,
      amount: payment.totalAmount,
      paymentStatus: payment.paymentStatus,
      paymentId: payment.paymentDetails?.razorpayPaymentId,
      paymentDate: payment.paymentDetails?.paymentDate || payment.createdAt,
      createdAt: payment.createdAt,
      status: payment.status,
      razorpayOrderId: payment.paymentDetails?.razorpayOrderId,
      razorpaySignature: payment.paymentDetails?.razorpaySignature
    }));

    // Transform subscription payments
    const transformedSubscriptionPayments = subscriptionPayments.map(payment => ({
      _id: payment._id,
      type: 'subscription',
      user: {
        _id: payment.userId?._id,
        name: payment.userId?.name || 'Unknown User',
        email: payment.userId?.email || 'No Email',
        phone: payment.userId?.phone || 'No Phone'
      },
      packageName: payment.planName,
      amount: payment.price,
      paymentStatus: payment.paymentStatus,
      paymentId: payment.paymentId,
      paymentDate: payment.paymentCompletedAt || payment.createdAt,
      createdAt: payment.createdAt,
      status: payment.status
    }));

    // Combine and sort all payments by date
    const allPayments = [...transformedBoostPayments, ...transformedSubscriptionPayments]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Calculate statistics
    const totalBoostRevenue = transformedBoostPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalSubscriptionRevenue = transformedSubscriptionPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalRevenue = totalBoostRevenue + totalSubscriptionRevenue;

    // Monthly revenue (current month)
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    
    const monthlyBoostRevenue = transformedBoostPayments
      .filter(payment => new Date(payment.createdAt) >= currentMonth)
      .reduce((sum, payment) => sum + payment.amount, 0);
    
    const monthlySubscriptionRevenue = transformedSubscriptionPayments
      .filter(payment => new Date(payment.createdAt) >= currentMonth)
      .reduce((sum, payment) => sum + payment.amount, 0);
    
    const monthlyRevenue = monthlyBoostRevenue + monthlySubscriptionRevenue;

    const stats = {
      totalPayments: allPayments.length,
      totalRevenue: totalRevenue,
      monthlyRevenue: monthlyRevenue,
      boostPayments: {
        count: transformedBoostPayments.length,
        revenue: totalBoostRevenue,
        monthlyRevenue: monthlyBoostRevenue
      },
      subscriptionPayments: {
        count: transformedSubscriptionPayments.length,
        revenue: totalSubscriptionRevenue,
        monthlyRevenue: monthlySubscriptionRevenue
      }
    };

    res.status(200).json({
      success: true,
      data: {
        payments: allPayments,
        stats: stats
      }
    });

  } catch (error) {
    console.error('❌ Error getting all payments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment details',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  getAllPayments
};
