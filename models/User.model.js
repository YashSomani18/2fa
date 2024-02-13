const mongoose = require('mongoose');

// Schema for the user
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true, 
    trim: true, 
    lowercase: true 
  },
  secret: {
    type: String,
    required: true
  }
});


const User = mongoose.model('User', userSchema);

module.exports = User;
