const User = require('../models/User');

/**
 * Utility function to fix incorrect boost credits calculation
 * This should be run once to fix existing users with wrong boost counts
 */
async function fixBoostCredits() {
  try {
    console.log('🔧 Starting boost credits fix...');
    
    // Get all users with boostCredits
    const users = await User.find({ boostCredits: { $exists: true } });
    
    console.log(`📊 Found ${users.length} users with boost credits`);
    
    let fixedCount = 0;
    
    for (const user of users) {
      if (user.boostCredits) {
        const oldRemainingBoosts = user.boostCredits.remainingBoosts;
        
        // Recalculate remaining boosts correctly
        const correctRemainingBoosts = user.boostCredits.freeBoosts + user.boostCredits.purchasedBoosts - user.boostCredits.usedBoosts;
        
        if (oldRemainingBoosts !== correctRemainingBoosts) {
          user.boostCredits.remainingBoosts = correctRemainingBoosts;
          await user.save();
          
          console.log(`✅ Fixed user ${user._id}: ${oldRemainingBoosts} → ${correctRemainingBoosts} remaining boosts`);
          fixedCount++;
        }
      }
    }
    
    console.log(`🎉 Fix completed! Fixed ${fixedCount} users`);
    
  } catch (error) {
    console.error('❌ Error fixing boost credits:', error);
  }
}

module.exports = { fixBoostCredits };
