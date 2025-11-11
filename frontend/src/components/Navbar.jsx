// src/components/Navbar.jsx
import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const nav = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <header className="nav">
      <div className="container nav-inner">
        <div className="brand-section">
          <div className="brand" onClick={() => nav("/dashboard")}>
            <span className="brand-icon">📋</span>
            <span className="brand-text">TaskManager</span>
          </div>
        </div>
        <nav className="nav-links">
          <Link 
            to="/dashboard" 
            className={`nav-link ${isActive("/dashboard") ? "active" : ""}`}
          >
            <span className="nav-link-icon">🏠</span>
            <span>Dashboard</span>
          </Link>
          <Link 
            to="/analytics" 
            className={`nav-link ${isActive("/analytics") ? "active" : ""}`}
          >
            <span className="nav-link-icon">📊</span>
            <span>Analytics</span>
          </Link>
          <button className="btn-theme" onClick={toggle} title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}>
            {theme === "light" ? "🌙" : "☀️"}
          </button>
          <div className="user-menu">
            <div className="user-info">
              <span className="user-avatar">{user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U"}</span>
              <span className="user-name">{user?.name || user?.email}</span>
            </div>
            <button className="btn-logout" onClick={logout} title="Logout">
              Logout
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}
