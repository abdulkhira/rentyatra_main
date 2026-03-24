const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Banner title is required'],
    trim: true,
    maxlength: [100, 'Banner title cannot exceed 100 characters']
  },
  banner: {
    type: String,
    required: [true, 'Banner image is required']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Banner', bannerSchema);
