// src/pages/Analytics.jsx
import React, { useEffect, useState } from "react";
import api from "../api/api";
import Loader from "../components/Loader";

function StatCard({ title, value, icon, color, subtitle }) {
  return (
    <div className="stat-card" style={{ borderLeftColor: color }}>
      <div className="stat-icon" style={{ backgroundColor: color + "20", color }}>
        {icon}
      </div>
      <div className="stat-content">
        <div className="stat-value">{value}</div>
        <div className="stat-title">{title}</div>
        {subtitle && <div className="stat-subtitle">{subtitle}</div>}
      </div>
    </div>
  );
}

function SimpleBar({ data = {}, title, colors = {} }) {
  const entries = Object.entries(data);
  const max = Math.max(...entries.map(([, v]) => v), 1);
  
  if (entries.length === 0) {
    return (
      <div className="chart-card">
        <div className="chart-header">
          <h4>{title}</h4>
        </div>
        <div className="chart-empty">No data available</div>
      </div>
    );
  }

  const getColor = (key) => {
    return colors[key] || `hsl(${Math.random() * 360}, 70%, 50%)`;
  };

  return (
    <div className="chart-card">
      <div className="chart-header">
        <h4>{title}</h4>
        <span className="chart-count">{entries.reduce((sum, [, v]) => sum + v, 0)} tasks</span>
      </div>
      <div className="chart-body">
        {entries.map(([k, v]) => {
          const pct = (v / max) * 100;
          const color = getColor(k);
          return (
            <div key={k} className="bar-row">
              <div className="bar-info">
                <span className="bar-label">{k.charAt(0).toUpperCase() + k.slice(1).replace(/-/g, " ")}</span>
                <span className="bar-value">{v}</span>
              </div>
              <div className="bar-container">
                <div 
                  className="bar-fill" 
                  style={{ 
                    width: `${pct}%`,
                    backgroundColor: color
                  }}
                />
              </div>
              <span className="bar-percentage">{Math.round(pct)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PerformanceCard({ performance }) {
  if (!performance) return null;

  const formatDuration = (ms) => {
    if (!ms) return "N/A";
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return "Less than 1h";
  };

  const completionRate = performance.totalAssigned > 0 
    ? Math.round((performance.completed / performance.totalAssigned) * 100)
    : 0;

  return (
    <div className="chart-card performance-card">
      <div className="chart-header">
        <h4>Performance Metrics</h4>
      </div>
      <div className="performance-grid">
        <div className="performance-item">
          <div className="performance-label">Completion Rate</div>
          <div className="performance-value-large">{completionRate}%</div>
          <div className="performance-detail">
            {performance.completed} of {performance.totalAssigned} tasks
          </div>
        </div>
        <div className="performance-item">
          <div className="performance-label">Avg. Completion Time</div>
          <div className="performance-value">{formatDuration(performance.avgCompletionMs)}</div>
          <div className="performance-detail">
            {performance.completed} completed tasks
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Analytics() {
  const [overview, setOverview] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [overviewRes, performanceRes] = await Promise.all([
        api.overview(),
        api.performance()
      ]);
      setOverview(overviewRes.data);
      setPerformance(performanceRes.data);
    } catch (err) {
      console.error(err);
      alert("Could not load analytics");
    }
    setLoading(false);
  };

  useEffect(() => { 
    load(); 
  }, []);

  if (loading || !overview) return <Loader />;

  const statusColors = {
    todo: "#6b7280",
    "in-progress": "#3b82f6",
    done: "#10b981"
  };

  const priorityColors = {
    low: "#10b981",
    medium: "#f59e0b",
    high: "#ef4444"
  };

  const totalTasks = overview.total || 0;
  const completedTasks = overview.byStatus?.done || 0;
  const inProgressTasks = overview.byStatus?.["in-progress"] || 0;
  const todoTasks = overview.byStatus?.todo || 0;

  return (
    <div className="container page">
      <div className="analytics-header">
        <div>
          <h2>Analytics Dashboard</h2>
          <p className="analytics-subtitle">Track your task management performance</p>
        </div>
        <button className="btn primary" onClick={load}>
          🔄 Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <StatCard
          title="Total Tasks"
          value={totalTasks}
          icon="📊"
          color="#3b82f6"
          subtitle="All your tasks"
        />
        <StatCard
          title="Completed"
          value={completedTasks}
          icon="✅"
          color="#10b981"
          subtitle={`${totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}% completion rate`}
        />
        <StatCard
          title="In Progress"
          value={inProgressTasks}
          icon="🚀"
          color="#f59e0b"
          subtitle="Active tasks"
        />
        <StatCard
          title="To Do"
          value={todoTasks}
          icon="📝"
          color="#6b7280"
          subtitle="Pending tasks"
        />
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        <SimpleBar 
          data={overview.byStatus || {}} 
          title="Tasks by Status"
          colors={statusColors}
        />
        <SimpleBar 
          data={overview.byPriority || {}} 
          title="Tasks by Priority"
          colors={priorityColors}
        />
      </div>

      {/* Performance Card */}
      {performance && (
        <PerformanceCard performance={performance} />
      )}
    </div>
  );
}
