import { useMemo } from "react";

function buildDays() {
  // สร้าง grid 7x5-6 อย่างง่าย (เดือนสมมติ)
  const days = [];
  for (let i = 1; i <= 30; i++) days.push(i);
  return days;
}

export default function CalendarPage() {
  const days = useMemo(buildDays, []);
  return (
    <section className="page">
      <h1 className="page-title">Calendar</h1>

      <div className="cal-grid">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(h => (
          <div key={h} className="cal-head">{h}</div>
        ))}
        {days.map(d => (
          <div key={d} className="cal-cell">
            <div className="cal-day">{d}</div>
            {/* จุดสำหรับ badge event */}
          </div>
        ))}
      </div>

      <h3 className="mt">Upcoming Events</h3>
      <ul className="list">
        <li><b>SC Volunteer</b> — 10:00–12:00 @ A Building</li>
        <li><b>Meeting Freshy Day</b> — 14:00–15:00 @ Discord</li>
      </ul>
    </section>
  );
}
