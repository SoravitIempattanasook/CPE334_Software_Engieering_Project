import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export const AuthContext = createContext(null);

// Allowed domains (env -> fallback)
const envAllowed = (import.meta?.env?.VITE_ALLOWED_DOMAINS || "")
  .split(",").map(s => s.trim()).filter(Boolean);
const DEFAULT_ALLOWED = ["st.kmutt.ac.th", "kmutt.ac.th", "mail.kmutt.ac.th"];
const ALLOWED_DOMAINS = envAllowed.length ? envAllowed : DEFAULT_ALLOWED;

// helpers
const getDomain = (email) => (email ? String(email).split("@")[1] : null);
const getDisplayName = (user) =>
  user?.user_metadata?.full_name ||
  user?.user_metadata?.name ||
  (user?.email ? user.email.split("@")[0] : "");
const getStudentYear = (email) => {
  const local = email?.split("@")[0] || "";
  const yy = local.slice(0, 2);
  return /^\d{2}$/.test(yy) ? Number(`25${yy}`) : null;
};

// 🔎 ดึง role จาก DB + metadata
async function resolveRole(user) {
  if (!user?.email) return "user";
  const email = user.email;

  // 1) admin? (เช็คตาราง public.admins)
  const { data: adminRow, error: adminErr } = await supabase
    .from("admins")
    .select("email")
    .eq("email", email)
    .maybeSingle();
  if (adminRow && !adminErr) return "admin";

  // 2) activity_maker? (จาก user_metadata.role)
  const metaRole = user.user_metadata?.role;
  if (metaRole === "activity_maker") return "activity_maker";

  // 3) student ตามโดเมน
  if (email.endsWith("@st.kmutt.ac.th")) return "student";

  // 4) fallback
  return "user";
}

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(true);

  // โหลด session ครั้งแรก
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: sData } = await supabase.auth.getSession();
        let s = sData?.session ?? null;

        // refresh user metadata
        if (s?.user) {
          const { data: uData } = await supabase.auth.getUser();
          if (uData?.user) s = { ...s, user: uData.user };
        }

        // domain gate
        if (s?.user?.email) {
          const domain = getDomain(s.user.email);
          if (domain && !ALLOWED_DOMAINS.includes(domain)) {
            await supabase.auth.signOut();
            s = null;
          }
        }

        if (mounted) {
          setSession(s);
          const r = await resolveRole(s?.user);
          setRole(r);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // ฟังการเปลี่ยนแปลง auth
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange(async (_evt, newSession) => {
      let s = newSession ?? null;

      if (s?.user) {
        const { data: uData } = await supabase.auth.getUser();
        if (uData?.user) s = { ...s, user: uData.user };
      }

      if (s?.user?.email) {
        const domain = getDomain(s.user.email);
        if (domain && !ALLOWED_DOMAINS.includes(domain)) {
          await supabase.auth.signOut();
          s = null;
        }
      }

      setSession(s);
      const r = await resolveRole(s?.user);
      setRole(r);
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
      role, // 👈 ใช้ตรงนี้ใน Sidebar/RoleRedirect/Profile

      displayName: user ? getDisplayName(user) : "",
      domain: email ? getDomain(email) : null,
      studentYear: email ? getStudentYear(email) : null,

      refreshSession: async () => {
        const { data: sData } = await supabase.auth.getSession();
        let s = sData?.session ?? null;
        if (s?.user) {
          const { data: uData } = await supabase.auth.getUser();
          if (uData?.user) s = { ...s, user: uData.user };
        }
        setSession(s);
        const r = await resolveRole(s?.user);
        setRole(r);
        return s;
      },
    };
  }, [session, user, loading, role]);

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div style={{
          display: "flex", justifyContent: "center", alignItems: "center",
          height: "100vh", fontSize: 20, color: "#777"
        }}>
          Loading...
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
