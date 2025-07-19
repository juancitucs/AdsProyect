const mongoose = require('mongoose');
const PostSchema = new mongoose.Schema({
  autor: {
    type: String,
    ref: 'User',
    required: true
  },
  course: String,
  title: String,
  content: String,
  image: String,
  time: Number,
  votes: Number,
  ratingTotal: Number,
  ratingCount: Number,
  userRating: Number,
});
module.exports = mongoose.model('Post', PostSchema);