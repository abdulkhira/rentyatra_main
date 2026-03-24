// Script to initialize default boost packages
// Run this once to set up the default boost package templates

const mongoose = require('mongoose');
const BoostPackageTemplate = require('./models/BoostPackageTemplate');

async function initializeBoostPackages() {
  try {
    // Connect to MongoDB (adjust connection string as needed)
    // await mongoose.connect('your-mongodb-connection-string');
    
    console.log('🚀 Initializing default boost packages...');
    
    // Initialize default packages
    await BoostPackageTemplate.initializeDefaults();
    
    console.log('✅ Default boost packages initialized successfully!');
    
    // Verify packages were created
    const packages = await BoostPackageTemplate.find({ isActive: true });
    console.log(`📊 Created ${packages.length} boost packages:`);
    packages.forEach(pkg => {
      console.log(`  - ${pkg.name}: ₹${pkg.price} (${pkg.boostCount} boosts)`);
    });
    
  } catch (error) {
    console.error('❌ Error initializing boost packages:', error);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Uncomment to run the initialization
// initializeBoostPackages();

module.exports = { initializeBoostPackages };
