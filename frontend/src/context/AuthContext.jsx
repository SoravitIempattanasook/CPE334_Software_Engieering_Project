// frontend/src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext(null);

// อ่านโดเมนที่อนุญาตจาก .env (คอมมาแยก), ถ้าไม่มีให้ใช้ default
const envAllowed = (import.meta?.env?.VITE_ALLOWED_DOMAINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const DEFAULT_ALLOWED = ["st.kmutt.ac.th", "kmutt.ac.th", "mail.kmutt.ac.th"];
const ALLOWED_DOMAINS = envAllowed.length ? envAllowed : DEFAULT_ALLOWED;

// ------- helpers -------
const getDomain = (email) => (email ? String(email).split("@")[1] : null);

const getDisplayName = (user) =>
  user?.user_metadata?.full_name ||
  user?.user_metadata?.name ||
  (user?.email ? user.email.split("@")[0] : "");

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
  const [loading, setLoading] = useState(true);

  // โหลดครั้งแรก: getSession -> แล้วตามด้วย getUser() เพื่อให้ user_metadata ใหม่สุด
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: sData, error: sErr } = await supabase.auth.getSession();
      if (!mounted) return;
      if (sErr) console.error("getSession error:", sErr.message);

      let s = sData?.session ?? null;

      if (s?.user) {
        const { data: uData, error: uErr } = await supabase.auth.getUser();
        if (uErr) console.error("getUser error:", uErr.message);
        if (uData?.user) s = { ...s, user: uData.user };
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
    const { data } = supabase.auth.onAuthStateChange(async (_evt, newSession) => {
      let s = newSession ?? null;

      if (s?.user) {
        const { data: uData, error: uErr } = await supabase.auth.getUser();
        if (!uErr && uData?.user) s = { ...s, user: uData.user };
      }

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
    });
    return () => data.subscription.unsubscribe();
  }, []);

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

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
