// src/components/Admin/AdminLayout.jsx
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import "../style/AdminLayout.css";

export default function AdminLayout() {
  const navigate = useNavigate();

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">Admin Panel</div>

        <nav className="admin-nav">
          <NavLink
            to="/admin/dashboard"
            className={({ isActive }) =>
              "admin-nav-item" + (isActive ? " active" : "")
            }
          >
            📊 Dashboard
          </NavLink>

          <NavLink
            to="/admin/templates"
            className={({ isActive }) =>
              "admin-nav-item" + (isActive ? " active" : "")
            }
          >
            📝 Templates
          </NavLink>

          {/* 👇 Thêm Admin Reviews vào menu */}
          <NavLink
            to="/admin/reviews"
            className={({ isActive }) =>
              "admin-nav-item" + (isActive ? " active" : "")
            }
          >
            ⭐ Reviews
          </NavLink>
        </nav>

        <button
          className="admin-logout"
          onClick={() => navigate("/logout")}
        >
          🔒 Logout
        </button>
      </aside>

      {/* PHẢI có Outlet để render trang con */}
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
