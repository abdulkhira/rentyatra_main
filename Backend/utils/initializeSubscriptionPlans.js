const SubscriptionPlan = require('../models/SubscriptionPlan');

const defaultPlans = [
  {
    planId: 'basic',
    name: 'Basic Plan',
    price: 100,
    duration: 30,
    features: [
      '3 Post Ads',
      'Basic Support',
      'Valid for 30 Days',
      'Email notifications'
    ],
    maxListings: 3,
    maxPhotos: 3,
    gradient: 'from-gray-400 to-gray-500',
    popular: false,
    isActive: true,
    displayOrder: 1
  },
  {
    planId: 'premium',
    name: 'Premium Plan',
    price: 200,
    duration: 30,
    features: [
      '5 Post Ads',
      'Priority Support',
      'Valid for 30 Days',
      'Email notifications',
      'Featured Badge'
    ],
    maxListings: 5,
    maxPhotos: 5,
    gradient: 'from-blue-500 to-indigo-600',
    popular: true,
    isActive: true,
    displayOrder: 2
  },
  {
    planId: 'pro',
    name: 'Pro Plan',
    price: 300,
    duration: 30,
    features: [
      '15 Post Ads',
      'Priority Support 24/7',
      'Valid for 30 Days',
      'Email notifications',
      'Featured Badge'
    ],
    maxListings: 15,
    maxPhotos: 10,
    gradient: 'from-purple-500 to-pink-600',
    popular: false,
    isActive: true,
    displayOrder: 3
  }
];

/**
 * Initialize default subscription plans if they don't exist
 */
const initializeDefaultPlans = async () => {
  try {
    console.log('🔄 Initializing default subscription plans...');
    
    for (const planData of defaultPlans) {
      const existingPlan = await SubscriptionPlan.findOne({ planId: planData.planId });
      
      if (!existingPlan) {
        const plan = new SubscriptionPlan(planData);
        await plan.save();
        console.log(`✅ Created default plan: ${planData.name}`);
      } else {
        console.log(`ℹ️  Plan already exists: ${planData.name}`);
      }
    }
    
    console.log('✅ Default subscription plans initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing default subscription plans:', error);
    throw error;
  }
};

module.exports = { initializeDefaultPlans };

