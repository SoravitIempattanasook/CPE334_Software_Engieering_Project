import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  Modal,
  Input,
  DatePicker,
  TimePicker,
  Checkbox,
  Select,
  message,
  Button,
  Divider,
  Popconfirm,
} from "antd";
import dayjs from "dayjs";
import "dayjs/locale/th";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

dayjs.locale("th");

export default function CalendarPage() {
  const { user, role } = useAuth();
  const [events, setEvents] = useState([]);
  const [todayEvents, setTodayEvents] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModal, setDetailModal] = useState(null);
  const [typeModal, setTypeModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [types, setTypes] = useState([]);

  const [form, setForm] = useState({
    name: "",
    description: "",
    startDate: dayjs(),
    endDate: dayjs(),
    startTime: dayjs("09:00", "HH:mm"),
    endTime: dayjs("10:00", "HH:mm"),
    allDay: false,
    type_id: null,
  });

  const [newType, setNewType] = useState({
    name: "",
    color: "#3b82f6",
  });

  // 🇹🇭 วันหยุดไทย
  const thaiHolidays = [
    { title: "วันขึ้นปีใหม่", start: "2025-01-01", color: "#f43f5e", allDay: true },
    { title: "วันสงกรานต์", start: "2025-04-13", end: "2025-04-15", color: "#22c55e", allDay: true },
    { title: "วันแรงงานแห่งชาติ", start: "2025-05-01", color: "#3b82f6", allDay: true },
    { title: "วันแม่แห่งชาติ", start: "2025-08-12", color: "#60a5fa", allDay: true },
    { title: "วันพ่อแห่งชาติ", start: "2025-12-05", color: "#f59e0b", allDay: true },
    { title: "วันคริสต์มาส", start: "2025-12-25", color: "#84cc16", allDay: true },
  ];

  // โหลดประเภทกิจกรรม
  const loadTypes = async () => {
    const { data, error } = await supabase.from("ActivityType").select("*").eq("user_id", user.id);
    if (!error) setTypes(data || []);
  };

  // โหลดกิจกรรมทั้งหมด
 const loadUserEvents = async () => {
  const { data, error } = await supabase
    .from("Activity")
    .select("id, name, description, start_time, end_time, all_day, ActivityType(color, name)")
    // ✅ ดึงกิจกรรมที่เราเป็น student หรือเราเป็นผู้สร้าง
    .or(`student_id.eq.${user.id},created_by.eq.${user.id}`)
    .order("start_time", { ascending: true });

  if (error) {
    console.error("Supabase error:", error);
    message.error("โหลดกิจกรรมไม่ได้: " + error.message);
    return [];
  }

  return (data || []).map((ev) => ({
    id: String(ev.id),                    // ป้องกัน “2a”
    title: ev.name?.trim() || "กิจกรรม",
    start: ev.start_time,
    end: ev.end_time,
    allDay: ev.all_day,
    description: ev.description,
    color: ev.ActivityType?.color || "#2563eb",
    typeName: ev.ActivityType?.name || "ทั่วไป",
  }));
};


  // โหลดข้อมูลทั้งหมด
  const loadEvents = async () => {
    const userEvents = await loadUserEvents();
    setEvents([...userEvents, ...thaiHolidays]);
  };

  useEffect(() => {
    if (user) {
      loadEvents();
      loadTypes();
    }
  }, [user]);

  // 📅 แสดงกิจกรรมของวันปัจจุบัน
  useEffect(() => {
    const today = dayjs().format("YYYY-MM-DD");
    setTodayEvents(events.filter((ev) => dayjs(ev.start).format("YYYY-MM-DD") === today));
  }, [events]);

  // 🗓 คลิกวันที่เพื่อเพิ่มกิจกรรม
  const handleDateClick = (info) => {
    if (role === "guest") {
      message.warning("Guest ไม่สามารถเพิ่มกิจกรรมได้ ❌");
      return;
    }

    const clickedDate = dayjs(info.dateStr);
    setForm({
      name: "",
      description: "",
      startDate: clickedDate,
      endDate: clickedDate,
      startTime: dayjs("09:00", "HH:mm"),
      endTime: dayjs("10:00", "HH:mm"),
      allDay: false,
      type_id: null,
    });
    setModalOpen(true);
  };

  // 💾 เพิ่มกิจกรรมใหม่
  const handleAddEvent = async () => {
  if (!form.name) return message.warning("กรุณากรอกชื่อกิจกรรม");

  let start, end;
  if (form.allDay) {
    start = form.startDate.startOf("day").toISOString();
    end   = form.endDate.endOf("day").toISOString();
  } else {
    start = form.startDate.hour(form.startTime.hour()).minute(form.startTime.minute()).toISOString();
    end   = form.endDate.hour(form.endTime.hour()).minute(form.endTime.minute()).toISOString();
  }

  // ✅ payload กลาง
  const payload = {
    name: form.name,
    description: form.description,
    start_time: start,
    end_time: end,
    all_day: form.allDay,
    type_id: form.type_id || null,
  };

  // ✅ นักเรียน -> ผูกกับ student_id, role อื่น -> ผูกกับ created_by
  if (role === "student") {
    payload.student_id = user.id;
  } else {
    payload.created_by = user.id;
  }

  setLoading(true);
  const { error } = await supabase.from("Activity").insert(payload);
  setLoading(false);

  if (error) {
    console.error(error);
    message.error("เกิดข้อผิดพลาด: " + error.message);
  } else {
    message.success("เพิ่มกิจกรรมสำเร็จ 🎉");
    setModalOpen(false);
    loadEvents();
  }
};


  // ✏️ แก้ไขกิจกรรม
  const handleEditEvent = async () => {
    if (!detailModal.name) return message.warning("กรุณากรอกชื่อกิจกรรม");
    const { error } = await supabase
      .from("Activity")
      .update({
        name: detailModal.name,
        description: detailModal.description,
      })
      .eq("id", detailModal.id);

    if (error) {
      message.error("แก้ไขไม่สำเร็จ ❌");
    } else {
      message.success("แก้ไขเรียบร้อย ✅");
      setEditMode(false);
      setDetailModal(null);
      loadEvents();
    }
  };

  // 🗑️ ลบกิจกรรม
  const handleDeleteEvent = async () => {
    const { error } = await supabase.from("Activity").delete().eq("id", detailModal.id);
    if (error) message.error("ลบไม่สำเร็จ ❌");
    else {
      message.success("ลบสำเร็จ 🗑️");
      setDetailModal(null);
      loadEvents();
    }
  };

  // 💡 เพิ่มประเภทกิจกรรม
  const handleAddType = async () => {
    if (!newType.name) return message.warning("กรุณากรอกชื่อประเภท");
    const { error } = await supabase.from("ActivityType").insert({
      name: newType.name,
      color: newType.color,
      user_id: user.id,
    });
    if (error) message.error(error.message);
    else {
      message.success("เพิ่มประเภทสำเร็จ ✅");
      setTypeModal(false);
      loadTypes();
    }
  };

  return (
    <section style={{ padding: 20, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <h1 style={{ fontSize: "1.8rem", fontWeight: 600, marginBottom: 20 }}>📅 My Calendar</h1>

      {/* กิจกรรมวันนี้ */}
      <div
        style={{
          width: "90%",
          maxWidth: 900,
          marginBottom: 20,
          padding: 12,
          background: "#f3f4f6",
          borderRadius: 12,
          textAlign: "center",
        }}
      >
        {todayEvents.length > 0 ? (
          <>
            <strong>กิจกรรมวันนี้:</strong> {todayEvents.map((ev) => ev.title).join(", ")}
          </>
        ) : (
          <span>วันนี้ยังไม่มีกิจกรรม 🎈</span>
        )}
      </div>

      {/* ปฏิทิน */}
      <div
        style={{
          maxWidth: 900,
          width: "100%",
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
          padding: 16,
        }}
      >
        <FullCalendar
  plugins={[dayGridPlugin, interactionPlugin]}
  initialView="dayGridMonth"
  dateClick={handleDateClick}
  eventClick={(info) => {
    const e = info.event;
    setDetailModal({
      id: e.id,
      name: e.title,
      title: e.title,
      start: e.start,
      end: e.end,
      description: e.extendedProps.description,
      color: e.backgroundColor,
      typeName: e.extendedProps.typeName,
      allDay: e.allDay,
    });
  }}
  eventContent={(arg) => {
    const bg =
      arg.event.backgroundColor || arg.event.extendedProps?.color || null;
    const title = arg.event.title || "(ไม่มีชื่อ)";

    // ถ้าเป็นอีเวนต์แบบบล็อกที่มีพื้นหลัง (เช่น วันหยุดไทย)
    if (arg.event.allDay && bg) {
      return <div style={{ color: "#fff", fontWeight: 600 }}>{title}</div>;
    }

    // อีเวนต์ปกติใน month view: แสดง "จุดสี" + ชื่อ (เหมือนดีฟอลต์)
    return (
      <div className="fc-event-main" style={{ fontWeight: 500 }}>
        <span
          className="fc-daygrid-event-dot"
          style={{ borderColor: bg || "#3788d8" }}
        />
        <span className="fc-event-title">{title}</span>
      </div>
    );
  }}
  events={events}
  height="80vh"
  nowIndicator={true}
  headerToolbar={{
    left: "prev,next today",
    center: "title",
    right: "dayGridMonth,dayGridWeek,dayGridDay",
  }}
/>


      </div>

      {/* Modal: เพิ่มกิจกรรม */}
      <Modal
        title="📝 สร้างกิจกรรมใหม่"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleAddEvent}
        confirmLoading={loading}
        okText="บันทึก"
      >
        <Input
          placeholder="ชื่อกิจกรรม"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <Input.TextArea
          rows={3}
          placeholder="รายละเอียด"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          style={{ marginTop: 10 }}
        />
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <DatePicker
            value={form.startDate}
            onChange={(d) => setForm({ ...form, startDate: d })}
            format="DD/MM/YYYY"
            style={{ width: "100%" }}
          />
          <DatePicker
            value={form.endDate}
            onChange={(d) => setForm({ ...form, endDate: d })}
            format="DD/MM/YYYY"
            style={{ width: "100%" }}
          />
        </div>
        <Checkbox
          checked={form.allDay}
          onChange={(e) => setForm({ ...form, allDay: e.target.checked })}
          style={{ marginTop: 10 }}
        >
          ทั้งวัน
        </Checkbox>
        {!form.allDay && (
          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            <TimePicker
              format="HH:mm"
              value={form.startTime}
              onChange={(t) => setForm({ ...form, startTime: t })}
              style={{ width: "100%" }}
            />
            <TimePicker
              format="HH:mm"
              value={form.endTime}
              onChange={(t) => setForm({ ...form, endTime: t })}
              style={{ width: "100%" }}
            />
          </div>
        )}
        <Divider />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Select
            placeholder="เลือกประเภท"
            value={form.type_id}
            onChange={(v) => setForm({ ...form, type_id: v })}
            style={{ flex: 1 }}
            options={types.map((t) => ({
              label: (
                <span>
                  <span
                    style={{
                      display: "inline-block",
                      width: 12,
                      height: 12,
                      background: t.color,
                      borderRadius: "50%",
                      marginRight: 8,
                    }}
                  ></span>
                  {t.name}
                </span>
              ),
              value: t.id,
            }))}
          />
          <Button onClick={() => setTypeModal(true)}>+ ประเภท</Button>
        </div>
      </Modal>

      {/* Modal: รายละเอียดกิจกรรม */}
      <Modal
        title="📖 รายละเอียดกิจกรรม"
        open={!!detailModal}
        onCancel={() => {
          setDetailModal(null);
          setEditMode(false);
        }}
        footer={
          editMode
            ? [
                <Button onClick={() => setEditMode(false)}>ยกเลิก</Button>,
                <Button type="primary" onClick={handleEditEvent}>
                  บันทึก
                </Button>,
              ]
            : [
                <Button key="edit" onClick={() => setEditMode(true)}>
                  แก้ไข
                </Button>,
                <Popconfirm title="ลบกิจกรรมนี้?" onConfirm={handleDeleteEvent}>
                  <Button danger>ลบ</Button>
                </Popconfirm>,
                <Button onClick={() => setDetailModal(null)}>ปิด</Button>,
              ]
        }
      >
        {detailModal && !editMode && (
          <div style={{ lineHeight: 1.7 }}>
            <p><strong>ชื่อกิจกรรม:</strong> {detailModal.name}</p>
            <p>
              <strong>ประเภท:</strong>{" "}
              <span
                style={{
                  background: detailModal.color,
                  color: "#fff",
                  padding: "2px 8px",
                  borderRadius: 6,
                }}
              >
                {detailModal.typeName}
              </span>
            </p>
            <p><strong>รายละเอียด:</strong> {detailModal.description || "-"}</p>
            <p>
              <strong>เริ่ม:</strong>{" "}
              {dayjs(detailModal.start).format("DD/MM/YYYY HH:mm")}
            </p>
            <p>
              <strong>สิ้นสุด:</strong>{" "}
              {dayjs(detailModal.end).format("DD/MM/YYYY HH:mm")}
            </p>
            {detailModal.allDay && (
              <p style={{ color: "#16a34a" }}>📅 กิจกรรมนี้เป็นทั้งวัน</p>
            )}
          </div>
        )}

        {editMode && detailModal && (
          <>
            <Input
              value={detailModal.name}
              onChange={(e) =>
                setDetailModal({ ...detailModal, name: e.target.value })
              }
            />
            <Input.TextArea
              rows={3}
              value={detailModal.description}
              onChange={(e) =>
                setDetailModal({ ...detailModal, description: e.target.value })
              }
              style={{ marginTop: 10 }}
            />
          </>
        )}
      </Modal>

      {/* Modal: สร้างประเภท */}
      <Modal
        title="🎨 สร้างประเภทใหม่"
        open={typeModal}
        onCancel={() => setTypeModal(false)}
        onOk={handleAddType}
      >
        <Input
          placeholder="ชื่อประเภท"
          value={newType.name}
          onChange={(e) => setNewType({ ...newType, name: e.target.value })}
          style={{ marginBottom: 10 }}
        />
        <label>เลือกสี:</label>
        <Input
          type="color"
          value={newType.color}
          onChange={(e) => setNewType({ ...newType, color: e.target.value })}
          style={{ width: "100%" }}
        />
      </Modal>
    </section>
  );
}
