import { NavLink, useNavigate } from "react-router-dom";
import { LuCalendar, LuLayoutGrid, LuSettings, LuLogOut } from "react-icons/lu";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";

export default function Sidebar() {
  const navigate = useNavigate();
  const { user, displayName, role } = useAuth();

  const avatar =
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    "/avatar.png";

  const goHomeByRole = () => {
    if (role === "admin") return navigate("/dashboard");
    if (role === "activity_maker") return navigate("/activity");
    return navigate("/calendar");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  return (
    <aside className="side">
      <div className="brand cursor-pointer" onClick={goHomeByRole} style={{ userSelect: "none" }}>
        MODSC
        <div className="brand-sub">Student Companion</div>
      </div>

      <nav className="nav">
        {role === "admin" && (
          <NavLink to="/dashboard" className="item">
            <LuLayoutGrid className="ic" /> Dashboard
          </NavLink>
        )}

        <NavLink to="/calendar" className="item">
          <LuCalendar className="ic" /> Calendar
        </NavLink>

        {(role === "activity_maker" || role === "admin") && (
          <NavLink to="/activity" className="item">
            <LuLayoutGrid className="ic" /> Activity Board
          </NavLink>
        )}

        <NavLink to="/settings" className="item">
          <LuSettings className="ic" /> Settings
        </NavLink>
      </nav>

      <div className="side-footer">
        <div className="me-card cursor-pointer" onClick={() => navigate("/profile")}>
          <img src={avatar} className="me-avatar" alt="user avatar" />
          <div className="me-name">
            {displayName || "User"} <span className="star">· {role}</span>
          </div>
        </div>

        <button className="logout" onClick={handleLogout}>
          <LuLogOut className="ic" /> Logout
        </button>
      </div>
    </aside>
  );
}
