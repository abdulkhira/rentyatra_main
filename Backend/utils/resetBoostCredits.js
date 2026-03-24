/**
 * Utility script to reset boost credits for all users or a specific user
 * This fixes corrupted boost credits data (e.g., 258 remaining when it should be 2)
 * 
 * Usage:
 *   node utils/resetBoostCredits.js                    # Reset all users
 *   node utils/resetBoostCredits.js --userId <userId>   # Reset specific user
 *   node utils/resetBoostCredits.js --dry-run          # Preview changes without applying
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

async function resetBoostCredits(userId = null, dryRun = false) {
  try {
    await connectDB();
    
    console.log('🔧 Starting boost credits reset...');
    console.log(`Mode: ${dryRun ? 'DRY RUN (no changes will be made)' : 'LIVE (changes will be applied)'}`);
    console.log(`Target: ${userId ? `User ${userId}` : 'All users'}`);
    console.log('');
    
    // Build query
    const query = userId ? { _id: userId } : {};
    
    // Find users
    const users = await User.find(query).select('_id name email phone boostCredits');
    
    console.log(`📊 Found ${users.length} user(s) to check`);
    console.log('');
    
    let fixedCount = 0;
    let resetCount = 0;
    
    for (const user of users) {
      const needsFix = !user.boostCredits || 
                       isNaN(user.boostCredits.remainingBoosts) ||
                       user.boostCredits.remainingBoosts < 0 ||
                       user.boostCredits.remainingBoosts > 10000;
      
      const calculatedRemaining = user.boostCredits 
        ? (user.boostCredits.freeBoosts || 0) + 
          (user.boostCredits.purchasedBoosts || 0) - 
          (user.boostCredits.usedBoosts || 0)
        : 2;
      
      const hasMismatch = user.boostCredits && 
                          user.boostCredits.remainingBoosts !== calculatedRemaining &&
                          Math.abs(user.boostCredits.remainingBoosts - calculatedRemaining) > 1;
      
      if (needsFix || hasMismatch) {
        console.log(`👤 User: ${user.name || user.email || user.phone || user._id}`);
        console.log(`   Current boost credits:`, user.boostCredits || 'MISSING');
        
        if (needsFix) {
          console.log(`   ⚠️ Invalid data detected - will reset to defaults`);
          resetCount++;
        } else if (hasMismatch) {
          console.log(`   ⚠️ Mismatch detected: ${user.boostCredits.remainingBoosts} vs calculated ${calculatedRemaining}`);
          fixedCount++;
        }
        
        if (!dryRun) {
          if (needsFix) {
            // Reset to defaults
            user.boostCredits = {
              freeBoosts: 2,
              purchasedBoosts: 0,
              usedBoosts: 0,
              remainingBoosts: 2
            };
          } else {
            // Fix calculation
            user.boostCredits.remainingBoosts = calculatedRemaining;
          }
          await user.save();
          console.log(`   ✅ Fixed and saved`);
        } else {
          console.log(`   🔍 Would fix (dry run)`);
        }
        console.log('');
      }
    }
    
    console.log('');
    console.log('📊 Summary:');
    console.log(`   Users checked: ${users.length}`);
    console.log(`   Users with mismatches: ${fixedCount}`);
    console.log(`   Users reset to defaults: ${resetCount}`);
    console.log(`   Total fixes needed: ${fixedCount + resetCount}`);
    
    if (dryRun && (fixedCount > 0 || resetCount > 0)) {
      console.log('');
      console.log('💡 Run without --dry-run to apply fixes');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting boost credits:', error);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
let userId = null;
let dryRun = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--userId' && args[i + 1]) {
    userId = args[i + 1];
    i++;
  } else if (args[i] === '--dry-run') {
    dryRun = true;
  }
}

resetBoostCredits(userId, dryRun);

