export default function ActivityBoard() {
  return (
    <section className="page">
      <h1 className="page-title">Activity board</h1>
      <p className="muted">บอร์ดกิจกรรมของชมรม — โพสต์/อัปเดต/ประกาศ</p>

      <div className="card-list">
        {[1,2,3].map(i => (
          <article key={i} className="card">
            <div className="card-title">ประกาศที่ #{i}</div>
            <div className="card-body">
              เนื้อหาตัวอย่างกิจกรรม/ประกาศ … (เชื่อม API ภายหลัง)
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
