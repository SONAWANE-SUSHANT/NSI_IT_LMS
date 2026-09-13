import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { useInstructorPortal } from '../../context/InstructorPortalContext';
import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  LogOut,
  X,
  Users,
  ArrowLeft,
  Award,
  Megaphone,
  User,
} from 'lucide-react';

const ADMIN_PRIMARY = '#3c4cb8';
const ADMIN_LIGHT   = '#e7e9fb';
const ADMIN_DARK    = '#2e3a8c';
const ADMIN_ACTIVE  = '#eef0fb';

export default function InstructorSidebar({ isOpen = false, onClose }) {
  const { user, logout } = useAuth();
  const { currentInstructor, isViewingAsAdmin, baseRoute, returnToAdmin } = useInstructorPortal();
  const navigate = useNavigate();

  const handleLogout = () => {
    if (isViewingAsAdmin) {
      returnToAdmin();
      return;
    }
    logout();
    navigate('/login');
  };

  const activeInstructor = (isViewingAsAdmin && currentInstructor) ? currentInstructor : user;

  const fullName = activeInstructor
    ? `${activeInstructor.first_name || ''} ${activeInstructor.last_name || ''}`.trim() || activeInstructor.username
    : 'Instructor';

  const initials = `${activeInstructor?.first_name?.[0] || ''}${activeInstructor?.last_name?.[0] || ''}`.toUpperCase() || 'I';

  const basePath = isViewingAsAdmin ? (baseRoute || '/instructor') : '/instructor';

  const navGroups = [
    {
      label: 'Main',
      items: [
        { name: 'Dashboard', path: basePath, icon: LayoutDashboard, isExact: true },
        { name: 'My Profile', path: `${basePath}/profile`, icon: User },
      ],
    },
    {
      label: 'Teaching Space',
      items: [
        { name: 'My Batches', path: `${basePath}/batches`, icon: Users },
        { name: 'Lecture Schedule', path: `${basePath}/schedule`, icon: CalendarDays },
        { name: 'Course Content', path: `${basePath}/content`, icon: BookOpen },
        { name: 'Quizzes & Tests', path: `${basePath}/quizzes`, icon: Award },
        { name: 'Announcements', path: `${basePath}/announcements`, icon: Megaphone },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="admin-sidebar-backdrop fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`admin-sidebar fixed top-0 left-0 bottom-0 z-40 w-[280px] flex flex-col bg-white transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ borderRight: '1px solid #ECEEF2' }}
      >
        {/* Mobile close */}
        <div className="flex items-center justify-end px-4 pt-4 pb-1 flex-shrink-0 lg:hidden">
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg transition-colors flex-shrink-0"
            style={{ color: '#9CA3AF' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#111827'; e.currentTarget.style.background = '#F3F4F6'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#9CA3AF'; e.currentTarget.style.background = 'transparent'; }}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Portal badge */}
        <div className="px-4 pt-5 pb-3 flex-shrink-0">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl" style={{ background: ADMIN_LIGHT }}>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: ADMIN_PRIMARY, color: '#fff' }}>
              <Users size={15} />
            </span>
            <div>
              <span className="text-[12px] font-extrabold uppercase tracking-wider block leading-tight" style={{ color: ADMIN_DARK }}>
                Instructor Portal
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Faculty Workspace</span>
            </div>
          </div>
        </div>

        {/* Nav list */}
        <div className="flex-1 overflow-y-auto pt-2 pb-4 px-3.5 space-y-6 admin-sidebar-scroll">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="px-2.5 mb-1.5 text-[11px] font-semibold uppercase select-none" style={{ color: '#A3A9B7', letterSpacing: '0.08em' }}>
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={Boolean(item.isExact)}
                      onClick={() => { if (isOpen && onClose) onClose(); }}
                      className="group relative flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                      style={({ isActive }) => ({
                        color: isActive ? ADMIN_PRIMARY : '#4B5563',
                        background: isActive ? ADMIN_ACTIVE : 'transparent',
                        fontWeight: isActive ? 600 : 500,
                      })}
                      onMouseEnter={(e) => {
                        if (!e.currentTarget.classList.contains('active')) {
                          e.currentTarget.style.background = '#F9FAFB';
                          e.currentTarget.style.color = '#111827';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!e.currentTarget.classList.contains('active')) {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = '#4B5563';
                        }
                      }}
                    >
                      {({ isActive }) => (
                        <>
                          <span
                            className="flex-shrink-0 transition-colors"
                            style={{ color: isActive ? ADMIN_PRIMARY : '#9CA3AF' }}
                          >
                            <Icon size={18} />
                          </span>
                          <span className="truncate">{item.name}</span>
                          {isActive && (
                            <span
                              className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-l-full"
                              style={{ background: ADMIN_PRIMARY }}
                            />
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* User profile footer */}
        <div className="p-3 border-t border-slate-100 flex-shrink-0 bg-white">
          <div className="flex items-center justify-between p-2 rounded-xl border border-slate-100 bg-slate-50/60">
            <NavLink
              to={`${basePath}/profile`}
              title="View / Edit Profile"
              className="flex items-center gap-2.5 overflow-hidden flex-1 group cursor-pointer hover:opacity-85 transition-opacity"
            >
              {activeInstructor?.photo ? (
                <img
                  src={activeInstructor.photo.startsWith('http') || activeInstructor.photo.startsWith('data:') ? activeInstructor.photo : `${window.location.origin}${activeInstructor.photo}`}
                  alt={fullName}
                  className="w-8 h-8 rounded-lg object-cover shrink-0 border border-slate-200"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : null}
              {!activeInstructor?.photo && (
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0"
                  style={{ background: ADMIN_LIGHT, color: ADMIN_PRIMARY }}
                >
                  {initials}
                </div>
              )}
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-800 truncate leading-tight group-hover:text-indigo-600 transition-colors">{fullName}</p>
                <p className="text-[11px] text-slate-400 truncate leading-tight">@{activeInstructor?.username || 'instructor'}</p>
              </div>
            </NavLink>
            <button
              onClick={handleLogout}
              title={isViewingAsAdmin ? "Return to Admin Portal" : "Sign Out"}
              className={`p-1.5 rounded-lg transition-colors shrink-0 ml-1 ${
                isViewingAsAdmin
                  ? 'text-amber-600 hover:text-amber-800 hover:bg-amber-50'
                  : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
              }`}
            >
              {isViewingAsAdmin ? <ArrowLeft size={16} /> : <LogOut size={16} />}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
