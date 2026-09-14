import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Video,
  ExternalLink,
  RefreshCw,
  BookOpen,
  User,
  FileText,
  Filter,
  Award,
  Play,
  CheckCircle2,
} from 'lucide-react';

import VideoPlayerModal from '../../components/shared/VideoPlayerModal';
import { API_BASE_URL as API } from '../../config/apiConfig';
import { getViewingInstructorId, getViewingStudentId } from '../../utils/token';
const TOKEN_KEY = 'nsi_lms_token';

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

async function apiFetch(path) {
  const viewingInstructorId = getViewingInstructorId();
  const viewingStudentId = getViewingStudentId();
  const res = await fetch(`${API}${path}`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
      ...(viewingInstructorId ? { 'x-instructor-id': String(viewingInstructorId) } : {}),
      ...(viewingStudentId ? { 'x-student-id': String(viewingStudentId) } : {}),
    },
  });
  if (!res.ok) throw new Error('Request failed');
  const json = await res.json();
  return json.data ?? [];
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function isSameDay(a, b) {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatTime(dt) {
  if (!dt) return '';
  return new Date(dt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDate(dt) {
  if (!dt) return '';
  return new Date(dt).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function ScheduleCalendarPage({ role = 'student' }) {
  const navigate = useNavigate();
  const today = useMemo(() => new Date(), []);
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(today);
  const [allLectures, setAllLectures] = useState([]);
  const [allQuizzes, setAllQuizzes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [playingLecture, setPlayingLecture] = useState(null);

  // Brand Admin Color
  const ADMIN_PRIMARY = '#3c4cb8';
  const ADMIN_LIGHT = '#e7e9fb';
  const ADMIN_DARK = '#2e3a8c';

  // Fetch lectures based on user role
  const loadLectures = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      let fetchedLectures = [];
      let fetchedCourses = [];

      if (role === 'student') {
        // 1. Fetch student batches
        const batches = await apiFetch('/student/my-batches').catch(() => []);
        fetchedCourses = batches.map((b) => ({
          id: b.id,
          name: b.course?.name || b.name,
          code: b.course?.code || b.batch_code,
        }));

        // 2. Fetch full content (with scheduled lectures) for each enrolled batch
        const batchContents = await Promise.all(
          batches.map(async (batch) => {
            const content = await apiFetch(`/student/batches/${batch.id}/content`).catch(() => null);
            if (!content || !content.modules) return [];
            const lecs = [];
            content.modules.forEach((mod) => {
              (mod.lectures || []).forEach((lec) => {
                if (lec.scheduled_at) {
                  lecs.push({
                    ...lec,
                    _courseName: content.course?.name || batch.name,
                    _moduleName: mod.name,
                    _batchCode: batch.batch_code,
                    _instructors: content.instructors || [],
                  });
                }
              });
            });
            return lecs;
          })
        );
        fetchedLectures = batchContents.flat();

        // Also fetch upcoming sessions to catch any additional direct sessions
        const upcoming = await apiFetch('/student/upcoming-sessions').catch(() => []);
        upcoming.forEach((up) => {
          if (!fetchedLectures.some((l) => l.id === up.id)) {
            fetchedLectures.push({
              ...up,
              _courseName: up.batch_name || 'Enrolled Course',
              _moduleName: up.module_name || 'Module',
              _batchCode: up.batch_code,
            });
          }
        });
      } else if (role === 'instructor') {
        // 1. Fetch instructor batches
        const batches = await apiFetch('/instructor/my-batches').catch(() => []);
        fetchedCourses = batches.map((b) => ({
          id: b.id,
          name: b.course?.name || b.name,
          code: b.course?.code || b.batch_code,
        }));

        // 2. Fetch content for each batch
        const batchContents = await Promise.all(
          batches.map(async (batch) => {
            const content = await apiFetch(`/instructor/batches/${batch.id}/content`).catch(() => null);
            if (!content || !content.modules) return [];
            const lecs = [];
            content.modules.forEach((mod) => {
              (mod.lectures || []).forEach((lec) => {
                if (lec.scheduled_at) {
                  lecs.push({
                    ...lec,
                    _courseName: content.course?.name || batch.name,
                    _moduleName: mod.name,
                    _batchCode: batch.batch_code,
                  });
                }
              });
            });
            return lecs;
          })
        );
        fetchedLectures = batchContents.flat();
      } else {
        // Admin
        const adminCourses = await apiFetch('/admin/courses').catch(() => []);
        fetchedCourses = adminCourses.map((c) => ({ id: c.id, name: c.name, code: c.code }));
        const content = await Promise.all(
          adminCourses.slice(0, 10).map(async (course) => {
            const modules = await apiFetch(`/courses/${course.id}/modules`).catch(() => []);
            const moduleLecs = await Promise.all(
              modules.map((m) => apiFetch(`/modules/${m.id}/lectures`).catch(() => []))
            );
            return moduleLecs.flat().map((l) => ({
              ...l,
              _courseName: course.name,
            }));
          })
        );
        fetchedLectures = content.flat().filter((l) => l.scheduled_at);
      }

      // Fetch scheduled tests/quizzes
      let fetchedQuizzes = [];
      if (role === 'student') {
        fetchedQuizzes = await apiFetch('/student/quizzes').catch(() => []);
      } else {
        fetchedQuizzes = await apiFetch('/quizzes').catch(() => []);
      }
      const mappedQuizzes = (Array.isArray(fetchedQuizzes) ? fetchedQuizzes : fetchedQuizzes?.quizzes || []).map((q) => ({
        ...q,
        _itemType: 'quiz',
        scheduled_at: q.available_from || q.created_at,
        _courseName: q.course_name || q.course?.name || q.Course?.name || 'Course',
        _moduleName: q.module_name || q.module?.name || q.CourseModule?.name || 'Curriculum Module',
      }));

      setCourses(fetchedCourses);
      setAllLectures(fetchedLectures);
      setAllQuizzes(mappedQuizzes);
    } catch (err) {
      setError('Unable to load lecture timetable. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [role]);

  useEffect(() => {
    loadLectures();
  }, [loadLectures]);

  // Filtered lectures
  const filteredLectures = useMemo(() => {
    if (selectedCourseFilter === 'ALL') return allLectures;
    return allLectures.filter(
      (l) =>
        l._courseName === selectedCourseFilter ||
        l.course_id === Number(selectedCourseFilter) ||
        l._batchCode === selectedCourseFilter
    );
  }, [allLectures, selectedCourseFilter]);

  // Filtered tests/quizzes
  const filteredQuizzes = useMemo(() => {
    if (selectedCourseFilter === 'ALL') return allQuizzes;
    return allQuizzes.filter(
      (q) =>
        q._courseName === selectedCourseFilter ||
        q.course_id === Number(selectedCourseFilter)
    );
  }, [allQuizzes, selectedCourseFilter]);

  // Calendar Grid Math
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const calendarDays = useMemo(() => {
    const days = [];
    // Previous month padding
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        isCurrentMonth: false,
      });
    }
    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({
        date: new Date(year, month, d),
        isCurrentMonth: true,
      });
    }
    // Trailing days for 6-week full grid (42 days total)
    const trailingCount = 42 - days.length;
    for (let d = 1; d <= trailingCount; d++) {
      days.push({
        date: new Date(year, month + 1, d),
        isCurrentMonth: false,
      });
    }
    return days;
  }, [year, month, firstDayOfWeek, daysInMonth, prevMonthDays]);

  // Navigation handlers
  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const handleTodayClick = () => {
    const now = new Date();
    setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(now);
  };

  // Lectures for selected day
  const selectedDayLectures = useMemo(() => {
    return filteredLectures.filter(
      (l) => l.scheduled_at && isSameDay(new Date(l.scheduled_at), selectedDate)
    );
  }, [filteredLectures, selectedDate]);

  // Tests for selected day
  const selectedDayQuizzes = useMemo(() => {
    return filteredQuizzes.filter(
      (q) => q.scheduled_at && isSameDay(new Date(q.scheduled_at), selectedDate)
    );
  }, [filteredQuizzes, selectedDate]);

  return (
    <div className="space-y-6">
      {/* Page Title & Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-[#ECEEF2] shadow-xs">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0"
            style={{ background: ADMIN_PRIMARY }}
          >
            <CalendarDays className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border"
                style={{ background: ADMIN_LIGHT, color: ADMIN_DARK, borderColor: '#c7cef5' }}
              >
                {role === 'instructor' ? 'Faculty Timetable' : 'Class Timetable'}
              </span>
              <span className="text-xs text-slate-400 font-medium">NSI IT LMS</span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight mt-0.5 truncate">
              Live Lecture & Session Calendar
            </h1>
          </div>
        </div>

        {/* Filter & Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
          {courses.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-xs flex-1 sm:flex-initial min-w-0">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={selectedCourseFilter}
                onChange={(e) => setSelectedCourseFilter(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-hidden truncate w-full sm:max-w-[200px] md:max-w-[240px] cursor-pointer"
              >
                <option value="ALL">All Enrolled Courses</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.code ? `[${c.code}] ` : ''}
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={loadLectures}
              title="Refresh Schedule"
              disabled={isLoading}
              className="p-2 min-h-[38px] min-w-[38px] flex items-center justify-center text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleTodayClick}
              className="flex-1 sm:flex-initial px-3.5 py-2 min-h-[38px] text-xs font-bold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs cursor-pointer text-center"
            >
              Today
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-semibold text-rose-700">
          {error}
        </div>
      )}

      {/* Main Calendar + Day Details Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* Left: Monthly Grid (8 cols on desktop) */}
        <div className="lg:col-span-7 xl:col-span-8 bg-white rounded-2xl border border-[#ECEEF2] p-3.5 sm:p-5 md:p-6 shadow-xs flex flex-col">
          {/* Calendar Header Month Navigation */}
          <div className="flex items-center justify-between mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-slate-100">
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
              {MONTHS[month]} {year}
            </h2>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrevMonth}
                className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                aria-label="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                aria-label="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days of Week Row */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {DAYS.map((day) => (
              <div
                key={day}
                className="py-1 sm:py-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 select-none truncate"
              >
                <span className="sm:hidden">{day.charAt(0)}</span>
                <span className="hidden sm:inline">{day}</span>
              </div>
            ))}
          </div>

          {/* 42-cell Month Days Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5 flex-1">
            {calendarDays.map(({ date, isCurrentMonth }, idx) => {
              const dayLectures = filteredLectures.filter(
                (l) => l.scheduled_at && isSameDay(new Date(l.scheduled_at), date)
              );
              const dayQuizzes = filteredQuizzes.filter(
                (q) => q.scheduled_at && isSameDay(new Date(q.scheduled_at), date)
              );
              const totalEvents = dayLectures.length + dayQuizzes.length;
              const isToday = isSameDay(date, today);
              const isSelected = isSameDay(date, selectedDate);
              const hasEvents = totalEvents > 0;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedDate(date)}
                  className={`min-h-[50px] sm:min-h-[76px] lg:min-h-[82px] p-1 sm:p-1.5 md:p-2 rounded-xl text-left flex flex-col justify-between transition-all border cursor-pointer ${
                    isSelected
                      ? 'border-[#3c4cb8] bg-[#EEF0FB] ring-2 ring-[#3c4cb8]/30 shadow-xs'
                      : isToday
                      ? 'border-indigo-200 bg-indigo-50/40'
                      : isCurrentMonth
                      ? 'border-slate-100 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                      : 'border-transparent bg-slate-50/30 text-slate-300 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-extrabold ${
                        isSelected
                          ? 'text-[#3c4cb8]'
                          : isToday
                          ? 'text-indigo-600 bg-indigo-100 px-1 sm:px-1.5 py-0.5 rounded-md'
                          : isCurrentMonth
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {date.getDate()}
                    </span>

                    {hasEvents && (
                      <div className="flex items-center gap-1">
                        {dayQuizzes.length > 0 && (
                          <span
                            className="hidden sm:inline-block text-[9px] font-extrabold px-1.5 py-0.2 rounded-full text-white bg-amber-500 shadow-2xs"
                            title={`${dayQuizzes.length} test(s)`}
                          >
                            📝 {dayQuizzes.length}
                          </span>
                        )}
                        {dayLectures.length > 0 && (
                          <span
                            className="hidden sm:inline-block text-[10px] font-bold px-1.5 py-0.2 rounded-full text-white"
                            style={{ background: ADMIN_PRIMARY }}
                            title={`${dayLectures.length} class(es)`}
                          >
                            {dayLectures.length}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Badges on day cell (dot indicators on mobile, text badges on sm+) */}
                  {hasEvents ? (
                    <>
                      {/* Mobile dot indicators */}
                      <div className="sm:hidden flex items-center justify-center gap-1 mt-1">
                        {dayQuizzes.length > 0 && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        )}
                        {dayLectures.length > 0 && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#3c4cb8] shrink-0" />
                        )}
                      </div>

                      {/* Desktop badges */}
                      <div className="hidden sm:block mt-1 space-y-0.5 overflow-hidden">
                        {dayQuizzes.slice(0, 1).map((q) => (
                          <div
                            key={`day-q-${q.id}`}
                            className="truncate text-[9.5px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100/90 border border-amber-300 text-amber-900 shadow-2xs flex items-center gap-1"
                            title={`Test: ${q.title}`}
                          >
                            <Award className="w-2.5 h-2.5 text-amber-700 shrink-0" />
                            <span className="truncate">{q.title}</span>
                          </div>
                        ))}
                        {dayLectures.slice(0, dayQuizzes.length > 0 ? 1 : 2).map((l) => (
                          <div
                            key={l.id}
                            className="truncate text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-800 shadow-2xs"
                            title={l.title}
                          >
                            <span className="truncate">{l.title}</span>
                          </div>
                        ))}
                        {totalEvents > 2 && (
                          <span className="text-[9px] font-bold text-slate-400 block px-1">
                            +{totalEvents - 2} more
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <div />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Day's Schedule Details (stacked on mobile/tablet) */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-2xl border border-[#ECEEF2] p-4 sm:p-5 md:p-6 shadow-xs flex flex-col">
          <div className="border-b border-slate-100 pb-4 mb-4">
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
              style={{ background: ADMIN_LIGHT, color: ADMIN_DARK }}
            >
              Selected Date
            </span>
            <h3 className="text-base font-extrabold text-slate-900 mt-1">
              {formatDate(selectedDate)}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {selectedDayLectures.length}{' '}
              {selectedDayLectures.length === 1 ? 'class session' : 'class sessions'} &bull;{' '}
              {selectedDayQuizzes.length}{' '}
              {selectedDayQuizzes.length === 1 ? 'test' : 'tests'} scheduled
            </p>
          </div>

          {/* List of Lectures & Tests on Selected Date */}
          <div className="flex-1 overflow-y-auto space-y-3 max-h-[580px] pr-1">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-32 bg-slate-100 animate-pulse rounded-2xl" />
                ))}
              </div>
            ) : selectedDayLectures.length === 0 && selectedDayQuizzes.length === 0 ? (
              <div className="text-center py-16">
                <CalendarDays className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-700">No Events on this Day</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  There are no scheduled live sessions or module tests on {formatDate(selectedDate)}.
                </p>
              </div>
            ) : (
              <>
                {/* ── Scheduled Tests Section ── */}
                {selectedDayQuizzes.length > 0 && (
                  <div className="space-y-2.5 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-amber-600" />
                        <span>Scheduled Tests & Exams ({selectedDayQuizzes.length})</span>
                      </span>
                    </div>

                    {selectedDayQuizzes.map((quiz) => {
                      const attempt = quiz.attempts?.[0];
                      const hasPassed = attempt?.passed;
                      const inProgress = attempt && attempt.status === 'IN_PROGRESS';
                      const isCompleted = attempt && attempt.status === 'COMPLETED';

                      return (
                        <div
                          key={`detail-quiz-${quiz.id}`}
                          className="p-4 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/60 via-white to-orange-50/40 hover:shadow-xs transition-all flex flex-col justify-between gap-3 shadow-2xs"
                          style={{ borderLeft: '4px solid #f59e0b' }}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1">
                                <Award className="w-3 h-3 text-amber-600" />
                                <span>MODULE TEST</span>
                              </span>
                              <span className="text-[10px] font-bold text-slate-500">
                                {quiz.duration_minutes ? `${quiz.duration_minutes} Mins` : 'No Timer'}
                              </span>
                            </div>

                            <h4 className="text-sm font-bold text-slate-900 leading-snug break-words">
                              {quiz.title}
                            </h4>

                            {quiz.description && (
                              <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed break-words">
                                {quiz.description}
                              </p>
                            )}

                            <div className="mt-3 space-y-1 text-xs text-slate-600 font-medium">
                              <div className="flex items-center gap-1.5 text-slate-500 min-w-0">
                                <BookOpen className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <span className="truncate">
                                  {quiz._courseName} {quiz._moduleName ? `• ${quiz._moduleName}` : ''}
                                </span>
                              </div>

                              <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1 flex-wrap">
                                <span>Total Marks: <strong className="text-slate-800">{Number(quiz.total_marks || 0)}</strong></span>
                                {quiz.passing_marks && (
                                  <span>Pass Score: <strong className="text-emerald-700">{Number(quiz.passing_marks)}</strong></span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-amber-200/60 flex items-center gap-2">
                            {role === 'student' ? (
                              <button
                                type="button"
                                onClick={() => navigate(`/student/quizzes/${quiz.id}`)}
                                className="w-full min-h-[40px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition-all shadow-xs cursor-pointer"
                              >
                                <Play className="w-3.5 h-3.5 fill-current" />
                                <span>
                                  {hasPassed
                                    ? 'View Test Results'
                                    : inProgress
                                    ? 'Resume Test'
                                    : isCompleted
                                    ? 'View Results / Retake'
                                    : 'Take Test Now'}
                                </span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => navigate(`/instructor/quizzes/${quiz.id}/builder`)}
                                className="w-full min-h-[40px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition-all shadow-xs cursor-pointer"
                              >
                                <Award className="w-3.5 h-3.5" />
                                <span>Edit Test In Builder</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ── Class Lectures Section ── */}
                {selectedDayLectures.map((lec) => {
                const isLive = (lec.session_type || lec.lecture_type) === 'LIVE';
                const meetLink = isLive ? (lec.session_url || lec.meet_url) : null;
                const recLink = lec.recording_url || (!isLive ? (lec.session_url || lec.meet_url) : null);

                return (
                  <div
                    key={lec.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-xs transition-all flex flex-col justify-between gap-3 shadow-2xs"
                    style={{ borderLeft: `4px solid ${ADMIN_PRIMARY}` }}
                  >
                    <div>
                      {/* Badge row */}
                      <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isLive
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          }`}
                        >
                          {isLive ? '🔴 LIVE CLASS' : '📹 RECORDED'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {lec.status || 'PUBLISHED'}
                        </span>
                      </div>

                      {/* Title */}
                      <h4 className="text-sm font-bold text-slate-900 leading-snug break-words">{lec.title}</h4>

                      {lec.description && (
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2 break-words">{lec.description}</p>
                      )}

                      {/* Meta Tags */}
                      <div className="mt-3 space-y-1 text-xs text-slate-600 font-medium">
                        {lec.scheduled_at && (
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span>
                              {formatTime(lec.scheduled_at)}
                              {lec.duration_minutes ? ` (${lec.duration_minutes} mins)` : ''}
                            </span>
                          </div>
                        )}

                        {(lec._courseName || lec._moduleName) && (
                          <div className="flex items-center gap-1.5 text-slate-500 min-w-0">
                            <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">
                              {lec._courseName}
                              {lec._moduleName ? ` • ${lec._moduleName}` : ''}
                            </span>
                          </div>
                        )}

                        {lec.instructor && (
                          <div className="flex items-center gap-1.5 text-slate-500 min-w-0">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">
                              Prof. {lec.instructor.first_name} {lec.instructor.last_name}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Lecture Notes */}
                      {lec.notes && lec.notes.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex flex-wrap gap-1.5">
                          {lec.notes.map((note) => (
                            <a
                              key={note.id}
                              href={note.external_url || note.file_url || '#'}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#3c4cb8] bg-[#EEF0FB] px-2 py-0.5 rounded-md hover:bg-indigo-100 transition-colors max-w-full"
                            >
                              <FileText className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate max-w-[150px] sm:max-w-[200px]">{note.title}</span>
                              <ExternalLink className="w-2 h-2 opacity-60 shrink-0" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action Links */}
                    <div className="pt-2 border-t border-slate-200/60 flex items-center gap-2">
                      {isLive ? (
                        meetLink ? (
                          <a
                            href={meetLink}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full min-h-[40px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-xs cursor-pointer"
                            style={{ background: ADMIN_PRIMARY }}
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>Join Live Meeting</span>
                            <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
                          </a>
                        ) : recLink ? (
                          <button
                            type="button"
                            onClick={() => setPlayingLecture({ ...lec, recording_url: recLink })}
                            className="w-full min-h-[40px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 hover:text-[#3c4cb8] transition-colors cursor-pointer shadow-2xs"
                          >
                            <Video className="w-3.5 h-3.5 text-[#3c4cb8]" />
                            <span>Watch Recording</span>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 italic py-2 block text-center w-full">Live link available before class</span>
                        )
                      ) : (
                        /* RECORDED */
                        recLink ? (
                          <button
                            type="button"
                            onClick={() => setPlayingLecture({ ...lec, recording_url: recLink })}
                            className="w-full min-h-[40px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-xs cursor-pointer hover:opacity-90"
                            style={{ background: ADMIN_PRIMARY }}
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>Watch Recording</span>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 italic py-2 block text-center w-full">Recording not uploaded yet</span>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}
          </div>
        </div>
      </div>

      {/* ── In-LMS Video Player Modal ── */}
      <VideoPlayerModal
        isOpen={!!playingLecture}
        onClose={() => setPlayingLecture(null)}
        lecture={playingLecture}
        moduleName={playingLecture?._moduleName}
        courseName={playingLecture?._courseName}
      />
    </div>
  );
}
