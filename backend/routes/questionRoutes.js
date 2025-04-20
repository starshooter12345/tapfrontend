const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const Answer = require('../models/Answer');

// GET questions with their answers (max 10)
router.get('/', async (req, res) => {
  try {
    const questions = await Question.find().limit(10);
    const answers = await Answer.find();
    const response = questions.map(q => ({
      ...q._doc,
      answer: answers.find(a => a.questionId === q._id)?.text || ''
    }));
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST answer for a question
router.post('/answer', async (req, res) => {
  const { questionId, text } = req.body;
  try {
    const newAnswer = new Answer({ questionId, text });
    await newAnswer.save();
    res.status(201).json(newAnswer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
