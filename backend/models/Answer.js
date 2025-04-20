const mongoose = require('mongoose');

const AnswerSchema = new mongoose.Schema({
  questionId: Number,
  text: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { collection: 'answers' }); // ✅ Explicit here too

module.exports = mongoose.model('Answer', AnswerSchema);
