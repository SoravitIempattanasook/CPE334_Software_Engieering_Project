import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";
import { useState } from "react";
import StudentIdGate from "./StudentIdGate";

// สไตล์สำหรับลิงก์เมนู
const linkBase = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "12px 16px",
  borderRadius: "10px",
  color: "#4b5563",
  fontWeight: 500,
  textDecoration: "none",
  marginBottom: "4px",
  transition: "all 0.2s",
  fontSize: "0.95rem",
};

// สไตล์เมื่อลิงก์นั้น Active
const activeStyle = {
  ...linkBase,
  backgroundColor: "#eff6ff",
  color: "#2563eb",
  fontWeight: 600,
  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
};

export default function SidebarLayout() {
  const { user, role } = useAuth(); // ใช้ user และ role จาก AuthContext
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // ดึง Avatar จาก metadata (ถ้ามี)
  const avatar =
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  // ดึงชื่อแสดงผล
  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";

  const handleLogout = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await supabase.auth.signOut();
      navigate("/login", { replace: true });
    } catch (e) {
      alert(e?.message || "Logout failed");
    } finally {
      setLoading(false);
    }
  };

  const goProfile = () => navigate("/profile");

  // กำหนดเมนูที่จะแสดง (รวม Feature: Dashboard ทุกคน + Calendar ทุกคน)
  const menus = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: "📊",
      show: true, // ✅ Dashboard แสดงให้ทุกคนเห็น (ตาม requirement ล่าสุด)
    },
    {
      label: "ActivityMakerRequest",
      path: "/admin-requests",
      icon: "🛡️",
      show: role === "admin", // เฉพาะ Admin
    },
    {
      label: "Activity Board",
      path: "/activity-board",
      icon: "📄",
      show: true, // ทุกคนเข้าดูบอร์ดกิจกรรมได้
    },
    {
      label: "Calendar",
      path: "/calendar",
      icon: "📅",
      show: true, // ✅ Calendar แสดงให้ทุกคนเห็น (ตาม snippet ของคุณ)
    },
    {
      label: "Profile",
      path: "/profile",
      icon: "👤",
      show: true,
    },
    {
      label: "Settings",
      path: "/settings",
      icon: "⚙️",
      show: true,
    }
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#fff" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: "260px",
          backgroundColor: "#fff",
          borderRight: "1px solid #e5e7eb",
          display: "flex",
          flexDirection: "column",
          padding: "24px 16px",
          position: "sticky",
          top: 0,
          height: "100vh",
          flexShrink: 0,
          justifyContent: "space-between",
          boxSizing: "border-box"
        }}
      >
        {/* ส่วนบน: โลโก้และเมนู */}
        <div>
          <div style={{ marginBottom: "24px", paddingLeft: "8px", fontWeight: "800", fontSize: "1.4rem", color: "#2563eb", display: 'flex', alignItems: 'center', gap: '10px', letterSpacing: "-0.5px" }}>
            <span>KMUTTCALENDAR</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {menus.map((menu) => (
              menu.show && (
                <NavLink
                  key={menu.path}
                  to={menu.path}
                  style={({ isActive }) => (isActive ? activeStyle : linkBase)}
                >
                  <span style={{ fontSize: "1.3rem" }}>{menu.icon}</span>
                  <span>{menu.label}</span>
                </NavLink>
              )
            ))}
          </div>
        </div>

        {/* ส่วนล่าง: ปุ่ม Logout และ โปรไฟล์ */}
        <div>
          <button
            onClick={handleLogout}
            disabled={loading}
            style={{
              ...linkBase,
              width: "100%",
              textAlign: "left",
              background: "#fff",
              border: "1px solid #fee2e2",
              cursor: loading ? "not-allowed" : "pointer",
              marginBottom: 16,
              color: "#ef4444",
              fontWeight: 600,
              justifyContent: "center",
              transition: "background 0.2s"
            }}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.background = "#fef2f2")}
            onMouseLeave={(e) => !loading && (e.currentTarget.style.background = "#fff")}
          >
            🚪 {loading ? "Logging out..." : "Logout"}
          </button>

          <div
            onClick={goProfile}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === "Enter" ? goProfile() : null)}
            title="ดูโปรไฟล์"
            style={{
              padding: "12px",
              borderTop: "1px solid #f3f4f6",
              textAlign: "center",
              borderRadius: "12px",
              cursor: "pointer",
              userSelect: "none",
              transition: "all 0.2s",
              background: "#f9fafb"
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#f3f4f6"}
            onMouseLeave={(e) => e.currentTarget.style.background = "#f9fafb"}
          >
            <img
              src={avatar}
              alt="avatar"
              style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", border: "2px solid #fff", boxShadow: "0 2px 5px rgba(0,0,0,0.1)", margin: "0 auto" }}
            />
            <div style={{ marginTop: 8, fontWeight: 700, color: "#1f2937", fontSize: "0.95rem" }}>
              {displayName}
            </div>
            <div style={{ marginTop: 4 }}>
              <span style={{ 
                display: "inline-block",
                padding: "2px 10px", 
                borderRadius: "20px", 
                backgroundColor: "#e0e7ff", 
                fontSize: "0.75rem",
                textTransform: "capitalize",
                color: "#3730a3",
                fontWeight: 600
              }}>
                {role}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area wrapped with StudentIdGate */}
      <main style={{ flex: 1, background: "#f9fafb", padding: "32px 40px", overflowY: "auto" }}>
        {/* ✅ ใส่ StudentIdGate ตามที่ขอ */}
        <StudentIdGate>
          <Outlet />
        </StudentIdGate>
      </main>
    </div>
  );
}