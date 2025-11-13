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

  // ฟอร์มตอน "สร้างกิจกรรม"
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

  // ฟอร์มตอน "แก้ไขกิจกรรม"
  const [editForm, setEditForm] = useState({
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
    const { data, error } = await supabase
      .from("ActivityType")
      .select("*")
      .eq("user_id", user.id);

    if (error) {
      console.error(error);
      message.error("โหลดประเภทกิจกรรมไม่สำเร็จ");
      return;
    }
    setTypes(data || []);
  };

  // โหลดกิจกรรมทั้งหมดของ user
  const loadUserEvents = async () => {
    const { data, error } = await supabase
      .from("Activity")
      .select(
        "id, name, description, start_time, end_time, all_day, type_id, ActivityType(color, name)"
      )
      .or(`student_id.eq.${user.id},created_by.eq.${user.id}`)
      .order("start_time", { ascending: true });

    if (error) {
      console.error("Supabase error:", error);
      message.error("โหลดกิจกรรมไม่ได้: " + error.message);
      return [];
    }

    return (data || []).map((ev) => {
      const startRaw = ev.start_time || null;
      const endRaw = ev.end_time || null;

      const startDateObj = startRaw ? dayjs(startRaw).toDate() : null;

      // เวลาไว้โชว์ใน modal (สิ้นสุดจริง)
      let endModal = endRaw ? dayjs(endRaw).toDate() : null;
      if (!endModal && startDateObj) {
        const d = new Date(startDateObj);
        d.setHours(23, 59, 0, 0);
        endModal = d;
      }

      // เวลาให้ FullCalendar ใช้วาดแทบ (all-day ใช้ end แบบ exclusive: +1 วัน)
      let endForCalendar = endModal;
      if (ev.all_day && endModal) {
        endForCalendar = dayjs(endModal).add(1, "day").startOf("day").toDate();
      }

      return {
        id: String(ev.id),
        title: ev.name?.trim() || "กิจกรรม",
        start: startDateObj,
        end: endForCalendar,
        allDay: ev.all_day,
        description: ev.description,
        color: ev.ActivityType?.color || "#2563eb",
        typeName: ev.ActivityType?.name || "ทั่วไป",
        typeId: ev.type_id || null,
        startRaw,
        endRaw,
      };
    });
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
    setTodayEvents(
      events.filter(
        (ev) => ev.start && dayjs(ev.start).format("YYYY-MM-DD") === today
      )
    );
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

  // helper: แปลงฟอร์ม -> start/end string (local time)
  const buildStartEndFromForm = (frm) => {
    let start;
    let end;

    if (frm.allDay) {
      // ทั้งวัน: 00:00 - 23:59 ของช่วงวันนั้น
      start = frm.startDate
        .hour(0)
        .minute(0)
        .second(0)
        .millisecond(0)
        .format("YYYY-MM-DD HH:mm:ss");

      end = frm.endDate
        .hour(23)
        .minute(59)
        .second(0)
        .millisecond(0)
        .format("YYYY-MM-DD HH:mm:ss");
    } else {
      // ไม่ทั้งวัน: ใช้เวลาจาก TimePicker
      start = frm.startDate
        .hour(frm.startTime.hour())
        .minute(frm.startTime.minute())
        .second(0)
        .millisecond(0)
        .format("YYYY-MM-DD HH:mm:ss");

      end = frm.endDate
        .hour(frm.endTime.hour())
        .minute(frm.endTime.minute())
        .second(0)
        .millisecond(0)
        .format("YYYY-MM-DD HH:mm:ss");
    }

    return { start, end };
  };

  // 💾 เพิ่มกิจกรรมใหม่
  const handleAddEvent = async () => {
    if (!form.name) return message.warning("กรุณากรอกชื่อกิจกรรม");

    const { start, end } = buildStartEndFromForm(form);

    const payload = {
      name: form.name,
      description: form.description,
      start_time: start,
      end_time: end,
      all_day: form.allDay,
      type_id: form.type_id || null,
    };

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

  // เริ่มเข้าโหมดแก้ไข -> เตรียม editForm ให้เหมือนตอนสร้าง
  const startEdit = () => {
    if (!detailModal) return;

    const start = detailModal.start ? dayjs(detailModal.start) : dayjs();
    const end = detailModal.end ? dayjs(detailModal.end) : start;
    const isAllDay = !!detailModal.allDay;

    setEditForm({
      name: detailModal.name,
      description: detailModal.description || "",
      startDate: start,
      endDate: end,
      startTime: isAllDay ? dayjs("00:00", "HH:mm") : start,
      endTime: isAllDay ? dayjs("23:59", "HH:mm") : end,
      allDay: isAllDay,
      type_id: detailModal.typeId || null,
    });
    setEditMode(true);
  };

  // ✏️ แก้ไขกิจกรรม (ครบทุกฟิลด์เหมือนตอนสร้าง)
  const handleEditEvent = async () => {
    if (!editForm?.name) return message.warning("กรุณากรอกชื่อกิจกรรม");

    const { start, end } = buildStartEndFromForm(editForm);

    const { error } = await supabase
      .from("Activity")
      .update({
        name: editForm.name,
        description: editForm.description,
        start_time: start,
        end_time: end,
        all_day: editForm.allDay,
        type_id: editForm.type_id || null,
      })
      .eq("id", detailModal.id);

    if (error) {
      console.error(error);
      message.error("แก้ไขไม่สำเร็จ ❌");
    } else {
      message.success("แก้ไขเรียบร้อย ✅");
      setEditMode(false);
      setEditForm({
        name: "",
        description: "",
        startDate: dayjs(),
        endDate: dayjs(),
        startTime: dayjs("09:00", "HH:mm"),
        endTime: dayjs("10:00", "HH:mm"),
        allDay: false,
        type_id: null,
      });
      setDetailModal(null);
      loadEvents();
    }
  };

  // 🗑️ ลบกิจกรรม
  const handleDeleteEvent = async () => {
    const { error } = await supabase
      .from("Activity")
      .delete()
      .eq("id", detailModal.id);

    if (error) {
      message.error("ลบไม่สำเร็จ ❌");
    } else {
      message.success("ลบสำเร็จ 🗑️");
      setDetailModal(null);
      setEditMode(false);
      setEditForm({
        name: "",
        description: "",
        startDate: dayjs(),
        endDate: dayjs(),
        startTime: dayjs("09:00", "HH:mm"),
        endTime: dayjs("10:00", "HH:mm"),
        allDay: false,
        type_id: null,
      });
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
    if (error) {
      console.error(error);
      message.error("เพิ่มประเภทไม่สำเร็จ: " + error.message);
    } else {
      message.success("เพิ่มประเภทสำเร็จ ✅");
      setNewType({ name: "", color: "#3b82f6" });
      loadTypes();
    }
  };

  // ❌ ลบประเภทกิจกรรม
  const handleDeleteType = async (id, name) => {
    const { error } = await supabase
      .from("ActivityType")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error(error);
      // ถ้ามี foreign key (ถูกใช้ใน Activity) จะลบไม่ได้
      if (
        error.message?.toLowerCase().includes("foreign key") ||
        error.message?.toLowerCase().includes("violates")
      ) {
        message.error(
          "ลบประเภทไม่ได้ เพราะมีการใช้งานในกิจกรรมอยู่ กรุณาเปลี่ยนประเภทของกิจกรรมก่อน"
        );
      } else {
        message.error("ลบประเภทไม่สำเร็จ: " + error.message);
      }
    } else {
      message.success(`ลบประเภท "${name}" สำเร็จ`);
      // ถ้าแบบฟอร์มเลือก type นี้อยู่ ให้เคลียร์ออก
      setForm((f) => (f.type_id === id ? { ...f, type_id: null } : f));
      setEditForm((f) =>
        f.type_id === id ? { ...f, type_id: null } : f
      );
      loadTypes();
    }
  };

  // options ของประเภท (ให้ Select แสดงแค่จุดสี + ชื่อ)
  const typeOptions = types.map((t) => ({
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
        />
        {t.name}
      </span>
    ),
    value: t.id,
    color: t.color,
    name: t.name,
  }));

  return (
    <section
      style={{
        padding: 20,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <h1 style={{ fontSize: "1.8rem", fontWeight: 600, marginBottom: 20 }}>
        📅 My Calendar
      </h1>

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
            <strong>กิจกรรมวันนี้:</strong>{" "}
            {todayEvents.map((ev) => ev.title).join(", ")}
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
            const props = e.extendedProps || {};

            const startFromRaw = props.startRaw
              ? dayjs(props.startRaw)
              : e.start
              ? dayjs(e.start)
              : null;

            let endFromRaw = null;
            if (props.endRaw) {
              endFromRaw = dayjs(props.endRaw);
            } else if (e.end) {
              endFromRaw = dayjs(e.end);
            } else if (e.allDay && e.start) {
              endFromRaw = dayjs(e.start).endOf("day");
            }

            setDetailModal({
              id: e.id,
              name: e.title,
              title: e.title,
              start: startFromRaw ? startFromRaw.toDate() : null,
              end: endFromRaw ? endFromRaw.toDate() : null,
              description: props.description,
              color: e.backgroundColor,
              typeName: props.typeName,
              typeId: props.typeId,
              allDay: e.allDay,
            });
            setEditMode(false);
            setEditForm({
              name: "",
              description: "",
              startDate: dayjs(),
              endDate: dayjs(),
              startTime: dayjs("09:00", "HH:mm"),
              endTime: dayjs("10:00", "HH:mm"),
              allDay: false,
              type_id: null,
            });
          }}
          eventContent={(arg) => {
            const bg =
              arg.event.backgroundColor || arg.event.extendedProps?.color || null;
            const title = arg.event.title || "(ไม่มีชื่อ)";

            if (arg.event.allDay && bg) {
              return (
                <div style={{ color: "#fff", fontWeight: 600 }}>{title}</div>
              );
            }

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
          onChange={(e) => {
            const checked = e.target.checked;
            if (checked) {
              setForm({
                ...form,
                allDay: true,
                startTime: dayjs("00:00", "HH:mm"),
                endTime: dayjs("23:59", "HH:mm"),
              });
            } else {
              setForm({
                ...form,
                allDay: false,
                startTime: dayjs("09:00", "HH:mm"),
                endTime: dayjs("10:00", "HH:mm"),
              });
            }
          }}
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
          options={typeOptions}
          />
          <Button onClick={() => setTypeModal(true)}>จัดการประเภท</Button>
        </div>
      </Modal>

      {/* Modal: รายละเอียด / แก้ไขกิจกรรม */}
      <Modal
        title="📖 รายละเอียดกิจกรรม"
        open={!!detailModal}
        onCancel={() => {
          setDetailModal(null);
          setEditMode(false);
          setEditForm({
            name: "",
            description: "",
            startDate: dayjs(),
            endDate: dayjs(),
            startTime: dayjs("09:00", "HH:mm"),
            endTime: dayjs("10:00", "HH:mm"),
            allDay: false,
            type_id: null,
          });
        }}
        footer={
          editMode
            ? [
                <Button
                  key="cancel-edit"
                  onClick={() => {
                    setEditMode(false);
                  }}
                >
                  ยกเลิก
                </Button>,
                <Button key="save" type="primary" onClick={handleEditEvent}>
                  บันทึก
                </Button>,
              ]
            : [
                <Button key="edit" onClick={startEdit}>
                  แก้ไข
                </Button>,
                <Popconfirm
                  key="delete"
                  title="ลบกิจกรรมนี้?"
                  onConfirm={handleDeleteEvent}
                >
                  <Button danger>ลบ</Button>
                </Popconfirm>,
                <Button
                  key="close"
                  onClick={() => {
                    setDetailModal(null);
                    setEditMode(false);
                  }}
                >
                  ปิด
                </Button>,
              ]
        }
      >
        {/* โหมดดูรายละเอียด */}
        {detailModal && !editMode && (
          <div style={{ lineHeight: 1.7 }}>
            <p>
              <strong>ชื่อกิจกรรม:</strong> {detailModal.name}
            </p>
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
                {detailModal.typeName || "ทั่วไป"}
              </span>
            </p>
            <p>
              <strong>รายละเอียด:</strong> {detailModal.description || "-"}
            </p>
            <p>
              <strong>เริ่ม:</strong>{" "}
              {detailModal.start
                ? dayjs(detailModal.start).format("DD/MM/YYYY HH:mm")
                : "-"}
            </p>
            <p>
              <strong>สิ้นสุด:</strong>{" "}
              {detailModal.end
                ? dayjs(detailModal.end).format("DD/MM/YYYY HH:mm")
                : "-"}
            </p>
            {detailModal.allDay && (
              <p style={{ color: "#16a34a" }}>📅 กิจกรรมนี้เป็นทั้งวัน</p>
            )}
          </div>
        )}

        {/* โหมดแก้ไข (ฟอร์มเหมือนตอนสร้าง) */}
        {editMode && (
          <>
            <Input
              placeholder="ชื่อกิจกรรม"
              value={editForm.name}
              onChange={(e) =>
                setEditForm({ ...editForm, name: e.target.value })
              }
            />
            <Input.TextArea
              rows={3}
              placeholder="รายละเอียด"
              value={editForm.description}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  description: e.target.value,
                })
              }
              style={{ marginTop: 10 }}
            />
            <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
              <DatePicker
                value={editForm.startDate}
                onChange={(d) =>
                  setEditForm({ ...editForm, startDate: d })
                }
                format="DD/MM/YYYY"
                style={{ width: "100%" }}
              />
              <DatePicker
                value={editForm.endDate}
                onChange={(d) =>
                  setEditForm({ ...editForm, endDate: d })
                }
                format="DD/MM/YYYY"
                style={{ width: "100%" }}
              />
            </div>
            <Checkbox
              checked={editForm.allDay}
              onChange={(e) => {
                const checked = e.target.checked;
                if (checked) {
                  setEditForm({
                    ...editForm,
                    allDay: true,
                    startTime: dayjs("00:00", "HH:mm"),
                    endTime: dayjs("23:59", "HH:mm"),
                  });
                } else {
                  setEditForm({
                    ...editForm,
                    allDay: false,
                    startTime: dayjs("09:00", "HH:mm"),
                    endTime: dayjs("10:00", "HH:mm"),
                  });
                }
              }}
              style={{ marginTop: 10 }}
            >
              ทั้งวัน
            </Checkbox>
            {!editForm.allDay && (
              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                <TimePicker
                  format="HH:mm"
                  value={editForm.startTime}
                  onChange={(t) =>
                    setEditForm({ ...editForm, startTime: t })
                  }
                  style={{ width: "100%" }}
                />
                <TimePicker
                  format="HH:mm"
                  value={editForm.endTime}
                  onChange={(t) =>
                    setEditForm({ ...editForm, endTime: t })
                  }
                  style={{ width: "100%" }}
                />
              </div>
            )}
            <Divider />
            <div
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              <Select
                placeholder="เลือกประเภท"
                value={editForm.type_id}
                onChange={(v) =>
                  setEditForm({ ...editForm, type_id: v })
                }
                style={{ flex: 1 }}
                options={typeOptions}
              />
              <Button onClick={() => setTypeModal(true)}>
                จัดการประเภท
              </Button>
            </div>
          </>
        )}
      </Modal>

      {/* Modal: สร้าง/จัดการประเภท */}
      <Modal
        title="🎨 จัดการประเภทกิจกรรม"
        open={typeModal}
        onCancel={() => setTypeModal(false)}
        onOk={() => setTypeModal(false)}
        okText="ปิด"
        cancelButtonProps={{ style: { display: "none" } }}
      >
        <h4>เพิ่มประเภทใหม่</h4>
        <Input
          placeholder="ชื่อประเภท"
          value={newType.name}
          onChange={(e) =>
            setNewType({ ...newType, name: e.target.value })
          }
          style={{ marginBottom: 10 }}
        />
        <label>เลือกสี:</label>
        <Input
          type="color"
          value={newType.color}
          onChange={(e) =>
            setNewType({ ...newType, color: e.target.value })
          }
          style={{ width: "100%", marginBottom: 10 }}
        />
        <Button type="primary" block onClick={handleAddType}>
          + เพิ่มประเภท
        </Button>

        <Divider />

        <h4>ประเภทที่มีอยู่</h4>
        {types.length === 0 && <p style={{ color: "#6b7280" }}>ยังไม่มีประเภท</p>}
        {types.map((t) => (
          <div
            key={t.id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "6px 8px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              marginBottom: 6,
            }}
          >
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
              />
              {t.name}
            </span>
            <Popconfirm
              title="ลบประเภทนี้?"
              okText="ลบ"
              okType="danger"
              cancelText="ยกเลิก"
              onConfirm={() => handleDeleteType(t.id, t.name)}
            >
              <Button danger size="small">
                ลบ
              </Button>
            </Popconfirm>
          </div>
        ))}
      </Modal>
    </section>
  );
}
