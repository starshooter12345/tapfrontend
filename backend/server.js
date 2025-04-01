require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'secretkey', resave: false, saveUninitialized: true }));

// Initialize Passport for authentication
app.use(passport.initialize());
app.use(passport.session());

// Connect to MongoDB Atlas using connection string from .env
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("Connected to MongoDB"))
.catch((err) => console.error("MongoDB connection error:", err));

// Define a simple User schema and model
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String },  // will be empty for Google signups
  dob: { type: Date },         // required for signup (age check)
  googleId: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Passport configuration for Google OAuth
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,            // from your .env file
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,    // from your .env file
    callbackURL: "/api/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ googleId: profile.id });
      if (!user) {
        user = await User.create({
          email: profile.emails[0].value,
          googleId: profile.id,
          dob: null  // You may prompt the user for DOB later if needed
        });
      }
      return done(null, user);
    } catch(err) {
      return done(err, null);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch(err) {
    done(err, null);
  }
});

// Signup endpoint with age validation
app.post('/api/auth/signup', async (req, res) => {
  const { email, password, dob } = req.body;
  if (!dob) {
    return res.status(400).json({ error: "Date of birth is required" });
  }
  // Calculate age (simple check)
  const ageDifMs = Date.now() - new Date(dob).getTime();
  const ageDate = new Date(ageDifMs);
  const age = Math.abs(ageDate.getUTCFullYear() - 1970);
  if (age < 18) {
    return res.status(400).json({ error: "You must be at least 18 years old to register." });
  }
  try {
    const existingUser = await User.findOne({ email });
    if(existingUser) {
      return res.status(400).json({ error: "Email already in use." });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ email, password: hashedPassword, dob });
    res.status(201).json({ message: "User created successfully", user: newUser });
  } catch(err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try{
    const user = await User.findOne({ email });
    if(!user) {
      return res.status(400).json({ error: "User not found." });
    }
    // If the user registered via Google, prompt to use Google login
    if(!user.password) {
      return res.status(400).json({ error: "User registered with Google. Please sign in using Google." });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch) {
      return res.status(400).json({ error: "Invalid credentials." });
    }
    // On success, you might return a JWT or set a session – for demo, we simply send back a message.
    res.status(200).json({ message: "Login successful", user });
  } catch(err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Google OAuth routes
app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/api/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication, redirect or return token
    res.redirect('/');
  }
);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
