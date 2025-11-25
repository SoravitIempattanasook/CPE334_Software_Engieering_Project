import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import { ProtectedRoute } from './components/ProtectedRoute';
import SidebarLayout from './components/SidebarLayout';
import TodayActivityModal from './components/TodayActivityModal'; // ✅ Import Modal

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import AdminRequests from './pages/AdminRequests';
import ActivityBoard from './pages/ActivityBoard'; 
import CalendarPage from './pages/CalendarPage';
import ProfilePage from './pages/ProfilePage';

// --- Placeholder Pages ---
const Forbidden = () => (
  <div style={{ padding: 40, textAlign: 'center', color: 'red' }}>
    <h1>⛔ 403 Forbidden</h1>
    <p>คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
  </div>
);

const RoleRedirect = () => {
  const { role, loading } = useAuth();
  if (loading) return null;

  if (role === 'admin') return <Navigate to="/admin-requests" replace />; // เปลี่ยนให้ Admin ไปหน้า Requests แทน หรือจะไป Dashboard ก็ได้
  if (role === 'activity_maker') return <Navigate to="/activity-board" replace />;
  
  return <Navigate to="/calendar" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/403" element={<Forbidden />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                {/* ✅ ใส่ Modal ไว้ตรงนี้ มันจะเช็คกิจกรรมและเด้งเตือนทุกครั้งที่เข้าสู่ระบบ */}
                <TodayActivityModal />
                
                {/* Layout หลัก */}
                <SidebarLayout />
              </ProtectedRoute>
            }
          >
            {/* หน้าแรกให้ RoleRedirect ทำงาน */}
            <Route index element={<RoleRedirect />} />

            {/* ✅ แก้ไข: เอา roles={['admin']} ออก 
              เพื่อให้ทุกคนที่ Login แล้วสามารถเข้า Dashboard ได้ 
            */}
            <Route
              path="dashboard"
              element={
                <Dashboard />
              }
            />
            
            <Route
              path="admin-requests"
              element={
                <ProtectedRoute roles={['admin']}>
                  <AdminRequests />
                </ProtectedRoute>
              }
            />

            <Route path="activity-board" element={<ActivityBoard />} />
            <Route path="calendar" element={<CalendarPage />} /> 
            <Route path="settings" element={<Settings />} />
            <Route path="profile" element={<ProfilePage />} />
            
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;