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
  averageRating: Number,
  ratings: [
    {
      userId: { type: String, required: true },
      value: { type: Number, required: true, min: 1, max: 5 }
    }
  ]
});
module.exports = mongoose.model('Post', PostSchema);