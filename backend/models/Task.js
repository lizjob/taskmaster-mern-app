// models/Task.js
import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, default: "" },
  status: { type: String, default: "todo" },
  priority: { type: String, default: "medium" },
  due_date: { type: Date, default: null },
  tags: { type: [String], default: [] },
  assigned_to: { type: String, default: null },
  files: { type: [String], default: [] },
  comments: { type: [String], default: [] },
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
  completedAt: { type: Date },
  deleted: { type: Boolean, default: false },
  deletedAt: { type: Date }
});

// Indexes for faster queries
taskSchema.index({ id: 1 });
taskSchema.index({ createdBy: 1, deleted: 1 });
taskSchema.index({ assigned_to: 1, deleted: 1 });
taskSchema.index({ status: 1, deleted: 1 });
taskSchema.index({ priority: 1, deleted: 1 });
taskSchema.index({ tags: 1, deleted: 1 });

const Task = mongoose.model("Task", taskSchema);

export default Task;

