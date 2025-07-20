
const express = require('express');
const router = express.Router();
console.log('Posts router loaded.');
const Post = require('../models/Post');
const User = require('../models/User'); // Import User model
const authenticateToken = require('../middleware/auth'); // Import the middleware

/* ---------- GET /api/posts/:id ---------- */
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).lean();
    if (!post) {
      return res.status(404).json({ error: 'Post no encontrado' });
    }

    // Check if the authenticated user has rated this post
    let hasRated = false;
    if (req.user && post.ratings) {
      hasRated = post.ratings.some(r => r.userId === req.user.id);
    }

    res.json({ ...post, hasRated });
  } catch (error) {
    console.error('Error al obtener post por ID:', error);
    res.status(500).json({ error: 'Error interno al obtener post' });
  }
});

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

    const populatedPosts = posts.map(post => {
      // Check if the authenticated user has rated this post
      let hasRated = false;
      if (req.user && post.ratings) {
        hasRated = post.ratings.some(r => r.userId === req.user.id);
      }
      return {
        ...post,
        autor: authorMap[post.autor] || { nombre: 'Usuario Desconocido' },
        hasRated
      };
    });

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
      ratingTotal: 0,
      ratingCount: 0,
      averageRating: 0
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

/* ---------- PATCH /api/posts/:id (votos / rating / update fields) ---------- */
router.patch('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  console.log('Received PATCH request body:', req.body);

  try {
    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ error: 'Post no encontrado' });
    }

    /* rating */
    if ('rating' in req.body) {
      const val = Number(req.body.rating);
      const userId = req.user.id; // Get the ID of the authenticated user

      // Check if the user has already rated this post
      const existingRatingIndex = post.ratings.findIndex(r => r.userId === userId);

      if (existingRatingIndex > -1) {
        // User has already rated, prevent re-rating
        return res.status(400).json({ error: 'Ya has calificado esta publicación.' });
      }

      // Add the new rating to the ratings array
      post.ratings.push({ userId, value: val });

      // Recalculate ratingTotal and ratingCount from the ratings array
      post.ratingTotal = post.ratings.reduce((sum, r) => sum + r.value, 0);
      post.ratingCount = post.ratings.length;
      post.averageRating = post.ratingCount > 0 ? (post.ratingTotal / post.ratingCount) : 0;

      console.log('Attempting to save post with new rating:', post);
      await post.save();
      console.log('Post saved successfully with new rating.');

      return res.json({
        ratingTotal: post.ratingTotal,
        ratingCount: post.ratingCount,
        averageRating: post.averageRating,
        hasRated: true // Indicate that the current user has now rated this post
      });
    }

    // For other updates (title, content, image, course), only the author can modify
    if (post.autor.toString() !== req.user.id) {
      return res.status(403).json({ error: 'No autorizado para modificar este post' });
    }

    const { title, content, image, course } = req.body;
    if (title) post.title = title;
    if (content) post.content = content;
    if (image) post.image = image;
    if (course) post.course = course;

    await post.save();

    // Re-populate author for the response
    const author = await User.findById(post.autor).lean();
    const populatedPost = {
      ...post.toObject(),
      autor: author || { nombre: 'Usuario Desconocido' }
    };

    res.json(populatedPost);

  } catch (error) {
    console.error('Error al actualizar post:', error);
    res.status(500).json({ error: 'Error interno al actualizar post' });
  }
});

/* ---------- DELETE /api/posts/:id ---------- */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ error: 'Post no encontrado' });
    }

    // Verificar que el usuario autenticado es el autor del post
    if (post.autor.toString() !== req.user.id) {
      return res.status(403).json({ error: 'No autorizado para eliminar este post' });
    }

    await Post.findByIdAndDelete(id);
    res.status(200).json({ message: 'Post eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar post:', error);
    res.status(500).json({ error: 'Error interno al eliminar post' });
  }
});

module.exports = router;

