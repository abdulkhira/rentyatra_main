const Ticket = require('../models/Ticket');
const User = require('../models/User');
const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');

// Get Socket.IO instance
const getSocketIO = () => {
  const { Server } = require('socket.io');
  return global.io; // We'll set this in server.js
};

// @desc    Create a new ticket
// @route   POST /api/tickets
// @access  Private
const createTicket = asyncHandler(async (req, res) => {
  const { subject, description, priority, userName, userEmail, userPhone } = req.body;
  const userId = req.user?.id;

  console.log('Creating ticket for user ID:', userId);
  console.log('User from JWT:', req.user);
  console.log('Request body:', req.body);

  // Check if user ID exists
  if (!userId) {
    console.log('No user ID found in JWT token');
    console.log('Creating ticket with fallback user data');
    
    // Fallback: Create ticket with minimal user data
    const ticket = await Ticket.create({
      subject,
      description,
      priority: priority || 'medium',
      status: 'submitted',
      userId: new mongoose.Types.ObjectId(), // Generate a new ObjectId
      user: {
        name: userName || 'Anonymous User',
        email: userEmail || 'anonymous@example.com',
        phone: userPhone || 'N/A'
      }
    });

    return res.status(201).json({
      success: true,
      data: ticket,
      warning: 'Ticket created with anonymous user data (authentication failed)'
    });
  }

  // Ensure userId is a valid ObjectId string
  const validUserId = userId.toString();
  console.log('Valid userId:', validUserId);

  // Fetch complete user details from database
  const user = await User.findById(validUserId);
  
  console.log('User found in database:', user);
  
  if (!user) {
    console.log('User not found in database for ID:', userId);
    console.log('Attempting to create ticket with JWT user data as fallback');
    
    // Fallback: Use JWT user data if database lookup fails
    const ticket = await Ticket.create({
      subject,
      description,
      priority: priority || 'medium',
      userId: validUserId,
      user: {
        name: req.user.name || userName || 'Unknown User',
        email: req.user.email || userEmail || 'unknown@email.com',
        phone: req.user.phone || userPhone || 'N/A'
      }
    });

    return res.status(201).json({
      success: true,
      data: ticket,
      warning: 'User data from JWT token (database lookup failed)'
    });
  }

  const ticket = await Ticket.create({
    subject,
    description,
    priority: priority || 'medium',
    userId: validUserId,
    user: {
      name: user.name || userName || 'Unknown User',
      email: user.email || userEmail || 'unknown@email.com',
      phone: user.phone || userPhone || 'N/A'
    }
  });

  res.status(201).json({
    success: true,
    data: ticket
  });
});

// @desc    Get all tickets (Admin only)
// @route   GET /api/tickets
// @access  Private/Admin
const getAllTickets = asyncHandler(async (req, res) => {
  const tickets = await Ticket.find()
    .sort({ createdAt: -1 })
    .populate('userId', 'name email phone');

  res.json({
    success: true,
    count: tickets.length,
    data: tickets
  });
});

// @desc    Get tickets for a specific user
// @route   GET /api/tickets/user/:userId
// @access  Private
const getUserTickets = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // Check if user is requesting their own tickets or is admin
  const userRole = req.admin?.role || req.user?.role;
  const userIdFromToken = req.admin?.adminId || req.user?.id;
  if (userIdFromToken.toString() !== userId.toString() && userRole !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access these tickets'
    });
  }

  const tickets = await Ticket.find({ userId })
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: tickets.length,
    data: tickets
  });
});

// @desc    Get current user's tickets
// @route   GET /api/tickets/my-tickets
// @access  Private
const getMyTickets = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  console.log("USER:", req.user);


  const tickets = await Ticket.find({ userId })
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: tickets.length,
    data: tickets
  });
});

// @desc    Update ticket status
// @route   PUT /api/tickets/:id/status
// @access  Private/Admin
const updateTicketStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  console.log('🔄 Updating ticket status:', { id, status });

  if (!['new', 'submitted', 'in-progress', 'completed'].includes(status)) {
    console.log('❌ Invalid status:', status);
    return res.status(400).json({
      success: false,
      message: 'Invalid status. Must be "new", "submitted", "in-progress", or "completed"'
    });
  }

  const ticket = await Ticket.findById(id);

  if (!ticket) {
    console.log('❌ Ticket not found:', id);
    return res.status(404).json({
      success: false,
      message: 'Ticket not found'
    });
  }

  console.log('📝 Current ticket status:', ticket.status);
  console.log('📝 Updating to status:', status);
  
  ticket.status = status;
  ticket.lastUpdate = new Date();
  await ticket.save();

  console.log('✅ Ticket status updated successfully:', ticket.status);
  console.log('✅ Updated ticket:', { id: ticket._id, status: ticket.status, lastUpdate: ticket.lastUpdate });

  // Emit real-time update to all connected clients
  try {
    const io = getSocketIO();
    if (io) {
      io.emit('ticketStatusUpdated', {
        ticketId: ticket._id,
        status: ticket.status,
        lastUpdate: ticket.lastUpdate,
        subject: ticket.subject
      });
      console.log('📡 Real-time update emitted for ticket:', ticket._id);
    }
  } catch (error) {
    console.log('⚠️ Could not emit real-time update:', error.message);
  }

  res.json({
    success: true,
    data: ticket
  });
});

// @desc    Add admin notes to ticket
// @route   PUT /api/tickets/:id/admin-notes
// @access  Private/Admin
const addAdminNotes = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { adminNotes } = req.body;

  const ticket = await Ticket.findById(id);

  if (!ticket) {
    return res.status(404).json({
      success: false,
      message: 'Ticket not found'
    });
  }

  ticket.adminNotes = adminNotes;
  ticket.lastUpdate = new Date();
  await ticket.save();

  res.json({
    success: true,
    data: ticket
  });
});

// @desc    Update ticket status and resolution notes (Admin)
// @route   PUT /api/tickets/:id/admin-update
// @access  Private/Admin
const adminUpdateTicket = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, resolutionNotes, adminNotes } = req.body;
  const adminId = req.admin?.adminId || req.user?.id;

  console.log('🔄 Admin updating ticket:', { id, status, resolutionNotes, adminId });

  const ticket = await Ticket.findById(id);

  if (!ticket) {
    console.log('❌ Ticket not found:', id);
    return res.status(404).json({
      success: false,
      message: 'Ticket not found'
    });
  }

  // Validate status if provided
  if (status && !['new', 'submitted', 'in-progress', 'completed'].includes(status)) {
    console.log('❌ Invalid status:', status);
    return res.status(400).json({
      success: false,
      message: 'Invalid status. Must be "new", "submitted", "in-progress", or "completed"'
    });
  }

  // Update fields if provided
  if (status) {
    ticket.status = status;
    console.log('📝 Status updated to:', status);
  }

  if (resolutionNotes !== undefined) {
    ticket.resolutionNotes = resolutionNotes;
    console.log('📝 Resolution notes updated');
  }

  if (adminNotes !== undefined) {
    ticket.adminNotes = adminNotes;
    console.log('📝 Admin notes updated');
  }

  ticket.updatedBy = adminId;
  ticket.lastUpdate = new Date();
  await ticket.save();

  console.log('✅ Ticket updated successfully:', {
    id: ticket._id,
    status: ticket.status,
    hasResolutionNotes: !!ticket.resolutionNotes,
    hasAdminNotes: !!ticket.adminNotes,
    lastUpdate: ticket.lastUpdate
  });

  // Emit real-time update to all connected clients
  try {
    const io = getSocketIO();
    if (io) {
      io.emit('ticketUpdated', {
        ticketId: ticket._id,
        status: ticket.status,
        resolutionNotes: ticket.resolutionNotes,
        adminNotes: ticket.adminNotes,
        lastUpdate: ticket.lastUpdate,
        updatedBy: adminId,
        subject: ticket.subject
      });
      console.log('📡 Real-time update emitted for ticket:', ticket._id);
    }
  } catch (error) {
    console.log('⚠️ Could not emit real-time update:', error.message);
  }

  res.json({
    success: true,
    data: ticket,
    message: 'Ticket updated successfully'
  });
});

// @desc    Add resolution notes to ticket
// @route   PUT /api/tickets/:id/resolution-notes
// @access  Private/Admin
const addResolutionNotes = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { resolutionNotes } = req.body;
  const adminId = req.admin?.adminId || req.user?.id;

  console.log('🔄 Adding resolution notes to ticket:', { id, adminId });

  const ticket = await Ticket.findById(id);

  if (!ticket) {
    console.log('❌ Ticket not found:', id);
    return res.status(404).json({
      success: false,
      message: 'Ticket not found'
    });
  }

  ticket.resolutionNotes = resolutionNotes;
  ticket.updatedBy = adminId;
  ticket.lastUpdate = new Date();
  await ticket.save();

  console.log('✅ Resolution notes added successfully');

  // Emit real-time update
  try {
    const io = getSocketIO();
    if (io) {
      io.emit('ticketResolutionUpdated', {
        ticketId: ticket._id,
        resolutionNotes: ticket.resolutionNotes,
        lastUpdate: ticket.lastUpdate,
        updatedBy: adminId,
        subject: ticket.subject
      });
      console.log('📡 Real-time resolution update emitted for ticket:', ticket._id);
    }
  } catch (error) {
    console.log('⚠️ Could not emit real-time update:', error.message);
  }

  res.json({
    success: true,
    data: ticket,
    message: 'Resolution notes added successfully'
  });
});

// @desc    Get ticket by ID
// @route   GET /api/tickets/:id
// @access  Private
const getTicketById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const ticket = await Ticket.findById(id);

  if (!ticket) {
    return res.status(404).json({
      success: false,
      message: 'Ticket not found'
    });
  }

  // Check if user is authorized to view this ticket
  const userRole = req.admin?.role || req.user?.role;
  const userIdFromToken = req.admin?.adminId || req.user?.id;
  if (userIdFromToken.toString() !== ticket.userId.toString() && userRole !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view this ticket'
    });
  }

  res.json({
    success: true,
    data: ticket
  });
});

// @desc    Create a new ticket (Public - no auth required)
// @route   POST /api/tickets/public
// @access  Public
const createPublicTicket = asyncHandler(async (req, res) => {
  const { subject, description, priority, userEmail, userName, userPhone } = req.body;

  console.log('Creating public ticket with data:', req.body);

  const ticket = await Ticket.create({
    subject,
    description,
    priority: priority || 'medium',
    status: 'submitted',
    userId: new mongoose.Types.ObjectId(), // Generate a new ObjectId
    user: {
      name: userName || 'Anonymous User',
      email: userEmail || 'anonymous@example.com',
      phone: userPhone || 'N/A'
    }
  });

  res.status(201).json({
    success: true,
    data: ticket,
    message: 'Ticket created successfully'
  });
});

module.exports = {
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
};
