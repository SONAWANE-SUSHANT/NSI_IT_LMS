import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import Navbar from '../components/common/Navbar';
import RoleBadge from '../components/admin/RoleBadge';
import {
  GraduationCap, ArrowLeft, BookOpen, Clock, Video,
  Calendar, RefreshCw, Layers, ChevronRight,
} from 'lucide-react';

const API = 'http://localhost:5000/api';
const TOKEN_KEY = 'nsi_lms_token';

function getToken() { return localStorage.getItem(TOKEN_KEY); }

async function apiFetch(path) {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error('Request failed');
  const json = await res.json();
  return json.data;
}

function formatDate(dt) {
  if (!dt) return null;
  return new Date(dt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

function StatCard({ icon, label, value, accent }) {
  const colors = {
    student: 'border-[var(--student-border)] bg-[var(--student-light)] text-[var(--student-dark)]',
    instructor: 'border-[var(--instructor-border)] bg-[var(--instructor-light)] text-[var(--instructor-dark)]',
    admin: 'border-[var(--admin-border)] bg-[var(--admin-light)] text-[var(--admin-dark)]',
  };
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm" style={{ borderColor: 'var(--border-subtle)' }}>
      <div className={`mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl border ${colors[accent] || colors.student}`}>
        {icon}
      </div>
      <p className="text-2xl font-extrabold text-[var(--text-primary)]">{value}</p>
      <p className="mt-0.5 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">{label}</p>
    </div>
  );
}

export default function StudentDashboard() {
  const { user, allowedPortals } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [upcomingLectures, setUpcomingLectures] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fullName = user
    ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username
    : 'Student';

  const loadData = async () => {
    setIsLoading(true);
    setError('');
    try {
      // Fetch all batch students and filter by current user's id
      // (using admin endpoint - will be empty for students without data yet)
      const allEnrollments = await apiFetch(`/admin/batches/students`).catch(() => []);
      const myEnrollments = Array.isArray(allEnrollments)
        ? allEnrollments.filter((e) => e.student_id === user?.id)
        : [];
      setEnrollments(myEnrollments);

      // Collect lectures from modules of enrolled batches
      setUpcomingLectures([]);
    } catch {
      setError('Could not load your enrollment data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const initials = fullName
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div className="portal-page-layout">
      <Navbar currentPortal="student" />

      <main className="dashboard-main-container">
        <div className="dashboard-content">

          {/* Hero Banner */}
          <div className="student-dashboard-hero">
            <div className="student-dashboard-hero-bg" aria-hidden="true" />
            <div className="student-dashboard-hero-body">
              <div className="student-avatar-ring">
                <span className="student-avatar-initials">{initials || 'S'}</span>
              </div>
              <div className="student-hero-text">
                <div className="dashboard-portal-tag" style={{ color: 'var(--student-dark)' }}>
                  NSI IT LMS &bull; Learner Space
                </div>
                <h1 className="dashboard-portal-name">Welcome back, {fullName}!</h1>
                <p className="dashboard-subtext">
                  @{user?.username} &nbsp;&bull;&nbsp; {user?.email}
                </p>
              </div>
              <RoleBadge role={user?.role} size="md" />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <StatCard icon={<BookOpen size={20} />} label="Enrolled Batches" value={isLoading ? '…' : enrollments.length} accent="student" />
            <StatCard icon={<Video size={20} />} label="Upcoming Lectures" value={isLoading ? '…' : upcomingLectures.length} accent="student" />
            <StatCard icon={<Clock size={20} />} label="Portal Status" value={user?.status || 'ACTIVE'} accent="student" />
          </div>

          {/* Enrolled Batches */}
          <div className="student-section-card">
            <div className="student-section-header">
              <div className="flex items-center gap-2 text-[var(--student-dark)]">
                <Layers size={16} />
                <span className="text-xs font-extrabold uppercase tracking-wider">My Enrollments</span>
              </div>
              <button onClick={loadData} disabled={isLoading} className="content-icon-btn-sm">
                <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              </button>
            </div>

            {isLoading ? (
              <div className="flex items-center gap-3 py-6 text-sm text-[var(--text-muted)]">
                <RefreshCw size={16} className="animate-spin" /> Loading your courses…
              </div>
            ) : error ? (
              <p className="py-4 text-sm text-rose-600">{error}</p>
            ) : enrollments.length === 0 ? (
              <div className="student-empty-state">
                <GraduationCap size={32} className="mb-3 text-[var(--student-primary)]" />
                <p className="font-semibold text-[var(--text-primary)]">No enrollments yet</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  Contact your administrator to get enrolled in a batch.
                </p>
              </div>
            ) : (
              <div className="student-batch-list">
                {enrollments.map((en) => (
                  <div key={en.id} className="student-batch-card">
                    <div className="student-batch-icon">
                      <BookOpen size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[var(--text-primary)] truncate">
                        {en.batch?.name || `Batch #${en.batch_id}`}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] truncate">
                        {en.course?.name || `Course #${en.course_id}`}
                        {en.batch?.start_date && ` · Started ${formatDate(en.batch.start_date)}`}
                      </p>
                    </div>
                    <ChevronRight size={16} className="shrink-0 text-[var(--text-muted)]" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Lectures placeholder */}
          <div className="student-section-card">
            <div className="student-section-header">
              <div className="flex items-center gap-2 text-[var(--student-dark)]">
                <Calendar size={16} />
                <span className="text-xs font-extrabold uppercase tracking-wider">Upcoming Live Lectures</span>
              </div>
            </div>
            <div className="student-empty-state">
              <Calendar size={28} className="mb-3 text-[var(--student-primary)]" />
              <p className="font-semibold text-[var(--text-primary)]">No upcoming lectures</p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Scheduled lectures will appear here once your instructor adds them.
              </p>
            </div>
          </div>

          {/* Footer Nav */}
          <div className="dashboard-actions-footer">
            {allowedPortals.length > 1 && (
              <Link to="/portal-selection" className="btn-secondary-link">
                <ArrowLeft size={16} />
                <span>Switch Portal</span>
              </Link>
            )}
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <p>&copy; {new Date().getFullYear()} Nityashree Infosystems. All rights reserved. | NSI IT LMS</p>
      </footer>
    </div>
  );
}
