import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

export default function AdminRequests() {
  const { role } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    setLoading(true);
    // Get pending requests
    const { data, error } = await supabase
      .from("ActivityMakerRequest")
      .select("*") 
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) console.error("Error fetching requests:", error);
    else setRequests(data || []);
    setLoading(false);
  };

  useEffect(() => {
    // ดึงข้อมูลเฉพาะเมื่อ role เป็น admin
    if (role === 'admin') fetchRequests();
    else setLoading(false); // ถ้าไม่ใช่ admin ก็ไม่ต้อง loading ค้าง
  }, [role]);

  const handleApprove = async (req) => {
    if (!confirm(`อนุมัติให้ตั้งกลุ่ม "${req.maker_name}" ใช่หรือไม่?`)) return;

    try {
      // 1. Insert into ActivityMaker table
      const { error: insertErr } = await supabase
        .from("ActivityMaker")
        .insert({
          user_id: req.user_id,
          name: req.maker_name,
          description: req.maker_description
        });
      
      if (insertErr) throw insertErr;

      // 2. Update status in Request to approved
      const { error: updateErr } = await supabase
        .from("ActivityMakerRequest")
        .update({ status: "approved" })
        .eq("id", req.id);

      if (updateErr) throw updateErr;

      alert("✅ อนุมัติสำเร็จ! User นี้เป็น Activity Maker แล้ว");
      fetchRequests(); // Refresh list

    } catch (err) {
      alert("เกิดข้อผิดพลาด: " + err.message);
      console.error(err);
    }
  };

  const handleReject = async (id) => {
    if (!confirm("ปฏิเสธคำขอนี้?")) return;
    
    const { error } = await supabase
      .from("ActivityMakerRequest")
      .update({ status: "rejected" })
      .eq("id", id);

    if (error) alert(error.message);
    else fetchRequests();
  };

  // ถ้าไม่ใช่ Admin ให้แสดงข้อความ Access Denied
  if (role !== 'admin') {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#d32f2f" }}>
        <h2>⛔ Access Denied</h2>
        <p>คุณไม่มีสิทธิ์เข้าถึงหน้านี้ (เฉพาะ Admin เท่านั้น)</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 24 }}>🛡️ จัดการคำขอ (Admin)</h1>

      {loading ? (
        <p>Loading...</p>
      ) : requests.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, background: "#f9fafb", borderRadius: 8, color: "#666" }}>
          <p>ไม่มีคำขอที่รอการตรวจสอบ</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {requests.map((req) => (
            <div key={req.id} style={{ 
              border: "1px solid #e5e7eb", 
              borderRadius: 12, 
              padding: 20, 
              background: "#fff", 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "start",
              boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
            }}>
              <div>
                <h3 style={{ margin: "0 0 8px 0", color: "#2563eb" }}>{req.maker_name}</h3>
                <p style={{ margin: "4px 0", fontSize: 14, color: "#374151" }}>
                  <strong>รายละเอียด:</strong> {req.maker_description || "-"}
                </p>
                <p style={{ margin: "4px 0", fontSize: 14, color: "#374151" }}>
                  <strong>เหตุผล:</strong> {req.reason}
                </p>
                <p style={{ margin: "12px 0 0", fontSize: 12, color: "#6b7280" }}>
                  User ID: {req.user_id} <br/> 
                  เมื่อ: {new Date(req.created_at).toLocaleString()}
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button 
                  onClick={() => handleApprove(req)}
                  style={{ 
                    padding: "8px 16px", 
                    background: "#16a34a", 
                    color: "#fff", 
                    border: "none", 
                    borderRadius: 6, 
                    cursor: "pointer", 
                    fontWeight: "600",
                    fontSize: "0.9rem"
                  }}
                >
                  อนุมัติ
                </button>
                <button 
                  onClick={() => handleReject(req.id)}
                  style={{ 
                    padding: "8px 16px", 
                    background: "#dc2626", 
                    color: "#fff", 
                    border: "none", 
                    borderRadius: 6, 
                    cursor: "pointer", 
                    fontWeight: "600",
                    fontSize: "0.9rem"
                  }}
                >
                  ปฏิเสธ
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}