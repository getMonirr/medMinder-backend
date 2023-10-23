// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  // Add any other user-related fields here
});
const User = mongoose.models.User || mongoose.model("User", userSchema);

module.exports = User;
