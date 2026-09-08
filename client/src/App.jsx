import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import PortalSelectionPage from './pages/PortalSelectionPage';
import StudentDashboard from './pages/StudentDashboard';
import InstructorDashboard from './pages/InstructorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import StudentsPage from './pages/admin/StudentsPage';
import InstructorsPage from './pages/admin/InstructorsPage';
import AdminsPage from './pages/admin/AdminsPage';
import CoursesPage from './pages/admin/CoursesPage';
import BatchesPage from './pages/admin/BatchesPage';
import BatchAssignmentsPage from './pages/admin/BatchAssignmentsPage';
import AdminPlaceholderPage from './pages/admin/AdminPlaceholderPage';
import CourseContentPage from './pages/admin/CourseContentPage';
import AdminLayout from './components/admin/AdminLayout';
import UnauthorizedPage from './pages/UnauthorizedPage';
import ProtectedRoute from './components/common/ProtectedRoute';
import './App.css';

export default function App() {
  return (
    <Routes>
      {/* Public / Auth Entry Route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Portal Selection */}
      <Route
        path="/portal-selection"
        element={
          <ProtectedRoute>
            <PortalSelectionPage />
          </ProtectedRoute>
        }
      />

      {/* Role-Protected Portal Dashboards */}
      <Route
        path="/student"
        element={
          <ProtectedRoute requiredPortal="student">
            <StudentDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/instructor"
        element={
          <ProtectedRoute requiredPortal="instructor">
            <InstructorDashboard />
          </ProtectedRoute>
        }
      />

      {/* Protected Admin Portal with Nested Admin Layout */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredPortal="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="instructors" element={<InstructorsPage />} />
        <Route path="admins" element={<AdminsPage />} />

        {/* Courses */}
        <Route path="courses" element={<CoursesPage />} />
        <Route path="batches" element={<BatchesPage />} />
        <Route
          path="courses/content"
          element={<CourseContentPage />}
        />

        {/* Assignments */}
        <Route path="batch-instructors" element={<BatchAssignmentsPage mode="instructors" />} />
        <Route path="batch-students" element={<BatchAssignmentsPage mode="students" />} />

        {/* Operations Placeholders */}
        <Route
          path="scheduling"
          element={
            <AdminPlaceholderPage
              title="Scheduling & Timetable"
              phase="Phase 3"
              description="Lecture slots, timetable management, instructor batch assignment, and calendar."
            />
          }
        />
        <Route
          path="attendance"
          element={
            <AdminPlaceholderPage
              title="Attendance Tracking"
              phase="Phase 3"
              description="Daily attendance logging, session reports, and biometric reconciliation."
            />
          }
        />

        {/* Analytics & System Placeholders */}
        <Route
          path="reports"
          element={
            <AdminPlaceholderPage
              title="Analytics & Reports"
              phase="Phase 3"
              description="Platform utilization metrics, student performance analytics, and audit logs."
            />
          }
        />
        <Route
          path="notifications"
          element={
            <AdminPlaceholderPage
              title="System Notifications"
              phase="Phase 3"
              description="Broadcast announcements, email triggers, and push notifications."
            />
          }
        />
        <Route
          path="settings"
          element={
            <AdminPlaceholderPage
              title="Platform Settings"
              phase="Phase 3"
              description="Security settings, database backup configuration, and LMS portal branding."
            />
          }
        />
      </Route>

      {/* Access Denied Page */}
      <Route
        path="/unauthorized"
        element={
          <ProtectedRoute>
            <UnauthorizedPage />
          </ProtectedRoute>
        }
      />

      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/portal-selection" replace />} />

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/portal-selection" replace />} />
    </Routes>
  );
}
