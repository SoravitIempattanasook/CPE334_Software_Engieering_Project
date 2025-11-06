import { NavLink, useNavigate } from "react-router-dom";
import { LuCalendar, LuLayoutGrid, LuUserCog, LuUser, LuLogOut } from "react-icons/lu";

export default function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // TODO: ดึง logout() จาก context ถ้ามี แล้วค่อย navigate("/login")
    // logout();
    navigate("/login");
  };

  return (
    <aside className="side">
      <div className="brand">Menu<br/><span className="brand-sub">KMUTT SC</span></div>

      <nav className="nav">
        <NavLink to="/" end className="item">
          <LuLayoutGrid className="ic" /> <span>Dashboard</span>
        </NavLink>
        <NavLink to="/activity" className="item">
          <LuLayoutGrid className="ic" /> <span>Activity board</span>
        </NavLink>
        <NavLink to="/calendar" className="item">
          <LuCalendar className="ic" /> <span>Calendar</span>
        </NavLink>
        <NavLink to="/settings" className="item">
          <LuUserCog className="ic" /> <span>Setting</span>
        </NavLink>
        <NavLink to="/profile" className="item">
          <LuUser className="ic" /> <span>Profile</span>
        </NavLink>
      </nav>

      <div className="side-footer">
        {/* แสดงผู้ใช้ปัจจุบัน */}
        <div className="me-card">
          <img className="me-avatar" src="/avatar.png" alt="me" />
          <div className="me-name">Among U.<span className="star">★</span></div>
        </div>

        <button className="logout" onClick={handleLogout}>
          <LuLogOut className="ic" /> Logout
        </button>
      </div>
    </aside>
  );
}
