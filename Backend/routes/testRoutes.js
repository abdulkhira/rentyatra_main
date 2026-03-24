const express = require('express');
const router = express.Router();
const { testEmail } = require('../controllers/testController');
const User = require('../models/User');

// Test email service
router.post('/email', testEmail);

// Test endpoint to get users for testing chat API
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({ isActive: true })
      .select('_id name email phone')
      .limit(20)
      .lean();
    
    const userList = users.map(user => ({
      userId: user._id.toString(),
      name: user.name || 'No Name',
      email: user.email || 'No Email',
      phone: user.phone || 'No Phone'
    }));
    
    res.json({
      success: true,
      message: 'Users list for testing',
      total: userList.length,
      users: userList
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
});

module.exports = router;
