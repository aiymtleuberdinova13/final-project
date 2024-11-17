const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  publicKey: { type: String, required: true },
  privateKey: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  age: { type: Number, required: true },
  city: { type: String, required: true },
  country: { type: String, required: true },
  gender: { type: String, required: true },
  role: { type: String, enum: ['admin', 'editor'], default: 'editor' },
});

const User = mongoose.model('User', userSchema);

module.exports = { User };
