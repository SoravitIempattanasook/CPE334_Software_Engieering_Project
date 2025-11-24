import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

export default function Settings() {
  const { user, role, profile } = useAuth();
  
  const [formData, setFormData] = useState({
    maker_name: "",
    maker_description: "",
    reason: ""
  });
  const [requestStatus, setRequestStatus] = useState(null); // null, 'pending', 'approved', 'rejected'
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    // Check if a request has already been sent
    const fetchRequest = async () => {
      const { data } = await supabase
        .from("ActivityMakerRequest")
        .select("status")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .maybeSingle();
      
      if (data) setRequestStatus(data.status);
    };
    fetchRequest();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.maker_name || !formData.reason) return alert("กรุณากรอกข้อมูลให้ครบ");

    setLoading(true);
    const { error } = await supabase.from("ActivityMakerRequest").insert({
      user_id: user.id,
      maker_name: formData.maker_name,
      maker_description: formData.maker_description,
      reason: formData.reason
    });

    if (error) {
      alert(error.message);
    } else {
      alert("ส่งคำขอเรียบร้อย");
      setRequestStatus("pending");
      setFormData({ maker_name: "", maker_description: "", reason: "" });
    }
    setLoading(false);
  };

  const containerStyle = { maxWidth: 600, margin: "40px auto", padding: 20 };
  const cardStyle = { border: "1px solid #e5e7eb", borderRadius: 12, padding: 24, marginBottom: 20, background: "#fff", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" };
  const inputStyle = { width: "100%", padding: 10, margin: "8px 0 16px", borderRadius: 8, border: "1px solid #ccc", boxSizing: "border-box" };

  return (
    <div style={containerStyle}>
      <h1 style={{ marginBottom: 20 }}>⚙️ Settings</h1>

      {/* Profile Info */}
      <div style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>👤 ข้อมูลผู้ใช้</h3>
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>Role:</strong> <span style={{ textTransform: "capitalize", color: role === 'admin' ? 'red' : 'blue' }}>{role}</span></p>
        {role === 'student' && <p><strong>รหัสนักศึกษา:</strong> {profile?.student_id}</p>}
        {role === 'activity_maker' && <p><strong>ชื่อกลุ่มกิจกรรม:</strong> {profile?.name}</p>}
      </div>

      {/* Request Form */}
      <div style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>🌟 ขอเป็น Activity Maker (ผู้จัดกิจกรรม)</h3>
        
        {role === "activity_maker" || role === "admin" ? (
          <div style={{ padding: 10, background: "#dcfce7", color: "#166534", borderRadius: 8 }}>
            ✅ คุณได้รับสิทธิ์เป็นผู้จัดกิจกรรมแล้ว
          </div>
        ) : requestStatus === "pending" ? (
          <div style={{ padding: 10, background: "#fff3cd", color: "#856404", borderRadius: 8 }}>
            ⏳ คำขอของคุณกำลังรอการตรวจสอบจาก Admin
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label><strong>ชื่อกลุ่ม/ชมรม ที่ต้องการตั้ง:</strong></label>
            <input 
              type="text" 
              value={formData.maker_name}
              onChange={e => setFormData({...formData, maker_name: e.target.value})}
              style={inputStyle}
              placeholder="เช่น ชมรมอาสาพัฒนา, กลุ่มคนรักดนตรี"
              required
            />

            <label><strong>รายละเอียดกลุ่ม (สังเขป):</strong></label>
            <textarea 
              rows="2"
              value={formData.maker_description}
              onChange={e => setFormData({...formData, maker_description: e.target.value})}
              style={inputStyle}
            />

            <label><strong>เหตุผลในการขอสิทธิ์:</strong></label>
            <textarea 
              rows="3"
              value={formData.reason}
              onChange={e => setFormData({...formData, reason: e.target.value})}
              style={inputStyle}
              placeholder="เช่น ต้องการสร้างกิจกรรมสำหรับนักศึกษา..."
              required
            />

            <button 
              type="submit" 
              disabled={loading}
              style={{
                width: "100%",
                padding: 12,
                background: "#2563eb",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontWeight: "bold",
                cursor: loading ? "not-allowed" : "pointer"
              }}
            >
              {loading ? "กำลังส่งข้อมูล..." : "ส่งคำขอ"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}