// Update your server.js to this:

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('passport');
// Add this with your other route imports
const googleAuthRoutes = require('./routes/googleAuthRoutes');

require('dotenv').config();

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// Initialize App
const app = express();

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));
app.use(express.json());

// Add this with your other route middleware
// Passport Configuration
require('./config/passport')(passport);
app.use(passport.initialize());

// Routes
app.get('/', (req, res) => res.send('API Running')); // Basic route test
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/auth/google', require('./routes/googleAuthRoutes'));

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});