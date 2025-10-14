import { useAuth } from '../context/AuthContext'; // ตรวจสอบว่า import ถูกต้อง
import { supabase } from '../lib/supabaseClient'; // ตรวจสอบว่า import ถูกต้อง

function Dashboard() { // <--- เอา export ข้างหน้าออก
  const { user } = useAuth();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error logging out:', error.message);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '50px auto' }}>
      <h2>Dashboard (Protected Route)</h2>
      <p>
        Welcome, <strong>{user?.email}</strong>!
      </p>
      <pre style={{ background: '#eee', padding: '1rem', borderRadius: '5px', overflowX: 'auto' }}>
        {JSON.stringify(user, null, 2)}
      </pre>
      <button onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
}

export default Dashboard; // <--- เพิ่มบรรทัดนี้ที่ท้ายไฟล์