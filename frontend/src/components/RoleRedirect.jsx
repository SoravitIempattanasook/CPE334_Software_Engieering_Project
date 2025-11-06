import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RoleRedirect() {
  const { role } = useAuth();
  if (role === "admin") return <Navigate to="/dashboard" replace />;
  if (role === "activity_maker") return <Navigate to="/activity" replace />;
  return <Navigate to="/calendar" replace />; // student / user
}
