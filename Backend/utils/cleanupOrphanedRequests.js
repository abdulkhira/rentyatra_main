/**
 * Quick script to cleanup orphaned rental requests via API
 * 
 * Usage:
 *   node utils/cleanupOrphanedRequests.js --dry-run     # Preview what will be deleted
 *   node utils/cleanupOrphanedRequests.js --cleanup    # Actually delete orphaned requests
 */

require('dotenv').config();
const axios = require('axios');

async function cleanupOrphanedRequests(dryRun = true) {
  try {
    const apiUrl = process.env.API_URL || 'http://localhost:5000/api';
    const adminToken = process.env.ADMIN_TOKEN; // You can set this in .env
    
    if (!adminToken) {
      console.error('❌ ADMIN_TOKEN not set in environment variables');
      console.log('💡 To use this script, set ADMIN_TOKEN in your .env file');
      console.log('💡 Or use the admin panel to call: POST /api/admin/rental-requests/cleanup-orphaned');
      process.exit(1);
    }

    const url = `${apiUrl}/admin/rental-requests/cleanup-orphaned`;
    
    console.log(`📡 Calling cleanup endpoint: ${url}`);
    console.log(`🔄 Mode: ${dryRun ? 'DRY RUN (preview only)' : 'CLEANUP (will delete)'}`);
    
    const response = await axios.post(url, {
      dryRun: dryRun
    }, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      console.log('\n✅ Success:', response.data.message);
      console.log('\n📊 Results:');
      console.log(`   Orphaned requests found: ${response.data.data.orphanedCount}`);
      console.log(`   Deleted: ${response.data.data.deletedCount}`);
      
      if (response.data.data.statusBreakdown) {
        console.log('\n   Status breakdown:');
        Object.entries(response.data.data.statusBreakdown).forEach(([status, count]) => {
          console.log(`     - ${status}: ${count}`);
        });
      }

      if (dryRun && response.data.data.orphanedRequests) {
        console.log('\n   Sample orphaned requests (first 10):');
        response.data.data.orphanedRequests.slice(0, 10).forEach((req, index) => {
          console.log(`     ${index + 1}. ${req.title} (ID: ${req._id})`);
        });
      }

      if (dryRun && response.data.data.orphanedCount > 0) {
        console.log('\n💡 This was a dry run. To actually delete, run:');
        console.log('   node utils/cleanupOrphanedRequests.js --cleanup');
      }
    } else {
      console.error('❌ Cleanup failed:', response.data.message);
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
      console.error('Status:', error.response.status);
    }
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run') || (!args.includes('--cleanup'));
  const shouldCleanup = args.includes('--cleanup');

  if (shouldCleanup) {
    console.log('⚠️  WARNING: This will permanently delete orphaned rental requests!');
    console.log('⚠️  Press Ctrl+C within 5 seconds to cancel...');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  await cleanupOrphanedRequests(isDryRun);
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { cleanupOrphanedRequests };

