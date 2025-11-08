// controllers/analyticsController.js
import Task from "../models/Task.js";

// Overview: count by status & priority for current user's tasks (createdBy or assigned)
export const getTaskOverview = async (req, res, next) => {
  try {
    const userId = req.userId;
    const tasks = await Task.find({
      deleted: false,
      $or: [{ createdBy: userId }, { assigned_to: userId }]
    }).lean();

    const byStatus = tasks.reduce((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {});
    const byPriority = tasks.reduce((acc, t) => {
      acc[t.priority] = (acc[t.priority] || 0) + 1;
      return acc;
    }, {});
    res.json({ total: tasks.length, byStatus, byPriority });
  } catch (err) { next(err); }
};

export const getUserPerformance = async (req, res, next) => {
  try {
    const userId = req.query.userId || req.userId;
    const tasks = await Task.find({
      deleted: false,
      $or: [{ assigned_to: userId }, { createdBy: userId }]
    }).lean();

    const completed = tasks.filter((t) => t.status === "done");
    const durations = completed.map((t) => {
      if (!t.completedAt || !t.createdAt) return null;
      return new Date(t.completedAt) - new Date(t.createdAt);
    }).filter(Boolean);
    const avgMs = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : null;
    res.json({ userId, totalAssigned: tasks.length, completed: completed.length, avgCompletionMs: avgMs });
  } catch (err) { next(err); }
};

export const getTaskTrends = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const userId = req.userId;
    const tasks = await Task.find({
      deleted: false,
      $or: [{ createdBy: userId }, { assigned_to: userId }]
    }).lean();

    const results = {};
    const add = (dateStr, key) => {
      if (!dateStr) return;
      if (from && dateStr < from) return;
      if (to && dateStr > to) return;
      results[dateStr] = results[dateStr] || { created: 0, completed: 0 };
      results[dateStr][key] += 1;
    };
    tasks.forEach((t) => {
      const created = t.createdAt ? new Date(t.createdAt).toISOString().slice(0, 10) : null;
      const completed = t.completedAt ? new Date(t.completedAt).toISOString().slice(0, 10) : null;
      add(created, "created");
      add(completed, "completed");
    });
    res.json(results);
  } catch (err) { next(err); }
};

export const exportTasksData = async (req, res, next) => {
  try {
    const userId = req.userId;
    const tasks = await Task.find({
      deleted: false,
      $or: [{ createdBy: userId }, { assigned_to: userId }]
    }).lean();
    res.json(tasks);
  } catch (err) { next(err); }
};
