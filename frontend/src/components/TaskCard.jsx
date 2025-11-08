// src/components/TaskCard.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";

export default function TaskCard({ task, onDelete, onEdit, onUpdate }) {
  const [updating, setUpdating] = useState(false);

  const formatDate = (dateValue) => {
    if (!dateValue) return null;
    try {
      const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
      if (isNaN(date.getTime())) return null;
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return null;
    }
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    try {
      const due = dueDate instanceof Date ? dueDate : new Date(dueDate);
      if (isNaN(due.getTime())) return false;
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      due.setHours(0, 0, 0, 0);
      return due < now && task.status !== "done";
    } catch {
      return false;
    }
  };

  const handleQuickUpdate = async (field, value) => {
    setUpdating(true);
    try {
      const res = await api.updateTask(task.id, { [field]: value });
      if (onUpdate) {
        onUpdate(res.data);
      }
    } catch (err) {
      console.error("Update error:", err);
      alert("Failed to update task");
    } finally {
      setUpdating(false);
    }
  };

  const handleStatusChange = (e) => {
    handleQuickUpdate("status", e.target.value);
  };

  const handlePriorityChange = (e) => {
    handleQuickUpdate("priority", e.target.value);
  };

  return (
    <div className={`card task-card compact ${isOverdue(task.due_date) ? "overdue" : ""}`}>
      <div className="task-header-compact">
        <div className="task-title-row">
          <h4 className="task-title-compact">{task.title}</h4>
          <div className="task-badges-compact">
            <span className={`badge badge-sm ${task.priority}`}>
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </span>
            <span className={`badge badge-sm status status-${task.status}`}>
              {task.status === "in-progress" ? "In Progress" : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
            </span>
          </div>
        </div>
        {task.assigned_to && (
          <div className="task-assigned-compact">@{task.assigned_to}</div>
        )}
      </div>

      {task.description && (
        <p className="task-description-compact">{task.description}</p>
      )}

      <div className="task-footer-compact">
        <div className="task-meta-compact">
          {task.tags && task.tags.length > 0 && (
            <div className="task-tags-compact">
              {task.tags.slice(0, 3).map((tag, idx) => (
                <span key={idx} className="tag tag-sm">
                  {tag}
                </span>
              ))}
              {task.tags.length > 3 && (
                <span className="tag tag-sm tag-more">+{task.tags.length - 3}</span>
              )}
            </div>
          )}
          {task.due_date && (
            <div className={`task-due-compact ${isOverdue(task.due_date) ? "overdue" : ""}`}>
              📅 {formatDate(task.due_date)}
              {isOverdue(task.due_date) && <span className="overdue-indicator">!</span>}
            </div>
          )}
        </div>

        <div className="task-actions-compact">
          <select
            value={task.status}
            onChange={handleStatusChange}
            disabled={updating}
            className="quick-select-compact"
            title="Status"
          >
            <option value="todo">Todo</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
          </select>
          <select
            value={task.priority}
            onChange={handlePriorityChange}
            disabled={updating}
            className="quick-select-compact"
            title="Priority"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <Link to={`/task/${task.id}`} className="btn btn-xs btn-icon" title="View">
            👁️
          </Link>
          <button
            className="btn btn-xs btn-icon"
            onClick={() => onEdit && onEdit(task)}
            disabled={updating}
            title="Edit"
          >
            ✏️
          </button>
          <button
            className="btn btn-xs btn-icon btn-danger-icon"
            onClick={() => onDelete(task.id)}
            disabled={updating}
            title="Delete"
          >
            🗑️
          </button>
        </div>
      </div>

      {updating && (
        <div className="task-updating-compact">
          <span className="updating-spinner">⏳</span>
        </div>
      )}
    </div>
  );
}
