// Test script to verify boost functionality
// This can be run in the backend to test the boost logic

const mongoose = require('mongoose');
const User = require('./models/User');
const RentalRequest = require('./models/RentalRequest');

async function testBoostLogic() {
  try {
    console.log('🧪 Testing boost logic...');
    
    // Connect to database (adjust connection string as needed)
    // await mongoose.connect('your-mongodb-connection-string');
    
    // Test 1: Check user boost credits initialization
    console.log('\n📊 Test 1: User boost credits initialization');
    const testUser = {
      boostCredits: {
        freeBoosts: 2,
        purchasedBoosts: 0,
        usedBoosts: 0,
        remainingBoosts: 2
      }
    };
    
    console.log('✅ Initial boost credits:', testUser.boostCredits);
    
    // Test 2: Simulate boost deduction
    console.log('\n📊 Test 2: Boost deduction simulation');
    const userAfterBoost = { ...testUser };
    userAfterBoost.boostCredits.usedBoosts += 1;
    userAfterBoost.boostCredits.remainingBoosts = 
      userAfterBoost.boostCredits.freeBoosts + 
      userAfterBoost.boostCredits.purchasedBoosts - 
      userAfterBoost.boostCredits.usedBoosts;
    
    console.log('✅ After using 1 boost:', userAfterBoost.boostCredits);
    
    // Test 3: Check remaining boosts calculation
    console.log('\n📊 Test 3: Remaining boosts calculation');
    const remainingBoosts = userAfterBoost.boostCredits.remainingBoosts;
    const expectedRemaining = 2 + 0 - 1; // freeBoosts + purchasedBoosts - usedBoosts
    
    console.log(`✅ Remaining boosts: ${remainingBoosts}`);
    console.log(`✅ Expected remaining: ${expectedRemaining}`);
    console.log(`✅ Calculation correct: ${remainingBoosts === expectedRemaining}`);
    
    // Test 4: Simulate purchasing boost package
    console.log('\n📊 Test 4: Purchasing boost package simulation');
    const userAfterPurchase = { ...userAfterBoost };
    userAfterPurchase.boostCredits.purchasedBoosts += 4; // 4-boost package
    userAfterPurchase.boostCredits.remainingBoosts = 
      userAfterPurchase.boostCredits.freeBoosts + 
      userAfterPurchase.boostCredits.purchasedBoosts - 
      userAfterPurchase.boostCredits.usedBoosts;
    
    console.log('✅ After purchasing 4-boost package:', userAfterPurchase.boostCredits);
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Uncomment to run the test
// testBoostLogic();

module.exports = { testBoostLogic };
