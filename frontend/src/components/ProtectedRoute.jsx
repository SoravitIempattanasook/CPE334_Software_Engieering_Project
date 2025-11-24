import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ใช้ Named Export (export const ...)
export const ProtectedRoute = ({ children, roles }) => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // หรือ Component Loading สวยๆ
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ถ้ามีการกำหนด roles และ user.role ไม่อยู่ในนั้น ให้ไปหน้า 403 (Forbidden)
  if (roles && !roles.includes(role)) {
    return <Navigate to="/403" replace />;
  }

  return children;
};