/**
 * Utility script to find and optionally clean up orphaned rental requests
 * Orphaned rental requests are those whose user references don't exist in the database
 * 
 * Usage:
 *   node utils/findOrphanedRentalRequests.js --dry-run     # Just find and report
 *   node utils/findOrphanedRentalRequests.js --cleanup    # Find and delete orphaned requests
 */

require('dotenv').config();
const mongoose = require('mongoose');
const RentalRequest = require('../models/RentalRequest');
const User = require('../models/User');

async function findOrphanedRentalRequests() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || process.env.DB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all rental requests
    const allRequests = await RentalRequest.find({}).select('_id title user status createdAt');
    console.log(`\n📊 Total rental requests in database: ${allRequests.length}`);

    // Get all user IDs that exist
    const existingUserIds = new Set();
    const users = await User.find({}).select('_id');
    users.forEach(user => existingUserIds.add(user._id.toString()));
    console.log(`📊 Total users in database: ${existingUserIds.size}`);

    // Find orphaned requests
    const orphanedRequests = [];
    const validRequests = [];

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
      } else {
        validRequests.push(request._id);
      }
    }

    // Report findings
    console.log(`\n📋 ANALYSIS RESULTS:`);
    console.log(`   ✅ Valid requests: ${validRequests.length}`);
    console.log(`   ⚠️  Orphaned requests: ${orphanedRequests.length}`);
    
    if (orphanedRequests.length > 0) {
      console.log(`\n⚠️  ORPHANED RENTAL REQUESTS:`);
      console.log(`   Status breakdown:`);
      const statusBreakdown = {};
      orphanedRequests.forEach(req => {
        statusBreakdown[req.status] = (statusBreakdown[req.status] || 0) + 1;
      });
      Object.entries(statusBreakdown).forEach(([status, count]) => {
        console.log(`     - ${status}: ${count}`);
      });

      console.log(`\n   Details:`);
      orphanedRequests.forEach((req, index) => {
        console.log(`   ${index + 1}. ID: ${req._id}`);
        console.log(`      Title: ${req.title}`);
        console.log(`      User ID: ${req.userId}`);
        console.log(`      Status: ${req.status}`);
        console.log(`      Created: ${req.createdAt}`);
        console.log('');
      });
    }

    return { orphanedRequests, validRequests };

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

async function cleanupOrphanedRequests(orphanedRequests) {
  try {
    console.log(`\n🧹 CLEANING UP ${orphanedRequests.length} orphaned rental requests...`);
    
    const idsToDelete = orphanedRequests.map(req => req._id);
    const result = await RentalRequest.deleteMany({ _id: { $in: idsToDelete } });
    
    console.log(`✅ Successfully deleted ${result.deletedCount} orphaned rental requests`);
    return result;
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run') || (!args.includes('--cleanup') && !args.includes('--dry-run'));
  const shouldCleanup = args.includes('--cleanup');

  try {
    const { orphanedRequests } = await findOrphanedRentalRequests();

    if (orphanedRequests.length === 0) {
      console.log('\n✅ No orphaned rental requests found. Database is clean!');
      await mongoose.connection.close();
      process.exit(0);
    }

    if (isDryRun) {
      console.log('\n💡 This was a dry run. To actually delete orphaned requests, run:');
      console.log('   node utils/findOrphanedRentalRequests.js --cleanup');
    } else if (shouldCleanup) {
      console.log('\n⚠️  WARNING: This will permanently delete orphaned rental requests!');
      await cleanupOrphanedRequests(orphanedRequests);
    }

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Script failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { findOrphanedRentalRequests, cleanupOrphanedRequests };

