import { useEffect, useState } from 'react';
// ใช้ Relative Path ตามโครงสร้างปกติของโปรเจกต์
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

/**
 * Modal บังคับกรอกรหัสนักศึกษา (11 หลัก)
 * - โผล่เมื่อ user.user_metadata.student_id ไม่มี
 * - ปิดไม่ได้จนกว่าจะบันทึก หรือกด Logout
 * - มีปุ่ม "ไม่ใช่นักศึกษา" เพื่อข้ามการกรอก (จำค่าตลอดไปใน Browser นี้)
 */
export default function StudentIdGate({ children }) {
  const { loading } = useAuth(); 
  const [open, setOpen] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    const checkStudentId = async () => {
      // ถ้า AuthContext ยังโหลดไม่เสร็จ ให้รอไปก่อน
      if (loading) return;

      // 1. เช็คว่าเคยกดข้าม (Skip) ในเครื่องนี้หรือยัง (เปลี่ยนจาก SessionStorage เป็น LocalStorage)
      const isSkipped = localStorage.getItem("skipStudentIdGate");
      if (isSkipped) {
        if (active) setOpen(false);
        return;
      }

      // 2. เช็ค Session จาก Supabase โดยตรง
      const { data: sData } = await supabase.auth.getSession();
      if (!sData?.session) {
        if (active) setOpen(false);
        return; 
      }

      // 3. เช็ค User Metadata ล่าสุดจาก Server
      const { data: uData } = await supabase.auth.getUser();
      const freshUser = uData?.user;
      
      const currentId = freshUser?.user_metadata?.student_id || "";

      if (active) {
        // ถ้าไม่มีรหัสนักศึกษา ให้เปิด Modal
        if (!currentId) {
          setOpen(true);
          setStudentId("");
        } else {
          setOpen(false);
        }
      }
    };

    checkStudentId();

    return () => { active = false; };
  }, [loading]);

  // ถ้า loading หรือไม่เปิด Modal ให้แสดง content ข้างใน (children) ตามปกติ
  if (loading) return <>{children}</>;
  if (!open) return <>{children}</>;

  const validate = (v) => {
    if (!v) return "กรุณากรอกรหัสนักศึกษา";
    if (!/^\d{11}$/.test(v)) return "รหัสนักศึกษาต้องเป็นตัวเลข 11 หลักเท่านั้น";
    return null;
  };

  const save = async () => {
    setErr("");
    const trimmed = (studentId || "").trim();
    const msg = validate(trimmed);
    if (msg) return setErr(msg);

    const { data: sData, error: sErr } = await supabase.auth.getSession();
    if (sErr) return setErr(sErr.message);
    if (!sData?.session) return setErr("Session หมดอายุ กรุณาเข้าสู่ระบบใหม่");

    setSaving(true);

    // อัปเดต metadata ของ user
    const { error: uErr } = await supabase.auth.updateUser({
      data: { student_id: trimmed },
    });

    if (uErr) {
      setSaving(false);
      return setErr(uErr.message);
    }

    setSaving(false);
    setOpen(false);
    // รีโหลดหน้าเพื่อให้ AuthContext ไปดึงข้อมูล Role/Profile มาใหม่
    window.location.reload(); 
  };

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.assign("/login");
  };

  const handleSkip = () => {
    // บันทึกการข้ามลง LocalStorage (จำค่าตลอดไปแม้ปิด Browser)
    localStorage.setItem("skipStudentIdGate", "1");
    setOpen(false);
  };

  return (
    <>
      {/* เนื้อหาหลักของหน้า (Dashboard ฯลฯ) */}
      {children}
      
      {/* Modal Overlay */}
      <div style={backdrop}>
        <div style={modal} role="dialog" aria-modal="true" aria-labelledby="sid-title">
          {/* แก้ไขบรรทัดนี้ครับ ลบ xj ออก */}
          <h2 id="sid-title" style={{ margin: 0, fontSize: 24, color: '#333' }}>กรอกรหัสนักศึกษา</h2>
          <p style={{ marginTop: 8, color: "#666" }}>
            เพื่อความถูกต้องของข้อมูล โปรดระบุรหัสนักศึกษาก่อนเริ่มใช้งานระบบ
          </p>

          <div style={{ marginTop: 20, textAlign: 'left' }}>
            <label htmlFor="student-id" style={{ display: "block", marginBottom: 6, fontWeight: 600, color: '#444' }}>
              Student ID
            </label>
            <input
              id="student-id"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value.replace(/\D/g, ""))}
              placeholder="เช่น 65070000000"
              style={input}
              inputMode="numeric"
              maxLength={11}
              autoFocus
            />
            {err && <div style={errBox}>{err}</div>}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 24 }}>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={save} disabled={saving} style={primaryBtn}>
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
              <button onClick={logout} style={ghostBtn}>ออกจากระบบ</button>
            </div>

            <button onClick={handleSkip} style={linkBtn}>
              ฉันไม่ใช่นักศึกษา (ข้ามขั้นตอนนี้)
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* --- styles --- */
const backdrop = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,.6)",
  backdropFilter: "blur(4px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
};

const modal = {
  width: "min(480px, 90vw)",
  background: "#fff",
  borderRadius: 16,
  padding: "32px 24px",
  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
  textAlign: "center",
  border: "1px solid #e5e7eb"
};

const input = {
  width: "100%",
  padding: "12px 16px",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  fontSize: "1rem",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.2s"
};

const primaryBtn = {
  flex: 1,
  padding: "12px",
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  fontWeight: 600,
  cursor: "pointer",
  fontSize: "1rem",
  transition: "background 0.2s"
};

const ghostBtn = {
  padding: "12px 20px",
  background: "#fff",
  color: "#ef4444",
  border: "1px solid #ef4444",
  borderRadius: 8,
  fontWeight: 600,
  cursor: "pointer",
  fontSize: "1rem",
  transition: "background 0.2s"
};

const linkBtn = {
  background: "none",
  border: "none",
  color: "#6b7280",
  textDecoration: "underline",
  cursor: "pointer",
  fontSize: "0.9rem",
  padding: "8px",
  marginTop: "4px"
};

const errBox = {
  marginTop: 8,
  background: "#fee2e2",
  border: "1px solid #fecaca",
  color: "#991b1b",
  padding: "8px 12px",
  borderRadius: 6,
  fontSize: "0.9rem",
  textAlign: "left"
};