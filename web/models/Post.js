
const mongoose = require('mongoose');
const PostSchema = new mongoose.Schema({
  course: String,
  title: String,
  content: String,
  image: String,
  time: Number,
  votes: Number,
  ratingTotal: Number,
  ratingCount: Number,
  userRating: Number,
  userId: String,   // opcional: quién lo creó
});
module.exports = mongoose.model('Post', PostSchema);
