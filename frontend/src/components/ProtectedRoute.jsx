import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // ระหว่างกำลังโหลด session → แสดง Loading UI (กันหน้าขาว)
  if (loading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        fontSize: "20px",
        color: "#777"
      }}>
        Loading...
      </div>
    );
  }

  // โหลดเสร็จแล้วแต่ไม่มี user → เด้งไป login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // มี user แล้ว → แสดงหน้าได้ปกติ
  return children;
};
