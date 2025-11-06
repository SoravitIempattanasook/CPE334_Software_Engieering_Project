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

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
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
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
export default App;
