export default function ProfilePage() {
  // ตัวอย่างข้อมูล — ต่อกับ context/api ภายหลัง
  const user = {
    displayName: "Among U.",
    handle: "@NatthananRod6969",
    name: "Natthanan Roddeepeng",
    email: "NatthananRod6969@gmail.com",
    phone: "069-696-6969",
    avatar: "/avatar.png"
  };

  return (
    <section className="page">
      <h1 className="page-title">My Profile</h1>

      <div className="profile-card">
        <div className="profile-top">
          <img className="profile-avatar" src={user.avatar} alt="avatar" />
          <div className="profile-id">
            <div className="display">{user.displayName}</div>
            <div className="handle">{user.handle}</div>
          </div>
        </div>

        <div className="divider" />

        <div className="field">
          <label>Name</label>
          <div className="value">{user.name}</div>
        </div>

        <div className="field">
          <label>Email</label>
          <div className="value">{user.email}</div>
        </div>

        <div className="field">
          <label>Phone Number</label>
          <div className="value">{user.phone}</div>
        </div>

        <div className="field">
          <label>Password</label>
          <div className="value">********** <span className="muted">Change password</span></div>
        </div>
      </div>
    </section>
  );
}
