import { useAuth } from "../context/AuthContext";

export default function ProfilePage() {
  const { user, displayName, domain, role, studentYear } = useAuth();
  if (!user) return null;

  const md = user.user_metadata || {};
  const avatar = md.avatar_url || md.picture || "/avatar.png";
  const name = md.full_name || md.name || displayName || (user.email || "").split("@")[0];
  const handle = md.username ? `@${md.username}` : `@${(user.email || "").split("@")[0]}`;
  const phone = md.phone || "-";

  return (
    <section className="page">
      <h1 className="page-title">My Profile</h1>

      <div className="profile-card">
        <div className="profile-top">
          <img className="profile-avatar" src={avatar} alt="avatar" />
          <div className="profile-id">
            <div className="display">{name}</div>
            <div className="handle">{handle}</div>
          </div>
        </div>

        <div className="divider" />

        <div className="field"><label>Name</label><div className="value">{name}</div></div>
        <div className="field"><label>Email</label><div className="value">{user.email}</div></div>
        <div className="field"><label>Domain</label><div className="value">{domain || "-"}</div></div>
        <div className="field">
          <label>Role</label>
          <div className="value" style={{ textTransform: "capitalize" }}>
            {role}{studentYear ? ` (${studentYear})` : ""}
          </div>
        </div>
        <div className="field"><label>Phone Number</label><div className="value">{phone}</div></div>
        <div className="field"><label>Password</label><div className="value">********** <span className="muted">Change password</span></div></div>
      </div>
    </section>
  );
}
