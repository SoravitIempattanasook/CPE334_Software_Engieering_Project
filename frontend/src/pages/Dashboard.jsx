import { useEffect, useMemo, useState } from "react";
import { Card, List, Tag, message, Statistic, Row, Col, Empty } from "antd";
import { CalendarOutlined, ClockCircleOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import "dayjs/locale/th";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

dayjs.locale("th");
dayjs.extend(isBetween);

export default function Dashboard() {
  // ✅ ไม่เช็ค Forbidden ในหน้านี้แล้ว เพื่อกันปัญหาเด้ง/ขึ้น 403
  const { user, role } = useAuth();
  const [events, setEvents] = useState([]);

  const loadUserEvents = async () => {
    if (!user) return [];
    const { data, error } = await supabase
      .from("Activity")
      .select("id, name, description, start_time, end_time, all_day, ActivityType(color, name)")
      .or(`student_id.eq.${user.id},created_by.eq.${user.id}`)
      .order("start_time", { ascending: true });

    if (error) {
      console.error("Supabase error:", error);
      message.error("โหลดกิจกรรมไม่ได้: " + error.message);
      return [];
    }

    return (data || []).map((ev) => ({
      id: String(ev.id),
      title: ev.name?.trim() || "กิจกรรม",
      start: ev.start_time,
      end: ev.end_time,
      allDay: ev.all_day,
      description: ev.description,
      color: ev.ActivityType?.color || "#2563eb",
      typeName: ev.ActivityType?.name || "ทั่วไป",
    }));
  };

  const loadEvents = async () => {
    const es = await loadUserEvents();
    setEvents(es);
  };

  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

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
    const hoursToday = todayEvents.reduce((acc, e) => {
      const start = dayjs(e.start);
      const end = dayjs(e.end);
      const diff = end.diff(start, "minute") / 60;
      return acc + (diff > 0 ? diff : 0);
    }, 0);
    return { thisWeek, total, todayCount, hoursToday: Number(hoursToday.toFixed(1)) };
  }, [events, todayEvents, endOfWeek, now]);

  const renderItem = (item) => (
    <List.Item>
      <List.Item.Meta
        title={
          <span>
            <Tag color={item.color} style={{ color: "#fff" }}>{item.typeName}</Tag>
            {item.title}
          </span>
        }
        description={
          <span>
            <ClockCircleOutlined /> {dayjs(item.start).format("DD/MM/YYYY HH:mm")} – {dayjs(item.end).format("DD/MM/YYYY HH:mm")}
            <br />
            {item.description || <em style={{ color: "#888" }}>ไม่มีรายละเอียด</em>}
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
          <Card><Statistic title="วันนี้มีนัด" value={kpi.todayCount} prefix={<CalendarOutlined />} /></Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card><Statistic title="ชั่วโมงรวมวันนี้" value={kpi.hoursToday} suffix="ชม." /></Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card><Statistic title="สัปดาห์นี้" value={kpi.thisWeek} /></Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card><Statistic title="ทั้งหมด" value={kpi.total} /></Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={12}>
          <Card title="📅 วันนี้">
            {todayEvents.length ? (
              <List dataSource={todayEvents} renderItem={renderItem} />
            ) : (
              <Empty description="วันนี้ยังไม่มีกิจกรรม" />
            )}
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="⏭️ 7 วันถัดไป">
            {upcoming7.length ? (
              <List dataSource={upcoming7} renderItem={renderItem} />
            ) : (
              <Empty description="ยังไม่มีใน 7 วันถัดไป" />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <Card title={<span><ExclamationCircleOutlined /> ค้าง/เลยกำหนด</span>}>
            {overdue.length ? (
              <List dataSource={overdue} renderItem={renderItem} />
            ) : (
              <Empty description="ไม่มีงานค้าง" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}