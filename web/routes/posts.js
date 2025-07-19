
const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User'); // Import User model
const authenticateToken = require('../middleware/auth'); // Import the middleware

/* ---------- GET /api/posts?course=... ---------- */
router.get('/', async (req, res) => {
  try {
    const filter = req.query.course ? { course: req.query.course } : {};
    const posts = await Post.find(filter).sort({ time: -1 }).lean(); // Use .lean() for plain JS objects

    // Manual population
    const authorIds = [...new Set(posts.map(p => p.autor))];
    const authors = await User.find({ '_id': { $in: authorIds } });
    const authorMap = authors.reduce((map, author) => {
      map[author._id] = author;
      return map;
    }, {});

    const populatedPosts = posts.map(post => ({
      ...post,
      autor: authorMap[post.autor] || { nombre: 'Usuario Desconocido' } // Replace autor ID with user object
    }));

    console.log('Sending populated posts to client:', JSON.stringify(populatedPosts, null, 2));
    res.json(populatedPosts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

/* ---------- POST /api/posts ---------- */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const data = req.body;
    // 1. Create the post with the author ID
    const newPost = await Post.create({
      ...data,
      autor: req.user.id, // ID from JWT
      time: Date.now(),
      votes: 0,
      ratingTotal: 0,
      ratingCount: 0
    });

    // 2. Find the author's full document
    const author = await User.findById(req.user.id).lean();

    // 3. Combine the post data with the author data
    const populatedPost = {
      ...newPost.toObject(), // Convert Mongoose doc to plain object
      autor: author || { nombre: 'Usuario Desconocido' }
    };

    console.log('Sending new populated post to client:', JSON.stringify(populatedPost, null, 2));
    res.status(201).json(populatedPost);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(400).json({ error: 'Error creating post', details: error.message });
  }
});

/* ---------- PATCH /api/posts/:id (votos / rating) ---------- */
router.patch('/:id', async (req, res) => {
  const { id } = req.params;

  /* votos */
  if (req.body.$inc?.votes) {
    const p = await Post.findByIdAndUpdate(id, { $inc: { votes: req.body.$inc.votes } }, { new: true });
    return res.json({ votes: p.votes });
  }

  /* rating */
  if ('rating' in req.body) {
    const val = Number(req.body.rating);
    const p = await Post.findById(id);

    p.ratingTotal += val;
    p.ratingCount += 1;
    await p.save();

    return res.json({
      ratingTotal: p.ratingTotal,
      ratingCount: p.ratingCount,
      userRating: val
    });
  }

  res.status(400).json({ error: 'Bad PATCH body' });
});

module.exports = router;

