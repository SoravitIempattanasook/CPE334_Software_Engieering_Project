import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

export default function TodayActivityModal() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [todaysList, setTodaysList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // เช็คว่าเคยปิด Modal ใน Session นี้ไปหรือยัง
    const hasSeen = sessionStorage.getItem("seenTodayModal");
    if (hasSeen) return;

    const fetchTodayActivities = async () => {
      setLoading(true);
      
      // หาวันที่ปัจจุบัน (YYYY-MM-DD) ตามเวลาเครื่อง User
      const now = new Date();
      // ตั้งเวลาให้เป็นเริ่มต้นวัน (00:00:00) และสิ้นสุดวัน (23:59:59) เพื่อเปรียบเทียบ Timestamp
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).getTime();
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).getTime();

      // Format สำหรับ Query Supabase (UTC หรือ ISO string ขึ้นอยู่กับ DB แต่ Supabase รับ ISO ได้)
      // เพื่อความง่ายและชัวร์เรื่อง Timezone เราจะดึงมาช่วงกว้างๆ แล้วกรองด้วย JS
      
      try {
        // 1. ดึงกิจกรรมส่วนตัว (Activity)
        const { data: personalEvents } = await supabase
          .from("Activity")
          .select("id, name, start_time, end_time, all_day")
          .or(`student_id.eq.${user.id},created_by.eq.${user.id}`);

        // 2. ดึงกิจกรรมส่วนกลางที่เข้าร่วม (JoinEvent -> Event)
        const { data: joinedEvents } = await supabase
          .from("JoinEvent")
          .select(`
            event_id,
            Event (
              event_id,
              name,
              start_event,
              end_event
            )
          `)
          .eq("user_id", user.id);

        // ฟังก์ชันเช็คว่ากิจกรรมครอบคลุม "วันนี้" หรือไม่
        const isToday = (startStr, endStr) => {
          if (!startStr) return false;
          
          const start = new Date(startStr).getTime();
          // ถ้าไม่มีเวลาจบ ให้ถือว่าจบพร้อมเริ่ม (จุดเดียว)
          const end = endStr ? new Date(endStr).getTime() : start;

          // สูตร Overlap: (Start <= EndToday) AND (End >= StartToday)
          // แปลว่า: กิจกรรมเริ่มก่อนจะหมดวันนี้ และ จบหลังจากเริ่มวันนี้ไปแล้ว
          return start <= endOfToday && end >= startOfToday;
        };

        // กรองกิจกรรมส่วนตัว
        const validPersonal = (personalEvents || [])
          .filter((p) => isToday(p.start_time, p.end_time))
          .map((p) => ({
            id: `pers-${p.id}`,
            name: p.name,
            start_time: p.start_time,
            type: "ส่วนตัว",
          }));

        // กรองกิจกรรมส่วนกลาง
        const validJoined = (joinedEvents || [])
          .map((j) => j.Event)
          .filter((ev) => ev && isToday(ev.start_event, ev.end_event))
          .map((ev) => ({
            id: `join-${ev.event_id}`,
            name: ev.name,
            start_time: ev.start_event,
            type: "ส่วนกลาง",
          }));

        const allEvents = [...validPersonal, ...validJoined];

        // เรียงตามเวลาเริ่ม
        allEvents.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

        if (allEvents.length > 0) {
          setTodaysList(allEvents);
          setIsOpen(true);
        }
      } catch (error) {
        console.error("Check today error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTodayActivities();
  }, [user]);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem("seenTodayModal", "1");
  };

  if (!isOpen) return null;

  return (
    <div style={backdrop}>
      <div style={modal}>
        <div style={header}>
          <h2 style={{ margin: 0, fontSize: "1.4rem", color: "#333" }}>📅 กิจกรรมวันนี้</h2>
          <button onClick={handleClose} style={closeBtn}>&times;</button>
        </div>
        
        <div style={{ padding: "20px 0" }}>
          <p style={{ marginTop: 0, color: "#555" }}>
            สวัสดีครับ, วันนี้คุณมี <strong>{todaysList.length}</strong> กิจกรรมที่ต้องทำ:
          </p>
          
          <div style={listContainer}>
            {todaysList.map((item, index) => (
              <div key={index} style={listItem}>
                <div style={timeBadge}>
                  {new Date(item.start_time).toLocaleTimeString("th-TH", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })} น.
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: "bold", fontSize: "1rem", color: "#111" }}>{item.name}</div>
                  <div style={{ fontSize: "0.85rem", color: "#666" }}>
                    {item.type === "ส่วนกลาง" ? "🏢 กิจกรรมคณะ/มหาลัย" : "👤 กิจกรรมส่วนตัว"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button onClick={handleClose} style={primaryBtn}>รับทราบ</button>
      </div>
    </div>
  );
}

// --- Styles ---
const backdrop = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(0,0,0,0.6)",
  backdropFilter: "blur(3px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 10000,
};

const modal = {
  backgroundColor: "white",
  width: "90%",
  maxWidth: "450px",
  borderRadius: "16px",
  padding: "24px",
  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  animation: "fadeIn 0.3s ease-out",
};

const header = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "10px",
  borderBottom: "1px solid #f0f0f0",
  paddingBottom: "12px",
};

const closeBtn = {
  background: "none",
  border: "none",
  fontSize: "1.5rem",
  cursor: "pointer",
  color: "#9ca3af",
  transition: "color 0.2s",
};

const listContainer = {
  maxHeight: "300px",
  overflowY: "auto",
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  marginTop: "10px",
};

const listItem = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "12px",
  backgroundColor: "#f8fafc",
  borderRadius: "10px",
  border: "1px solid #e2e8f0",
};

const timeBadge = {
  backgroundColor: "#dbeafe",
  color: "#1e40af",
  padding: "6px 10px",
  borderRadius: "8px",
  fontSize: "0.85rem",
  fontWeight: "700",
  whiteSpace: "nowrap",
  fontVariantNumeric: "tabular-nums",
};

const primaryBtn = {
  width: "100%",
  padding: "12px",
  backgroundColor: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: "10px",
  fontSize: "1rem",
  fontWeight: "600",
  cursor: "pointer",
  marginTop: "16px",
  transition: "background-color 0.2s",
};