// models/Comment.js
import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  taskId: { type: String, required: true },
  author: { type: String, required: true },
  authorName: { type: String, required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
  deleted: { type: Boolean, default: false },
  deletedAt: { type: Date }
});

// Indexes for faster queries
commentSchema.index({ id: 1 });
commentSchema.index({ taskId: 1, deleted: 1 });
commentSchema.index({ author: 1 });

const Comment = mongoose.model("Comment", commentSchema);

export default Comment;

