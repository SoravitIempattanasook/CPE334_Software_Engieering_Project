import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RoleRedirect() {
  const { user, role } = useAuth();

  // ยังไม่ได้ login → ไปหน้า login
  if (!user) return <Navigate to="/login" replace />;

  // role-based redirect
  switch (role) {
    case "admin":
      return <Navigate to="/dashboard" replace />;
    case "activity_maker":
      return <Navigate to="/activity-board" replace />;
    case "student":
      return <Navigate to="/calendar" replace />;
    case "guest":
    default:
      // guest เข้าดู activity board ได้ (ดูได้แต่ join ไม่ได้)
      return <Navigate to="/activity-board" replace />;
  }
}
