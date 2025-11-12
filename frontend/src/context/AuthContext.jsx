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

<<<<<<< Updated upstream
  // โหลด session ครั้งแรก
=======
  // ===== role/profile =====
  const cachedRole = (() => {
    try { return localStorage.getItem("app.role") || null; } catch { return null; }
  })();
  const [role, setRole] = useState(cachedRole);     // เริ่มจากค่าแคช (ถ้ามี), หรือ null
  const [studentProfile, setStudentProfile] = useState(null);
  const [loadingRole, setLoadingRole] = useState(false);

  // ---------- Bootstrap auth ----------
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
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
=======
 // ---------- Load role/profile when user changes (Admin-first) ----------
useEffect(() => {
  let cancelled = false;

  const loadRole = async () => {
    if (!user) {
      setRole("guest");
      setStudentProfile(null);
      return;
    }

    setLoadingRole(true);
    try {
      // 1) เช็ก Admin ก่อน (ใช้ head+count เร็วสุด และไม่ดึงบอดี้)
      const { count: adminCount, error: adminErr } = await supabase
        .from("Admin")
        .select("user_id", { count: "exact", head: true })
        .eq("user_id", user.id);

      if (adminErr) console.warn("[AUTH] Admin error:", adminErr);
      if (!cancelled && (adminCount ?? 0) > 0) {
        setRole("admin");
        setStudentProfile(null);
        return; // ✅ เจอแล้ว จบ ไม่ต้องเช็กอย่างอื่น
      }

      // 2) เช็ก ActivityMaker ต่อ
      const { count: makerCount, error: makerErr } = await supabase
        .from("ActivityMaker")
        .select("user_id", { count: "exact", head: true })
        .eq("user_id", user.id);

      if (makerErr) console.warn("[AUTH] Maker error:", makerErr);
      if (!cancelled && (makerCount ?? 0) > 0) {
        setRole("activity_maker");
        setStudentProfile(null);
        return; // ✅ เจอแล้ว จบ
      }

      // 3) สุดท้ายเช็ก Student (ต้องดึงโปรไฟล์มาด้วย)
      const { data: student, error: studentErr } = await supabase
        .from("Student")
        .select("user_id, student_id, department, phone")
        .eq("user_id", user.id)
        .maybeSingle();

      if (studentErr) console.warn("[AUTH] Student error:", studentErr);

      if (!cancelled && student) {
        setRole("student");
        setStudentProfile({
          user_id: user.id,
          student_id: student.student_id ?? null,
          department: student.department ?? null,
          phone: student.phone ?? null,
        });
        return;
      }

      // ไม่เจอเลย → guest
      if (!cancelled) {
        setRole("guest");
        setStudentProfile(null);
      }
    } catch (e) {
      console.error("[AUTH] role fetch failed:", e);
      if (!cancelled) {
        setRole("guest");
        setStudentProfile(null);
      }
    } finally {
      if (!cancelled) setLoadingRole(false);
    }
  };

  loadRole();
  return () => { cancelled = true; };
}, [user]);


    return () => { active = false; };
  }, [user]);

  // ---------- helpers ----------
  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    (user?.email ? user.email.split("@")[0] : null) ||
    null;

  const domain = user?.email?.includes("@") ? user.email.split("@")[1] : null;

  const deriveStudentYear = () => {
    const mdYear = user?.user_metadata?.student_year;
    if (mdYear) return mdYear;
    const sid = String(studentProfile?.student_id || "");
    if (/^\d{11}$/.test(sid)) {
      const yy = sid.slice(0, 2);
      return yy;
    }
    return null;
  };
  const studentYear = deriveStudentYear();

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    try { localStorage.removeItem("app.role"); } catch {}
  };

  const refreshUser = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    setUser(data?.user ?? null);
    return data?.user ?? null;
  };

  const loading = loadingAuth || loadingRole;

  const value = useMemo(() => ({
    session, user, role, loading,
    studentProfile, displayName, domain, studentYear,
    logout, signOut: logout, refreshUser,
  }), [session, user, role, loading, studentProfile, displayName, domain, studentYear]);
>>>>>>> Stashed changes

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
