// Script to fix missing default subscriptions for existing users
// Run this once to ensure all existing users have default subscriptions with 2 free post ads

const mongoose = require('mongoose');
const Subscription = require('../models/Subscription');
const User = require('../models/User');

async function fixMissingSubscriptions() {
  try {
    console.log('🚀 Starting fix for missing subscriptions...');
    
    // Load environment variables
    require('dotenv').config();
    
    // Connect to MongoDB
    const connectionString = process.env.MONGODB_URI || 'mongodb://localhost:27017/rentyatra';
    await mongoose.connect(connectionString);
    
    console.log('✅ Connected to MongoDB');
    
    // Find all users
    const users = await User.find({ role: 'user' });
    console.log(`📊 Found ${users.length} users`);
    
    let fixedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    // Check each user for subscription
    for (const user of users) {
      try {
        // Check if user has any active subscription
        const activeSubscription = await Subscription.findOne({
          userId: user._id,
          status: 'active',
          endDate: { $gt: new Date() }
        });
        
        // Check if user has any default subscription (even if expired)
        const defaultSubscription = await Subscription.findOne({
          userId: user._id,
          planId: 'new_user_default'
        });
        
        // Only create subscription if user doesn't have any active subscription
        // and hasn't received the default subscription before
        if (!activeSubscription && !defaultSubscription) {
          const startDate = new Date();
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + 365); // 1 year default
          
          const newSubscription = new Subscription({
            userId: user._id,
            planId: 'new_user_default',
            planName: 'New User Default',
            status: 'active',
            startDate: startDate,
            endDate: endDate,
            price: 0,
            paymentStatus: 'paid',
            paymentCompletedAt: new Date(),
            currentListings: 0,
            totalViews: 0,
            totalRevenue: 0,
            maxListings: 2, // 2 free post ads
            maxPhotos: 10
          });
          
          await newSubscription.save();
          console.log(`✅ Created default subscription for user: ${user._id} (${user.phone || user.email || 'Unknown'})`);
          fixedCount++;
        } else {
          if (activeSubscription) {
            console.log(`⏭️  User ${user._id} already has active subscription: ${activeSubscription.planName}`);
          } else {
            console.log(`⏭️  User ${user._id} already received default subscription`);
          }
          skippedCount++;
        }
      } catch (userError) {
        console.error(`❌ Error processing user ${user._id}:`, userError.message);
        errorCount++;
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`✅ Fixed: ${fixedCount} users`);
    console.log(`⏭️  Skipped: ${skippedCount} users`);
    console.log(`❌ Errors: ${errorCount} users`);
    console.log('🎉 Fix completed!');
    
  } catch (error) {
    console.error('❌ Error fixing subscriptions:', error);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the fix if called directly
if (require.main === module) {
  fixMissingSubscriptions()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { fixMissingSubscriptions };

