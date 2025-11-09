// src/pages/CalendarPage.jsx
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

export default function CalendarPage() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  const load = async () => {
    setLoading(true);

    // ดึงเฉพาะกิจกรรมที่เราเป็นเจ้าของก่อน (ภายหลังค่อยขยายเป็นสมาชิกได้)
    const { data, error } = await supabase
      .from("Activity")
      .select("*")
      .eq("student_id", user.id)
      .order("start", { ascending: true });

    if (!error) setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const addEvent = async () => {
    const name = prompt("ชื่อกิจกรรม:");
    if (!name) return;
    const description = prompt("รายละเอียด (ใส่ก็ได้):") || null;
    const start = prompt("เริ่ม (ISO เช่น 2025-11-10T10:00:00+07:00):");
    if (!start) return;
    const end = prompt("สิ้นสุด (ISO หรือเว้นว่าง):") || null;

    const { error } = await supabase.from("Activity").insert({
      name,
      description,
      start,
      end,
      student_id: user.id,
    });
    if (error) alert(error.message);
    await load();
  };

  const editEvent = async (ev) => {
    const name = prompt("ชื่อกิจกรรม:", ev.name);
    if (!name) return;
    const description = prompt("รายละเอียด:", ev.description || "") || null;
    const start = prompt("เริ่ม (ISO):", ev.start);
    if (!start) return;
    const end = prompt("สิ้นสุด (ISO หรือเว้นว่าง):", ev.end || "") || null;

    const { error } = await supabase
      .from("Activity")
      .update({ name, description, start, end })
      .eq("id", ev.id)
      .eq("student_id", user.id); // กันแก้ของคนอื่น
    if (error) alert(error.message);
    await load();
  };

  const deleteEvent = async (ev) => {
    if (!confirm(`ลบกิจกรรม "${ev.name}" ?`)) return;
    const { error } = await supabase
      .from("Activity")
      .delete()
      .eq("id", ev.id)
      .eq("student_id", user.id);
    if (error) alert(error.message);
    await load();
  };

  return (
    <section className="page">
      <h1 className="page-title">My Calendar</h1>

      <button className="chip mt" onClick={addEvent}>+ เพิ่มกิจกรรมส่วนตัว</button>

      {loading ? (
        <p className="mt">กำลังโหลด...</p>
      ) : (
        <div className="card-list mt">
          {items.map((ev) => (
            <div className="card" key={ev.id}>
              <div className="card-title">{ev.name}</div>
              <div className="muted">
                {ev.start ? new Date(ev.start).toLocaleString() : "-"}
                {ev.end ? ` → ${new Date(ev.end).toLocaleString()}` : ""}
              </div>
              {ev.description && <div className="mt">{ev.description}</div>}
              <div className="mt">
                <button className="chip" onClick={() => editEvent(ev)}>แก้ไข</button>
                <button className="chip" onClick={() => deleteEvent(ev)}>ลบ</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
