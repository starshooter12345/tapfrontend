const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['personal', 'preferences', 'feedback'],
    default: 'feedback'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { collection: 'test.questions' });

module.exports = mongoose.model('Question', QuestionSchema);