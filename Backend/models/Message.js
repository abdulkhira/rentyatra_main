const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file'],
    default: 'text'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: false // Optional, for product-related chats
  },
  conversationId: {
    type: String,
    required: true,
    index: true
  }
}, {
  timestamps: true
});

// Create compound index for efficient querying
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ sender: 1, receiver: 1 });
messageSchema.index({ isRead: 1, receiver: 1 });

// Virtual for conversation participants
messageSchema.virtual('participants', {
  ref: 'User',
  localField: 'sender',
  foreignField: '_id',
  justOne: true
});

// Static method to generate conversation ID
messageSchema.statics.generateConversationId = function(user1Id, user2Id) {
  const sortedIds = [user1Id.toString(), user2Id.toString()].sort();
  return `${sortedIds[0]}_${sortedIds[1]}`;
};

// Static method to get conversation between two users
messageSchema.statics.getConversation = function(user1Id, user2Id, page = 1, limit = 50) {
  const conversationId = this.generateConversationId(user1Id, user2Id);
  
  return this.find({ conversationId })
    .populate('sender', 'name email profilePicture')
    .populate('receiver', 'name email profilePicture')
    .populate('product', 'title images')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
};

// Static method to get user's conversations
messageSchema.statics.getUserConversations = function(userId) {
  return this.aggregate([
    {
      $match: {
        $or: [
          { sender: new mongoose.Types.ObjectId(userId) },
          { receiver: new mongoose.Types.ObjectId(userId) }
        ]
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $group: {
        _id: '$conversationId',
        lastMessage: { $first: '$$ROOT' },
        unreadCount: {
          $sum: {
        $cond: [
          { $and: [{ $eq: ['$receiver', new mongoose.Types.ObjectId(userId)] }, { $eq: ['$isRead', false] }] },
          1,
          0
        ]
          }
        }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'lastMessage.sender',
        foreignField: '_id',
        as: 'sender'
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'lastMessage.receiver',
        foreignField: '_id',
        as: 'receiver'
      }
    },
    {
      $lookup: {
        from: 'products',
        localField: 'lastMessage.product',
        foreignField: '_id',
        as: 'product'
      }
    },
    {
      $project: {
        conversationId: '$_id',
        lastMessage: 1,
        unreadCount: 1,
        sender: { $arrayElemAt: ['$sender', 0] },
        receiver: { $arrayElemAt: ['$receiver', 0] },
        product: { $arrayElemAt: ['$product', 0] }
      }
    },
    {
      $sort: { 'lastMessage.createdAt': -1 }
    }
  ]);
};

// Instance method to mark as read
messageSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Message', messageSchema);
