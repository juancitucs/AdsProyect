const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const User = require('../models/User');
const authenticateToken = require('../middleware/auth');

// Helper function to build comment tree
const buildCommentTree = (comments, parentId = null) => {
  const tree = [];
  comments.forEach(comment => {
    // Convert IDs to string for consistent comparison
    const currentCommentId = comment._id.toString();
    const currentParentId = parentId ? parentId.toString() : null;

    if ((comment.parentId ? comment.parentId.toString() : null) === currentParentId) {
      const replies = buildCommentTree(comments, currentCommentId);
      if (replies.length > 0) {
        comment.replies = replies;
      }
      tree.push(comment);
    }
  });
  return tree;
};

// GET comments for a post
router.get('/posts/:postId/comments', async (req, res) => {
  try {
    const { postId } = req.params;
    const comments = await Comment.find({ postId }).lean();

    // Populate author details for each comment
    const authorIds = [...new Set(comments.map(c => c.author))];
    const authors = await User.find({ '_id': { $in: authorIds } }).lean();
    const authorMap = authors.reduce((map, author) => {
      map[author._id] = author;
      return map;
    }, {});

    const populatedComments = comments.map(comment => ({
      ...comment,
      authorName: authorMap[comment.author]?.nombre || 'Usuario desconocido',
      authorAvatar: authorMap[comment.author]?.perfil?.foto || 'imagenes/usuario.png'
    }));

    const commentTree = buildCommentTree(populatedComments);
    res.json(commentTree);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Error al obtener comentarios' });
  }
});

// POST a new comment or reply
router.post('/posts/:postId/comments', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, parentId } = req.body;
    const authorId = req.user.id; // From authenticated token

    const newComment = new Comment({
      postId,
      author: authorId,
      content,
      parentId: parentId || null
    });

    await newComment.save();

    // Optionally, return the populated comment for immediate display
    const author = await User.findById(authorId).lean();
    const populatedComment = {
      ...newComment.toObject(),
      authorName: author?.nombre || 'Usuario desconocido',
      authorAvatar: author?.perfil?.foto || 'imagenes/usuario.png'
    };

    res.status(201).json(populatedComment);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Error al crear comentario' });
  }
});

module.exports = router;
