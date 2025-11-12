<<<<<<< Updated upstream
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Layout from "./layout/Layout";
import ActivityBoard from "./pages/ActivityBoard";
import CalendarPage from "./pages/CalendarPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import RoleRedirect from "./components/RoleRedirect";
=======
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

import ProtectedRoute from "./components/ProtectedRoute";
import RoleRedirect from "./components/RoleRedirect";
import SidebarLayout from "./components/SidebarLayout";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CalendarPage from "./pages/CalendarPage";
import ActivityBoard from "./pages/ActivityBoard";
import Forbidden from "./pages/Forbidden";
import ProfilePage from "./pages/ProfilePage";

function AppShell() {
  return (
    <ProtectedRoute roles={["admin", "student", "guest", "activity_maker"]}>
      <SidebarLayout>
        <Outlet />
      </SidebarLayout>
    </ProtectedRoute>
  );
}
>>>>>>> Stashed changes

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
<<<<<<< Updated upstream
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<RoleRedirect />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="activity" element={<ActivityBoard />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="profile" element={<ProfilePage />} />
=======
          {/* นอก shell */}
          <Route path="/login" element={<Login />} />
          <Route path="/403" element={<Forbidden />} />
          <Route path="/" element={<RoleRedirect />} />

          {/* ใน shell */}
          <Route element={<AppShell />}>
            {/* ⬇️ ปล่อยให้เข้า Dashboard ได้เสมอ—ไปเช็กในหน้าเอง */}
            <Route path="/dashboard" element={<Dashboard />} />

            <Route
              path="/calendar"
              element={
                <ProtectedRoute roles={["guest", "student", "activity_maker", "admin"]}>
                  <CalendarPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/activity-board"
              element={
                <ProtectedRoute roles={["guest", "student", "activity_maker", "admin"]}>
                  <ActivityBoard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute roles={["admin", "student", "guest", "activity_maker"]}>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
>>>>>>> Stashed changes
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
<<<<<<< Updated upstream
export default App;
=======
>>>>>>> Stashed changes
