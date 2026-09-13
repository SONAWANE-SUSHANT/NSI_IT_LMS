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
import AdminReportsPage from './pages/admin/AdminReportsPage';
import AdminNotificationsPage from './pages/admin/AdminNotificationsPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AdminInstructorPortalWrapper from './components/admin/AdminInstructorPortalWrapper';
import AdminStudentPortalWrapper from './components/admin/AdminStudentPortalWrapper';

// Quizzes / Assessments
import InstructorQuizzesPage from './pages/instructor/InstructorQuizzesPage';
import QuizBuilderPage from './pages/instructor/QuizBuilderPage';
import QuizAttemptsPage from './pages/instructor/QuizAttemptsPage';
import StudentQuizzesPage from './pages/student/StudentQuizzesPage';
import StudentQuizDetailPage from './pages/student/StudentQuizDetailPage';
import StudentQuizTakingPage from './pages/student/StudentQuizTakingPage';
import StudentQuizResultPage from './pages/student/StudentQuizResultPage';

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

// Announcements
import StudentAnnouncementsPage from './pages/student/StudentAnnouncementsPage';
import InstructorAnnouncementsPage from './pages/instructor/InstructorAnnouncementsPage';
import AdminAnnouncementsPage from './pages/admin/AdminAnnouncementsPage';
import UserProfilePage from './pages/shared/UserProfilePage';

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
        <Route path="quizzes" element={<StudentQuizzesPage />} />
        <Route path="quizzes/:quizId" element={<StudentQuizDetailPage />} />
        <Route path="quizzes/:quizId/attempt/:attemptId" element={<StudentQuizTakingPage />} />
        <Route path="quizzes/:quizId/results/:attemptId" element={<StudentQuizResultPage />} />
        <Route path="announcements" element={<StudentAnnouncementsPage />} />
        <Route path="profile" element={<UserProfilePage role="STUDENT" />} />
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
        <Route path="quizzes" element={<InstructorQuizzesPage />} />
        <Route path="quizzes/builder" element={<QuizBuilderPage />} />
        <Route path="quizzes/builder/:quizId" element={<QuizBuilderPage />} />
        <Route path="quizzes/:quizId/attempts" element={<QuizAttemptsPage />} />
        <Route path="announcements" element={<InstructorAnnouncementsPage />} />
        <Route path="profile" element={<UserProfilePage role="INSTRUCTOR" />} />
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
        <Route path="quizzes" element={<InstructorQuizzesPage />} />
        <Route path="quizzes/builder" element={<QuizBuilderPage />} />
        <Route path="quizzes/builder/:quizId" element={<QuizBuilderPage />} />
        <Route path="quizzes/:quizId/attempts" element={<QuizAttemptsPage />} />
        <Route path="announcements" element={<InstructorAnnouncementsPage />} />
        <Route path="profile" element={<UserProfilePage role="INSTRUCTOR" />} />
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
        <Route path="quizzes" element={<StudentQuizzesPage />} />
        <Route path="quizzes/:quizId" element={<StudentQuizDetailPage />} />
        <Route path="quizzes/:quizId/attempt/:attemptId" element={<StudentQuizTakingPage />} />
        <Route path="quizzes/:quizId/results/:attemptId" element={<StudentQuizResultPage />} />
        <Route path="announcements" element={<StudentAnnouncementsPage />} />
        <Route path="profile" element={<UserProfilePage role="STUDENT" />} />
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
        <Route path="quizzes" element={<InstructorQuizzesPage basePathOverride="/admin" />} />
        <Route path="quizzes/builder" element={<QuizBuilderPage basePathOverride="/admin" />} />
        <Route path="quizzes/builder/:quizId" element={<QuizBuilderPage basePathOverride="/admin" />} />
        <Route path="quizzes/:quizId/attempts" element={<QuizAttemptsPage basePathOverride="/admin" />} />

        {/* Assignments */}
        <Route path="batch-instructors" element={<BatchAssignmentsPage mode="instructors" />} />
        <Route path="batch-students" element={<BatchAssignmentsPage mode="students" />} />

        {/* Scheduling Calendar */}
        <Route path="scheduling" element={<ScheduleCalendarPage role="admin" />} />

        {/* Operations & Communications */}
        <Route path="announcements" element={<AdminAnnouncementsPage />} />
        <Route path="notifications" element={<AdminNotificationsPage />} />
        <Route path="attendance" element={<AdminPlaceholderPage title="Attendance Tracking" phase="Phase 3" description="Daily attendance logging, session reports, and biometric reconciliation." />} />
        <Route path="reports" element={<AdminReportsPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
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
