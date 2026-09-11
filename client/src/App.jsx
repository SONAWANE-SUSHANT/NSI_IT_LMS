import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/useAuth';

// Auth / Common
import LoginPage from './pages/LoginPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import ProtectedRoute from './components/common/ProtectedRoute';

function RoleDefaultRedirect() {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  const role = user.role?.toUpperCase();
  if (role === 'ADMIN') return <Navigate to="/admin" replace />;
  if (role === 'INSTRUCTOR') return <Navigate to="/instructor" replace />;
  if (role === 'STUDENT') return <Navigate to="/student" replace />;
  return <Navigate to="/login" replace />;
}

// Admin portal
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/AdminDashboard';
import StudentsPage from './pages/admin/StudentsPage';
import InstructorsPage from './pages/admin/InstructorsPage';
import AdminsPage from './pages/admin/AdminsPage';
import CoursesPage from './pages/admin/CoursesPage';
import BatchesPage from './pages/admin/BatchesPage';
import BatchAssignmentsPage from './pages/admin/BatchAssignmentsPage';
import AdminPlaceholderPage from './pages/admin/AdminPlaceholderPage';
import CourseContentPage from './pages/admin/CourseContentPage';
import AdminInstructorPortalWrapper from './components/admin/AdminInstructorPortalWrapper';
import AdminStudentPortalWrapper from './components/admin/AdminStudentPortalWrapper';

// Student portal
import StudentLayout from './components/student/StudentLayout';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentSchedulePage from './pages/student/StudentSchedulePage';
import StudentCoursesPage from './pages/student/StudentCoursesPage';

// Instructor portal
import InstructorLayout from './components/instructor/InstructorLayout';
import InstructorDashboard from './pages/instructor/InstructorDashboard';
import InstructorSchedulePage from './pages/instructor/InstructorSchedulePage';
import InstructorBatchesPage from './pages/instructor/InstructorBatchesPage';

import ScheduleCalendarPage from './pages/shared/ScheduleCalendarPage';

import './App.css';

export default function App() {
  return (
    <Routes>
      {/* ── Public ── */}
      <Route path="/login" element={<LoginPage />} />

      {/* ── Direct Role Redirect ── */}
      <Route path="/portal-selection" element={<RoleDefaultRedirect />} />

      {/* ── Student Portal ── */}
      <Route
        path="/student"
        element={
          <ProtectedRoute requiredPortal="student">
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<StudentDashboard />} />
        <Route path="courses" element={<StudentCoursesPage />} />
        <Route path="schedule" element={<StudentSchedulePage />} />
      </Route>

      {/* ── Instructor Portal ── */}
      <Route
        path="/instructor"
        element={
          <ProtectedRoute requiredPortal="instructor">
            <InstructorLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<InstructorDashboard />} />
        <Route path="batches" element={<InstructorBatchesPage />} />
        <Route path="schedule" element={<InstructorSchedulePage />} />
        <Route path="content" element={<CourseContentPage />} />
      </Route>

      {/* ── View Instructor Portal (Admin View Context) ── */}
      <Route
        path="/admin/instructors/:id/portal"
        element={
          <ProtectedRoute requiredPortal="admin">
            <AdminInstructorPortalWrapper />
          </ProtectedRoute>
        }
      >
        <Route index element={<InstructorDashboard />} />
        <Route path="batches" element={<InstructorBatchesPage />} />
        <Route path="schedule" element={<InstructorSchedulePage />} />
        <Route path="content" element={<CourseContentPage />} />
      </Route>

      {/* ── View Student Portal (Admin View Context) ── */}
      <Route
        path="/admin/students/:id/portal"
        element={
          <ProtectedRoute requiredPortal="admin">
            <AdminStudentPortalWrapper />
          </ProtectedRoute>
        }
      >
        <Route index element={<StudentDashboard />} />
        <Route path="courses" element={<StudentCoursesPage />} />
        <Route path="schedule" element={<StudentSchedulePage />} />
      </Route>

      {/* ── Admin Portal ── */}
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
        <Route path="courses/content" element={<CourseContentPage />} />

        {/* Assignments */}
        <Route path="batch-instructors" element={<BatchAssignmentsPage mode="instructors" />} />
        <Route path="batch-students" element={<BatchAssignmentsPage mode="students" />} />

        {/* Scheduling Calendar */}
        <Route path="scheduling" element={<ScheduleCalendarPage role="admin" />} />

        {/* Phase 3 placeholders */}
        <Route path="attendance" element={<AdminPlaceholderPage title="Attendance Tracking" phase="Phase 3" description="Daily attendance logging, session reports, and biometric reconciliation." />} />
        <Route path="reports" element={<AdminPlaceholderPage title="Analytics & Reports" phase="Phase 3" description="Platform utilization metrics, student performance analytics, and audit logs." />} />
        <Route path="notifications" element={<AdminPlaceholderPage title="System Notifications" phase="Phase 3" description="Broadcast announcements, email triggers, and push notifications." />} />
        <Route path="settings" element={<AdminPlaceholderPage title="Platform Settings" phase="Phase 3" description="Security settings, database backup configuration, and LMS portal branding." />} />
      </Route>

      {/* ── Access Denied ── */}
      <Route
        path="/unauthorized"
        element={
          <ProtectedRoute>
            <UnauthorizedPage />
          </ProtectedRoute>
        }
      />

      {/* ── Redirects ── */}
      <Route path="/" element={<RoleDefaultRedirect />} />
      <Route path="*" element={<RoleDefaultRedirect />} />
    </Routes>
  );
}
