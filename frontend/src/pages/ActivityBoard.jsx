import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

export default function ActivityBoard() {
  const { user, role } = useAuth();
  const isAdmin = role === "admin";

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("activity_board_events")
      .select("*")
      .order("date", { ascending: true });
    if (!error) setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const addEvent = async () => {
    if (!(role === "activity_maker" || isAdmin)) return;
    const title = prompt("ชื่อกิจกรรม:");
    if (!title) return;
    const details = prompt("รายละเอียด (ใส่ก็ได้):") || null;
    const date = prompt("วันเวลา (ISO เช่น 2025-11-06T10:00:00+07:00):");
    if (!date) return;

    const { error } = await supabase.from("activity_board_events").insert({
      title,
      details,
      date,
      created_by: user.id,
    });
    if (error) alert(error.message);
    await load();
  };

  const editEvent = async (ev) => {
    const canEdit = isAdmin || (role === "activity_maker" && ev.created_by === user.id);
    if (!canEdit) return;

    const title = prompt("ชื่อกิจกรรม:", ev.title);
    if (!title) return;
    const details = prompt("รายละเอียด:", ev.details || "") || null;
    const date = prompt("วันเวลา (ISO):", ev.date);
    if (!date) return;

    const { error } = await supabase
      .from("activity_board_events")
      .update({ title, details, date })
      .eq("id", ev.id);
    if (error) alert(error.message);
    await load();
  };

  const deleteEvent = async (ev) => {
    const canDelete = isAdmin || (role === "activity_maker" && ev.created_by === user.id);
    if (!canDelete) return;
    if (!confirm(`ลบกิจกรรม "${ev.title}" ?`)) return;
    const { error } = await supabase
      .from("activity_board_events")
      .delete()
      .eq("id", ev.id);
    if (error) alert(error.message);
    await load();
  };

  return (
    <section className="page">
      <h1 className="page-title">Activity Board</h1>

      {(role === "activity_maker" || isAdmin) && (
        <button className="chip mt" onClick={addEvent}>+ เพิ่มกิจกรรม</button>
      )}

      {loading ? (
        <p className="mt">กำลังโหลด...</p>
      ) : (
        <div className="card-list mt">
          {items.map((ev) => {
            const canEditThis =
              isAdmin || (role === "activity_maker" && ev.created_by === user.id);

            return (
              <div className="card" key={ev.id}>
                <div className="card-title">{ev.title}</div>
                <div className="muted">{new Date(ev.date).toLocaleString()}</div>
                {ev.details && <div className="mt">{ev.details}</div>}

                {(role === "student") && (
                  <div className="mt">
                    <button className="chip">เข้าร่วม</button>
                  </div>
                )}

                {canEditThis && (
                  <div className="mt">
                    <button className="chip" onClick={() => editEvent(ev)}>แก้ไข</button>
                    <button className="chip" onClick={() => deleteEvent(ev)}>ลบ</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
