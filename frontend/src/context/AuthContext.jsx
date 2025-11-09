// frontend/src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext(null);

<<<<<<< Updated upstream
// อ่านโดเมนที่อนุญาตจาก .env (คอมมาแยก), ถ้าไม่มีให้ใช้ default
const envAllowed = (import.meta?.env?.VITE_ALLOWED_DOMAINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const DEFAULT_ALLOWED = ["st.kmutt.ac.th", "kmutt.ac.th", "mail.kmutt.ac.th"];
const ALLOWED_DOMAINS = envAllowed.length ? envAllowed : DEFAULT_ALLOWED;

// ------- helpers -------
const getDomain = (email) => (email ? String(email).split("@")[1] : null);

=======
/** ตรวจบทบาทจากฐานข้อมูล (Admin > ActivityMaker > Student > Guest) */
async function resolveDbRole(user) {
  if (!user?.id) return { role: "guest", student: null };

  // 1) Admin?
  const { data: adminRow, error: adminErr } = await supabase
    .from("Admin")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (adminRow && !adminErr) return { role: "admin", student: null };

  // 2) ActivityMaker?
  const { data: makerRow, error: makerErr } = await supabase
    .from("ActivityMaker")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (makerRow && !makerErr) return { role: "activity_maker", student: null };

  // 3) Student?
  const { data: studentRow, error: stuErr } = await supabase
    .from("Student")
    .select("user_id, student_id, department, phone")
    .eq("user_id", user.id)
    .maybeSingle();
  if (studentRow && !stuErr) return { role: "student", student: studentRow };

  // 4) ไม่พบใน DB -> guest
  return { role: "guest", student: null };
}

>>>>>>> Stashed changes
const getDisplayName = (user) =>
  user?.user_metadata?.full_name ||
  user?.user_metadata?.name ||
  (user?.email ? user.email.split("@")[0] : "");

<<<<<<< Updated upstream
const getRole = (email) => {
  const d = getDomain(email) || "";
  if (d === "st.kmutt.ac.th") return "student";
  if (d.endsWith("kmutt.ac.th")) return "staff";
  return "guest";
};

// ตัวอย่างแปลงปีการศึกษา: "65xxxxxxx" -> 2565 (ถ้า format ไม่ตรงจะคืน null)
const getStudentYear = (email) => {
  const local = email?.split("@")[0] || "";
  const yy = local.slice(0, 2);
  return /^\d{2}$/.test(yy) ? Number(`25${yy}`) : null;
};

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
=======
export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("guest");
  const [studentProfile, setStudentProfile] = useState(null);
>>>>>>> Stashed changes
  const [loading, setLoading] = useState(true);

  // โหลดครั้งแรก: getSession -> แล้วตามด้วย getUser() เพื่อให้ user_metadata ใหม่สุด
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: sData, error: sErr } = await supabase.auth.getSession();
      if (!mounted) return;
      if (sErr) console.error("getSession error:", sErr.message);

      let s = sData?.session ?? null;

<<<<<<< Updated upstream
      if (s?.user) {
        const { data: uData, error: uErr } = await supabase.auth.getUser();
        if (uErr) console.error("getUser error:", uErr.message);
        if (uData?.user) s = { ...s, user: uData.user };
=======
        if (!mounted) return;
        setSession(s);
        setUser(s?.user ?? null);

        const { role, student } = await resolveDbRole(s?.user);
        if (!mounted) return;
        setRole(role);
        setStudentProfile(student);
      } finally {
        if (mounted) setLoading(false);
>>>>>>> Stashed changes
      }

      // ตรวจโดเมน
      if (s?.user?.email) {
        const domain = getDomain(s.user.email);
        if (domain && !ALLOWED_DOMAINS.includes(domain)) {
          await supabase.auth.signOut();
          setSession(null);
          setLoading(false);
          alert("ต้องใช้บัญชีอีเมลมหาวิทยาลัยเท่านั้น");
          return;
        }
      }

      setSession(s);
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // ฟังทุก event แล้ว refresh user สดเสมอ
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(async (_evt, newSession) => {
      let s = newSession ?? null;

      if (s?.user) {
        const { data: uData, error: uErr } = await supabase.auth.getUser();
        if (!uErr && uData?.user) s = { ...s, user: uData.user };
      }

<<<<<<< Updated upstream
      if (s?.user?.email) {
        const domain = getDomain(s.user.email);
        if (domain && !ALLOWED_DOMAINS.includes(domain)) {
          await supabase.auth.signOut();
          setSession(null);
          alert("ต้องใช้บัญชีอีเมลมหาวิทยาลัยเท่านั้น");
          return;
        }
      }

      setSession(s);
=======
      setSession(s);
      setUser(s?.user ?? null);

      const { role, student } = await resolveDbRole(s?.user);
      setRole(role);
      setStudentProfile(student);
>>>>>>> Stashed changes
    });
    return () => sub.subscription.unsubscribe();
  }, []);

<<<<<<< Updated upstream
  const user = session?.user || null;

  const value = useMemo(() => {
    const email = user?.email || null;
    return {
      session,
      user,
      loading,

      displayName: user ? getDisplayName(user) : "",
      domain: email ? getDomain(email) : null,
      role: email ? getRole(email) : "guest",
      studentYear: email ? getStudentYear(email) : null,

      refreshSession: async () => {
        const { data: sData, error } = await supabase.auth.getSession();
        if (error) console.error("refreshSession error:", error.message);
        let s = sData?.session ?? null;
        if (s?.user) {
          const { data: uData } = await supabase.auth.getUser();
          if (uData?.user) s = { ...s, user: uData.user };
        }
        setSession(s);
        return s;
      },
    };
  }, [session, user, loading]);
=======
  const value = useMemo(() => ({
    session,
    user,
    role,                 // "admin" | "activity_maker" | "student" | "guest"
    studentProfile,       // null หรือ { user_id, student_id, department, phone }
    displayName: user ? getDisplayName(user) : "",
    loading,
    logout: async () => {
      await supabase.auth.signOut();
      // เคลียร์ state เพื่อกัน redirect loop
      setSession(null);
      setUser(null);
      setRole("guest");
      setStudentProfile(null);
    },
    refreshRole: async () => {
      const { role, student } = await resolveDbRole(user);
      setRole(role);
      setStudentProfile(student);
      return { role, student };
    },
  }), [session, user, role, studentProfile, loading]);
>>>>>>> Stashed changes

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
