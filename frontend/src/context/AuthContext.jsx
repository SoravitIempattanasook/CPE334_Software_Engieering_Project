import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

// ✅ export context เป็น named export ด้วย (กันสับสน)
export const AuthContext = createContext(null);

// Allowed domains
const envAllowed = (import.meta?.env?.VITE_ALLOWED_DOMAINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const DEFAULT_ALLOWED = ["st.kmutt.ac.th", "kmutt.ac.th", "mail.kmutt.ac.th"];
const ALLOWED_DOMAINS = envAllowed.length ? envAllowed : DEFAULT_ALLOWED;

// helpers
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
const getStudentYear = (email) => {
  const local = email?.split("@")[0] || "";
  const yy = local.slice(0, 2);
  return /^\d{2}$/.test(yy) ? Number(`25${yy}`) : null;
};

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // initial load
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: sData } = await supabase.auth.getSession();
        let s = sData?.session ?? null;

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

        if (mounted) setSession(s);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // listen session changes
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
        const { data: sData } = await supabase.auth.getSession();
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
      {loading ? (
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
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

// ✅ named hook export ที่ ProtectedRoute ใช้
export const useAuth = () => useContext(AuthContext);
