// frontend/src/App.jsx
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import ProtectedRoute from './components/ProtectedRoute';
import RoleRedirect from './components/RoleRedirect';
import SidebarLayout from './components/SidebarLayout';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CalendarPage from './pages/CalendarPage';
import ActivityBoard from './pages/ActivityBoard';
import Forbidden from './pages/Forbidden';
import ProfilePage from './pages/ProfilePage';

// Layout ที่คง Sidebar ไว้ทุกหน้า (หลังล็อกอิน)
function AppShell() {
  return (
    <ProtectedRoute roles={['admin', 'student', 'guest', 'activity_maker']}>
      <SidebarLayout>
        <Outlet />
      </SidebarLayout>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* หน้าไม่ต้องมี Sidebar */}
          <Route path="/login" element={<Login />} />

          {/* กลุ่มหน้าที่ต้องมี Sidebar คงอยู่ */}
          <Route element={<AppShell />}>
            {/* root: เด้งไปตาม role */}
            <Route path="/" element={<RoleRedirect />} />

            {/* admin → dashboard */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute roles={['admin']}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* student & guest → calendar */}
            <Route
              path="/calendar"
              element={
                <ProtectedRoute roles={['student', 'guest']}>
                  <CalendarPage />
                </ProtectedRoute>
              }
            />

            {/* activity_maker → activity board */}
            <Route
              path="/activity-board"
              element={
                <ProtectedRoute roles={['activity_maker']}>
                  <ActivityBoard />
                </ProtectedRoute>
              }
            />

            {/* โปรไฟล์: ให้ทุกบทบาทที่ล็อกอินเข้าถึงได้ */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute roles={['admin', 'student', 'guest', 'activity_maker']}>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* หน้าข้อความสิทธิ์ไม่พอ (ยังมี Sidebar) */}
            <Route path="/403" element={<Forbidden />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
