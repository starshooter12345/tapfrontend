// backend/utils/auth.js
const jwt = require('jsonwebtoken');
const User = require('/models/User');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h'
  });
};

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

const protect = async (req, res, next) => {
  let token;
  
  // Get token from header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authorized, no token provided' });
  }

  try {
    // Verify token
    const decoded = verifyToken(token);
    
    // Get user from token
    req.user = await User.findById(decoded.id).select('-password');
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ error: 'Not authorized, token failed' });
  }
};

module.exports = {
  generateToken,
  verifyToken,
  protect
};