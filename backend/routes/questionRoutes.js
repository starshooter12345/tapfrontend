const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { protect } = require('../utils/auth');

// Debug endpoint - test direct database access
router.get('/debug', async (req, res) => {
  try {
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));

    // Try to access questions directly
    const questions = await mongoose.connection.db.collection('questions').find({}).toArray();
    const testQuestions = await mongoose.connection.db.collection('test.questions').find({}).toArray();

    res.json({
      database: mongoose.connection.db.databaseName,
      regularQuestions: questions,
      testQuestions: testQuestions,
      collections: collections.map(c => c.name)
    });
  } catch (err) {
    console.error('Debug error:', err);
    res.status(500).json({ 
      error: err.message,
      stack: err.stack 
    });
  }
});

// Protected questions endpoint
router.get('/', protect, async (req, res) => {
  try {
    // Try both possible collections
    let questions = await mongoose.connection.db.collection('questions').find({}).toArray();
    
    if (questions.length === 0) {
      questions = await mongoose.connection.db.collection('test.questions').find({}).toArray();
    }

    const answers = await mongoose.connection.db.collection('answers').find({
      user: new mongoose.Types.ObjectId(req.user.id)
    }).toArray();

    const questionsWithStatus = questions.map(q => ({
      ...q,
      answered: answers.some(a => a.question.toString() === q._id.toString())
    }));

    res.json(questionsWithStatus);
  } catch (err) {
    console.error('Questions route error:', err);
    res.status(500).json({ 
      error: 'Server error',
      details: err.message 
    });
  }
});

module.exports = router;