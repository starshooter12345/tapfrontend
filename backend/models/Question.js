const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  _id: Number,
  text: String
}, { collection: 'questions' }); // ✅ Explicitly use your collection name

module.exports = mongoose.model('Question', QuestionSchema);

