const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Import the User model

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret'; // Must match the secret in auth.js

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.status(401).json({ error: 'No token provided' });

  jwt.verify(token, JWT_SECRET, async (err, userPayload) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });

    try {
      const user = await User.findById(userPayload._id || userPayload.id); // Fetch user from DB
      if (!user) return res.status(404).json({ error: 'User not found' });

      req.user = { id: user._id, tipo: user.tipo }; // Attach user ID and type to request
      console.log('Authenticated user:', req.user);
      next();
    } catch (dbErr) {
      console.error('Error fetching user in auth middleware:', dbErr);
      res.status(500).json({ error: 'Internal server error during authentication' });
    }
  });
};

module.exports = authenticateToken;
