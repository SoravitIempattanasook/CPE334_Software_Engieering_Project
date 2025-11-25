import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
// เอา listPlugin และ timeGridPlugin ออกเพื่อลด dependency ที่อาจไม่มี
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
  Tag,
  Card,
  Tooltip,
  Typography,
  Space,
  Empty
} from "antd";
import { CalendarOutlined, ClockCircleOutlined, PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import dayjs from "dayjs";
import "dayjs/locale/th";
// ใช้ path ที่ถูกต้องตามที่คุณแจ้ง
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

dayjs.locale("th");
const { Title, Text } = Typography;

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
    { id: 'th-1', title: "วันขึ้นปีใหม่", start: "2025-01-01", color: "#f43f5e", allDay: true, editable: false, typeName: "วันหยุด" },
    { id: 'th-2', title: "วันสงกรานต์", start: "2025-04-13", end: "2025-04-15", color: "#22c55e", allDay: true, editable: false, typeName: "วันหยุด" },
    { id: 'th-3', title: "วันแรงงานแห่งชาติ", start: "2025-05-01", color: "#3b82f6", allDay: true, editable: false, typeName: "วันหยุด" },
    { id: 'th-4', title: "วันแม่แห่งชาติ", start: "2025-08-12", color: "#60a5fa", allDay: true, editable: false, typeName: "วันหยุด" },
    { id: 'th-5', title: "วันพ่อแห่งชาติ", start: "2025-12-05", color: "#f59e0b", allDay: true, editable: false, typeName: "วันหยุด" },
    { id: 'th-6', title: "วันคริสต์มาส", start: "2025-12-25", color: "#84cc16", allDay: true, editable: false, typeName: "วันหยุด" },
  ];

  // โหลดประเภทกิจกรรม
  const loadTypes = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("ActivityType")
      .select("*")
      .eq("user_id", user.id);

    if (error) {
      console.error(error);
      return;
    }
    setTypes(data || []);
  };

  // 1. โหลดกิจกรรมส่วนตัว (Personal Activity)
  const loadUserEvents = async () => {
    if (!user) return [];
    const { data, error } = await supabase
      .from("Activity")
      .select(
        "id, name, description, start_time, end_time, all_day, type_id, ActivityType(color, name)"
      )
      .or(`student_id.eq.${user.id},created_by.eq.${user.id}`)
      .order("start_time", { ascending: true });

    if (error) {
      console.error("Supabase error:", error);
      return [];
    }

    return (data || []).map((ev) => {
      const startRaw = ev.start_time || null;
      const endRaw = ev.end_time || null;
      const startDateObj = startRaw ? dayjs(startRaw).toDate() : null;

      let endModal = endRaw ? dayjs(endRaw).toDate() : null;
      if (!endModal && startDateObj) {
        const d = new Date(startDateObj);
        d.setHours(23, 59, 0, 0);
        endModal = d;
      }

      let endForCalendar = endModal;
      if (ev.all_day && endModal) {
        endForCalendar = dayjs(endModal).add(1, "day").startOf("day").toDate();
      }

      return {
        id: `personal-${ev.id}`,
        originalId: ev.id,
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
        isJoined: false,
      };
    });
  };

  // 2. โหลดกิจกรรมที่ Join จาก Board
  const loadJoinedEvents = async () => {
    if (!user) return [];
    const { data, error } = await supabase
      .from("JoinEvent")
      .select(`
        event_id,
        Event (
          event_id,
          name,
          detail,
          start_event,
          end_event,
          activity_hour,
          poster_url
        )
      `)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error loading joined events:", error);
      return [];
    }

    return (data || []).map((item) => {
      const ev = item.Event;
      if (!ev) return null;

      const startDateObj = ev.start_event ? dayjs(ev.start_event).toDate() : null;
      const endModal = ev.end_event ? dayjs(ev.end_event).toDate() : null;
      
      return {
        id: `joined-${ev.event_id}`,
        originalId: ev.event_id,
        title: `(Join) ${ev.name}`,
        start: startDateObj,
        end: endModal,
        allDay: false, 
        description: ev.detail,
        color: "#10b981",
        typeName: "Activity Board",
        isJoined: true,
        startRaw: ev.start_event,
        endRaw: ev.end_event,
        activity_hour: ev.activity_hour
      };
    }).filter(Boolean);
  };

  // รวมโหลดข้อมูลทั้งหมด
  const loadEvents = async () => {
    setLoading(true);
    try {
      const [userEvents, joinedEvents] = await Promise.all([
        loadUserEvents(),
        loadJoinedEvents()
      ]);
      setEvents([...userEvents, ...joinedEvents, ...thaiHolidays]);
    } catch (error) {
      console.error("Error loading events:", error);
      message.error("โหลดข้อมูลกิจกรรมล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadEvents();
      loadTypes();
    }
  }, [user]);

  // 📅 ✅ แสดงกิจกรรมของวันปัจจุบัน (รวมกิจกรรมที่ครอบคลุมวันนี้ด้วย)
  useEffect(() => {
    const now = dayjs();
    const startOfToday = now.startOf("day");
    const endOfToday = now.endOf("day");

    setTodayEvents(
      events.filter((ev) => {
        if (!ev.start) return false;
        const s = dayjs(ev.start);
        const e = ev.end ? dayjs(ev.end) : s;
        return s.isBefore(endOfToday) && e.isAfter(startOfToday);
      })
    );
  }, [events]);

  // 🗓 คลิกวันที่เพื่อเพิ่มกิจกรรมส่วนตัว
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

  const buildStartEndFromForm = (frm) => {
    let start, end;
    if (frm.allDay) {
      start = frm.startDate.hour(0).minute(0).second(0).format("YYYY-MM-DD HH:mm:ss");
      end = frm.endDate.hour(23).minute(59).second(0).format("YYYY-MM-DD HH:mm:ss");
    } else {
      start = frm.startDate.hour(frm.startTime.hour()).minute(frm.startTime.minute()).second(0).format("YYYY-MM-DD HH:mm:ss");
      end = frm.endDate.hour(frm.endTime.hour()).minute(frm.endTime.minute()).second(0).format("YYYY-MM-DD HH:mm:ss");
    }
    return { start, end };
  };

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
      .eq("id", detailModal.originalId);

    if (error) {
      console.error(error);
      message.error("แก้ไขไม่สำเร็จ ❌");
    } else {
      message.success("แก้ไขเรียบร้อย ✅");
      setEditMode(false);
      setDetailModal(null);
      loadEvents();
    }
  };

  const handleDeleteEvent = async () => {
    const { error } = await supabase
      .from("Activity")
      .delete()
      .eq("id", detailModal.originalId);

    if (error) {
      message.error("ลบไม่สำเร็จ ❌");
    } else {
      message.success("ลบสำเร็จ 🗑️");
      setDetailModal(null);
      setEditMode(false);
      loadEvents();
    }
  };

  const handleAddType = async () => {
    if (!newType.name) return message.warning("กรุณากรอกชื่อประเภท");
    const { error } = await supabase.from("ActivityType").insert({
      name: newType.name,
      color: newType.color,
      user_id: user.id,
    });
    if (error) {
      message.error("เพิ่มประเภทไม่สำเร็จ: " + error.message);
    } else {
      message.success("เพิ่มประเภทสำเร็จ ✅");
      setNewType({ name: "", color: "#3b82f6" });
      loadTypes();
    }
  };

  const handleDeleteType = async (id, name) => {
    const { error } = await supabase
      .from("ActivityType")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
       if (error.message?.toLowerCase().includes("foreign key")) {
        message.error("ลบประเภทไม่ได้ เพราะมีการใช้งานอยู่");
      } else {
        message.error("ลบไม่สำเร็จ");
      }
    } else {
      message.success(`ลบประเภท "${name}" สำเร็จ`);
      loadTypes();
    }
  };

  const typeOptions = types.map((t) => ({
    label: (
      <span>
        <span style={{ display: "inline-block", width: 12, height: 12, background: t.color, borderRadius: "50%", marginRight: 8 }} />
        {t.name}
      </span>
    ),
    value: t.id,
  }));

  return (
    <section style={{ padding: "24px", background: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <Title level={2} style={{ margin: 0, color: "#1e293b" }}>📅 ปฏิทินกิจกรรม</Title>
            <Text type="secondary">จัดการตารางเวลาและกิจกรรมของคุณได้ที่นี่</Text>
          </div>
          {role !== "guest" && (
            <Button 
              type="primary" 
              size="large" 
              icon={<PlusOutlined />} 
              onClick={() => {
                setForm({
                  name: "",
                  description: "",
                  startDate: dayjs(),
                  endDate: dayjs(),
                  startTime: dayjs("09:00", "HH:mm"),
                  endTime: dayjs("10:00", "HH:mm"),
                  allDay: false,
                  type_id: null,
                });
                setModalOpen(true);
              }}
              style={{ borderRadius: 8, boxShadow: "0 4px 14px rgba(37, 99, 235, 0.2)" }}
            >
              เพิ่มกิจกรรม
            </Button>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 24 }}>
          
          {/* Sidebar ซ้าย (สรุปกิจกรรมวันนี้ / หมวดหมู่) */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* กิจกรรมวันนี้ */}
            <Card 
              title={<><CalendarOutlined /> กิจกรรมวันนี้</>} 
              bordered={false}
              style={{ borderRadius: 16, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}
              bodyStyle={{ padding: "16px" }}
            >
              {todayEvents.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {todayEvents.map((ev) => (
                    <div key={ev.id} style={{ 
                      padding: "12px", 
                      borderRadius: 12, 
                      background: "#f8fafc", 
                      borderLeft: `4px solid ${ev.color}`,
                      display: "flex",
                      flexDirection: "column",
                      gap: 4
                    }}>
                      <div style={{ fontWeight: 600, color: "#334155" }}>{ev.title}</div>
                      <div style={{ fontSize: "0.85rem", color: "#64748b", display: "flex", alignItems: "center", gap: 4 }}>
                        <ClockCircleOutlined />
                        {ev.allDay ? "ทั้งวัน" : `${dayjs(ev.start).format("HH:mm")} - ${dayjs(ev.end).format("HH:mm")}`}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "20px 0", color: "#94a3b8" }}>
                  ไม่มีกิจกรรมวันนี้ 🎉
                </div>
              )}
            </Card>

            {/* Filter ประเภท */}
            <Card 
              title="หมวดหมู่" 
              bordered={false}
              style={{ borderRadius: 16, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}
            >
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {types.map(t => (
                  <Tag key={t.id} color={t.color} style={{ marginRight: 0, padding: "4px 10px", borderRadius: 20 }}>
                    {t.name}
                  </Tag>
                ))}
                {types.length === 0 && <Text type="secondary">ยังไม่มีหมวดหมู่</Text>}
              </div>
              <Button type="link" size="small" onClick={() => setTypeModal(true)} style={{ paddingLeft: 0, marginTop: 8 }}>
                + จัดการหมวดหมู่
              </Button>
            </Card>
          </div>

          {/* ตัวปฏิทิน */}
          <div style={{ 
            background: "#fff", 
            padding: 24, 
            borderRadius: 16, 
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)",
            minHeight: 700
          }}>
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth",
              }}
              buttonText={{
                today: 'วันนี้',
                month: 'เดือน',
              }}
              locale="th"
              height="auto"
              contentHeight="auto"
              aspectRatio={1.8}
              dateClick={handleDateClick}
              eventClick={(info) => {
                const e = info.event;
                const props = e.extendedProps || {};

                if(!props.isJoined && !props.originalId && !e.id.startsWith("personal") && !e.id.startsWith("th-")) return;
                const isThaiHoliday = e.id.startsWith("th-");

                const startFromRaw = props.startRaw ? dayjs(props.startRaw) : e.start ? dayjs(e.start) : null;
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
                  originalId: props.originalId,
                  name: props.title || e.title,
                  title: e.title,
                  start: startFromRaw ? startFromRaw.toDate() : null,
                  end: endFromRaw ? endFromRaw.toDate() : null,
                  description: props.description,
                  color: e.backgroundColor,
                  typeName: props.typeName,
                  typeId: props.typeId,
                  allDay: e.allDay,
                  isJoined: props.isJoined,
                  isHoliday: isThaiHoliday,
                  activity_hour: props.activity_hour
                });
                setEditMode(false);
              }}
              eventContent={(arg) => {
                const bg = arg.event.backgroundColor;
                const title = arg.event.title;
                const timeText = arg.timeText;
                const typeName = arg.event.extendedProps.typeName;
                
                return (
                  <Tooltip title={`${title} (${timeText})`}>
                    <div style={{ 
                      padding: "2px 6px", 
                      borderRadius: "4px",
                      backgroundColor: bg,
                      color: "#fff",
                      fontSize: "0.85em",
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                      textOverflow: "ellipsis",
                      borderLeft: "3px solid rgba(255,255,255,0.5)",
                      cursor: "pointer"
                    }}>
                      {!arg.event.allDay && <span style={{fontWeight: 600, marginRight: 4}}>{timeText}</span>}
                      <span>{title}</span>
                      {typeName && <span style={{ fontSize: '0.7em', opacity: 0.8, marginLeft: 6, background: 'rgba(0,0,0,0.1)', padding: '0 4px', borderRadius: 4 }}>{typeName}</span>}
                    </div>
                  </Tooltip>
                );
              }}
              events={events}
              dayMaxEvents={3}
              nowIndicator={true}
            />
          </div>
        </div>
      </div>

      {/* Modal: เพิ่มกิจกรรม */}
      <Modal
        title={<Title level={4} style={{ margin: 0 }}>📝 สร้างกิจกรรมใหม่</Title>}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleAddEvent}
        confirmLoading={loading}
        okText="บันทึก"
        cancelText="ยกเลิก"
        width={500}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}>
          <Input 
            placeholder="ชื่อกิจกรรม" 
            value={form.name} 
            onChange={(e) => setForm({ ...form, name: e.target.value })} 
            size="large"
          />
          <Input.TextArea 
            rows={3} 
            placeholder="รายละเอียดเพิ่มเติม..." 
            value={form.description} 
            onChange={(e) => setForm({ ...form, description: e.target.value })} 
          />
          
          <Card size="small" title="วันและเวลา" bordered={false} style={{ background: "#f8fafc" }}>
            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              <DatePicker value={form.startDate} onChange={(d) => setForm({ ...form, startDate: d })} format="DD/MM/YYYY" style={{ flex: 1 }} placeholder="วันเริ่ม" />
              <DatePicker value={form.endDate} onChange={(d) => setForm({ ...form, endDate: d })} format="DD/MM/YYYY" style={{ flex: 1 }} placeholder="วันจบ" />
            </div>
            
            <Checkbox
              checked={form.allDay}
              onChange={(e) => {
                const checked = e.target.checked;
                setForm({
                  ...form,
                  allDay: checked,
                  startTime: checked ? dayjs("00:00", "HH:mm") : dayjs("09:00", "HH:mm"),
                  endTime: checked ? dayjs("23:59", "HH:mm") : dayjs("10:00", "HH:mm"),
                });
              }}
            >
              ตลอดทั้งวัน
            </Checkbox>

            {!form.allDay && (
              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                <TimePicker format="HH:mm" value={form.startTime} onChange={(t) => setForm({ ...form, startTime: t })} style={{ flex: 1 }} />
                <TimePicker format="HH:mm" value={form.endTime} onChange={(t) => setForm({ ...form, endTime: t })} style={{ flex: 1 }} />
              </div>
            )}
          </Card>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Select 
              placeholder="เลือกประเภทกิจกรรม" 
              value={form.type_id} 
              onChange={(v) => setForm({ ...form, type_id: v })} 
              style={{ flex: 1 }} 
              options={typeOptions}
              allowClear
            />
            <Button icon={<EditOutlined />} onClick={() => setTypeModal(true)}>จัดการ</Button>
          </div>
        </div>
      </Modal>

      {/* Modal: รายละเอียด / แก้ไขกิจกรรม */}
      <Modal
        title={null}
        footer={null}
        open={!!detailModal}
        onCancel={() => {
          setDetailModal(null);
          setEditMode(false);
        }}
        width={500}
      >
        {detailModal && !editMode && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 16 }}>
              <div>
                <Title level={4} style={{ margin: 0, marginBottom: 4 }}>{detailModal.name}</Title>
                <Space>
                  {detailModal.isJoined && <Tag color="green">เข้าร่วมจาก Board</Tag>}
                  {detailModal.isHoliday && <Tag color="red">วันหยุด</Tag>}
                  {!detailModal.isHoliday && (
                    <Tag color={detailModal.color}>{detailModal.typeName || "ทั่วไป"}</Tag>
                  )}
                </Space>
              </div>
            </div>

            <Divider style={{ margin: "12px 0" }} />

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", gap: 12 }}>
                <ClockCircleOutlined style={{ marginTop: 4, color: "#64748b" }} />
                <div>
                  <div style={{ fontWeight: 500 }}>
                    {detailModal.start ? dayjs(detailModal.start).format("D MMM YYYY") : "-"}
                    {!detailModal.allDay && ` เวลา ${dayjs(detailModal.start).format("HH:mm")}`}
                  </div>
                  <div style={{ color: "#64748b", fontSize: "0.9em" }}>
                    ถึง {detailModal.end ? dayjs(detailModal.end).format("D MMM YYYY") : "-"}
                    {!detailModal.allDay && ` เวลา ${dayjs(detailModal.end).format("HH:mm")}`}
                  </div>
                </div>
              </div>

              {detailModal.description && (
                <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8, color: "#334155" }}>
                  {detailModal.description}
                </div>
              )}

              {detailModal.activity_hour > 0 && (
                 <div style={{ fontWeight: 500, color: "#0f172a" }}>
                   ⏳ ชั่วโมงกิจกรรม: {detailModal.activity_hour} ชม.
                 </div>
              )}
            </div>

            <Divider style={{ margin: "12px 0" }} />

            {!detailModal.isJoined && !detailModal.isHoliday && (
              <div style={{ display: "flex", justifyContent: "end", gap: 8 }}>
                <Popconfirm title="ลบกิจกรรมนี้?" onConfirm={handleDeleteEvent} okText="ลบ" cancelText="ไม่">
                  <Button danger icon={<DeleteOutlined />}>ลบ</Button>
                </Popconfirm>
                <Button type="primary" icon={<EditOutlined />} onClick={startEdit}>แก้ไข</Button>
              </div>
            )}
            {(detailModal.isJoined || detailModal.isHoliday) && (
               <div style={{ display: "flex", justifyContent: "end" }}>
                 <Button onClick={() => setDetailModal(null)}>ปิด</Button>
               </div>
            )}
          </div>
        )}

        {/* โหมดแก้ไข */}
        {editMode && !detailModal?.isJoined && !detailModal?.isHoliday && (
          <div style={{ paddingTop: 24 }}>
             <Title level={4} style={{ marginBottom: 24 }}>✏️ แก้ไขกิจกรรม</Title>
             <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} size="large" />
                <Input.TextArea rows={3} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
                
                <div style={{ display: "flex", gap: 10 }}>
                   <DatePicker value={editForm.startDate} onChange={(d) => setEditForm({ ...editForm, startDate: d })} format="DD/MM/YYYY" style={{ flex: 1 }} />
                   <DatePicker value={editForm.endDate} onChange={(d) => setEditForm({ ...editForm, endDate: d })} format="DD/MM/YYYY" style={{ flex: 1 }} />
                </div>
                
                <Checkbox checked={editForm.allDay} onChange={(e) => {
                   const checked = e.target.checked;
                   setEditForm({ ...editForm, allDay: checked, startTime: checked ? dayjs("00:00", "HH:mm") : dayjs("09:00", "HH:mm"), endTime: checked ? dayjs("23:59", "HH:mm") : dayjs("10:00", "HH:mm") });
                }}>ตลอดทั้งวัน</Checkbox>

                {!editForm.allDay && (
                   <div style={{ display: "flex", gap: 10 }}>
                     <TimePicker format="HH:mm" value={editForm.startTime} onChange={(t) => setEditForm({ ...editForm, startTime: t })} style={{ flex: 1 }} />
                     <TimePicker format="HH:mm" value={editForm.endTime} onChange={(t) => setEditForm({ ...editForm, endTime: t })} style={{ flex: 1 }} />
                   </div>
                )}
                
                <Select placeholder="เลือกประเภท" value={editForm.type_id} onChange={(v) => setEditForm({ ...editForm, type_id: v })} style={{ width: "100%" }} options={typeOptions} />
                
                <div style={{ display: "flex", justifyContent: "end", gap: 8, marginTop: 8 }}>
                  <Button onClick={() => setEditMode(false)}>ยกเลิก</Button>
                  <Button type="primary" onClick={handleEditEvent}>บันทึกการแก้ไข</Button>
                </div>
             </div>
          </div>
        )}
      </Modal>

      {/* Modal จัดการประเภท */}
      <Modal title="🎨 จัดการประเภทกิจกรรม" open={typeModal} onCancel={() => setTypeModal(false)} onOk={() => setTypeModal(false)} okText="เสร็จสิ้น" cancelButtonProps={{ style: { display: "none" } }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <Input placeholder="ชื่อหมวดหมู่ใหม่..." value={newType.name} onChange={(e) => setNewType({ ...newType, name: e.target.value })} />
          <Input type="color" value={newType.color} onChange={(e) => setNewType({ ...newType, color: e.target.value })} style={{ width: 50, padding: 0 }} />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddType}></Button>
        </div>
        <Divider style={{ margin: "12px 0" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 300, overflowY: "auto" }}>
          {types.map((t) => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 16, height: 16, background: t.color, borderRadius: 4 }}></div>
                <Text>{t.name}</Text>
              </div>
              <Popconfirm title="ลบหมวดหมู่นี้?" onConfirm={() => handleDeleteType(t.id, t.name)} okText="ลบ" cancelText="ไม่">
                <Button type="text" danger icon={<DeleteOutlined />} size="small" />
              </Popconfirm>
            </div>
          ))}
          {types.length === 0 && <Empty description="ยังไม่มีหมวดหมู่" />}
        </div>
      </Modal>
    </section>
  );
}