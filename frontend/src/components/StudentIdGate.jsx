// frontend/src/components/StudentIdGate.jsx
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

/**
 * Modal บังคับกรอกรหัสนักศึกษา (11 หลัก)
 * - โผล่เมื่อ user.user_metadata.student_id ไม่มี
 * - ปิดไม่ได้จนกว่าจะบันทึก หรือกด Logout
 */
export default function StudentIdGate() {
  const { loading } = useAuth(); // ไม่ใช้ user จาก context เพื่อเลี่ยง metadata เก่า
  const [open, setOpen] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  // ตัดสินใจเปิด Gate จาก user สดทุกครั้ง (กัน metadata cache)
  useEffect(() => {
    (async () => {
      if (loading) return;

      const { data: sData } = await supabase.auth.getSession();
      if (!sData?.session) return; // ยังไม่ล็อกอิน

      const { data: uData } = await supabase.auth.getUser();
      const freshUser = uData?.user;

      const current = freshUser?.user_metadata?.student_id || "";
      setOpen(!current);
      setStudentId(current);
    })();
  }, [loading]);

  if (loading) return null;
  if (!open) return null;

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

    // เช็ค session ให้ชัวร์ก่อนอัปเดต (กัน Auth session missing!)
    const { data: sData, error: sErr } = await supabase.auth.getSession();
    if (sErr) return setErr(sErr.message);
    if (!sData?.session) return setErr("ยังไม่มี session กรุณาเข้าสู่ระบบใหม่");

    setSaving(true);

    // 1) อัปเดต Auth metadata
    const { error: uErr } = await supabase.auth.updateUser({
      data: { student_id: trimmed },
    });
    if (uErr) {
      setSaving(false);
      return setErr(uErr.message);
    }

    // 2) (ตัวเลือก) ถ้ามีตาราง profiles ให้ upsert ด้วย
    // const { error: pErr } = await supabase
    //   .from("profiles")
    //   .upsert({ id: sData.session.user.id, student_id: trimmed }, { onConflict: "id" });
    // if (pErr) { setSaving(false); return setErr(pErr.message); }

    setSaving(false);

    // ปิด Gate และรีเฟรชเพื่อให้ AuthContext โหลด user สด (metadata ล่าสุด)
    setOpen(false);
    window.location.reload();
  };

  const logout = async () => {
    localStorage.setItem("forceAccountSelect", "1");
    await supabase.auth.signOut();
    window.location.assign("/login");
  };

  return (
    <div style={backdrop}>
      <div style={modal} role="dialog" aria-modal="true" aria-labelledby="sid-title">
        <h2 id="sid-title" style={{ margin: 0, fontSize: 24 }}>กรอกรหัสนักศึกษา</h2>
        <p style={{ marginTop: 8, color: "#555" }}>
          เพื่อความถูกต้องของข้อมูล โปรดระบุรหัสนักศึกษาก่อนเริ่มใช้งานระบบ
        </p>

        <div style={{ marginTop: 16 }}>
          <label htmlFor="student-id" style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>
            Student ID
          </label>
          <input
            id="student-id"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value.replace(/\D/g, ""))}
            placeholder="เช่น 65070000000 (11 หลัก)"
            style={input}
            inputMode="numeric"
            maxLength={11}
            autoFocus
          />
          {err && <div style={errBox}>{err}</div>}
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
          <button onClick={save} disabled={saving} style={primaryBtn}>
            {saving ? "Saving..." : "Save"}
          </button>
          <button onClick={logout} style={ghostBtn}>Logout</button>
        </div>
      </div>
    </div>
  );
}

/* --- styles --- */
const backdrop = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,.35)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
};

const modal = {
  width: "min(520px, 92vw)",
  background: "#fff",
  borderRadius: 16,
  padding: 24,
  boxShadow: "0 20px 60px rgba(0,0,0,.2)",
};

const input = {
  width: "100%",
  padding: "12px 14px",
  border: "1px solid #d1d5db",
  borderRadius: 10,
  fontSize: 16,
  outline: "none",
};

const primaryBtn = {
  padding: "10px 16px",
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  fontWeight: 600,
  cursor: "pointer",
};

const ghostBtn = {
  padding: "10px 16px",
  background: "#fff",
  color: "#111",
  border: "1px solid #d1d5db",
  borderRadius: 10,
  fontWeight: 600,
  cursor: "pointer",
};

const errBox = {
  marginTop: 8,
  background: "#ffe4e6",
  border: "1px solid #fecdd3",
  color: "#7f1d1d",
  padding: 8,
  borderRadius: 8,
};
