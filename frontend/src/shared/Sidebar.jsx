import { NavLink, useNavigate } from "react-router-dom";
import { LuCalendar, LuLayoutGrid, LuSettings, LuLogOut } from "react-icons/lu";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";

export default function Sidebar() {
  const navigate = useNavigate();
  const { user, displayName } = useAuth();

  const avatar =
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    "/avatar.png";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  return (
    <aside className="side">
      <div
      className="brand cursor-pointer"
      onClick={() => navigate("/")}
      style={{ userSelect: "none" }}
    >
      MODSC
      <div className="brand-sub">Student Companion</div>
    </div>


      <nav className="nav">
        <NavLink to="/" end className="item">
          <LuLayoutGrid className="ic" /> Dashboard
        </NavLink>

        <NavLink to="/activity" className="item">
          <LuLayoutGrid className="ic" /> Activity Board
        </NavLink>

        <NavLink to="/calendar" className="item">
          <LuCalendar className="ic" /> Calendar
        </NavLink>

        <NavLink to="/settings" className="item">
          <LuSettings className="ic" /> Settings
        </NavLink>

        {/* ✅ ลบปุ่ม Profile ออกจากเมนู */}
      </nav>

      <div className="side-footer">

        {/* ✅ ทำ me-card คลิกได้ → ไปหน้า Profile */}
        <div
          className="me-card cursor-pointer"
          onClick={() => navigate("/profile")}
        >
          <img src={avatar} className="me-avatar" alt="user avatar" />
          <div className="me-name">{displayName || "User"}</div>
        </div>

        <button className="logout" onClick={handleLogout}>
          <LuLogOut className="ic" /> Logout
        </button>
      </div>
    </aside>
  );
}
