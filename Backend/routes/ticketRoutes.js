const express = require('express');
const router = express.Router();
const {
  createTicket,
  createPublicTicket,
  getAllTickets,
  getUserTickets,
  getMyTickets,
  updateTicketStatus,
  addAdminNotes,
  adminUpdateTicket,
  addResolutionNotes,
  getTicketById
} = require('../controllers/ticketController');
const { protect } = require('../middleware/auth');
const { adminAuth } = require('../middleware/adminAuth');

// @route   POST /api/tickets
// @desc    Create a new ticket
// @access  Private
router.post('/', protect, createTicket);

// @route   POST /api/tickets/public
// @desc    Create a new ticket (Public)
// @access  Public
router.post('/public', createPublicTicket);

// @route   GET /api/tickets/public
// @desc    Get all tickets (Public - for testing)
// @access  Public
router.get('/public', getAllTickets);

// @route   GET /api/tickets
// @desc    Get all tickets (Admin only)
// @access  Private/Admin
router.get('/', adminAuth, getAllTickets);

// @route   GET /api/tickets/user/:userId
// @desc    Get tickets for a specific user
// @access  Private
router.get('/user/:userId', protect, getUserTickets);

// @route   GET /api/tickets/my-tickets
// @desc    Get current user's tickets
// @access  Private
router.get('/my-tickets', protect, getMyTickets);

// @route   GET /api/tickets/:id
// @desc    Get ticket by ID
// @access  Private
router.get('/:id', protect, getTicketById);

// @route   PUT /api/tickets/:id/status
// @desc    Update ticket status
// @access  Private/Admin
router.put('/:id/status', adminAuth, updateTicketStatus);

// @route   PUT /api/tickets/:id/admin-notes
// @desc    Add admin notes to ticket
// @access  Private/Admin
router.put('/:id/admin-notes', adminAuth, addAdminNotes);

// @route   PUT /api/tickets/:id/admin-update
// @desc    Update ticket status and resolution notes (Admin)
// @access  Private/Admin
router.put('/:id/admin-update', adminAuth, adminUpdateTicket);

// @route   PUT /api/tickets/:id/resolution-notes
// @desc    Add resolution notes to ticket
// @access  Private/Admin
router.put('/:id/resolution-notes', adminAuth, addResolutionNotes);

module.exports = router;
