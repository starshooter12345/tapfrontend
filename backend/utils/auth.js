const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate tokens with proper expiration
const generateToken = (userId, expiresIn = '1h') => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: expiresIn
  });
};

// Enhanced token verification
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    console.error('Token verification failed:', error.message);
    throw error; // Re-throw to handle specific errors in protect middleware
  }
};

// Improved protect middleware
const protect = async (req, res, next) => {
  let token;
  
  // Get token from header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ 
      error: 'Not authorized, no token provided',
      code: 'NO_TOKEN'
    });
  }

  try {
    const decoded = verifyToken(token);
    req.user = await User.findById(decoded.id).select('-password');
    
    if (!req.user) {
      return res.status(401).json({ 
        error: 'User belonging to this token no longer exists',
        code: 'USER_NOT_FOUND'
      });
    }
    
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Session expired, please login again',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token, please login again',
        code: 'INVALID_TOKEN'
      });
    }
    
    res.status(401).json({ 
      error: 'Not authorized',
      code: 'AUTH_FAILED'
    });
  }
};

module.exports = {
  generateToken,
  verifyToken,
  protect
};