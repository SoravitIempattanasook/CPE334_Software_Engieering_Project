// frontend/src/components/SidebarLayout.jsx
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";
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

export default function SidebarLayout({ children }) {
  const { user, displayName } = useAuth();
  const navigate = useNavigate();

  const avatar =
    user?.user_metadata?.avatar_url ||
    "https://i.pravatar.cc/80";

  const goUsers = () => navigate("/users");

  const handleLogout = async () => {
    // ✅ บังคับให้หน้า Login เรียก Google แบบเลือกบัญชีใหม่
    localStorage.setItem("forceAccountSelect", "1");
    await supabase.auth.signOut();
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
          <h2 style={{ margin: "0 0 24px 8px" }}>Menu</h2>

          <NavLink to="/" style={linkBase}>🏠 Dashboard</NavLink>
          <NavLink to="/activities" style={linkBase}>📄 Activity board</NavLink>
          {/* ❌ เอาเมนู Users ออกตามที่ขอ */}
          {/* <NavLink to="/users" style={linkBase}>👤 Users</NavLink> */}
          <NavLink to="/database" style={linkBase}>📅 Calendar</NavLink>
          <NavLink to="/setting" style={linkBase}>⚙️ Setting</NavLink>

          {/* ✅ ปุ่ม Logout ใต้ Setting */}
          <button
            onClick={handleLogout}
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
            🚪 Logout
          </button>
        </div>

        {/* ✅ พื้นที่ผู้ใช้ด้านล่าง: กดเพื่อไปหน้า /users */}
        <div
          role="button"
          tabIndex={0}
          onClick={goUsers}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && goUsers()}
          style={{
            padding: "16px",
            borderTop: "1px solid #e5e7eb",
            textAlign: "center",
            cursor: "pointer",
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

      {/* Content */}
      <main style={{ flex: 1, padding: "40px" }}>{children}</main>

      {/* ✅ Gate: บังคับกรอกรหัสนักศึกษาถ้ายังไม่มี */}
      <StudentIdGate />
    </div>
  );
}
