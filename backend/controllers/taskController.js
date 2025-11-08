import Task from "../models/Task.js";
import Comment from "../models/Comment.js";
import File from "../models/File.js";
import { v4 as uuidv4 } from "uuid";
import { sanitizeString } from "../utils/sanitize.js";

// Helper to parse tags (allow "a,b" or array)
const parseTags = (tags) => {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.map((t) => sanitizeString(t));
  return String(tags).split(",").map((t) => sanitizeString(t.trim())).filter(Boolean);
};

// Create task - user-based (createdBy = req.userId)
export const createTask = async (req, res, next) => {
  try {
    const title = sanitizeString(req.body.title);
    if (!title) return res.status(400).json({ message: "Title is required" });

    const description = sanitizeString(req.body.description || "");
    const status = sanitizeString(req.body.status || "todo");
    const priority = sanitizeString(req.body.priority || "medium");
    const due_date = req.body.due_date || null;
    const tags = parseTags(req.body.tags);
    const assigned_to = req.body.assigned_to || null;

    const task = new Task({
      id: uuidv4(),
      title,
      description,
      status,
      priority,
      due_date: due_date ? new Date(due_date) : null,
      tags,
      assigned_to,
      files: [],
      comments: [],
      createdBy: req.userId,
      createdAt: new Date(),
      deleted: false
    });
    await task.save();
    res.status(201).json(task);
  } catch (err) { next(err); }
};

// Bulk create - all tasks will be createdBy req.userId
export const bulkCreateTasks = async (req, res, next) => {
  try {
    const arr = Array.isArray(req.body) ? req.body : [];
    if (!arr.length) return res.status(400).json({ message: "Array of tasks required" });

    const tasks = arr.map((t) => ({
      id: uuidv4(),
      title: sanitizeString(t.title || "Untitled"),
      description: sanitizeString(t.description || ""),
      status: sanitizeString(t.status || "todo"),
      priority: sanitizeString(t.priority || "medium"),
      due_date: t.due_date ? new Date(t.due_date) : null,
      tags: parseTags(t.tags),
      assigned_to: t.assigned_to || null,
      files: [],
      comments: [],
      createdBy: req.userId,
      createdAt: new Date(),
      deleted: false
    }));

    const created = await Task.insertMany(tasks);
    res.status(201).json({ created });
  } catch (err) { next(err); }
};

// List tasks - for current user only (createdBy or assigned_to)
const parseSort = (sort) => {
  if (!sort) return null;
  const [field, dir] = sort.split(":");
  return { field, dir: dir === "desc" ? "desc" : "asc" };
};

export const getAllTasks = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { search, status, priority, tag, page = 1, limit = 10, sort } = req.query;

    // Build base query with user filter
    const userFilter = { $or: [{ createdBy: userId }, { assigned_to: userId }] };
    const query = {
      deleted: false,
      ...userFilter
    };

    // Add additional filters
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (tag) query.tags = tag;

    // Search filter - combine with user filter using $and to ensure both conditions
    if (search) {
      const searchRegex = { $regex: String(search), $options: "i" };
      query.$and = [
        userFilter,
        { $or: [{ title: searchRegex }, { description: searchRegex }] }
      ];
      // Remove duplicate userFilter from top level
      delete query.$or;
    }

    // Build sort
    const sortObj = {};
    const s = parseSort(sort);
    if (s) {
      sortObj[s.field] = s.dir === "desc" ? -1 : 1;
    }

    const p = Math.max(parseInt(page, 10), 1);
    const l = Math.max(parseInt(limit, 10), 1);
    const start = (p - 1) * l;

    const tasks = await Task.find(query)
      .sort(sortObj)
      .skip(start)
      .limit(l)
      .lean();

    const total = await Task.countDocuments(query);

    res.json({ tasks, meta: { total, page: p, limit: l } });
  } catch (err) { next(err); }
};

// Get single task (only if user is creator or assignee)
export const getTaskById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const task = await Task.findOne({ id, deleted: false });
    if (!task) return res.status(404).json({ message: "Task not found" });
    if (!(task.createdBy === req.userId || task.assigned_to === req.userId)) return res.status(403).json({ message: "Not allowed" });

    // Get comments and files
    const comments = await Comment.find({ taskId: id, deleted: false }).lean();
    const files = await File.find({ taskId: id, deleted: false }).lean();
    
    res.json({ ...task.toObject(), comments, files });
  } catch (err) { next(err); }
};

// Update task - only creator or assignee
export const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const task = await Task.findOne({ id, deleted: false });
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (!(task.createdBy === req.userId || task.assigned_to === req.userId)) return res.status(403).json({ message: "Not allowed" });

    const updates = req.body || {};

    // if marking done, set completedAt if not present
    if (updates.status && updates.status === "done" && task.status !== "done") {
      task.completedAt = new Date();
    }
    // if changing away from done, clear completedAt
    if (updates.status && updates.status !== "done" && task.status === "done") {
      task.completedAt = null;
    }

    if (updates.title) task.title = sanitizeString(updates.title);
    if (updates.description !== undefined) task.description = sanitizeString(updates.description);
    if (updates.status) task.status = sanitizeString(updates.status);
    if (updates.priority) task.priority = sanitizeString(updates.priority);
    if (updates.due_date !== undefined) task.due_date = updates.due_date ? new Date(updates.due_date) : null;
    if (updates.tags !== undefined) task.tags = parseTags(updates.tags);
    if (updates.assigned_to !== undefined) task.assigned_to = updates.assigned_to;

    task.updatedAt = new Date();
    await task.save();
    res.json(task);
  } catch (err) { next(err); }
};

// Soft delete - only creator
export const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const task = await Task.findOne({ id, deleted: false });
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (task.createdBy !== req.userId) return res.status(403).json({ message: "Only creator can delete" });

    task.deleted = true;
    task.deletedAt = new Date();
    await task.save();
    res.json({ message: "Task deleted" });
  } catch (err) { next(err); }
};

// Add files to task (multer saved to disk)
export const addFilesToTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const task = await Task.findOne({ id, deleted: false });
    if (!task) return res.status(404).json({ message: "Task not found" });
    if (!(task.createdBy === req.userId || task.assigned_to === req.userId)) return res.status(403).json({ message: "Not allowed" });

    const files = req.files || [];
    const saved = [];

    for (const f of files) {
      const fileMeta = new File({
        id: uuidv4(),
        taskId: id,
        originalName: f.originalname,
        storedName: f.filename,
        path: `/uploads/${f.filename}`,
        mimetype: f.mimetype,
        size: f.size,
        uploadedBy: req.userId,
        createdAt: new Date(),
        deleted: false
      });
      await fileMeta.save();
      saved.push(fileMeta.toObject());

      task.files = task.files || [];
      task.files.push(fileMeta.id);
    }

    await task.save();
    res.status(201).json({ files: saved });
  } catch (err) { next(err); }
};
