import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, roles = [] }) => {
  const { user, role, loading } = useAuth();

  // ระหว่างโหลดข้อมูล User ให้แสดงข้อความ Loading หรือหน้าว่างๆ ไปก่อน
  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

  // ถ้ายังไม่ Login ให้ดีดกลับไปหน้า Login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ถ้ามีการระบุ roles และ role ปัจจุบันของผู้ใช้ไม่อยู่ในรายการที่อนุญาต
  // ให้ดีดไปหน้า 403 (Forbidden)
  if (roles.length > 0 && !roles.includes(role)) {
    return <Navigate to="/403" replace />;
  }

  return children;
};

export default ProtectedRoute;