import { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { useStudentPortal } from '../../context/StudentPortalContext';
import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  LogOut,
  X,
  GraduationCap,
  ArrowLeft,
  Award,
  Megaphone,
  User,
} from 'lucide-react';

const ADMIN_PRIMARY = '#3c4cb8';
const ADMIN_LIGHT   = '#e7e9fb';
const ADMIN_DARK    = '#2e3a8c';
const ADMIN_ACTIVE  = '#eef0fb';

export default function StudentSidebar({ isOpen = false, onClose }) {
  const { user, logout } = useAuth();
  const { currentStudent, isViewingAsAdmin, baseRoute, returnToAdmin } = useStudentPortal();
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleLogout = () => {
    if (isViewingAsAdmin) {
      returnToAdmin();
      return;
    }
    logout();
    navigate('/login');
  };

  const activeStudent = (isViewingAsAdmin && currentStudent) ? currentStudent : user;

  const fullName = activeStudent
    ? `${activeStudent.first_name || ''} ${activeStudent.last_name || ''}`.trim() || activeStudent.username
    : 'Student';

  const initials = `${activeStudent?.first_name?.[0] || ''}${activeStudent?.last_name?.[0] || ''}`.toUpperCase() || 'S';

  const basePath = isViewingAsAdmin ? (baseRoute || '/student') : '/student';

  const navGroups = [
    {
      label: 'Main',
      items: [
        { name: 'Dashboard', path: basePath, icon: LayoutDashboard, isExact: true },
      ],
    },
    {
      label: 'Learning Space',
      items: [
        { name: 'My Courses', path: `${basePath}/courses`, icon: BookOpen },
        { name: 'Class Schedule', path: `${basePath}/schedule`, icon: CalendarDays },
        { name: 'Tests', path: `${basePath}/quizzes`, icon: Award },
        { name: 'Announcements', path: `${basePath}/announcements`, icon: Megaphone },
        { name: 'My Profile', path: `${basePath}/profile`, icon: User },
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
        className={`admin-sidebar fixed top-0 left-0 bottom-0 z-50 lg:z-30 w-[280px] max-w-[85vw] sm:max-w-xs flex flex-col bg-white transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
        style={{ borderRight: '1px solid #ECEEF2' }}
      >
        {/* Mobile close */}
        <div className="flex items-center justify-end px-4 pt-4 pb-1 flex-shrink-0 lg:hidden">
          <button
            type="button"
            onClick={onClose}
            className="p-2 min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Portal badge */}
        <div className="px-4 pt-5 pb-3 flex-shrink-0">
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-[#c7cef5]/50" style={{ background: ADMIN_LIGHT }}>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl shadow-2xs shrink-0" style={{ background: ADMIN_PRIMARY, color: '#fff' }}>
              <GraduationCap size={16} />
            </span>
            <div>
              <span className="text-[12px] font-extrabold uppercase tracking-wider block leading-tight" style={{ color: ADMIN_DARK }}>
                Student Portal
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Learning Workspace</span>
            </div>
          </div>
        </div>

        {/* Nav list */}
        <div className="flex-1 overflow-y-auto pt-2 pb-4 px-3.5 space-y-6 admin-sidebar-scroll">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="px-2.5 mb-1.5 text-[11px] font-bold uppercase select-none tracking-wider text-slate-400">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={Boolean(item.isExact)}
                      onClick={() => { if (isOpen && onClose) onClose(); }}
                      className="group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all min-h-[42px]"
                      style={({ isActive }) => ({
                        color: isActive ? ADMIN_PRIMARY : '#4B5563',
                        background: isActive ? ADMIN_ACTIVE : 'transparent',
                        fontWeight: isActive ? 700 : 500,
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
              className="flex items-center gap-2.5 overflow-hidden hover:opacity-80 transition-opacity min-w-0"
              title="View & Edit Profile"
            >
              <div
                className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center font-bold text-xs shrink-0"
                style={{ background: ADMIN_LIGHT, color: ADMIN_PRIMARY }}
              >
                {activeStudent?.photo ? (
                  <img src={activeStudent.photo} alt={fullName} className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-800 truncate leading-tight">{fullName}</p>
                <p className="text-[11px] text-slate-400 truncate leading-tight">@{activeStudent?.username || 'student'}</p>
              </div>
            </NavLink>
            <button
              onClick={handleLogout}
              title={isViewingAsAdmin ? "Return to Admin Portal" : "Sign Out"}
              className={`p-2 rounded-xl transition-colors shrink-0 min-h-[38px] min-w-[38px] flex items-center justify-center cursor-pointer ${
                isViewingAsAdmin
                  ? 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50'
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
