
// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// General request logger - MUST be before any specific routes
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});

const {
  DB_HOST = 'mongodb',
  DB_PORT = '27017',
  DB_NAME = 'test',
  DB_USER,
  DB_PASSWORD
} = process.env;

// MongoDB URI

const uri = `mongodb://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?authSource=admin`;
// Conexión a MongoDB
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('🔌 Conectado a MongoDB');
}).catch(err => {
  console.error('❌ Error al conectar a MongoDB:', err.message);
});

// Rutas API
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');
const commentRoutes = require('./routes/comments');
const courseRoutes = require('./routes/courses'); // Import courses route
const Post = require('./models/Post'); // Import Post model
const Course = require('./models/Course'); // Import Course model

app.use('/api', authRoutes);

// New: Get top users by average post rating - moved here to ensure it's processed before dynamic user routes
app.get('/api/users/top', async (req, res) => {
  try {
    const topUsers = await Post.aggregate([
      {
        $match: {
          averageRating: { $exists: true, $ne: null } // Only consider posts with an average rating
        }
      },
      {
        $group: {
          _id: '$autor', // Group by user ID
          totalRatingSum: { $sum: '$averageRating' },
          postCount: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0, // Exclude _id from this stage
          userId: '$_id',
          overallAverageRating: { $divide: ['$totalRatingSum', '$postCount'] }
        }
      },
      {
        $sort: { overallAverageRating: -1 } // Sort by overall average rating descending
      },
      {
        $limit: 10 // Get top 10 users
      },
      {
        $lookup: {
          from: 'users', // The collection to join with (MongoDB automatically pluralizes model names)
          localField: 'userId',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      {
        $unwind: '$userDetails' // Deconstruct the userDetails array
      },
      {
        $project: {
          userId: '$userDetails._id',
          nombre: '$userDetails.nombre',
          email: '$userDetails.email', // Include email if needed, but be mindful of privacy
          foto: '$userDetails.perfil.foto',
          overallAverageRating: { $round: ['$overallAverageRating', 2] } // Round to 2 decimal places
        }
      }
    ]);
    res.json(topUsers);
  } catch (err) {
    console.error('Error fetching top users:', err);
    res.status(500).json({ error: 'Error al obtener los usuarios principales' });
  }
});

app.use('/api/users', userRoutes);
app.use('/api/posts', express.json(), postRoutes);
app.use('/api', commentRoutes);
app.use('/api/courses', courseRoutes); // Add courses route

// Servir frontend
app.use(express.static(path.join(__dirname, 'web')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'web', 'index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
});


