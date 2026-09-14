import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BarChart3,
  GraduationCap,
  Award,
  BookOpen,
  CalendarDays,
  Shield,
  Star,
  Download,
  Search,
  RefreshCw,
  Eye,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Smartphone,
  Sparkles,
  ArrowUpRight,
  UserCheck,
} from 'lucide-react';
import {
  getOverviewStats,
  getStudentProgressReport,
  getQuizPerformanceReport,
  getBatchAnalyticsReport,
  getCourseFeedbackReport,
  getSecurityAuditReport,
} from '../../services/adminReportService';
import { getCourses } from '../../services/courseAdminService';
import { exportToCsv } from '../../utils/csvExport';
import StudentDossierModal from '../../components/admin/reports/StudentDossierModal';
import LoadingState from '../../components/admin/LoadingState';
import EmptyState from '../../components/admin/EmptyState';
import ErrorState from '../../components/admin/ErrorState';

export default function AdminReportsPage() {
  const [activeTab, setActiveTab] = useState('progress');
  const [overview, setOverview] = useState(null);
  const [coursesList, setCoursesList] = useState([]);
  const [selectedStudentForDossier, setSelectedStudentForDossier] = useState(null);

  // Tab Data States
  const [progressData, setProgressData] = useState([]);
  const [quizData, setQuizData] = useState([]);
  const [batchData, setBatchData] = useState([]);
  const [feedbackData, setFeedbackData] = useState([]);
  const [deviceData, setDeviceData] = useState([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Loading & Error states
  const [isLoading, setIsLoading] = useState(true);
  const [isTabLoading, setIsTabLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch initial courses and overview metrics
  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [overviewRes, coursesRes] = await Promise.all([
        getOverviewStats().catch(() => null),
        getCourses().catch(() => []),
      ]);
      setOverview(overviewRes);
      setCoursesList(coursesRes || []);
    } catch (err) {
      setError(err.message || 'Failed to load report overview');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Fetch data for the currently active tab whenever activeTab or filters change
  const fetchTabData = useCallback(async () => {
    setIsTabLoading(true);
    try {
      const filters = {
        search: searchQuery.trim() || undefined,
        courseId: selectedCourse || undefined,
        batchId: selectedBatch || undefined,
        status: selectedStatus || undefined,
      };

      if (activeTab === 'progress' || activeTab === 'lookup') {
        const data = await getStudentProgressReport(filters);
        setProgressData(data || []);
      } else if (activeTab === 'quizzes') {
        const data = await getQuizPerformanceReport(filters);
        setQuizData(data || []);
      } else if (activeTab === 'batches') {
        const data = await getBatchAnalyticsReport(filters);
        setBatchData(data || []);
      } else if (activeTab === 'feedback') {
        const data = await getCourseFeedbackReport(filters);
        setFeedbackData(data || []);
      } else if (activeTab === 'devices') {
        const data = await getSecurityAuditReport(filters);
        setDeviceData(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch tab data:', err);
    } finally {
      setIsTabLoading(false);
    }
  }, [activeTab, searchQuery, selectedCourse, selectedBatch, selectedStatus]);

  useEffect(() => {
    fetchTabData();
  }, [fetchTabData]);

  // Unique batches extracted from batchData or progressData for filter dropdown
  const batchOptions = useMemo(() => {
    if (batchData && batchData.length > 0) {
      return batchData.map((b) => ({ id: b.batch_id, name: b.batch_name }));
    }
    const map = new Map();
    progressData.forEach((p) => {
      if (p.batch_id && !map.has(p.batch_id)) {
        map.set(p.batch_id, { id: p.batch_id, name: p.batch_name });
      }
    });
    return Array.from(map.values());
  }, [batchData, progressData]);

  // Handle Export CSV based on active tab
  const handleExportCsv = () => {
    if (activeTab === 'progress') {
      exportToCsv({
        data: progressData,
        filename: 'student_progress_report',
        columns: [
          { key: 'student_name', label: 'Student Name' },
          { key: 'username', label: 'Username' },
          { key: 'email', label: 'Email' },
          { key: 'contact_no', label: 'Contact' },
          { key: 'course_name', label: 'Course' },
          { key: 'batch_name', label: 'Batch' },
          { key: 'completion_percentage', label: 'Progress (%)' },
          { key: 'completed_sessions', label: 'Completed Sessions' },
          { key: 'total_sessions', label: 'Total Sessions' },
          { key: 'is_completed', label: 'Course Completed' },
          { key: 'student_status', label: 'Student Status' },
          { key: 'enrollment_date', label: 'Enrollment Date' },
        ],
      });
    } else if (activeTab === 'quizzes') {
      exportToCsv({
        data: quizData,
        filename: 'quiz_performance_report',
        columns: [
          { key: 'student_name', label: 'Student Name' },
          { key: 'student_email', label: 'Email' },
          { key: 'quiz_title', label: 'Quiz Title' },
          { key: 'course_name', label: 'Course' },
          { key: 'attempt_number', label: 'Attempt #' },
          { key: 'score', label: 'Score' },
          { key: 'total_marks', label: 'Total Marks' },
          { key: 'percentage', label: 'Score (%)' },
          { key: 'passed', label: 'Passed' },
          { key: 'status', label: 'Status' },
          { key: 'submitted_at', label: 'Submitted At' },
        ],
      });
    } else if (activeTab === 'batches') {
      exportToCsv({
        data: batchData,
        filename: 'batches_capacity_report',
        columns: [
          { key: 'batch_name', label: 'Batch Name' },
          { key: 'course_name', label: 'Course Name' },
          { key: 'batch_mode', label: 'Mode' },
          { key: 'batch_time', label: 'Time' },
          { key: 'batch_schedule', label: 'Schedule' },
          { key: 'total_enrolled', label: 'Total Enrolled' },
          { key: 'active_enrolled', label: 'Active Students' },
          { key: 'completed_enrolled', label: 'Completed Students' },
          { key: 'dropped_enrolled', label: 'Dropped Students' },
          { key: 'instructors', label: 'Instructors' },
          { key: 'status', label: 'Batch Status' },
          { key: 'start_date', label: 'Start Date' },
        ],
      });
    } else if (activeTab === 'feedback') {
      exportToCsv({
        data: feedbackData,
        filename: 'course_feedback_report',
        columns: [
          { key: 'course_name', label: 'Course' },
          { key: 'student_name', label: 'Student' },
          { key: 'student_email', label: 'Email' },
          { key: 'rating', label: 'Rating (1-5)' },
          { key: 'review_text', label: 'Review Comment' },
          { key: 'status', label: 'Status' },
          { key: 'submitted_at', label: 'Submitted Date' },
        ],
      });
    } else if (activeTab === 'devices') {
      exportToCsv({
        data: deviceData,
        filename: 'security_device_audit',
        columns: [
          { key: 'user_name', label: 'User Name' },
          { key: 'username', label: 'Username' },
          { key: 'email', label: 'Email' },
          { key: 'role', label: 'Role' },
          { key: 'device_name', label: 'Device Name' },
          { key: 'device_type', label: 'Device Type' },
          { key: 'browser', label: 'Browser' },
          { key: 'operating_system', label: 'OS' },
          { key: 'last_ip_address', label: 'Last IP' },
          { key: 'device_status', label: 'Device Status' },
          { key: 'last_active_at', label: 'Last Active' },
        ],
      });
    } else if (activeTab === 'lookup') {
      exportToCsv({
        data: progressData,
        filename: 'student_lookup_directory',
        columns: [
          { key: 'student_name', label: 'Student Name' },
          { key: 'username', label: 'Username' },
          { key: 'email', label: 'Email' },
          { key: 'contact_no', label: 'Contact' },
          { key: 'course_name', label: 'Course' },
          { key: 'batch_name', label: 'Batch' },
          { key: 'completion_percentage', label: 'Progress (%)' },
          { key: 'student_status', label: 'Status' },
        ],
      });
    }
  };

  // Reset filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCourse('');
    setSelectedBatch('');
    setSelectedStatus('');
  };

  return (
    <div className="admin-page space-y-6 pb-12">
      {/* ── Header Banner ── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-8">
          <BarChart3 size={220} />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold mb-3">
              <Sparkles size={13} />
              <span>NSI IT LMS Intelligence & Telemetry</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Analytics & Reports Hub
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Export comprehensive course progression reports, assessment scorecards, batch
              capacity analysis, and generate complete 360° student academic dossiers.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={fetchTabData}
              disabled={isTabLoading}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold transition border border-slate-700"
            >
              <RefreshCw size={15} className={isTabLoading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold transition shadow-md shadow-emerald-950/30"
            >
              <Download size={15} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Top KPI Cards ── */}
      {overview && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-indigo-200 transition">
            <div className="flex items-center justify-between text-indigo-600 mb-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Total Students
              </span>
              <GraduationCap size={16} />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {overview.users.totalStudents}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
              {overview.users.activeUsers} active accounts
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-indigo-200 transition">
            <div className="flex items-center justify-between text-indigo-600 mb-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Avg Progress
              </span>
              <BookOpen size={16} />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {overview.academic.avgCompletionPercentage}%
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Across all courses
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-indigo-200 transition">
            <div className="flex items-center justify-between text-amber-600 mb-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Quiz Pass Rate
              </span>
              <Award size={16} />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {overview.assessments.quizPassRate}%
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {overview.assessments.passedAttempts} / {overview.assessments.totalAttempts} passed
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-indigo-200 transition">
            <div className="flex items-center justify-between text-blue-600 mb-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Active Batches
              </span>
              <CalendarDays size={16} />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {overview.academic.activeBatches}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {overview.academic.totalBatches} total cohorts
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-indigo-200 transition">
            <div className="flex items-center justify-between text-amber-500 mb-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Course Rating
              </span>
              <Star size={16} className="fill-amber-400 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {overview.reviews.avgCourseRating} / 5
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {overview.reviews.totalReviews} student reviews
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-indigo-200 transition">
            <div className="flex items-center justify-between text-cyan-600 mb-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Active Devices
              </span>
              <Smartphone size={16} />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {overview.security.activeDevices}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
              Securely monitored
            </div>
          </div>
        </div>
      )}

      {/* ── Tab Navigation Bar ── */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setActiveTab('progress')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === 'progress'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <GraduationCap size={16} />
          <span>Student Progress ({progressData.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('quizzes')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === 'quizzes'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Award size={16} />
          <span>Quizzes & Tests ({quizData.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('batches')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === 'batches'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <CalendarDays size={16} />
          <span>Batches & Enrollment ({batchData.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('feedback')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === 'feedback'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Star size={16} />
          <span>Feedback & Reviews ({feedbackData.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('devices')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === 'devices'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Shield size={16} />
          <span>Security & Device Audit ({deviceData.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('lookup')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === 'lookup'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Search size={16} />
          <span>Student 360° Dossier</span>
        </button>
      </div>

      {/* ── Universal Filter Controls ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 flex-wrap">
          {/* Keyword Search */}
          <div className="relative flex-1 min-w-[220px]">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder={
                activeTab === 'quizzes'
                  ? 'Search student name, email, quiz title...'
                  : activeTab === 'lookup'
                  ? 'Type student name, email, or username...'
                  : 'Search by student, email, keyword...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:border-indigo-500 transition"
            />
          </div>

          {/* Course Filter Dropdown */}
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:border-indigo-500 text-slate-700"
          >
            <option value="">All Courses</option>
            {coursesList.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>

          {/* Batch Filter Dropdown */}
          {batchOptions.length > 0 && activeTab !== 'devices' && (
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:border-indigo-500 text-slate-700"
            >
              <option value="">All Batches</option>
              {batchOptions.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}

          {/* Status Filter Dropdown */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:border-indigo-500 text-slate-700"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
            <option value="INACTIVE">Inactive</option>
            <option value="REVOKED">Revoked</option>
          </select>

          {(searchQuery || selectedCourse || selectedBatch || selectedStatus) && (
            <button
              onClick={handleClearFilters}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1.5 rounded-lg hover:bg-rose-50 transition"
            >
              Clear Filters
            </button>
          )}
        </div>

        <div className="text-xs font-semibold text-slate-500 text-right self-center">
          Showing{' '}
          <strong className="text-slate-800">
            {activeTab === 'progress'
              ? progressData.length
              : activeTab === 'quizzes'
              ? quizData.length
              : activeTab === 'batches'
              ? batchData.length
              : activeTab === 'feedback'
              ? feedbackData.length
              : activeTab === 'devices'
              ? deviceData.length
              : progressData.length}
          </strong>{' '}
          records
        </div>
      </div>

      {/* ── Tab 1: Student Progress Report ── */}
      {activeTab === 'progress' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {isTabLoading ? (
            <LoadingState message="Loading student progress telemetry..." />
          ) : progressData.length === 0 ? (
            <EmptyState
              icon={<GraduationCap size={28} className="text-slate-400" />}
              title="No student progress records found"
              description="Try adjusting your course or batch filters."
            />
          ) : (
            <div className="table-container overflow-x-auto">
              <table className="w-full min-w-[740px] text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Student</th>
                    <th className="px-5 py-3.5">Course</th>
                    <th className="px-5 py-3.5">Batch</th>
                    <th className="px-5 py-3.5">Progress</th>
                    <th className="px-5 py-3.5 text-center">Sessions</th>
                    <th className="px-5 py-3.5 text-center">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {progressData.map((row) => (
                    <tr key={row.enrollment_id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900">{row.student_name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {row.email || row.username}
                        </div>
                        {row.contact_no && (
                          <div className="text-[10px] text-slate-400">Tel: {row.contact_no}</div>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-800">{row.course_name}</div>
                        <div className="text-[11px] text-slate-400">{row.course_code}</div>
                      </td>

                      <td className="px-5 py-4 text-slate-600 font-medium">
                        <div>{row.batch_name}</div>
                      </td>

                      <td className="px-5 py-4 min-w-[160px]">
                        <div className="flex items-center gap-2.5">
                          <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                row.completion_percentage >= 100
                                  ? 'bg-emerald-500'
                                  : row.completion_percentage >= 50
                                  ? 'bg-indigo-600'
                                  : 'bg-amber-500'
                              }`}
                              style={{ width: `${Math.min(row.completion_percentage, 100)}%` }}
                            />
                          </div>
                          <span className="font-bold text-slate-700 w-10 text-right">
                            {row.completion_percentage}%
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-center font-medium text-slate-600">
                        {row.completed_sessions} / {row.total_sessions}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            row.is_completed
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : row.student_status === 'ACTIVE'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {row.is_completed ? 'COMPLETED' : row.student_status}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => setSelectedStudentForDossier(row.student_id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition border border-indigo-100"
                        >
                          <Eye size={13} />
                          <span>360° Dossier</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Tab 2: Quizzes & Assessments Report ── */}
      {activeTab === 'quizzes' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {isTabLoading ? (
            <LoadingState message="Loading assessment scorecards..." />
          ) : quizData.length === 0 ? (
            <EmptyState
              icon={<Award size={28} className="text-slate-400" />}
              title="No quiz attempts found"
              description="No student attempts match your search filters."
            />
          ) : (
            <div className="table-container overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Student</th>
                    <th className="px-5 py-3.5">Quiz Title</th>
                    <th className="px-5 py-3.5">Course</th>
                    <th className="px-5 py-3.5 text-center">Attempt</th>
                    <th className="px-5 py-3.5 text-center">Score / Marks</th>
                    <th className="px-5 py-3.5 text-center">Percentage</th>
                    <th className="px-5 py-3.5 text-center">Result</th>
                    <th className="px-5 py-3.5">Submitted At</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {quizData.map((row) => (
                    <tr key={row.attempt_id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900">{row.student_name}</div>
                        <div className="text-[11px] text-slate-400">{row.student_email}</div>
                      </td>

                      <td className="px-5 py-4 font-semibold text-slate-800">
                        {row.quiz_title}
                      </td>

                      <td className="px-5 py-4 text-slate-600">{row.course_name}</td>

                      <td className="px-5 py-4 text-center font-bold text-slate-700">
                        #{row.attempt_number}
                      </td>

                      <td className="px-5 py-4 text-center font-semibold text-slate-800">
                        {row.score} / {row.total_marks}
                      </td>

                      <td className="px-5 py-4 text-center font-bold">
                        <span className={row.passed ? 'text-emerald-600' : 'text-rose-600'}>
                          {row.percentage}%
                        </span>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            row.passed
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {row.passed ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                          <span>{row.passed ? 'PASSED' : 'FAILED'}</span>
                        </span>
                      </td>

                      <td className="px-5 py-4 text-slate-500">
                        {row.submitted_at
                          ? new Date(row.submitted_at).toLocaleString('en-GB')
                          : 'In Progress'}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => setSelectedStudentForDossier(row.student_id)}
                          className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition"
                          title="View Student 360° Dossier"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Tab 3: Batches & Capacity Report ── */}
      {activeTab === 'batches' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {isTabLoading ? (
            <LoadingState message="Loading batch capacity metrics..." />
          ) : batchData.length === 0 ? (
            <EmptyState
              icon={<CalendarDays size={28} className="text-slate-400" />}
              title="No batches found"
              description="No batches match your filter criteria."
            />
          ) : (
            <div className="table-container overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Batch Name</th>
                    <th className="px-5 py-3.5">Course</th>
                    <th className="px-5 py-3.5">Mode / Timing</th>
                    <th className="px-5 py-3.5 text-center">Enrolled</th>
                    <th className="px-5 py-3.5 text-center">Active</th>
                    <th className="px-5 py-3.5 text-center">Completed</th>
                    <th className="px-5 py-3.5">Instructors</th>
                    <th className="px-5 py-3.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {batchData.map((row) => (
                    <tr key={row.batch_id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900">{row.batch_name}</div>
                        <div className="text-[11px] text-slate-400">{row.batch_code}</div>
                      </td>

                      <td className="px-5 py-4 font-semibold text-slate-800">
                        {row.course_name}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        <div className="font-medium">{row.batch_mode}</div>
                        <div className="text-[11px] text-slate-400">
                          {row.batch_time} • {row.batch_schedule}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-center font-bold text-slate-900 text-sm">
                        {row.total_enrolled}
                      </td>

                      <td className="px-5 py-4 text-center font-semibold text-emerald-600">
                        {row.active_enrolled}
                      </td>

                      <td className="px-5 py-4 text-center font-semibold text-indigo-600">
                        {row.completed_enrolled}
                      </td>

                      <td className="px-5 py-4 text-slate-600 max-w-xs truncate">
                        {row.instructors}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            row.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : row.status === 'COMPLETED'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Tab 4: Course Reviews & Feedback Report ── */}
      {activeTab === 'feedback' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {isTabLoading ? (
            <LoadingState message="Loading student feedback & course reviews..." />
          ) : feedbackData.length === 0 ? (
            <EmptyState
              icon={<Star size={28} className="text-slate-400" />}
              title="No course reviews found"
              description="No feedback records match the selected filters."
            />
          ) : (
            <div className="table-container overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Course</th>
                    <th className="px-5 py-3.5">Student</th>
                    <th className="px-5 py-3.5">Rating</th>
                    <th className="px-5 py-3.5">Review Comment</th>
                    <th className="px-5 py-3.5 text-center">Status</th>
                    <th className="px-5 py-3.5">Submitted Date</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {feedbackData.map((row) => (
                    <tr key={row.review_id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900">{row.course_name}</div>
                        <div className="text-[11px] text-slate-400">{row.course_code}</div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-800">{row.student_name}</div>
                        <div className="text-[11px] text-slate-400">{row.student_email}</div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center text-amber-500 gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={12}
                              className={
                                i < row.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                              }
                            />
                          ))}
                          <span className="font-bold text-slate-700 ml-1.5">{row.rating}</span>
                        </div>
                      </td>

                      <td className="px-5 py-4 max-w-sm">
                        <p className="text-slate-600 italic truncate">"{row.review_text}"</p>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            row.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-slate-500">
                        {new Date(row.submitted_at).toLocaleDateString('en-GB')}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => setSelectedStudentForDossier(row.student_id)}
                          className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition"
                          title="View Student 360° Dossier"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Tab 5: Security & Device Audit ── */}
      {activeTab === 'devices' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {isTabLoading ? (
            <LoadingState message="Loading security telemetry & device audit log..." />
          ) : deviceData.length === 0 ? (
            <EmptyState
              icon={<Shield size={28} className="text-slate-400" />}
              title="No devices found"
              description="No registered devices match your filter criteria."
            />
          ) : (
            <div className="table-container overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">User</th>
                    <th className="px-5 py-3.5">Role</th>
                    <th className="px-5 py-3.5">Device Name</th>
                    <th className="px-5 py-3.5">Device Type</th>
                    <th className="px-5 py-3.5">Browser / OS</th>
                    <th className="px-5 py-3.5">Last IP Address</th>
                    <th className="px-5 py-3.5">Last Active</th>
                    <th className="px-5 py-3.5 text-center">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {deviceData.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900">{row.user_name}</div>
                        <div className="text-[11px] text-slate-400">{row.email}</div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {row.role}
                        </span>
                      </td>

                      <td className="px-5 py-4 font-semibold text-slate-800">
                        {row.device_name}
                      </td>

                      <td className="px-5 py-4 text-slate-600">{row.device_type}</td>

                      <td className="px-5 py-4 text-slate-600">
                        {row.browser} on {row.operating_system}
                      </td>

                      <td className="px-5 py-4 font-mono text-[11px] text-slate-500">
                        {row.last_ip_address}
                      </td>

                      <td className="px-5 py-4 text-slate-500">
                        {row.last_active_at
                          ? new Date(row.last_active_at).toLocaleString('en-GB')
                          : '—'}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            row.device_status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {row.device_status}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => setSelectedStudentForDossier(row.user_id)}
                          className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition"
                          title="View 360° Dossier"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Tab 6: Student 360° Lookup Directory ── */}
      {activeTab === 'lookup' && (
        <div className="space-y-4">
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                <UserCheck size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Student 360° Academic & Security Dossier Search
                </h3>
                <p className="text-xs text-slate-600">
                  Select any enrolled student below to generate their complete official academic
                  dossier, printable PDF, and multi-faceted performance report.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {progressData.map((row) => (
              <div
                key={row.enrollment_id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-indigo-200 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-xl bg-indigo-600/10 text-indigo-600 font-bold flex items-center justify-center text-sm">
                        {row.student_name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{row.student_name}</h4>
                        <div className="text-[11px] text-slate-400">{row.email}</div>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        row.is_completed
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      }`}
                    >
                      {row.is_completed ? 'COMPLETED' : `${row.completion_percentage}%`}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 mb-4 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Course:</span>
                      <strong className="text-slate-800 text-right truncate max-w-[170px]">
                        {row.course_name}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Batch:</span>
                      <span className="text-slate-700">{row.batch_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Sessions Completed:</span>
                      <span className="font-semibold text-slate-800">
                        {row.completed_sessions} / {row.total_sessions}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedStudentForDossier(row.student_id)}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-xs"
                >
                  <Eye size={14} />
                  <span>View & Print 360° Dossier</span>
                  <ArrowUpRight size={13} className="text-slate-400" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Student 360° Dossier Modal ── */}
      {selectedStudentForDossier && (
        <StudentDossierModal
          studentId={selectedStudentForDossier}
          onClose={() => setSelectedStudentForDossier(null)}
        />
      )}
    </div>
  );
}
