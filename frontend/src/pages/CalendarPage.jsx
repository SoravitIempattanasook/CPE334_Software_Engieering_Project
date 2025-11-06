import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

export default function CalendarPage() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("personal_events")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: true });
    if (!error) setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const addEvent = async () => {
    const title = prompt("ชื่อกิจกรรม:");
    if (!title) return;
    const details = prompt("รายละเอียด (ใส่ก็ได้):") || null;
    const date = prompt("วันเวลา (ISO เช่น 2025-11-06T10:00:00+07:00):");
    if (!date) return;

    const { error } = await supabase.from("personal_events").insert({
      user_id: user.id,
      title,
      details,
      date,
    });
    if (error) alert(error.message);
    await load();
  };

  const editEvent = async (ev) => {
    const title = prompt("ชื่อกิจกรรม:", ev.title);
    if (!title) return;
    const details = prompt("รายละเอียด:", ev.details || "") || null;
    const date = prompt("วันเวลา (ISO):", ev.date);
    if (!date) return;

    const { error } = await supabase
      .from("personal_events")
      .update({ title, details, date })
      .eq("id", ev.id)
      .eq("user_id", user.id); // กันแก้ของคนอื่น
    if (error) alert(error.message);
    await load();
  };

  const deleteEvent = async (ev) => {
    if (!confirm(`ลบกิจกรรม "${ev.title}" ?`)) return;
    const { error } = await supabase
      .from("personal_events")
      .delete()
      .eq("id", ev.id)
      .eq("user_id", user.id);
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
              <div className="card-title">{ev.title}</div>
              <div className="muted">{new Date(ev.date).toLocaleString()}</div>
              {ev.details && <div className="mt">{ev.details}</div>}
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
