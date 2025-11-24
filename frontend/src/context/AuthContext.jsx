import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("guest"); // guest, student, activity_maker, admin
  const [profile, setProfile] = useState(null); // เก็บข้อมูลจากตาราง Student/Maker/Admin
  const [loading, setLoading] = useState(true);

  // ฟังก์ชันเช็ค Role จากตารางต่างๆ
  const fetchUserRole = async (userId) => {
    // 1. เช็ค Admin
    const { data: admin } = await supabase.from("Admin").select("*").eq("user_id", userId).maybeSingle();
    if (admin) return { role: "admin", profile: admin };

    // 2. เช็ค ActivityMaker
    const { data: maker } = await supabase.from("ActivityMaker").select("*").eq("user_id", userId).maybeSingle();
    if (maker) return { role: "activity_maker", profile: maker };

    // 3. เช็ค Student
    const { data: student } = await supabase.from("Student").select("*").eq("user_id", userId).maybeSingle();
    if (student) return { role: "student", profile: student };

    return { role: "user", profile: null }; // กรณีไม่มีในตารางไหนเลย
  };

  useEffect(() => {
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user || null);

      if (session?.user) {
        const { role, profile } = await fetchUserRole(session.user.id);
        setRole(role);
        setProfile(profile);
      }
      setLoading(false);
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user || null);
      setLoading(true);
      
      if (session?.user) {
        const { role, profile } = await fetchUserRole(session.user.id);
        setRole(role);
        setProfile(profile);
      } else {
        setRole("guest");
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    session,
    user,
    role,
    profile,
    loading, // ส่งค่า loading ให้ ProtectedRoute ใช้งาน
    isAdmin: role === 'admin',
    isMaker: role === 'activity_maker' || role === 'admin',
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};