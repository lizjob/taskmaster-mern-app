import React, { useEffect, useState } from "react";
import api from "../api/api";
import TaskCard from "../components/TaskCard";
import Loader from "../components/Loader";
import TaskFormModal from "../components/TaskFormModal";
import Confirm from "../components/Confirm";

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 8 });
  const [loading, setLoading] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [availableTags, setAvailableTags] = useState([]);

  // Separate filter inputs (typed values) vs applied filters (used in API)
  const [filterInputs, setFilterInputs] = useState({
    search: "",
    status: "",
    priority: "",
    tag: "",
  });
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    priority: "",
    tag: "",
  });

  const [confirm, setConfirm] = useState({ show: false, id: null });

  // 🔹 Fetch tasks
  const fetchTasks = async (page = meta.page, activeFilters = filters) => {
    setLoading(true);
    try {
      const params = { page, limit: meta.limit, ...activeFilters };
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === "" || params[key] === null) {
          delete params[key];
        }
      });
      const res = await api.getTasks(params);
      const data = res.data;

      const fetchedTasks = data.tasks || data || [];
      setTasks(fetchedTasks);
      setMeta(
        data.meta || {
          total: fetchedTasks.length,
          page,
          limit: meta.limit,
        }
      );

      // Update available tags from fetched tasks
      updateAvailableTags(fetchedTasks);
    } catch (err) {
      console.error("❌ Fetch error:", err);
      alert("Could not load tasks");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Extract tags from tasks and update available tags
  const updateAvailableTags = (taskList) => {
    setAvailableTags(prevTags => {
      const allTags = new Set(prevTags);
      taskList.forEach(task => {
        if (task.tags && Array.isArray(task.tags)) {
          task.tags.forEach(tag => {
            if (tag && tag.trim()) {
              allTags.add(tag.trim());
            }
          });
        }
      });
      return Array.from(allTags).sort();
    });
  };

  // 🔹 Fetch all tasks to get all available tags (runs once on mount)
  const fetchAllTags = async () => {
    try {
      const res = await api.getTasks({ limit: 1000 }); // Get more tasks to extract tags
      const allTasks = res.data.tasks || res.data || [];
      const allTags = new Set();
      allTasks.forEach(task => {
        if (task.tags && Array.isArray(task.tags)) {
          task.tags.forEach(tag => {
            if (tag && tag.trim()) {
              allTags.add(tag.trim());
            }
          });
        }
      });
      setAvailableTags(Array.from(allTags).sort());
    } catch (err) {
      console.error("Could not load tags:", err);
      // Tags will be updated when tasks are fetched
    }
  };

  // 🔹 Fetch whenever filters or page change
  useEffect(() => {
    fetchTasks(meta.page, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, meta.page]);

  // 🔹 Load all tags on mount
  useEffect(() => {
    fetchAllTags();
  }, []);

  const openCreate = () => {
    setEditTask(null);
    setOpenForm(true);
  };

  const handleSave = async (payload) => {
    try {
      let newTask;
      if (editTask) {
        const res = await api.updateTask(editTask.id, payload);
        newTask = res.data;
        setTasks((prev) => prev.map((t) => (t.id === editTask.id ? newTask : t)));
      } else {
        const res = await api.createTask(payload);
        newTask = res.data;
        setTasks((prev) => [newTask, ...prev]);
      }
      setOpenForm(false);
      setEditTask(null);
      // Refresh tags after creating/updating
      fetchAllTags();
      // Refresh tasks to get updated data
      fetchTasks(meta.page);
    } catch (err) {
      console.error("❌ Save error:", err);
      alert("Error saving task");
    }
  };

  const handleEdit = (task) => {
    setEditTask(task);
    setOpenForm(true);
  };

  const handleDelete = (id) => setConfirm({ show: true, id });

  const confirmDelete = async () => {
    try {
      await api.deleteTask(confirm.id);
      setConfirm({ show: false, id: null });
      setTasks((prev) => prev.filter((t) => t.id !== confirm.id));
      fetchAllTags(); // Refresh tags
    } catch (err) {
      console.error("❌ Delete error:", err);
      alert("Could not delete task");
    }
  };

  const handleTaskUpdate = (updatedTask) => {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
    // Refresh tags in case tags were updated
    fetchAllTags();
  };

  // 🔹 Apply button handler
  const applyFilters = () => {
    setFilters(filterInputs);
    setMeta((m) => ({ ...m, page: 1 })); // reset to first page
  };

  // 🔹 Clear filters
  const clearFilters = () => {
    const emptyFilters = { search: "", status: "", priority: "", tag: "" };
    setFilterInputs(emptyFilters);
    setFilters(emptyFilters);
    setMeta((m) => ({ ...m, page: 1 }));
  };

  // 🔹 Check if any filters are active
  const hasActiveFilters = Object.values(filters).some(val => val !== "");

  if (loading && tasks.length === 0) return <Loader />;

  return (
    <div className="container page">
      <div className="page-head">
        <h2>Tasks</h2>
        <div>
          <button className="btn primary" onClick={openCreate}>
            New Task
          </button>
        </div>
      </div>

      {/* 🔹 Filters Section */}
      <div className="filters-section">
        <div className="filters">
          <input
            placeholder="Search tasks..."
            value={filterInputs.search}
            onChange={(e) =>
              setFilterInputs({ ...filterInputs, search: e.target.value })
            }
            onKeyPress={(e) => e.key === "Enter" && applyFilters()}
          />

          <select
            value={filterInputs.status}
            onChange={(e) =>
              setFilterInputs({ ...filterInputs, status: e.target.value })
            }
          >
            <option value="">All status</option>
            <option value="todo">To do</option>
            <option value="in-progress">In progress</option>
            <option value="done">Done</option>
          </select>

          <select
            value={filterInputs.priority}
            onChange={(e) =>
              setFilterInputs({ ...filterInputs, priority: e.target.value })
            }
          >
            <option value="">All priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>

          <select
            value={filterInputs.tag}
            onChange={(e) =>
              setFilterInputs({ ...filterInputs, tag: e.target.value })
            }
          >
            <option value="">All tags</option>
            {availableTags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>

          <button className="btn primary" onClick={applyFilters}>
            Apply Filters
          </button>
          {hasActiveFilters && (
            <button className="btn subtle" onClick={clearFilters}>
              Clear
            </button>
          )}
        </div>

        {hasActiveFilters && (
          <div className="active-filters">
            <span className="filter-label">Active filters:</span>
            {filters.search && (
              <span className="filter-chip">
                Search: "{filters.search}"
                <button onClick={() => {
                  setFilterInputs({ ...filterInputs, search: "" });
                  setFilters({ ...filters, search: "" });
                }}>×</button>
              </span>
            )}
            {filters.status && (
              <span className="filter-chip">
                Status: {filters.status}
                <button onClick={() => {
                  setFilterInputs({ ...filterInputs, status: "" });
                  setFilters({ ...filters, status: "" });
                }}>×</button>
              </span>
            )}
            {filters.priority && (
              <span className="filter-chip">
                Priority: {filters.priority}
                <button onClick={() => {
                  setFilterInputs({ ...filterInputs, priority: "" });
                  setFilters({ ...filters, priority: "" });
                }}>×</button>
              </span>
            )}
            {filters.tag && (
              <span className="filter-chip">
                Tag: {filters.tag}
                <button onClick={() => {
                  setFilterInputs({ ...filterInputs, tag: "" });
                  setFilters({ ...filters, tag: "" });
                }}>×</button>
              </span>
            )}
          </div>
        )}
      </div>

      {loading && tasks.length > 0 && (
        <div className="loading-overlay">
          <span>Refreshing...</span>
        </div>
      )}

      {/* 🔹 Task Grid */}
      <div className="grid">
        {tasks.length ? (
          tasks.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onUpdate={handleTaskUpdate}
            />
          ))
        ) : (
          <div className="empty">
            {hasActiveFilters ? "No tasks match your filters" : "No tasks found. Create your first task!"}
          </div>
        )}
      </div>

      {/* 🔹 Pagination */}
      {meta.total > 0 && (
        <div className="pagination">
          <button
            className="btn subtle"
            disabled={meta.page === 1}
            onClick={() =>
              setMeta((m) => ({ ...m, page: Math.max(1, m.page - 1) }))
            }
          >
            Prev
          </button>
          <span>Page {meta.page} of {Math.ceil(meta.total / meta.limit)} ({meta.total} tasks)</span>
          <button
            className="btn subtle"
            disabled={meta.page >= Math.ceil(meta.total / meta.limit)}
            onClick={() => setMeta((m) => ({ ...m, page: m.page + 1 }))}
          >
            Next
          </button>
        </div>
      )}

      {/* 🔹 Modals */}
      {openForm && (
        <TaskFormModal
          initial={editTask}
          onClose={() => {
            setOpenForm(false);
            setEditTask(null);
          }}
          onSave={handleSave}
        />
      )}

      {confirm.show && (
        <Confirm
          message="Delete this task?"
          onConfirm={confirmDelete}
          onCancel={() => setConfirm({ show: false, id: null })}
        />
      )}
    </div>
  );
}
