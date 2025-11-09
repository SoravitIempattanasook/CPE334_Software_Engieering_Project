import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

const linkBase = {
  display: "block",
  padding: "10px 8px",
  borderRadius: "8px",
  color: "#111",
  fontWeight: 500,
  textDecoration: "none",
  marginBottom: "6px",
};

export default function SidebarLayout({ children }) {
  const { user, displayName, role, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const avatar =
    user?.user_metadata?.avatar_url ||
    "https://i.pravatar.cc/80";

  const handleLogout = async () => {
    setLoading(true);
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "#fff" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 240,
          borderRight: "1px solid #e5e7eb",
          padding: "24px 16px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h2 style={{ margin: "0 0 24px 8px" }}>Menu ({role})</h2>

          <NavLink to="/dashboard" style={linkBase}>🏠 Dashboard</NavLink>
          <NavLink to="/activity" style={linkBase}>📄 Activity board</NavLink>
          <NavLink to="/calendar" style={linkBase}>📅 Calendar</NavLink>
          <NavLink to="/settings" style={linkBase}>⚙️ Settings</NavLink>

          <button
            onClick={handleLogout}
            disabled={loading}
            style={{
              ...linkBase,
              width: "100%",
              textAlign: "left",
              background: "none",
              border: "none",
              cursor: "pointer",
              marginTop: 8,
              color: "#d32f2f",
              fontWeight: 600,
            }}
          >
            🚪 {loading ? "Logging out..." : "Logout"}
          </button>
        </div>

        <div
          style={{
            padding: "16px",
            borderTop: "1px solid #e5e7eb",
            textAlign: "center",
            borderRadius: 12,
          }}
        >
          <img
            src={avatar}
            alt="avatar"
            style={{ width: 48, height: 48, borderRadius: "50%" }}
          />
          <div style={{ marginTop: 8, fontWeight: 600 }}>
            {displayName || user?.email?.split("@")[0]}
          </div>
          <div style={{ fontSize: "0.85rem", color: "#666" }}>{user?.email}</div>
        </div>
      </aside>

      {/* ✅ สำคัญที่สุด — ต้องมี children */}
      <main style={{ flex: 1, padding: "40px" }}>
        {children}
      </main>
    </div>
  );
}
