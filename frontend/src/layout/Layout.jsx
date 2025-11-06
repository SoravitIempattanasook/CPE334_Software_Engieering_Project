import { Outlet } from "react-router-dom";
import Sidebar from "../shared/Sidebar";

export default function Layout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-content">
        <Outlet />
      </main>
    </div>
  );
}
