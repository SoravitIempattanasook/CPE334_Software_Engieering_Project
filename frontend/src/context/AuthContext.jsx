// frontend/src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // บทบาท/โปรไฟล์จาก DB
  const [role, setRole] = useState("guest");
  const [studentProfile, setStudentProfile] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: sData } = await supabase.auth.getSession();
      let s = sData?.session ?? null;
      if (s?.user) {
        const { data: uData } = await supabase.auth.getUser();
        if (uData?.user) s = { ...s, user: uData.user };
      }
      if (mounted) {
        setSession(s);
        setUser(s?.user ?? null);
        setLoading(false);
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

  // ดึงบทบาท/โปรไฟล์จาก DB ตามสคีมาของคุณ (Admin / ActivityMaker / Student)
  useEffect(() => {
    let active = true;
    (async () => {
      if (!user) {
        if (active) {
          setRole("guest");
          setStudentProfile(null);
        }
        return;
      }
      try {
        const [adminQ, makerQ, studentQ] = await Promise.all([
          supabase.from("Admin").select("user_id").eq("user_id", user.id).limit(1),
          supabase.from("ActivityMaker").select("user_id").eq("user_id", user.id).limit(1),
          supabase.from("Student").select("user_id, student_id, department, phone").eq("user_id", user.id).maybeSingle(),
        ]);

        if (!active) return;

        const isAdmin = !!(adminQ.data && adminQ.data.length > 0);
        const isMaker = !!(makerQ.data && makerQ.data.length > 0);
        const student = studentQ.data || null;

        let r = "guest";
        if (isAdmin) r = "admin";
        else if (isMaker) r = "activity_maker";
        else if (student) r = "student";

        setRole(r);
        setStudentProfile(student ? {
          user_id: user.id,
          student_id: student.student_id ?? null,
          department: student.department ?? null,
          phone: student.phone ?? null,
        } : null);
      } catch (e) {
        setRole("guest");
        setStudentProfile(null);
      }
    })();
    return () => { active = false; };
  }, [user]);

  // ======== เพิ่มตัวช่วยที่หน้าโปรไฟล์เรียกใช้ ========
  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    (user?.email ? user.email.split("@")[0] : null) ||
    null;

  const domain = user?.email?.includes("@") ? user.email.split("@")[1] : null;

  // พยายามเดา studentYear:
  // 1) ใช้จาก user_metadata.student_year ถ้ามี
  // 2) เดาจาก student_id (ถ้าเป็นเลข 11 หลัก เอา 2 หลักแรกเป็นปีพ.ศ./ค.ศ.ตาม format ที่คุณใช้)
  const deriveStudentYear = () => {
    const mdYear = user?.user_metadata?.student_year;
    if (mdYear) return mdYear;

    const sid = String(studentProfile?.student_id || "");
    if (/^\d{11}$/.test(sid)) {
      // ตัวอย่างเดาอย่างง่าย: ใช้ 2 หลักแรก
      // ปรับตาม convention ของสถาบันคุณได้เลย
      const yy = sid.slice(0, 2);
      return yy; // หรือ `20${yy}`, หรือ `25${yy}` ตามระบบปีที่ใช้
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

  const value = useMemo(() => ({
    session,
    user,
    loading,
    role,
    studentProfile,

    // สำหรับโปรไฟล์
    displayName,
    domain,
    studentYear,

    // ฟังก์ชันทั่วไป
    logout,
    signOut: logout,
    refreshUser,
  }), [session, user, loading, role, studentProfile, displayName, domain, studentYear]);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
