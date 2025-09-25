// /server/models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  githubId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  avatarUrl: { type: String },
  name: { type: String },
  bio: { type: String },
  role: {
    type: String,
    enum: ['student', 'recruiter'],
    default: 'student'
  },
  // Chúng ta sẽ thêm các trường khác ở đây sau
}, { timestamps: true }); // Tự động thêm createdAt và updatedAt

module.exports = mongoose.model('User', UserSchema);