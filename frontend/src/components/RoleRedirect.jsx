<<<<<<< Updated upstream
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RoleRedirect() {
  const { role } = useAuth();
  if (role === "admin") return <Navigate to="/dashboard" replace />;
  if (role === "activity_maker") return <Navigate to="/activity" replace />;
  return <Navigate to="/calendar" replace />; // student / user
=======
// src/components/RoleRedirect.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RoleRedirect() {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

  const targetByRole = {
    admin: "/dashboard",
    activity_maker: "/activity-board",
    student: "/calendar",
    guest: "/activity-board",
  };
  const target = targetByRole[role] ?? "/activity-board";

  if (location.pathname === target) return null;
  return <Navigate to={target} replace />;
>>>>>>> Stashed changes
}
