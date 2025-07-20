const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  author: {
    type: String,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null // For top-level comments
  },
  // replies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }] // Not strictly needed if we query by parentId
});

module.exports = mongoose.model('Comment', CommentSchema);
