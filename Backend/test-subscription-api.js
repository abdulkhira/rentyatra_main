const mongoose = require('mongoose');
require('dotenv').config();

const testSubscription = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database');
    
    const User = require('./models/User');
    const Subscription = require('./models/Subscription');
    
    const user = await User.findOne({ phone: '+917610416911' });
    console.log('User found:', user._id.toString());
    
    const userId = user._id.toString();
    const now = new Date();
    
    // Test the exact query that API uses
    const subscription = await Subscription.findOne({
      userId,
      status: 'active',
      endDate: { $gt: now }
    });
    
    console.log('\n=== API Query Result ===');
    if (subscription) {
      console.log('✅ Subscription found');
      console.log('- planId:', subscription.planId);
      console.log('- planName:', subscription.planName);
      console.log('- maxListings:', subscription.maxListings);
      console.log('- currentListings:', subscription.currentListings);
      console.log('- status:', subscription.status);
    } else {
      console.log('❌ No subscription found matching API query');
    }
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

testSubscription();

