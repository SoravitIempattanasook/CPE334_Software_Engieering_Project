import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RoleRedirect() {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  // รอให้โหลดข้อมูล User เสร็จก่อน
  if (loading) return null;

  // ถ้าไม่มี User ให้ไปหน้า Login
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

  // กำหนดหน้าปลายทางตาม Role
  const targetByRole = {
    admin: "/dashboard",
    activity_maker: "/activity-board",
    student: "/calendar",
    guest: "/activity-board",
  };

  // เลือกหน้าปลายทาง ถ้าไม่เจอ Role ให้ไปหน้า Activity Board
  const target = targetByRole[role] ?? "/activity-board";

  // ถ้าอยู่ที่หน้าเป้าหมายอยู่แล้ว ไม่ต้อง Redirect (ป้องกัน Loop)
  if (location.pathname === target) return null;

  return <Navigate to={target} replace />;
}