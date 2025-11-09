import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RoleRedirect() {
  const { role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (role === "admin")       navigate("/dashboard", { replace: true });
    else if (role === "activity_maker") navigate("/activity", { replace: true });
    else /* student | guest */  navigate("/calendar", { replace: true });
  }, [role, navigate]);

  return null;
}
