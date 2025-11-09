import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

export default function ActivityBoard() {
  const { role, user, studentProfile } = useAuth();
  const [events, setEvents] = useState([]);
  const [joining, setJoining] = useState(null);
  const [err, setErr] = useState("");

  const myDept = studentProfile?.department || null;

  const canSee = (e) => {
    if (role === "admin" || role === "activity_maker") return true;
    if (role === "student") {
      return e.for_department === null || e.for_department === myDept;
    }
    // guest: เห็นเฉพาะ public
    return e.for_department === null;
  };

  const canJoin = (e) => {
    if (role === "student") {
      return e.for_department === null || e.for_department === myDept;
    }
    // guest/activity_maker/admin: ไม่ให้ join (ตามเงื่อนไขที่ขอ)
    return false;
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      setErr("");
      const { data, error } = await supabase
        .from("Event")
        .select("event_id, name, detail, start_event, end_event, activity_hour, for_department, maker_id")
        .order("start_event", { ascending: true });
      if (!mounted) return;
      if (error) setErr(error.message);
      else setEvents((data || []).filter(canSee));
    })();
    return () => { mounted = false; };
  }, [role, myDept]);

  const joinEvent = async (e) => {
    if (!canJoin(e)) return;
    setJoining(e.event_id);
    setErr("");

    const { error } = await supabase
      .from("JoinEvent")
      .insert({ student_id: user.id, event_id: e.event_id });

    setJoining(null);
    if (error) setErr(error.message);
    else alert("เข้าร่วมกิจกรรมแล้ว 🎉");
  };

  return (
    <div>
      <h1>Activity board</h1>
      {err && <div style={{ background:"#ffecef", border:"1px solid #ffb7c1", padding:10, borderRadius:8, margin:"12px 0" }}>{err}</div>}
      <ul style={{ listStyle:"none", padding:0 }}>
        {events.map(e => (
          <li key={e.event_id} style={{ border:"1px solid #e5e7eb", borderRadius:12, padding:16, marginBottom:12 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:12 }}>
              <div>
                <div style={{ fontSize:"1.1rem", fontWeight:700 }}>{e.name}</div>
                <div style={{ color:"#666" }}>{e.detail}</div>
                <div style={{ marginTop:6, fontSize:14, color:"#555" }}>
                  {e.for_department ? `สำหรับภาค: ${e.for_department}` : "เปิดทั่วไป (Public)"}
                </div>
              </div>
              <div>
                <button
                  disabled={!canJoin(e) || joining === e.event_id}
                  onClick={() => joinEvent(e)}
                  title={!canJoin(e) ? "เฉพาะนักศึกษาที่สิทธิ์ตรงเท่านั้น" : ""}
                  style={{
                    padding:"8px 12px",
                    borderRadius:8,
                    border:"1px solid #ccc",
                    background: !canJoin(e) ? "#f3f4f6" : "#2563eb",
                    color: !canJoin(e) ? "#999" : "#fff",
                    cursor: !canJoin(e) ? "not-allowed" : "pointer",
                    fontWeight:600
                  }}
                >
                  {joining === e.event_id ? "Joining..." : "Join"}
                </button>
              </div>
            </div>
          </li>
        ))}
        {events.length === 0 && (
          <li style={{ color:"#777" }}>ยังไม่มีกิจกรรมที่คุณสามารถเห็นได้</li>
        )}
      </ul>
    </div>
  );
}
