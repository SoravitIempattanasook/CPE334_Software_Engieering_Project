import { Link } from "react-router-dom";

export default function Forbidden() {
  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'center', 
      alignItems: 'center', 
      background: '#f1f5f9',
      fontFamily: 'sans-serif'
    }}>
      <h1 style={{ fontSize: '4rem', color: '#dc2626', marginBottom: 0 }}>403</h1>
      <h2 style={{ color: '#1e293b', marginTop: 10 }}>Access Denied</h2>
      <p style={{ color: '#64748b' }}>คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
      <Link to="/" style={{ 
        marginTop: 20, 
        padding: '10px 20px', 
        background: '#2563eb', 
        color: '#fff', 
        textDecoration: 'none', 
        borderRadius: 8,
        fontWeight: 'bold'
      }}>
        กลับหน้าหลัก
      </Link>
    </div>
  );
}