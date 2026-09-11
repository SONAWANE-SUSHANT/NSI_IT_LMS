import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { fetchStudentPortalView } from '../../services/adminStudentService';
import { updateUserStatus } from '../../services/adminUserService';
import { setViewingStudentId, clearViewingStudentId } from '../../utils/token';
import { StudentPortalContext } from '../../context/StudentPortalContext';
import AdminStudentViewBanner from './AdminStudentViewBanner';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';
import StudentLayout from '../student/StudentLayout';
import { UserX, ShieldAlert, CheckCircle, ArrowLeft, AlertTriangle } from 'lucide-react';

export default function AdminStudentPortalWrapper() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [student, setStudent] = useState(null);
  const [accountStatus, setAccountStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorInfo, setErrorInfo] = useState(null);
  const [isActivating, setIsActivating] = useState(false);

  // 3. Non-admin tries to access: /admin/students/:id/portal -> Return 403 / unauthorized
  const isAdmin = Boolean(isAuthenticated && user?.role === 'ADMIN');

  const handleReturnToAdmin = useCallback(() => {
    clearViewingStudentId();
    navigate('/admin/students');
  }, [navigate]);

  const loadStudent = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setErrorInfo(null);

    try {
      const res = await fetchStudentPortalView(id);

      if (res.isActive === false) {
        // 4. Inactive/Suspended student account
        setStudent(res.data?.student || null);
        setAccountStatus(res.status || 'INACTIVE');
        setErrorInfo({
          type: 'INACTIVE_STATUS',
          status: res.status || 'INACTIVE',
          message: res.message || 'Student account is not active.',
          student: res.data?.student,
        });
        clearViewingStudentId();
      } else {
        // Active student
        setStudent(res.data?.student || null);
        setAccountStatus(res.data?.student?.status || 'ACTIVE');
        setViewingStudentId(id);
      }
    } catch (err) {
      clearViewingStudentId();
      if (err.status === 404) {
        // 1. Invalid student ID
        setErrorInfo({
          type: 'NOT_FOUND',
          message: err.message || `No student found with ID #${id}`,
        });
      } else if (err.status === 400) {
        // 2. User is not a student
        setErrorInfo({
          type: 'NOT_STUDENT',
          message: err.message || 'The specified user is not registered as a student.',
        });
      } else if (err.status === 403) {
        // 3. Unauthorized
        setErrorInfo({
          type: 'FORBIDDEN',
          message: 'You are not authorized to view student portals.',
        });
      } else {
        setErrorInfo({
          type: 'SERVER_ERROR',
          message: err.message || 'Failed to load student portal',
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (isAdmin) {
      loadStudent();
    }
    return () => {
      clearViewingStudentId();
    };
  }, [isAdmin, loadStudent]);

  const handleActivateAccount = async () => {
    if (!id) return;
    setIsActivating(true);
    try {
      await updateUserStatus(id, 'ACTIVE');
      await loadStudent();
    } catch (err) {
      alert(err.message || 'Failed to activate student');
    } finally {
      setIsActivating(false);
    }
  };

  // 3. Unauthorized access check
  if (!isAdmin) {
    return <Navigate to="/unauthorized" state={{ attemptedPortal: 'admin' }} replace />;
  }

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center">
        <div className="w-full max-w-md bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center">
          <LoadingState rows={3} />
          <p className="mt-4 text-xs font-semibold text-slate-500">
            Verifying student account and loading learner workspace...
          </p>
        </div>
      </div>
    );
  }

  // 1. Invalid Student ID -> Not Found State
  if (errorInfo?.type === 'NOT_FOUND') {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center">
        <div className="w-full max-w-lg bg-white rounded-3xl p-8 border border-slate-200 shadow-lg text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-xs border border-rose-100">
            <UserX size={32} />
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full">
              404 Not Found
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 mt-2">
              Student Not Found
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-md mx-auto">
              We could not find any student with ID <strong className="font-mono text-slate-700">#{id}</strong>. The student account may have been removed or the URL link is invalid.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleReturnToAdmin}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-semibold text-xs rounded-xl shadow-xs transition-all"
            >
              <ArrowLeft size={15} />
              <span>Return to Student Management</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. User is not a student -> Do not open student portal
  if (errorInfo?.type === 'NOT_STUDENT') {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center">
        <div className="w-full max-w-lg bg-white rounded-3xl p-8 border border-slate-200 shadow-lg text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-xs border border-amber-100">
            <ShieldAlert size={32} />
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
              Invalid Portal Role
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 mt-2">
              User is Not a Student
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-md mx-auto">
              Account <strong className="font-mono text-slate-700">#{id}</strong> is not assigned to the <strong className="text-slate-800">STUDENT</strong> role. In accordance with platform security rules, the student portal cannot be opened for non-student users.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleReturnToAdmin}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-all"
            >
              <ArrowLeft size={15} />
              <span>Return to Student Management</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Inactive or Suspended Student Account
  if (errorInfo?.type === 'INACTIVE_STATUS') {
    const studentName = student
      ? `${student.first_name || ''} ${student.last_name || ''}`.trim() || student.username
      : `Student #${id}`;

    return (
      <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center">
        <div className="w-full max-w-lg bg-white rounded-3xl p-8 border border-slate-200 shadow-lg text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-xs border border-amber-100">
            <AlertTriangle size={32} />
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full">
              Account Status: {accountStatus}
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 mt-2">
              Student Account is {accountStatus}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-md mx-auto">
              <strong className="text-slate-900">{studentName}</strong> (@{student?.username || id}) is currently set to <strong className="font-bold text-amber-700">{accountStatus}</strong>.
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Under NSI IT LMS rules, inactive and suspended student accounts cannot access enrolled courses, lecture notes, or schedule sessions. You can activate this student below or return to management.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleActivateAccount}
              disabled={isActivating}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-all disabled:opacity-50"
            >
              <CheckCircle size={15} />
              <span>{isActivating ? 'Activating...' : 'Activate Student Account'}</span>
            </button>

            <button
              type="button"
              onClick={handleReturnToAdmin}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all"
            >
              <ArrowLeft size={15} />
              <span>Return to Management</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Generic Server Error
  if (errorInfo) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-slate-200 shadow-lg text-center space-y-4">
          <ErrorState
            title="Failed to open student portal"
            message={errorInfo.message}
            onRetry={loadStudent}
          />
          <button
            type="button"
            onClick={handleReturnToAdmin}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all"
          >
            <ArrowLeft size={14} />
            <span>Return to Student Management</span>
          </button>
        </div>
      </div>
    );
  }

  // 5 & 6. Active student view context
  const contextValue = {
    currentStudent: student,
    isViewingAsAdmin: true,
    baseRoute: `/admin/students/${id}/portal`,
    returnToAdmin: handleReturnToAdmin,
    isLoading: false,
    error: null,
    refreshStudent: loadStudent,
  };

  return (
    <StudentPortalContext.Provider value={contextValue}>
      <div className="min-h-screen flex flex-col">
        <AdminStudentViewBanner
          student={student}
          onReturnToAdmin={handleReturnToAdmin}
        />
        <div className="flex-1">
          <StudentLayout />
        </div>
      </div>
    </StudentPortalContext.Provider>
  );
}
