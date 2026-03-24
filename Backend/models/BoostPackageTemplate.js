const mongoose = require('mongoose');

const boostPackageTemplateSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  boostCount: {
    type: Number,
    required: true,
    min: 1
  },
  features: [{
    type: String
  }],
  icon: {
    type: String,
    default: 'Zap'
  },
  color: {
    type: String,
    default: 'yellow',
    enum: ['yellow', 'orange', 'purple', 'blue', 'green', 'red']
  },
  popular: {
    type: Boolean,
    default: false
  },
  description: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  // Additional metadata
  metadata: {
    createdBy: String,
    lastModifiedBy: String,
    tags: [String]
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
// id index automatically created by unique: true
boostPackageTemplateSchema.index({ isActive: 1, sortOrder: 1 });
boostPackageTemplateSchema.index({ price: 1 });

// Virtual for formatted price
boostPackageTemplateSchema.virtual('formattedPrice').get(function() {
  return `₹${this.price}`;
});

// Static method to get active packages
boostPackageTemplateSchema.statics.getActivePackages = function() {
  return this.find({ isActive: true }).sort({ sortOrder: 1, price: 1 });
};

// Static method to initialize default packages
boostPackageTemplateSchema.statics.initializeDefaults = async function() {
  const defaultPackages = [
    {
      id: 'boost-1',
      name: 'Quick Boost',
      price: 99,
      boostCount: 4,
      features: [
        'Top placement in search results',
        'Increased visibility',
        'Priority in category listings',
        'Email notifications',
        '4 boosts included'
      ],
      icon: 'Zap',
      color: 'yellow',
      popular: false,
      sortOrder: 1
    },
    {
      id: 'boost-3',
      name: 'Power Boost',
      price: 249,
      boostCount: 8,
      features: [
        'Premium placement in search results',
        'Maximum visibility',
        'Featured in category listings',
        'Priority customer support',
        'Email notifications',
        '8 boosts included'
      ],
      icon: 'Rocket',
      color: 'orange',
      popular: true,
      sortOrder: 2
    },
    {
      id: 'boost-7',
      name: 'Mega Boost',
      price: 499,
      boostCount: 12,
      features: [
        'Ultimate placement in search results',
        'Maximum visibility across platform',
        'Priority customer support',
        'Email notifications',
        '12 boosts included'
      ],
      icon: 'Crown',
      color: 'purple',
      popular: false,
      sortOrder: 3
    }
  ];
  
  for (const packageData of defaultPackages) {
    const existingPackage = await this.findOne({ id: packageData.id });
    if (!existingPackage) {
      const newPackage = new this(packageData);
      await newPackage.save();
      console.log(`Created default boost package template: ${packageData.name}`);
    }
  }
};

module.exports = mongoose.model('BoostPackageTemplate', boostPackageTemplateSchema);
