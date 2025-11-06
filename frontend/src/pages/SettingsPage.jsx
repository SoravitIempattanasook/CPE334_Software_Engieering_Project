export default function SettingsPage() {
  return (
    <section className="page">
      <h1 className="page-title">Setting</h1>

      <div className="form-card">
        <div className="row">
          <label>Language</label>
          <select>
            <option>English</option>
            <option>ภาษาไทย</option>
          </select>
        </div>

        <div className="row">
          <label>Theme</label>
          <select>
            <option>Light</option>
            <option>Dark</option>
          </select>
        </div>

        <div className="row">
          <label>Notification</label>
          <div className="chip">In-app</div>
          <div className="chip">Email</div>
        </div>
      </div>
    </section>
  );
}
