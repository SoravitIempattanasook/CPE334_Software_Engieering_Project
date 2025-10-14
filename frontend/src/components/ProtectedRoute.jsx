import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();

  if (!user) {
    // ถ้าไม่มี user, ให้ redirect ไปหน้า login
    return <Navigate to="/login" />;
  }

  return children;
};