const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

console.log('Loading .env from:', path.resolve(__dirname, '.env'));
console.log('MONGO_URI:', process.env.MONGO_URI);

const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB Connected');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Connection Error:', err.message);
    process.exit(1);
  });