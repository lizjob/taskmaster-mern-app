// src/components/TaskFormModal.jsx
import React, { useEffect, useState } from "react";

/**
 * Task form modal used for create & edit.
 * `initial` can be a task object to prefill fields.
 * onSave receives a payload with fields (tags as array).
 */
export default function TaskFormModal({ initial = null, onClose, onSave }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    status: "todo",
    due_date: "",
    tags: "",
    assigned_to: ""
  });

  useEffect(() => {
    if (initial) {
      let dueDate = "";
      if (initial.due_date) {
        // Handle various date formats (Date object, ISO string, YYYY-MM-DD)
        const date = initial.due_date instanceof Date 
          ? initial.due_date 
          : new Date(initial.due_date);
        if (!isNaN(date.getTime())) {
          dueDate = date.toISOString().split('T')[0];
        } else if (typeof initial.due_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(initial.due_date)) {
          dueDate = initial.due_date;
        }
      }
      
      setForm({
        title: initial.title || "",
        description: initial.description || "",
        priority: initial.priority || "medium",
        status: initial.status || "todo",
        due_date: dueDate,
        tags: (initial.tags || []).join(", "),
        assigned_to: initial.assigned_to || ""
      });
    } else {
      // Reset form when modal is opened for new task
      setForm({
        title: "",
        description: "",
        priority: "medium",
        status: "todo",
        due_date: "",
        tags: "",
        assigned_to: ""
      });
    }
  }, [initial]);

  const handleSave = () => {
    if (!form.title.trim()) {
      alert("Title is required");
      return;
    }
    const payload = {
      ...form,
      tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : []
    };
    onSave(payload);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div 
      className="modal" 
      role="dialog" 
      aria-modal="true"
      aria-labelledby="modal-title"
      onKeyDown={handleKeyDown}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-card task-form-modal">
        <div className="modal-header">
          <h3 id="modal-title">{initial ? "Edit Task" : "Create New Task"}</h3>
          <button 
            className="modal-close" 
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <div className="form-group">
          <label htmlFor="task-title">
            Title <span className="required">*</span>
          </label>
          <input
            id="task-title"
            type="text"
            placeholder="Enter task title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            autoFocus
          />
        </div>

        <div className="form-group">
          <label htmlFor="task-description">Description</label>
          <textarea
            id="task-description"
            placeholder="Enter task description (optional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows="4"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="task-priority">Priority</label>
            <select
              id="task-priority"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="task-status">Status</label>
            <select
              id="task-status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="todo">Todo</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="task-due-date">Due Date</label>
          <input
            id="task-due-date"
            type="date"
            value={form.due_date || ""}
            onChange={(e) => setForm({ ...form, due_date: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label htmlFor="task-tags">Tags</label>
          <input
            id="task-tags"
            type="text"
            placeholder="e.g., urgent, frontend, backend (comma separated)"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
          />
          <small className="form-hint">Separate multiple tags with commas</small>
        </div>

        <div className="form-group">
          <label htmlFor="task-assigned">Assigned To</label>
          <input
            id="task-assigned"
            type="text"
            placeholder="User ID or email (optional)"
            value={form.assigned_to}
            onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
          />
        </div>

        <div className="modal-actions">
          <button 
            className="btn subtle" 
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button 
            className="btn primary" 
            onClick={handleSave}
            type="button"
          >
            {initial ? "Update Task" : "Create Task"}
          </button>
        </div>
      </div>
    </div>
  );
}
