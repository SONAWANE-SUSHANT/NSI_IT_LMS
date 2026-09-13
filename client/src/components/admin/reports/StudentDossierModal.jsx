import { useState, useEffect } from 'react';
import {
  X,
  Printer,
  Download,
  GraduationCap,
  Award,
  BookOpen,
  Clock,
  Shield,
  Smartphone,
  Calendar,
  Mail,
  Phone,
  User,
  CheckCircle2,
  XCircle,
  Star,
  ExternalLink,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { getStudentDossierReport } from '../../../services/adminReportService';
import { exportToCsv } from '../../../utils/csvExport';

export default function StudentDossierModal({ studentId, onClose }) {
  const [dossier, setDossier] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSubTab, setActiveSubTab] = useState('courses');

  useEffect(() => {
    let isMounted = true;
    if (!studentId) return;

    const fetchDossier = async () => {
      setIsLoading(true);
      setError('');
      try {
        const data = await getStudentDossierReport(studentId);
        if (isMounted) {
          setDossier(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load student dossier.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchDossier();
    return () => {
      isMounted = false;
    };
  }, [studentId]);

  // Handle browser print
  const handlePrint = () => {
    window.print();
  };

  // Handle exporting student records as CSV
  const handleExportStudentCsv = () => {
    if (!dossier) return;

    if (activeSubTab === 'courses') {
      exportToCsv({
        data: dossier.enrollments,
        filename: `${dossier.student.username}_courses_progress`,
        columns: [
          { key: 'course_code', label: 'Course Code' },
          { key: 'course_name', label: 'Course Name' },
          { key: 'batch_name', label: 'Batch' },
          { key: 'batch_mode', label: 'Mode' },
          { key: 'instructors', label: 'Instructors' },
          { key: 'completion_percentage', label: 'Progress (%)' },
          { key: 'completed_sessions', label: 'Completed Sessions' },
          { key: 'total_sessions', label: 'Total Sessions' },
          { key: 'is_completed', label: 'Course Completed' },
          { key: 'enrollment_status', label: 'Enrollment Status' },
          { key: 'enrollment_date', label: 'Enrollment Date' },
        ],
      });
    } else if (activeSubTab === 'quizzes') {
      exportToCsv({
        data: dossier.quizzes,
        filename: `${dossier.student.username}_quizzes_scorecard`,
        columns: [
          { key: 'quiz_title', label: 'Quiz Title' },
          { key: 'course_name', label: 'Course' },
          { key: 'attempt_number', label: 'Attempt #' },
          { key: 'score', label: 'Score Obtained' },
          { key: 'total_marks', label: 'Total Marks' },
          { key: 'percentage', label: 'Percentage (%)' },
          { key: 'passed', label: 'Passed' },
          { key: 'status', label: 'Status' },
          { key: 'submitted_at', label: 'Submitted At' },
        ],
      });
    } else if (activeSubTab === 'sessions') {
      exportToCsv({
        data: dossier.sessions,
        filename: `${dossier.student.username}_sessions_attendance`,
        columns: [
          { key: 'title', label: 'Session Title' },
          { key: 'module_title', label: 'Module' },
          { key: 'course_name', label: 'Course' },
          { key: 'session_type', label: 'Session Type' },
          { key: 'duration_minutes', label: 'Duration (Mins)' },
          { key: 'completed', label: 'Completed' },
          { key: 'completed_at', label: 'Completed At' },
        ],
      });
    } else if (activeSubTab === 'devices') {
      exportToCsv({
        data: dossier.devices,
        filename: `${dossier.student.username}_device_audit`,
        columns: [
          { key: 'device_name', label: 'Device Name' },
          { key: 'device_type', label: 'Device Type' },
          { key: 'browser', label: 'Browser' },
          { key: 'operating_system', label: 'Operating System' },
          { key: 'last_ip_address', label: 'Last IP Address' },
          { key: 'status', label: 'Status' },
          { key: 'last_active_at', label: 'Last Active At' },
        ],
      });
    } else {
      // Export general student summary
      exportToCsv({
        data: [
          {
            student_id: dossier.student.id,
            name: dossier.student.full_name,
            email: dossier.student.email,
            phone: dossier.student.contact_no,
            enrolled_courses: dossier.kpi.total_courses_enrolled,
            avg_progress: dossier.kpi.overall_avg_progress + '%',
            completed_sessions: dossier.kpi.total_sessions_completed,
            quizzes_taken: dossier.kpi.total_quiz_attempts,
            quizzes_passed: dossier.kpi.passed_quiz_attempts,
            avg_quiz_score: dossier.kpi.avg_quiz_score_pct + '%',
          },
        ],
        filename: `${dossier.student.username}_summary_dossier`,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white print:static print:inset-auto">
      <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden print:max-w-none print:max-h-none print:shadow-none print:border-none">
        
        {/* Header Bar */}
        <div className="px-6 py-4.5 bg-slate-900 text-white flex items-center justify-between gap-4 border-b border-slate-800 print:bg-white print:text-slate-950 print:border-b-2 print:border-slate-950">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 print:hidden">
              <GraduationCap size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300 print:text-indigo-700">
                  NSI IT Learning Management System
                </span>
                <span className="hidden sm:inline-block text-slate-500 print:hidden">•</span>
                <span className="text-xs text-slate-400 print:text-slate-600 hidden sm:inline-block">
                  Student Comprehensive Academic Dossier
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white print:text-slate-950">
                {isLoading
                  ? 'Loading Student Dossier...'
                  : dossier
                  ? `${dossier.student.full_name} (${dossier.student.username})`
                  : 'Student Profile'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            {dossier && (
              <>
                <button
                  onClick={handleExportStudentCsv}
                  title="Export active table as CSV"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition border border-slate-700"
                >
                  <Download size={14} />
                  <span className="hidden sm:inline">Export CSV</span>
                </button>
                <button
                  onClick={handlePrint}
                  title="Print or Save as PDF"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition shadow-xs"
                >
                  <Printer size={14} />
                  <span>Print / Save PDF</span>
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition ml-2"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body / Printable Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 print:overflow-visible print:p-4">
          {isLoading && (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
              <Loader2 size={36} className="animate-spin text-indigo-600" />
              <p className="text-sm font-medium">Aggregating 360° academic & security records...</p>
            </div>
          )}

          {error && (
            <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-center">
              <p className="font-semibold">{error}</p>
            </div>
          )}

          {dossier && !isLoading && (
            <>
              {/* Profile Card & Demographics */}
              <div className="bg-gradient-to-br from-slate-50 to-indigo-50/40 rounded-2xl border border-slate-200 p-5 sm:p-6 print:border-slate-300 print:bg-white">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-2xl shadow-md border-2 border-white overflow-hidden">
                      {dossier.student.photo ? (
                        <img
                          src={dossier.student.photo}
                          alt={dossier.student.full_name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        `${dossier.student.first_name?.[0] || ''}${
                          dossier.student.last_name?.[0] || ''
                        }`.toUpperCase()
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-xl font-extrabold text-slate-900">
                          {dossier.student.full_name}
                        </h3>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                            dossier.student.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {dossier.student.status}
                        </span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 font-medium">
                          ID: #{dossier.student.id}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-600 mt-2 flex-wrap">
                        <span className="inline-flex items-center gap-1">
                          <Mail size={13} className="text-slate-400" />
                          <span>{dossier.student.email}</span>
                        </span>
                        {dossier.student.contact_no && (
                          <span className="inline-flex items-center gap-1">
                            <Phone size={13} className="text-slate-400" />
                            <span>{dossier.student.contact_no}</span>
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <Calendar size={13} className="text-slate-400" />
                          <span>
                            Joined:{' '}
                            {new Date(dossier.student.created_at).toLocaleDateString('en-GB')}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right sm:border-l sm:border-slate-200 sm:pl-6 text-xs text-slate-500">
                    <div>Username: <strong className="text-slate-800">{dossier.student.username}</strong></div>
                    <div>Gender: <span className="capitalize">{dossier.student.gender?.toLowerCase() || 'N/A'}</span></div>
                    <div>DOB: {dossier.student.date_of_birth || 'N/A'}</div>
                  </div>
                </div>
              </div>

              {/* KPI Performance Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 print:grid-cols-4">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between text-indigo-600 mb-1">
                    <span className="text-xs font-semibold text-slate-500">Overall Progress</span>
                    <Award size={16} />
                  </div>
                  <div className="text-2xl font-black text-slate-900">
                    {dossier.kpi.overall_avg_progress}%
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Across {dossier.kpi.total_courses_enrolled} enrolled courses
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between text-emerald-600 mb-1">
                    <span className="text-xs font-semibold text-slate-500">Sessions Finished</span>
                    <CheckCircle2 size={16} />
                  </div>
                  <div className="text-2xl font-black text-slate-900">
                    {dossier.kpi.total_sessions_completed}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">Lectures & labs completed</p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between text-amber-600 mb-1">
                    <span className="text-xs font-semibold text-slate-500">Quiz Pass Rate</span>
                    <Award size={16} />
                  </div>
                  <div className="text-2xl font-black text-slate-900">
                    {dossier.kpi.total_quiz_attempts > 0
                      ? `${Math.round(
                          (dossier.kpi.passed_quiz_attempts / dossier.kpi.total_quiz_attempts) * 100
                        )}%`
                      : '0%'}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {dossier.kpi.passed_quiz_attempts} / {dossier.kpi.total_quiz_attempts} passed (Avg: {dossier.kpi.avg_quiz_score_pct}%)
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between text-blue-600 mb-1">
                    <span className="text-xs font-semibold text-slate-500">Security Devices</span>
                    <Smartphone size={16} />
                  </div>
                  <div className="text-2xl font-black text-slate-900">
                    {dossier.kpi.active_devices_count}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">Active registered devices</p>
                </div>
              </div>

              {/* Subtabs for Interactive View (hidden on print) */}
              <div className="flex items-center gap-2 border-b border-slate-200 print:hidden overflow-x-auto">
                <button
                  onClick={() => setActiveSubTab('courses')}
                  className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition whitespace-nowrap ${
                    activeSubTab === 'courses'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Courses & Batches ({dossier.enrollments.length})
                </button>
                <button
                  onClick={() => setActiveSubTab('quizzes')}
                  className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition whitespace-nowrap ${
                    activeSubTab === 'quizzes'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Quiz Scorecard ({dossier.quizzes.length})
                </button>
                <button
                  onClick={() => setActiveSubTab('sessions')}
                  className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition whitespace-nowrap ${
                    activeSubTab === 'sessions'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Session Progress ({dossier.sessions.length})
                </button>
                <button
                  onClick={() => setActiveSubTab('devices')}
                  className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition whitespace-nowrap ${
                    activeSubTab === 'devices'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Device Security ({dossier.devices.length})
                </button>
                <button
                  onClick={() => setActiveSubTab('reviews')}
                  className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition whitespace-nowrap ${
                    activeSubTab === 'reviews'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Reviews ({dossier.reviews.length})
                </button>
              </div>

              {/* Subtab 1: Courses & Progress */}
              <div className={`${activeSubTab === 'courses' ? 'block' : 'hidden'} print:block space-y-4`}>
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                  <BookOpen size={16} className="text-indigo-600" />
                  <span>Enrolled Courses & Academic Progress</span>
                </h4>
                {dossier.enrollments.length === 0 ? (
                  <p className="text-sm text-slate-400 py-4">No enrolled courses found for this student.</p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3">Course</th>
                          <th className="px-4 py-3">Batch</th>
                          <th className="px-4 py-3">Mode</th>
                          <th className="px-4 py-3">Progress</th>
                          <th className="px-4 py-3 text-center">Sessions</th>
                          <th className="px-4 py-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {dossier.enrollments.map((enr) => (
                          <tr key={enr.enrollment_id} className="hover:bg-slate-50/60 transition">
                            <td className="px-4 py-3 font-medium text-slate-900">
                              <div className="font-semibold">{enr.course_name}</div>
                              <div className="text-[11px] text-slate-400">{enr.course_code}</div>
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              <div>{enr.batch_name}</div>
                              {enr.instructors && (
                                <div className="text-[10px] text-slate-400">Inst: {enr.instructors}</div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-slate-500">{enr.batch_mode || 'ONLINE'}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      enr.completion_percentage >= 100
                                        ? 'bg-emerald-500'
                                        : enr.completion_percentage >= 50
                                        ? 'bg-indigo-600'
                                        : 'bg-amber-500'
                                    }`}
                                    style={{ width: `${Math.min(enr.completion_percentage, 100)}%` }}
                                  />
                                </div>
                                <span className="font-bold text-slate-700">
                                  {enr.completion_percentage}%
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center text-slate-600">
                              {enr.completed_sessions} / {enr.total_sessions}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span
                                className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  enr.is_completed
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                }`}
                              >
                                {enr.is_completed ? 'COMPLETED' : enr.enrollment_status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Subtab 2: Quiz Scorecard */}
              <div className={`${activeSubTab === 'quizzes' ? 'block' : 'hidden'} print:block space-y-4`}>
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                  <Award size={16} className="text-amber-600" />
                  <span>Quiz & Assessment Performance History</span>
                </h4>
                {dossier.quizzes.length === 0 ? (
                  <p className="text-sm text-slate-400 py-4">No quiz attempts recorded yet.</p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3">Quiz Name</th>
                          <th className="px-4 py-3">Course</th>
                          <th className="px-4 py-3 text-center">Attempt</th>
                          <th className="px-4 py-3 text-center">Score / Total</th>
                          <th className="px-4 py-3 text-center">Percentage</th>
                          <th className="px-4 py-3 text-center">Result</th>
                          <th className="px-4 py-3">Submitted At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {dossier.quizzes.map((q) => (
                          <tr key={q.attempt_id} className="hover:bg-slate-50/60 transition">
                            <td className="px-4 py-3 font-semibold text-slate-900">{q.quiz_title}</td>
                            <td className="px-4 py-3 text-slate-600">{q.course_name}</td>
                            <td className="px-4 py-3 text-center font-bold text-slate-700">
                              #{q.attempt_number}
                            </td>
                            <td className="px-4 py-3 text-center font-medium text-slate-800">
                              {q.score} / {q.total_marks}
                            </td>
                            <td className="px-4 py-3 text-center font-bold">
                              <span
                                className={
                                  q.passed ? 'text-emerald-600' : 'text-rose-600'
                                }
                              >
                                {q.percentage}%
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                  q.passed
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                                }`}
                              >
                                {q.passed ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                                <span>{q.passed ? 'PASSED' : 'FAILED'}</span>
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-500">
                              {q.submitted_at
                                ? new Date(q.submitted_at).toLocaleString('en-GB')
                                : 'In Progress'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Subtab 3: Session Attendance & Progress */}
              <div className={`${activeSubTab === 'sessions' ? 'block' : 'hidden'} print:block space-y-4`}>
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                  <Clock size={16} className="text-indigo-600" />
                  <span>Session Completion & Attendance Log</span>
                </h4>
                {dossier.sessions.length === 0 ? (
                  <p className="text-sm text-slate-400 py-4">No session progress recorded yet.</p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-72 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200 sticky top-0">
                        <tr>
                          <th className="px-4 py-3">Lecture / Session</th>
                          <th className="px-4 py-3">Module</th>
                          <th className="px-4 py-3">Course</th>
                          <th className="px-4 py-3 text-center">Type</th>
                          <th className="px-4 py-3 text-center">Duration</th>
                          <th className="px-4 py-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {dossier.sessions.map((sess) => (
                          <tr key={sess.id} className="hover:bg-slate-50/60 transition">
                            <td className="px-4 py-3 font-semibold text-slate-900">{sess.title}</td>
                            <td className="px-4 py-3 text-slate-600">{sess.module_title}</td>
                            <td className="px-4 py-3 text-slate-500">{sess.course_name}</td>
                            <td className="px-4 py-3 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 font-semibold text-slate-600">
                                {sess.session_type}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center text-slate-600">
                              {sess.duration_minutes ? `${sess.duration_minutes}m` : '—'}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                  sess.completed
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}
                              >
                                {sess.completed ? 'COMPLETED' : 'INCOMPLETE'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Subtab 4: Device Security Audit */}
              <div className={`${activeSubTab === 'devices' ? 'block' : 'hidden'} print:block space-y-4`}>
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                  <Shield size={16} className="text-blue-600" />
                  <span>Registered Devices & Security History</span>
                </h4>
                {dossier.devices.length === 0 ? (
                  <p className="text-sm text-slate-400 py-4">No devices recorded.</p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3">Device Name</th>
                          <th className="px-4 py-3">Type</th>
                          <th className="px-4 py-3">Browser / OS</th>
                          <th className="px-4 py-3">Last IP Address</th>
                          <th className="px-4 py-3">Last Active</th>
                          <th className="px-4 py-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {dossier.devices.map((dev) => (
                          <tr key={dev.id} className="hover:bg-slate-50/60 transition">
                            <td className="px-4 py-3 font-semibold text-slate-900">{dev.device_name}</td>
                            <td className="px-4 py-3 text-slate-600">{dev.device_type}</td>
                            <td className="px-4 py-3 text-slate-600">
                              {dev.browser} on {dev.operating_system}
                            </td>
                            <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                              {dev.last_ip_address}
                            </td>
                            <td className="px-4 py-3 text-slate-500">
                              {dev.last_active_at
                                ? new Date(dev.last_active_at).toLocaleString('en-GB')
                                : '—'}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span
                                className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  dev.status === 'ACTIVE'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                                }`}
                              >
                                {dev.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Subtab 5: Student Feedback & Reviews */}
              <div className={`${activeSubTab === 'reviews' ? 'block' : 'hidden'} print:block space-y-4`}>
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                  <Star size={16} className="text-amber-500" />
                  <span>Student Course Feedback & Reviews</span>
                </h4>
                {dossier.reviews.length === 0 ? (
                  <p className="text-sm text-slate-400 py-4">No reviews submitted by this student.</p>
                ) : (
                  <div className="space-y-3">
                    {dossier.reviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-900 text-xs">{rev.course_name}</span>
                          <div className="flex items-center text-amber-500 text-xs gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                size={13}
                                className={i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
                              />
                            ))}
                            <span className="font-bold text-slate-700 ml-1.5">{rev.rating}/5</span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 italic">"{rev.review}"</p>
                        <p className="text-[10px] text-slate-400">
                          Submitted on {new Date(rev.created_at).toLocaleDateString('en-GB')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Official Academic Sign-off Footer (visible on print) */}
              <div className="hidden print:block pt-8 mt-8 border-t-2 border-slate-300 text-xs text-slate-600">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="font-bold text-slate-900">NSI IT Solutions LMS Administration</p>
                    <p>Official Academic & Security Dossier</p>
                    <p className="text-[10px] text-slate-400 mt-1">Generated on: {new Date().toLocaleString('en-GB')}</p>
                  </div>
                  <div className="text-right">
                    <div className="w-48 border-b border-slate-400 mb-1"></div>
                    <p className="font-semibold text-slate-800">Authorized Academic Officer</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 print:hidden">
          <span>Student ID: #{studentId}</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
}
