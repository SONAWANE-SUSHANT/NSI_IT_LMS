import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { useStudentPortal } from '../../context/StudentPortalContext';
import RoleBadge from '../../components/admin/RoleBadge';
import {
  GraduationCap,
  BookOpen,
  Clock,
  CalendarDays,
  ArrowRight,
  Layers,
  RefreshCw,
  Video,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { fetchMyBatches, fetchUpcomingSessions } from '../../services/studentService';

const ADMIN_PRIMARY = '#3c4cb8';
const ADMIN_LIGHT = '#e7e9fb';
const ADMIN_DARK = '#2e3a8c';

function StatCard({ icon, label, value, subtext }) {
  return (
    <div className="admin-stat-card bg-white p-5 rounded-2xl border border-[#ECEEF2] shadow-xs hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-3">
        <div
          className="admin-stat-icon flex items-center justify-center rounded-xl w-10 h-10 shadow-xs"
          style={{ background: ADMIN_LIGHT, color: ADMIN_PRIMARY }}
        >
          {icon}
        </div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Student KPI
        </span>
      </div>
      <p className="text-2xl font-extrabold text-slate-900 tracking-tight">{value ?? '0'}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
      {subtext && <p className="text-[11px] text-slate-400 mt-0.5 font-medium">{subtext}</p>}
    </div>
  );
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const { currentStudent, isViewingAsAdmin, baseRoute } = useStudentPortal();
  const [batches, setBatches] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const activeStudent = (isViewingAsAdmin && currentStudent) ? currentStudent : user;

  const fullName = activeStudent
    ? `${activeStudent.first_name || ''} ${activeStudent.last_name || ''}`.trim() || activeStudent.username
    : 'Student';

  const initials =
    `${activeStudent?.first_name?.[0] || ''}${activeStudent?.last_name?.[0] || ''}`.toUpperCase() || 'S';

  const coursesPath = isViewingAsAdmin ? `${baseRoute}/courses` : '/student/courses';
  const schedulePath = isViewingAsAdmin ? `${baseRoute}/schedule` : '/student/schedule';

  const loadData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [bData, sData] = await Promise.all([
        fetchMyBatches(),
        fetchUpcomingSessions(),
      ]);
      setBatches(bData);
      setSessions(sData);
    } catch (err) {
      setError(err.message || 'Failed to load learner dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalModules = batches.reduce((acc, b) => acc + (Number(b.module_count) || 0), 0);

  return (
    <div className="space-y-6">
      {/* ── Hero Banner ── */}
      <div
        className="rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #2e3a8c 0%, #3c4cb8 50%, #5566d6 100%)',
        }}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-indigo-100 border border-white/20">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Learner Space</span>
              </span>
              <RoleBadge role="STUDENT" size="sm" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Welcome back, {fullName}!
            </h1>
            <p className="text-xs sm:text-sm text-indigo-100 mt-1 max-w-xl">
              Access your registered courses, attend scheduled interactive live classes, and explore module study notes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              title="Refresh Dashboard"
              disabled={isLoading}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/20 shadow-xs"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <Link
              to={coursesPath}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#2e3a8c] font-bold text-xs hover:bg-indigo-50 transition-all shadow-md active:scale-98"
            >
              <BookOpen className="w-4 h-4 text-[#3c4cb8]" />
              <span>Browse Enrolled Courses</span>
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-semibold text-rose-700">
          {error}
        </div>
      )}

      {/* ── KPI Stats Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<BookOpen size={20} />}
          label="Registered Courses"
          value={batches.length}
          subtext="Active cohort enrollments"
        />
        <StatCard
          icon={<Video size={20} />}
          label="Live Class Sessions"
          value={sessions.length}
          subtext="Upcoming scheduled classes"
        />
        <StatCard
          icon={<Layers size={20} />}
          label="Syllabus Modules"
          value={totalModules}
          subtext="Learning modules available"
        />
        <StatCard
          icon={<CheckCircle2 size={20} />}
          label="Academic Status"
          value="Enrolled"
          subtext="Full platform access"
        />
      </div>

      {/* ── Two Column Layout: Courses & Upcoming Classes ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left (7 cols): My Courses */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#ECEEF2] p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  My Registered Courses
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Programs you are currently admitted to
                </p>
              </div>
              <Link
                to={coursesPath}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#3c4cb8] hover:text-[#2e3a8c] transition-colors"
              >
                <span>View All</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-24 bg-slate-100 animate-pulse rounded-xl" />
                ))}
              </div>
            ) : batches.length === 0 ? (
              <div className="text-center py-10">
                <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">No Course Enrollments</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  You are not enrolled in any batches yet.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {batches.slice(0, 3).map((b) => (
                  <div
                    key={b.id}
                    className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-indigo-200 transition-all flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border"
                          style={{
                            background: ADMIN_LIGHT,
                            color: ADMIN_DARK,
                            borderColor: '#c7cef5',
                          }}
                        >
                          {b.batch_code}
                        </span>
                        <span className="text-xs font-bold text-slate-900">
                          {b.course?.name || b.name}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Mode: {b.batch_mode} &bull; Schedule: {b.batch_schedule} &bull; {b.module_count || 0} Modules
                      </p>
                    </div>

                    <Link
                      to={coursesPath}
                      state={{ batchId: b.id }}
                      className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#3c4cb8] bg-white border border-slate-200 hover:bg-indigo-50 transition-colors shadow-2xs"
                    >
                      <span>Study</span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-right">
            <Link
              to={coursesPath}
              className="text-xs font-bold text-[#3c4cb8] hover:underline"
            >
              Open Full Course Curriculum &rarr;
            </Link>
          </div>
        </div>

        {/* Right (5 cols): Upcoming Sessions */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#ECEEF2] p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Upcoming Live Classes
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Scheduled interactive sessions
                </p>
              </div>
              <Link
                to={schedulePath}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#3c4cb8] hover:text-[#2e3a8c] transition-colors"
              >
                <span>Calendar</span>
                <CalendarDays size={14} />
              </Link>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-20 bg-slate-100 animate-pulse rounded-xl" />
                ))}
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-10">
                <Video className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">No Upcoming Classes</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Your instructors haven't scheduled live sessions for today.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.slice(0, 3).map((session) => (
                  <div
                    key={session.id}
                    className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                        🔴 LIVE
                      </span>
                      {session.scheduled_at && (
                        <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                          <Clock size={12} className="text-indigo-600" />
                          {new Date(session.scheduled_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                      {session.title}
                    </h4>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-slate-500 font-medium truncate max-w-[160px]">
                        {session.module_name}
                      </span>
                      {session.session_url ? (
                        <a
                          href={session.session_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-white transition-colors shadow-2xs"
                          style={{ background: ADMIN_PRIMARY }}
                        >
                          <Video size={11} />
                          <span>Join</span>
                          <ExternalLink size={10} />
                        </a>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">No link</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-right">
            <Link
              to={schedulePath}
              className="text-xs font-bold text-[#3c4cb8] hover:underline"
            >
              Open Full Timetable Calendar &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
