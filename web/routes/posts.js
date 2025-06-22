
const express = require('express');
const router = express.Router();
const Post = require('../models/Post');

/* ---------- GET /api/posts?course=... ---------- */
router.get('/', async (req, res) => {
  const filter = req.query.course ? { course: req.query.course } : {};
  const posts = await Post.find(filter).sort({ time: -1 });
  res.json(posts);
});

/* ---------- POST /api/posts ---------- */
router.post('/', async (req, res) => {
  const data = req.body;
  const post = await Post.create({
    ...data,
    time: Date.now(),
    votes: 0,
    ratingTotal: 0,
    ratingCount: 0
  });
  res.status(201).json(post);
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

