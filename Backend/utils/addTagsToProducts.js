const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rentyatra', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Product = require('../models/Product');

// Tag mapping based on product names
const tagMapping = {
  'Car': ['Automotive', 'Vehicle', 'Transport'],
  'Bikes': ['Automotive', 'Vehicle', 'Transport', 'Sports'],
  'PC': ['Electronics', 'Computer', 'Technology'],
  'Printer': ['Electronics', 'Office', 'Technology'],
  'Toy': ['Kids', 'Entertainment', 'Games'],
  'Drinks': ['Food', 'Beverages', 'Consumables'],
  'Perfume': ['Beauty', 'Personal Care', 'Fashion'],
  'Cloths': ['Fashion', 'Clothing', 'Personal Care'],
  'EarPhones': ['Electronics', 'Audio', 'Technology'],
  'Furniture': ['Home', 'Furniture', 'Interior']
};

async function addTagsToProducts() {
  try {
    console.log('🚀 Starting to add tags to products...');
    
    const products = await Product.find({});
    console.log(`📦 Found ${products.length} products`);
    
    let updatedCount = 0;
    
    for (const product of products) {
      const productName = product.name;
      const tags = tagMapping[productName] || [productName]; // Default to product name if no mapping
      
      // Update product with tags
      await Product.findByIdAndUpdate(product._id, { tags: tags });
      
      console.log(`✅ Updated ${productName} with tags: ${tags.join(', ')}`);
      updatedCount++;
    }
    
    console.log(`🎉 Successfully updated ${updatedCount} products with tags`);
    
  } catch (error) {
    console.error('❌ Error adding tags to products:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
addTagsToProducts();
