import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState, useMemo } from "react";

const linkBase = {
  display: "block",
  padding: "10px 8px",
  borderRadius: "8px",
  color: "#111",
  fontWeight: 500,
  textDecoration: "none",
  marginBottom: "6px",
};

const activeStyle = {
  ...linkBase,
  background: "#e5f0ff",
  color: "#1e40af",
};

export default function SidebarLayout({ children }) {
  const { user, displayName, role, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const avatar =
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    "/avatar.png";

  const handleLogout = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (e) {
      alert(e?.message || "Logout failed");
    } finally {
      setLoading(false);
    }
  };

  const goProfile = () => navigate("/profile");

  // ===== จัดลำดับเมนูตาม role =====
  const items = useMemo(() => {
    const links = [];

    if (role === "admin") {
      // admin: Dashboard (first), Activity Board, Calendar
      links.push({ to: "/dashboard", label: "📊 Dashboard" });
      links.push({ to: "/activity-board", label: "📄 Activity board" });
      links.push({ to: "/calendar", label: "📅 Calendar" });
    } else if (role === "activity_maker") {
      // maker: Activity Board (first), Calendar
      links.push({ to: "/activity-board", label: "📄 Activity board" });
      links.push({ to: "/calendar", label: "📅 Calendar" });
    } else if (role === "student") {
      // student: Calendar (first), Activity Board
      links.push({ to: "/calendar", label: "📅 Calendar" });
      links.push({ to: "/activity-board", label: "📄 Activity board" });
    } else {
      // guest: Calendar (first), Activity Board
      links.push({ to: "/calendar", label: "📅 Calendar" });
      links.push({ to: "/activity-board", label: "📄 Activity board" });
    }

    return links;
  }, [role]);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#fff" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 260,
          borderRight: "1px solid #e5e7eb",
          padding: "24px 16px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#fff",
        }}
      >
        <div>
          <h2 style={{ margin: "0 0 16px 8px" }}>
            Menu ({role || "guest"})
          </h2>

          {/* ❌ ไม่มี Home แล้ว */}
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              style={({ isActive }) => (isActive ? activeStyle : linkBase)}
            >
              {it.label}
            </NavLink>
          ))}

          <button
            onClick={handleLogout}
            disabled={loading}
            style={{
              ...linkBase,
              width: "100%",
              textAlign: "left",
              background: "none",
              border: "1px solid #e5e7eb",
              cursor: loading ? "not-allowed" : "pointer",
              marginTop: 8,
              color: "#d32f2f",
              fontWeight: 600,
            }}
          >
            🚪 {loading ? "Logging out..." : "Logout"}
          </button>
        </div>

        {/* ✅ กรอบโปรไฟล์ด้านล่าง: คลิกเพื่อไป /profile */}
        <div
          onClick={goProfile}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === "Enter" ? goProfile() : null)}
          title="ดูโปรไฟล์"
          style={{
            padding: 16,
            borderTop: "1px solid #e5e7eb",
            textAlign: "center",
            borderRadius: 12,
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          <img
            src={avatar}
            alt="avatar"
            style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover" }}
          />
          <div style={{ marginTop: 8, fontWeight: 700 }}>
            {displayName || user?.email?.split("@")[0] || "User"}
          </div>
          <div style={{ fontSize: "0.85rem", color: "#666" }}>{user?.email}</div>
        </div>
      </aside>

      {/* Content */}
      <main style={{ flex: 1, padding: "32px 40px" }}>
        {children}
      </main>
    </div>
  );
}
