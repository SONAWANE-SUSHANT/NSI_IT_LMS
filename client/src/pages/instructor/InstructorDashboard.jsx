import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { useInstructorPortal } from '../../context/InstructorPortalContext';
import RoleBadge from '../../components/admin/RoleBadge';
import {
  Users,
  BookOpen,
  CalendarDays,
  ArrowRight,
  Layers,
  RefreshCw,
  Video,
  Plus,
} from 'lucide-react';
import { fetchMyBatches } from '../../services/instructorService';

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
          Faculty Metric
        </span>
      </div>
      <p className="text-2xl font-extrabold text-slate-900 tracking-tight">{value ?? '0'}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
      {subtext && <p className="text-[11px] text-slate-400 mt-0.5 font-medium">{subtext}</p>}
    </div>
  );
}

export default function InstructorDashboard() {
  const { user } = useAuth();
  const { currentInstructor, isViewingAsAdmin, baseRoute } = useInstructorPortal();
  const [batches, setBatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const activeInstructor = (isViewingAsAdmin && currentInstructor) ? currentInstructor : user;

  const fullName = activeInstructor
    ? `${activeInstructor.first_name || ''} ${activeInstructor.last_name || ''}`.trim() || activeInstructor.username
    : 'Instructor';

  const batchesPath = isViewingAsAdmin ? `${baseRoute}/batches` : '/instructor/batches';
  const schedulePath = isViewingAsAdmin ? `${baseRoute}/schedule` : '/instructor/schedule';

  const loadData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await fetchMyBatches();
      setBatches(data);
    } catch (err) {
      setError(err.message || 'Failed to load faculty batches');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalStudents = batches.reduce((acc, b) => acc + (Number(b.student_count) || 0), 0);
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
                <Users className="w-3.5 h-3.5" />
                <span>Faculty Workspace</span>
              </span>
              <RoleBadge role="INSTRUCTOR" size="sm" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Welcome back, Prof. {fullName}!
            </h1>
            <p className="text-xs sm:text-sm text-indigo-100 mt-1 max-w-xl">
              Manage your cohort syllabus, view active student rosters, schedule live lectures, and host online sessions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              title="Refresh Data"
              disabled={isLoading}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/20 shadow-xs"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <Link
              to={batchesPath}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#2e3a8c] font-bold text-xs hover:bg-indigo-50 transition-all shadow-md active:scale-98"
            >
              <Users className="w-4 h-4 text-[#3c4cb8]" />
              <span>Manage My Batches</span>
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
          label="Assigned Batches"
          value={batches.length}
          subtext="Active teaching cohorts"
        />
        <StatCard
          icon={<Users size={20} />}
          label="Enrolled Students"
          value={totalStudents}
          subtext="Total learners instructed"
        />
        <StatCard
          icon={<Layers size={20} />}
          label="Course Modules"
          value={totalModules}
          subtext="Curriculum syllabus units"
        />
        <StatCard
          icon={<Video size={20} />}
          label="Teaching Mode"
          value="Live & Online"
          subtext="Google Meet interactive"
        />
      </div>

      {/* ── Batches List & Quick Schedule ── */}
      <div className="bg-white rounded-2xl border border-[#ECEEF2] p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              Assigned Cohorts & Classes
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Review assigned student batches and curriculum coverage
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={schedulePath}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors shadow-2xs"
            >
              <CalendarDays size={13} />
              <span>Lecture Calendar</span>
            </Link>
            <Link
              to={batchesPath}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-colors shadow-xs"
              style={{ background: ADMIN_PRIMARY }}
            >
              <Plus size={13} />
              <span>Schedule Session</span>
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 bg-slate-100 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : batches.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-700">No Batches Assigned Yet</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              You haven't been assigned to any course batches yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {batches.map((b) => (
              <div
                key={b.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-xs transition-all flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
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
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-200">
                      {b.batch_mode || 'ONLINE'}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900">{b.course?.name || b.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Cohort: {b.name}</p>

                  <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-600 font-medium">
                    <span>
                      Students: <strong className="text-slate-900">{b.student_count || 0}</strong>
                    </span>
                    <span>&bull;</span>
                    <span>
                      Modules: <strong className="text-slate-900">{b.module_count || 0}</strong>
                    </span>
                    <span>&bull;</span>
                    <span className="capitalize">{b.batch_schedule?.toLowerCase()}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between">
                  <Link
                    to={batchesPath}
                    className="text-xs font-bold text-[#3c4cb8] hover:underline inline-flex items-center gap-1"
                  >
                    <span>View Student List & Syllabus</span>
                    <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
