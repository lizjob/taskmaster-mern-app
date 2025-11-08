// models/File.js
import mongoose from "mongoose";

const fileSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  taskId: { type: String, required: true },
  originalName: { type: String, required: true },
  storedName: { type: String, required: true },
  path: { type: String, required: true },
  mimetype: { type: String, required: true },
  size: { type: Number, required: true },
  uploadedBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  deleted: { type: Boolean, default: false },
  deletedAt: { type: Date }
});

// Indexes for faster queries
fileSchema.index({ id: 1 });
fileSchema.index({ taskId: 1, deleted: 1 });
fileSchema.index({ uploadedBy: 1 });

const File = mongoose.model("File", fileSchema);

export default File;

