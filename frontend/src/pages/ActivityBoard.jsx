import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

export default function ActivityBoard() {
  const { role, user, studentProfile } = useAuth();

  // =============== State ===============
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(null);
  const [err, setErr] = useState("");
  const [joinCounts, setJoinCounts] = useState({});
  const [userJoined, setUserJoined] = useState({});
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState({
    name: "",
    detail: "",
    start_event: "",
    end_event: "",
    activity_hour: 0,
    for_department: "",
    poster_file: null,
  });

  const myDept = studentProfile?.department || null;
  const canCreate = ["activity_maker", "admin"].includes(role);

  // =============== Permission ===============
  const canSee = (e) => {
    if (role === "admin" || role === "activity_maker") return true;
    if (role === "student") {
      return e.for_department === null || e.for_department === myDept;
    }
    return e.for_department === null;
  };

  const canJoin = (e) => {
    if (["student", "activity_maker", "admin"].includes(role)) {
      return e.for_department === null || e.for_department === myDept;
    }
    return false;
  };

  // =============== Fetch Events ===============
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setErr("");
      const { data, error } = await supabase
        .from("Event")
        .select(
          "event_id, name, detail, start_event, end_event, activity_hour, for_department, maker_id, poster_url"
        )
        .order("start_event", { ascending: true });

      if (!mounted) return;
      if (error) {
        setErr(error.message);
        setEvents([]);
      } else {
        setEvents((data || []).filter(canSee));
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [role, myDept]);

  // =============== Fetch Join Counts + User Joined ===============
  useEffect(() => {
    if (events.length === 0) {
      setJoinCounts({});
      setUserJoined({});
      return;
    }

    (async () => {
      const eventIds = events.map((e) => e.event_id);

      const { data, error } = await supabase
        .from("JoinEvent")
        .select("event_id, user_id")
        .in("event_id", eventIds);

      if (error) {
        console.error("Join count error:", error);
        return;
      }

      const counts = {};
      const joinedByUser = {};

      data?.forEach((row) => {
        counts[row.event_id] = (counts[row.event_id] || 0) + 1;
        if (user?.id && row.user_id === user.id) {
          joinedByUser[row.event_id] = true;
        }
      });

      setJoinCounts(counts);
      setUserJoined(joinedByUser);
    })();
  }, [events, user?.id]);

  // =============== Realtime Join Counts ===============
  useEffect(() => {
    const channel = supabase
      .channel("join-event-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "JoinEvent" },
        (payload) => {
          const newRow = payload.new;
          if (!newRow) return;

          const { event_id, user_id } = newRow;

          // update total count realtime
          setJoinCounts((prev) => ({
            ...prev,
            [event_id]: (prev[event_id] || 0) + 1,
          }));

          // mark joined for current user
          if (user?.id && user_id === user.id) {
            setUserJoined((prev) => ({ ...prev, [event_id]: true }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // =============== Sort + Filter Events ===============
  // เรียงตาม start_event จากใกล้ถึงก่อน และ "ไม่แสดงกิจกรรมที่ผ่านไปแล้ว"
  // กำหนดว่ากิจกรรมที่ผ่านไปแล้ว = end_event < ตอนนี้
  const sortedEvents = useMemo(() => {
    if (!events || events.length === 0) return [];
    const now = new Date();

    return events
      .filter((e) => {
        const end = e.end_event ? new Date(e.end_event) : null;
        // แสดงเฉพาะกิจกรรมที่ยังไม่สิ้นสุด (หรือไม่มี end_event)
        return !end || end >= now;
      })
      .sort(
        (a, b) =>
          new Date(a.start_event).getTime() - new Date(b.start_event).getTime()
      );
  }, [events]);

  // =============== Join Event ===============
  const joinEvent = async (e) => {
    if (!canJoin(e)) return;
    if (!user?.id) {
      alert("กรุณาเข้าสู่ระบบก่อน");
      return;
    }

    // กันการกดซ้ำถ้า state บอกว่า join แล้ว
    if (userJoined[e.event_id]) {
      alert("คุณเข้าร่วมกิจกรรมนี้แล้ว");
      return;
    }

    setJoining(e.event_id);
    setErr("");

    const { data: exist, error: existErr } = await supabase
      .from("JoinEvent")
      .select("user_id")
      .eq("user_id", user.id)
      .eq("event_id", e.event_id)
      .maybeSingle();

    if (existErr) {
      setErr(existErr.message);
      setJoining(null);
      return;
    }

    if (exist && exist.user_id) {
      alert("คุณเข้าร่วมกิจกรรมนี้แล้ว");
      setUserJoined((prev) => ({ ...prev, [e.event_id]: true }));
      setJoining(null);
      return;
    }

    const { error } = await supabase
      .from("JoinEvent")
      .insert({ user_id: user.id, event_id: e.event_id });

    setJoining(null);
    if (error) {
      setErr(error.message);
    } else {
      alert("เข้าร่วมกิจกรรมแล้ว 🎉");
      // ปิดปุ่มทันทีฝั่ง client
      setUserJoined((prev) => ({ ...prev, [e.event_id]: true }));
      // joinCounts จะอัปเดตจาก realtime subscription
    }
  };

  // =============== Create Activity ===============
  const onChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "poster_file") {
      setForm((f) => ({ ...f, poster_file: files?.[0] || null }));
    } else if (name === "activity_hour") {
      setForm((f) => ({ ...f, activity_hour: Number(value || 0) }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const resetForm = () =>
    setForm({
      name: "",
      detail: "",
      start_event: "",
      end_event: "",
      activity_hour: 0,
      for_department: "",
      poster_file: null,
    });

  const uploadPoster = async (file) => {
    if (!file) return { url: null, path: null };
    const ext = file.name.split(".").pop();
    const filePath = `${user?.id || "anon"}/${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage
      .from("posters")
      .upload(filePath, file, { upsert: false });
    if (uploadErr) throw uploadErr;
    const { data } = supabase.storage.from("posters").getPublicUrl(filePath);
    return { url: data.publicUrl || null, path: filePath };
  };

  const handleCreate = async (e) => {
    e?.preventDefault?.();
    if (!canCreate) return;
    if (!form.name || !form.start_event || !form.end_event) {
      alert("กรุณากรอกชื่อกิจกรรม และช่วงวันเวลาให้ครบถ้วน");
      return;
    }

    setCreating(true);
    setErr("");

    try {
      let poster_url = null;
      if (form.poster_file) {
        const { url } = await uploadPoster(form.poster_file);
        poster_url = url;
      }

      const payload = {
        name: form.name,
        detail: form.detail || null,
        start_event: form.start_event,
        end_event: form.end_event,
        activity_hour: form.activity_hour || 0,
        for_department: form.for_department || null,
        maker_id: user?.id || null,
        poster_url,
      };

      const { data, error } = await supabase
        .from("Event")
        .insert(payload)
        .select();
      if (error) throw error;

      setEvents((prev) => [...(prev || []), ...(data || [])].filter(canSee));
      alert("สร้างกิจกรรมสำเร็จ ✨");
      resetForm();
      setOpen(false);
    } catch (err) {
      console.error(err);
      setErr(err.message || String(err));
    } finally {
      setCreating(false);
    }
  };

  // =============== UI ===============
  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ fontSize: "1.6rem", marginBottom: 16 }}>📋 Activity Board</h1>

      {canCreate && (
        <div style={{ marginBottom: 16 }}>
          <button
            onClick={() => setOpen(true)}
            style={{
              padding: "10px 16px",
              borderRadius: 10,
              background: "#16a34a",
              color: "#fff",
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
            }}
          >
            + สร้างกิจกรรมใหม่
          </button>
        </div>
      )}

      {err && (
        <div
          style={{
            background: "#ffecef",
            border: "1px solid #ffb7c1",
            padding: 10,
            borderRadius: 8,
            margin: "12px 0",
          }}
        >
          {err}
        </div>
      )}

      {loading ? (
        <div style={{ color: "#777" }}>กำลังโหลดกิจกรรม…</div>
      ) : sortedEvents && sortedEvents.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 16,
          }}
        >
          {sortedEvents.map((e) => (
            <PosterCard
              key={e.event_id}
              ev={e}
              canJoin={canJoin(e)}
              joining={joining === e.event_id}
              onJoin={() => joinEvent(e)}
              joinCount={joinCounts[e.event_id] || 0}
              hasJoined={!!userJoined[e.event_id]}
            />
          ))}
        </div>
      ) : (
        <div style={{ color: "#777", marginTop: 8 }}>
          ยังไม่มีกิจกรรมที่คุณสามารถเห็นได้
        </div>
      )}

      {open && (
        <CreateEventModal
          form={form}
          onChange={onChange}
          onSubmit={handleCreate}
          creating={creating}
          onClose={() => {
            setOpen(false);
            resetForm();
          }}
        />
      )}
    </div>
  );
}

// =============== PosterCard ===============
function PosterCard({ ev, canJoin, joining, onJoin, joinCount, hasJoined }) {
  const start = ev.start_event ? new Date(ev.start_event) : null;
  const end = ev.end_event ? new Date(ev.end_event) : null;
  const dformat = (d) =>
    d?.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }) || "-";

  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        background: "#fff",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
        minHeight: 320,
      }}
    >
      <div
        style={{ position: "relative", aspectRatio: "3 / 4", background: "#f1f5f9" }}
      >
        {ev.poster_url ? (
          <img
            src={ev.poster_url}
            alt={ev.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              color: "#64748b",
              fontWeight: 700,
            }}
          >
            ไม่มีโปสเตอร์
          </div>
        )}
        <div style={{ position: "absolute", bottom: 8, right: 8 }}>
          {hasJoined ? (
            <div
              style={{
                padding: "6px 10px",
                borderRadius: 999,
                background: "#dcfce7",
                color: "#166534",
                fontWeight: 700,
                border: "1px solid #bbf7d0",
                fontSize: 12,
              }}
            >
              ✅ คุณเข้าร่วมแล้ว
            </div>
          ) : (
            <button
              onClick={onJoin}
              disabled={!canJoin || joining}
              title={
                canJoin ? "เข้าร่วมกิจกรรมนี้" : "เฉพาะนักศึกษาที่มีสิทธิ์เท่านั้น"
              }
              style={{
                padding: "8px 12px",
                borderRadius: 999,
                border: "1px solid #e2e8f0",
                background: canJoin ? "#2563eb" : "#f1f5f9",
                color: canJoin ? "#fff" : "#94a3b8",
                cursor: canJoin ? "pointer" : "not-allowed",
                fontWeight: 700,
                boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
              }}
            >
              {joining ? "Joining…" : "Join"}
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: 12, display: "grid", gap: 6 }}>
        <div style={{ fontWeight: 800, fontSize: 16 }}>{ev.name}</div>
        <div style={{ color: "#475569", fontSize: 14 }}>{ev.detail || "-"}</div>
        <div style={{ color: "#0f172a", fontSize: 13 }}>
          <b>เริ่ม:</b> {dformat(start)}
        </div>
        <div style={{ color: "#0f172a", fontSize: 13 }}>
          <b>สิ้นสุด:</b> {dformat(end)}
        </div>
        <div style={{ color: "#334155", fontSize: 12 }}>
          {ev.for_department ? `สำหรับภาค: ${ev.for_department}` : "เปิดทั่วไป (Public)"}
        </div>
        <div style={{ color: "#1e293b", fontSize: 13 }}>
          👥 ผู้เข้าร่วม: {joinCount} คน
        </div>
      </div>
    </div>
  );
}

// =============== CreateEventModal ===============
function CreateEventModal({ form, onChange, onSubmit, creating, onClose }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 50,
      }}
    >
      {/* modal container */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(720px, 96vw)",
          background: "#fff",
          borderRadius: 16,
          border: "1px solid #e5e7eb",
          boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
        }}
      >
        {/* modal header */}
        <div style={{ padding: 16, borderBottom: "1px solid #eee" }}>
          <div style={{ fontSize: 18, fontWeight: 800 }}>สร้างกิจกรรมใหม่</div>
        </div>

        {/* form */}
        <form onSubmit={onSubmit} style={{ padding: 16 }}>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          >
            {/* left column */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <label style={{ fontWeight: 700 }}>ชื่อกิจกรรม *</label>
              <input
                name="name"
                value={form.name}
                onChange={onChange}
                placeholder="เช่น ค่ายอาสา..."
                style={inputStyle}
                required
              />

              <label style={{ fontWeight: 700 }}>รายละเอียด</label>
              <textarea
                name="detail"
                value={form.detail}
                onChange={onChange}
                placeholder="คำอธิบายกิจกรรมโดยย่อ"
                style={{ ...inputStyle, minHeight: 100 }}
              />

              <label style={{ fontWeight: 700 }}>ชั่วโมงกิจกรรม</label>
              <input
                name="activity_hour"
                type="number"
                min={0}
                value={form.activity_hour}
                onChange={onChange}
                style={inputStyle}
              />

              <label style={{ fontWeight: 700 }}>
                สำหรับภาค (ปล่อยว่าง = Public)
              </label>
              <input
                name="for_department"
                value={form.for_department}
                onChange={onChange}
                placeholder="เช่น Nursing, Pharmacy..."
                style={inputStyle}
              />
            </div>

            {/* right column */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <label style={{ fontWeight: 700 }}>วัน/เวลาเริ่ม *</label>
              <input
                type="datetime-local"
                name="start_event"
                value={form.start_event}
                onChange={onChange}
                style={inputStyle}
                required
              />

              <label style={{ fontWeight: 700 }}>วัน/เวลาสิ้นสุด *</label>
              <input
                type="datetime-local"
                name="end_event"
                value={form.end_event}
                onChange={onChange}
                style={inputStyle}
                required
              />

              <label style={{ fontWeight: 700 }}>
                โปสเตอร์กิจกรรม (แนะนำ 3:4)
              </label>
              <input
                type="file"
                name="poster_file"
                accept="image/*"
                onChange={onChange}
                style={inputStyle}
              />

              {form.poster_file && (
                <div
                  style={{
                    border: "1px dashed #cbd5e1",
                    borderRadius: 12,
                    padding: 8,
                    display: "grid",
                    placeItems: "center",
                    overflow: "hidden",
                  }}
                >
                  <img
                    src={URL.createObjectURL(form.poster_file)}
                    alt="preview"
                    style={{
                      maxHeight: 260,
                      width: "100%",
                      objectFit: "contain",
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* footer buttons */}
          <div
            style={{
              display: "flex",
              gap: 8,
              justifyContent: "flex-end",
              marginTop: 16,
            }}
          >
            <button type="button" onClick={onClose} style={btnSecondary}>
              ยกเลิก
            </button>
            <button type="submit" disabled={creating} style={btnPrimary}>
              {creating && "กำลังบันทึก..."}
              {!creating && "บันทึกกิจกรรม"}
            </button>
          </div>
        </form>
        {/* end form */}
      </div>
      {/* end modal container */}
    </div>
  );
}

// =============== Styles ===============
const inputStyle = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  outline: "none",
};

const btnPrimary = {
  padding: "10px 16px",
  borderRadius: 10,
  background: "#2563eb",
  color: "#fff",
  fontWeight: 800,
  border: "none",
  cursor: "pointer",
};

const btnSecondary = {
  padding: "10px 16px",
  borderRadius: 10,
  background: "#f1f5f9",
  color: "#0f172a",
  fontWeight: 700,
  border: "1px solid #e2e8f0",
  cursor: "pointer",
};
