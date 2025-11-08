// controllers/commentController.js
import { v4 as uuidv4 } from "uuid";
import Comment from "../models/Comment.js";
import User from "../models/User.js";
import Task from "../models/Task.js";

/**
 * 🔹 Create a new comment
 */
export const addComment = async (req, res, next) => {
  try {
    const { taskId, text } = req.body;
    const userId = req.userId;

    const user = await User.findOne({ id: userId, deleted: false });
    if (!user) return res.status(404).json({ message: "User not found" });

    const task = await Task.findOne({ id: taskId, deleted: false });
    if (!task) return res.status(404).json({ message: "Task not found" });

    const newComment = new Comment({
      id: uuidv4(),
      taskId,
      author: user.id,
      authorName: user.name,
      text,
      createdAt: new Date(),
      deleted: false,
    });

    await newComment.save();

    // ✅ Attach comment to task
    task.comments = task.comments || [];
    task.comments.push(newComment.id);
    await task.save();

    res.status(201).json(newComment);
  } catch (err) {
    next(err);
  }
};

/**
 * 🔹 Get all comments for a task
 */
export const getCommentsByTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    const comments = await Comment.find({ taskId, deleted: false })
      .lean()
      .sort({ createdAt: 1 });

    // Get author names if needed (already stored, but ensure consistency)
    const commentsWithNames = await Promise.all(
      comments.map(async (c) => {
        const user = await User.findOne({ id: c.author, deleted: false });
        return {
          ...c,
          authorName: user?.name || c.authorName || "Anonymous",
        };
      })
    );

    res.json(commentsWithNames);
  } catch (err) {
    next(err);
  }
};

/**
 * 🔹 Update a comment
 */
export const updateComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const { text } = req.body;
    const userId = req.userId;

    const comment = await Comment.findOne({ id: commentId, deleted: false });
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    if (comment.author !== userId)
      return res.status(403).json({ message: "Unauthorized" });

    comment.text = text || comment.text;
    comment.updatedAt = new Date();

    await comment.save();
    res.json(comment);
  } catch (err) {
    next(err);
  }
};

/**
 * 🔹 Delete a comment (soft delete)
 */
export const deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const userId = req.userId;

    const comment = await Comment.findOne({ id: commentId, deleted: false });
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    if (comment.author !== userId)
      return res.status(403).json({ message: "Unauthorized" });

    comment.deleted = true;
    comment.deletedAt = new Date();

    await comment.save();

    // Remove comment ID from task
    const task = await Task.findOne({ id: comment.taskId });
    if (task) {
      task.comments = (task.comments || []).filter((cid) => cid !== commentId);
      await task.save();
    }

    res.json({ message: "Comment deleted successfully" });
  } catch (err) {
    next(err);
  }
};
