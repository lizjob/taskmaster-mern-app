// models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  deleted: { type: Boolean, default: false }
});

// Index for faster queries
userSchema.index({ email: 1, deleted: 1 });
userSchema.index({ id: 1 });

const User = mongoose.model("User", userSchema);

export default User;

