import { useAuth } from "../context/AuthContext";

export default function ProfilePage() {
  const { user, displayName, domain, role, studentYear } = useAuth();

  if (!user) return null; // เผื่อ State ยังโหลด (จริง ๆ AuthProvider กันไว้แล้ว)

  // ✅ ดึงข้อมูลจาก user_metadata (Supabase)
  const metadata = user.user_metadata || {};

  const avatar =
    metadata.avatar_url ||
    metadata.picture ||
    "/avatar.png";

  const name =
    metadata.full_name ||
    metadata.name ||
    displayName ||
    (user.email ? user.email.split("@")[0] : "");

  const handle = metadata.username
    ? `@${metadata.username}`
    : `@${user.email.split("@")[0]}`;

  const phone = metadata.phone || "-";

  const email = user.email;

  return (
    <section className="page">
      <h1 className="page-title">My Profile</h1>

      <div className="profile-card">
        {/* ส่วนบน */}
        <div className="profile-top">
          <img className="profile-avatar" src={avatar} alt="avatar" />
          <div className="profile-id">
            <div className="display">{name}</div>
            <div className="handle">{handle}</div>
          </div>
        </div>

        <div className="divider" />

        {/* รายละเอียด */}
        <div className="field">
          <label>Name</label>
          <div className="value">{name}</div>
        </div>

        <div className="field">
          <label>Email</label>
          <div className="value">{email}</div>
        </div>

        <div className="field">
          <label>Domain</label>
          <div className="value">{domain}</div>
        </div>

        <div className="field">
          <label>Role</label>
          <div className="value" style={{ textTransform: "capitalize" }}>
            {role}
            {studentYear ? ` (${studentYear})` : ""}
          </div>
        </div>

        <div className="field">
          <label>Phone Number</label>
          <div className="value">{phone}</div>
        </div>

        <div className="field">
          <label>Password</label>
          <div className="value">********** <span className="muted">Change password</span></div>
        </div>
      </div>
    </section>
  );
}
