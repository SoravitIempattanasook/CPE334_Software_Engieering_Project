import { NavLink, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState, useMemo } from "react";
import StudentIdGate from "./StudentIdGate";

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

export default function SidebarLayout() {
  const { user, displayName, role, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const avatar =
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    "https://cdn-icons-png.flaticon.com/512/149/149071.png";

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

  // ✅ แก้ตรงนี้: เปลี่ยนจาก /settings เป็น /profile
  const goProfile = () => navigate("/profile");

  const items = useMemo(() => {
    const links = [];

    if (role === "admin") {
      links.push({ to: "/dashboard", label: "📊 Dashboard" });
      links.push({ to: "/admin-requests", label: "🛡️ Admin Requests" }); 
      links.push({ to: "/activity-board", label: "📄 Activity board" });
      links.push({ to: "/calendar", label: "📅 Calendar" });
    } else if (role === "activity_maker") {
      links.push({ to: "/activity-board", label: "📄 Activity board" });
      links.push({ to: "/calendar", label: "📅 Calendar" });
    } else if (role === "student") {
      links.push({ to: "/calendar", label: "📅 Calendar" });
      links.push({ to: "/activity-board", label: "📄 Activity board" });
    } else {
      // guest
      links.push({ to: "/calendar", label: "📅 Calendar" });
      links.push({ to: "/activity-board", label: "📄 Activity board" });
    }

    links.push({ to: "/settings", label: "⚙️ Settings" });

    return links;
  }, [role]);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#fff" }}>
      <aside
        style={{
          width: 260,
          borderRight: "1px solid #e5e7eb",
          padding: "24px 16px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#fff",
          position: "sticky",
          top: 0,
          height: "100vh"
        }}
      >
        <div>
          <h2 style={{ margin: "0 0 16px 8px", color: "#333" }}>
            Menu <span style={{fontSize: '0.8em', color: '#888'}}>({role || "guest"})</span>
          </h2>

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
              marginTop: 16,
              color: "#d32f2f",
              fontWeight: 600,
            }}
          >
            🚪 {loading ? "Logging out..." : "Logout"}
          </button>
        </div>

        {/* ✅ ส่วนนี้คลิกแล้วจะเรียก goProfile() -> ไปหน้า /profile */}
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
            transition: "background 0.2s"
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "#f9fafb"}
          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
        >
          <img
            src={avatar}
            alt="avatar"
            style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", border: "2px solid #e5e7eb" }}
          />
          <div style={{ marginTop: 8, fontWeight: 700, color: "#333" }}>
            {displayName || "User"}
          </div>
          <div style={{ fontSize: "0.85rem", color: "#666", wordBreak: "break-all" }}>{user?.email}</div>
        </div>
      </aside>

      <main style={{ flex: 1, padding: "32px 40px", overflowY: "auto" }}>
        <StudentIdGate>
          <Outlet />
        </StudentIdGate>
      </main>
    </div>
  );
}