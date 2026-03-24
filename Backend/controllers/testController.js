const asyncHandler = require('express-async-handler');
const emailService = require('../services/emailService');

// @desc    Test email service
// @route   POST /api/test/email
// @access  Public
const testEmail = asyncHandler(async (req, res) => {
  try {
    const { to } = req.body;

    if (!to) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }

    const result = await emailService.sendTestEmail(to);

    res.json({
      success: result.success,
      message: result.message,
      data: result
    });

  } catch (error) {
    console.error('Error testing email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test email service',
      error: error.message
    });
  }
});

module.exports = {
  testEmail
};
