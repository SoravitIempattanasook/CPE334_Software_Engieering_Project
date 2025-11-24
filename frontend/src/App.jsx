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
import Settings from './pages/Settings';
import AdminRequests from './pages/AdminRequests';

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
          {/* หน้า login ไม่ต้องมี Sidebar */}
          <Route path="/login" element={<Login />} />

          {/* ส่วนที่มี Sidebar */}
          <Route element={<AppShell />}>
            {/* redirect ตาม role */}
            <Route path="/" element={<RoleRedirect />} />

            {/* admin */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute roles={['admin']}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/admin/requests"
              element={
                <ProtectedRoute roles={['admin']}>
                  <AdminRequests />
                </ProtectedRoute>
              }
            />

            {/* calendar: เปิดให้ทุกคนเข้าได้ */}
            <Route
              path="/calendar"
              element={
                <ProtectedRoute roles={['guest', 'student', 'activity_maker', 'admin']}>
                  <CalendarPage />
                </ProtectedRoute>
              }
            />

            {/* activity board: เปิดให้ทุกคนเข้าได้ */}
            <Route
              path="/activity-board"
              element={
                <ProtectedRoute roles={['guest', 'student', 'activity_maker', 'admin']}>
                  <ActivityBoard />
                </ProtectedRoute>
              }
            />

            {/* settings: เปิดให้ทุกคนเข้าได้ (มี logic แยกข้างใน) */}
            <Route
              path="/settings"
              element={
                <ProtectedRoute roles={['guest', 'student', 'activity_maker', 'admin']}>
                  <Settings />
                </ProtectedRoute>
              }
            />

            {/* profile */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute roles={['admin', 'student', 'guest', 'activity_maker']}>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* หน้า Forbidden */}
            <Route path="/403" element={<Forbidden />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;