// frontend/src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // ===== auth/session =====
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // ===== role/profile =====
  const [role, setRole] = useState(null);           // เริ่มจากยังไม่รู้บทบาท
  const [studentProfile, setStudentProfile] = useState(null);
  const [loadingRole, setLoadingRole] = useState(false);

  // ---------- Bootstrap auth ----------
  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoadingAuth(true);
      const { data: sData } = await supabase.auth.getSession();
      let s = sData?.session ?? null;

      if (s?.user) {
        const { data: uData } = await supabase.auth.getUser();
        if (uData?.user) s = { ...s, user: uData.user };
      }

      if (mounted) {
        setSession(s);
        setUser(s?.user ?? null);
        setLoadingAuth(false);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  // ---------- Load role/profile when user changes ----------
  useEffect(() => {
    let active = true;

    (async () => {
      if (!user) {
        setRole("guest");
        setStudentProfile(null);
        return;
      }

      setLoadingRole(true);
      try {
        const [adminQ, makerQ, studentQ] = await Promise.all([
          supabase.from("Admin").select("user_id").eq("user_id", user.id).maybeSingle(),
          supabase.from("ActivityMaker").select("user_id").eq("user_id", user.id).maybeSingle(),
          supabase.from("Student").select("user_id, student_id, department, phone").eq("user_id", user.id).maybeSingle(),
        ]);

        if (!active) return;

        const isAdmin = !!adminQ.data;
        const isMaker = !!makerQ.data;
        const student = studentQ.data ?? null;

        let computedRole = "guest";
        if (isAdmin) computedRole = "admin";
        else if (isMaker) computedRole = "activity_maker";
        else if (student) computedRole = "student";

        setRole(computedRole);
        setStudentProfile(
          student
            ? {
                user_id: user.id,
                student_id: student.student_id ?? null,
                department: student.department ?? null,
                phone: student.phone ?? null,
              }
            : null
        );
      } catch (e) {
        console.error("[AUTH] role fetch failed:", e);
        setRole("guest");
        setStudentProfile(null);
      } finally {
        setLoadingRole(false);
      }
    })();

    return () => {
      active = false;
    };
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
  };

  const refreshUser = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    setUser(data?.user ?? null);
    return data?.user ?? null;
  };

  const loading = loadingAuth || loadingRole;

  const value = useMemo(
    () => ({
      session,
      user,
      role,
      loading,
      studentProfile,
      displayName,
      domain,
      studentYear,
      logout,
      signOut: logout,
      refreshUser,
    }),
    [session, user, role, loading, studentProfile, displayName, domain, studentYear]
  );

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
