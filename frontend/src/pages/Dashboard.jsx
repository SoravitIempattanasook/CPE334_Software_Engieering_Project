import { useEffect, useMemo, useState } from "react";
import { Card, List, Tag, message, Statistic, Row, Col, Empty } from "antd";
import { CalendarOutlined, ClockCircleOutlined, ExclamationCircleOutlined, TeamOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import "dayjs/locale/th";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

dayjs.locale("th");
dayjs.extend(isBetween);

export default function Dashboard() {
  const { user, role } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. โหลดกิจกรรมส่วนตัว (Activity)
  const loadUserEvents = async () => {
    if (!user) return [];
    const { data, error } = await supabase
      .from("Activity")
      .select("id, name, description, start_time, end_time, all_day, ActivityType(color, name)")
      .or(`student_id.eq.${user.id},created_by.eq.${user.id}`)
      .order("start_time", { ascending: true });

    if (error) {
      console.error("Supabase error (Personal):", error);
      return [];
    }

    return (data || []).map((ev) => ({
      id: `personal-${ev.id}`, // Prefix ป้องกัน ID ชน
      title: ev.name?.trim() || "กิจกรรม",
      start: ev.start_time,
      end: ev.end_time,
      allDay: ev.all_day,
      description: ev.description,
      color: ev.ActivityType?.color || "#2563eb",
      typeName: ev.ActivityType?.name || "ส่วนตัว",
      source: "personal"
    }));
  };

  // 2. โหลดกิจกรรมที่เข้าร่วมจาก Board (JoinEvent -> Event)
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
      console.error("Supabase error (Joined):", error);
      return [];
    }

    // กรองและแปลงข้อมูล
    return (data || [])
      .filter(item => item.Event) // ป้องกันข้อมูล Event เป็น null
      .map((item) => {
        const ev = item.Event;
        return {
          id: `joined-${ev.event_id}`, // Prefix ป้องกัน ID ชน
          title: ev.name?.trim() || "กิจกรรมเข้าร่วม",
          start: ev.start_event,
          end: ev.end_event,
          allDay: false, // Event ส่วนใหญ่มักมีเวลาเริ่ม-จบชัดเจน
          description: ev.detail,
          color: "#10b981", // สีเขียว ให้ดูแตกต่างจากกิจกรรมส่วนตัว
          typeName: "กิจกรรมคณะ/มหาลัย",
          source: "joined",
          activity_hour: ev.activity_hour
        };
      });
  };

  // รวมการโหลดข้อมูล
  const loadEvents = async () => {
    setLoading(true);
    try {
      const [personal, joined] = await Promise.all([
        loadUserEvents(),
        loadJoinedEvents()
      ]);
      
      // รวม Array และเรียงตามเวลาเริ่ม
      const allEvents = [...personal, ...joined].sort((a, b) => 
        dayjs(a.start).valueOf() - dayjs(b.start).valueOf()
      );
      
      setEvents(allEvents);
    } catch (err) {
      console.error(err);
      message.error("โหลดข้อมูลบางส่วนล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // --- Logic การคำนวณต่างๆ ---
  const now = dayjs();
  const startOfToday = now.startOf("day");
  const endOfToday = now.endOf("day");
  const endOfWeek = now.endOf("week");

  const todayEvents = useMemo(
    () => events.filter((e) => dayjs(e.start).isBetween(startOfToday, endOfToday, null, "[]")),
    [events, startOfToday, endOfToday]
  );

  const upcoming7 = useMemo(
    () =>
      events
        .filter((e) => dayjs(e.start).isAfter(endOfToday))
        .filter((e) => dayjs(e.start).isBefore(now.add(7, "day")))
        .slice(0, 8),
    [events, endOfToday, now]
  );

  const overdue = useMemo(() => events.filter((e) => dayjs(e.end).isBefore(now)), [events, now]);

  const kpi = useMemo(() => {
    const thisWeek = events.filter(
      (e) => dayjs(e.start).isBefore(endOfWeek) && dayjs(e.end).isAfter(now.startOf("week"))
    ).length;
    
    const total = events.length;
    const todayCount = todayEvents.length;
    
    // คำนวณชั่วโมง (ถ้าเป็น Joined Event ใช้ activity_hour ถ้าเป็น Personal คำนวณจาก start-end)
    const hoursToday = todayEvents.reduce((acc, e) => {
      if (e.source === "joined" && e.activity_hour) {
        return acc + Number(e.activity_hour);
      }
      
      const start = dayjs(e.start);
      const end = dayjs(e.end);
      const diff = end.diff(start, "minute") / 60;
      return acc + (diff > 0 ? diff : 0);
    }, 0);

    // นับแยกประเภทว่าเข้าร่วมกี่งาน
    const joinedCount = events.filter(e => e.source === "joined").length;

    return { 
      thisWeek, 
      total, 
      todayCount, 
      hoursToday: Number(hoursToday.toFixed(1)),
      joinedCount 
    };
  }, [events, todayEvents, endOfWeek, now]);

  const renderItem = (item) => (
    <List.Item>
      <List.Item.Meta
        title={
          <span>
            <Tag color={item.color} style={{ color: "#fff", border: "none" }}>
              {item.typeName}
            </Tag>
            {item.title}
          </span>
        }
        description={
          <span>
            <ClockCircleOutlined style={{ marginRight: 4 }} /> 
            {dayjs(item.start).format("DD/MM/YYYY HH:mm")} – {dayjs(item.end).format("HH:mm")}
            <br />
            <span style={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden', color: '#666' }}>
              {item.description || <em style={{ color: "#999" }}>ไม่มีรายละเอียด</em>}
            </span>
          </span>
        }
      />
    </List.Item>
  );

  return (
    <div style={{ padding: 20 }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 12 }}>
        <Col>
          <h1 style={{ margin: 0 }}>
            📊 Dashboard{" "}
            <Tag color="geekblue" style={{ marginLeft: 8 }}>
              role: {(role ?? "unknown").toString()}
            </Tag>
          </h1>
          <div style={{ color: "#6b7280" }}>สรุปกิจกรรมและเตือนความจำสำหรับนักศึกษา</div>
        </Col>
      </Row>

      {/* KPIs */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={12} md={6}>
          <Card bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <Statistic title="วันนี้มีนัด" value={kpi.todayCount} prefix={<CalendarOutlined />} suffix="รายการ" />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <Statistic title="ชั่วโมงรวมวันนี้" value={kpi.hoursToday} suffix="ชม." precision={1} />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <Statistic title="กิจกรรมส่วนกลางที่เข้าร่วม" value={kpi.joinedCount} prefix={<TeamOutlined />} suffix="งาน" />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <Statistic title="กิจกรรมทั้งหมดในระบบ" value={kpi.total} suffix="รายการ" />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={12}>
          <Card title="📅 วันนี้" style={{ height: '100%' }} bodyStyle={{ padding: '0 16px' }}>
            {loading ? <div style={{ padding: 20, textAlign: 'center' }}>กำลังโหลด...</div> : (
              todayEvents.length ? (
                <List dataSource={todayEvents} renderItem={renderItem} />
              ) : (
                <Empty description="วันนี้ยังไม่มีกิจกรรม" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )
            )}
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="⏭️ 7 วันถัดไป" style={{ height: '100%' }} bodyStyle={{ padding: '0 16px' }}>
            {loading ? <div style={{ padding: 20, textAlign: 'center' }}>กำลังโหลด...</div> : (
              upcoming7.length ? (
                <List dataSource={upcoming7} renderItem={renderItem} />
              ) : (
                <Empty description="ว่างยาวๆ ใน 7 วันนี้" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <Card title={<span><ExclamationCircleOutlined style={{color: '#faad14'}} /> ค้าง/เลยกำหนด</span>} bodyStyle={{ padding: '0 16px' }}>
            {loading ? <div style={{ padding: 20, textAlign: 'center' }}>กำลังโหลด...</div> : (
              overdue.length ? (
                <List dataSource={overdue} renderItem={renderItem} />
              ) : (
                <Empty description="สุดยอด! ไม่มีงานค้าง" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}