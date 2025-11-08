// controllers/fileController.js
import File from "../models/File.js";
import Task from "../models/Task.js";
import path from "path";
import fs from "fs";

// Download file by id - verifies user has access to the task
export const downloadFile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const file = await File.findOne({ id, deleted: false });
    if (!file) return res.status(404).json({ message: "File not found" });

    const task = await Task.findOne({ id: file.taskId, deleted: false });
    if (!task) return res.status(404).json({ message: "Task for file not found" });

    if (!(task.createdBy === req.userId || task.assigned_to === req.userId)) return res.status(403).json({ message: "Not allowed" });

    const diskPath = path.join(process.cwd(), "uploads", file.storedName);
    if (!fs.existsSync(diskPath)) return res.status(404).json({ message: "File on disk missing" });

    res.download(diskPath, file.originalName);
  } catch (err) { next(err); }
};

// Delete file (soft + physical delete) - only uploader or task creator
export const deleteFile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const file = await File.findOne({ id, deleted: false });
    if (!file) return res.status(404).json({ message: "File not found" });

    const task = await Task.findOne({ id: file.taskId });
    if (file.uploadedBy !== req.userId && task?.createdBy !== req.userId) return res.status(403).json({ message: "Not allowed" });

    // soft-delete metadata
    file.deleted = true;
    file.deletedAt = new Date();
    await file.save();

    // remove from task.files array
    if (task) {
      task.files = (task.files || []).filter((fid) => fid !== file.id);
      await task.save();
    }

    // attempt to remove file from disk (best-effort)
    const diskPath = path.join(process.cwd(), "uploads", file.storedName);
    if (fs.existsSync(diskPath)) {
      try { fs.unlinkSync(diskPath); } catch (e) { console.warn("Could not delete file from disk:", e.message); }
    }

    res.json({ message: "File deleted" });
  } catch (err) { next(err); }
};
