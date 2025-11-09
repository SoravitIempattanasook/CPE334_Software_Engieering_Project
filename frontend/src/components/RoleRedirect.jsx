import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RoleRedirect() {
  const { user, role } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  if (role === 'admin') return <Navigate to="/dashboard" replace />;
  if (role === 'activity_maker') return <Navigate to="/activity-board" replace />;
  // student & guest
  return <Navigate to="/calendar" replace />;
}
