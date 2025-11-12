import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Safe ProtectedRoute
 * - รอให้ user+role โหลดเสร็จก่อนตัดสินใจ
 * - ยังไม่ล็อกอิน → ไป /login
 * - admin = superuser ผ่านทุกหน้า
 * - ถ้า role ยังไม่มา (null) → รอ (return null) แทนการเด้ง 403
 * - ถ้า role ไม่ตรงจริง ๆ → แสดงหน้าเปล่า (return null) ชั่วคราว
 *   *ถ้าอยากเห็น 403 เป็นจอ ให้เปลี่ยนจาก `return null` ด้านล่างเป็นคอมโพเนนต์ Forbidden*
 */
export default function ProtectedRoute({ children, roles }) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  // รอให้ auth/role พร้อมก่อน
  if (loading) return null;

  // ยังไม่ล็อกอิน → ไป login
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // แอดมินผ่านทุกหน้า
  if (role === "admin") {
    return children;
  }

  // มีการจำกัดสิทธิ์
  if (Array.isArray(roles) && roles.length > 0) {
    // role ยังไม่มา → รอ
    if (role == null) return null;

    // ไม่อยู่ในสิทธิ์ → ไม่ redirect 403 อีก (กันเด้ง)
    if (!roles.includes(role)) {
      return null; // หรือใส่ <Forbidden/> ถ้าอยากเห็นหน้าห้ามเข้า
    }
  }

  return children;
}
