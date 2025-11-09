import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

<<<<<<< Updated upstream
export const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();

  if (!user) {
    // ถ้าไม่มี user, ให้ redirect ไปหน้า login
    return <Navigate to="/login" />;
  }

  return children;
};
=======
export function ProtectedRoute({ children }) {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (!session) return <Navigate to="/login" replace />;
  return children;
}
>>>>>>> Stashed changes
