const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const User = require('../models/User');
const { generateToken } = require('../utils/auth');

// Validation middleware
const validateSignup = [
  check('username').trim().notEmpty().withMessage('Username is required'),
  check('email').isEmail().withMessage('Please provide a valid email'),
  check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  check('dob').isDate().withMessage('Invalid date format')
];

const validateLogin = [
  check('email').isEmail().withMessage('Please provide a valid email'),
  check('password').exists().withMessage('Password is required')
];

// Regular signup
router.post('/signup', validateSignup, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { username, email, password, dob } = req.body;

    // Check if email or username already exists
    if (await User.isEmailTaken(email)) {
      return res.status(400).json({ error: 'Email already in use' });
    }
    if (await User.isUsernameTaken(username)) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    const user = new User({ username, email, password, dob });
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({ 
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error during signup' });
  }
});

// Regular login
router.post('/login', validateLogin, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({ 
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Google OAuth routes
router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email'],
  session: false 
}));

router.get('/google/callback', 
  passport.authenticate('google', { session: false }),
  (req, res) => {
    const token = generateToken(req.user._id);
    const redirectUrl = `${process.env.FRONTEND_URL}/auth/success?token=${token}`;
    res.redirect(redirectUrl);
  }
);

module.exports = router;