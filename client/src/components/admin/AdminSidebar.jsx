import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  ShieldCheck,
  BookOpen,
  CalendarDays,
  CheckSquare,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  X,
  UserCheck,
} from 'lucide-react';

/**
 * AdminSidebar component
 * @param {object} props
 * @param {boolean} [props.isOpen] - Mobile drawer state
 * @param {Function} [props.onClose] - Mobile drawer close handler
 */
export default function AdminSidebar({ isOpen = false, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navGroups = [
  {
    label: 'Main',
    items: [
      { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'People',
    items: [
      { name: 'Students', path: '/admin/students', icon: GraduationCap },
      { name: 'Instructors', path: '/admin/instructors', icon: Users },
      { name: 'Admins', path: '/admin/admins', icon: ShieldCheck },
    ],
  },
  {
    label: 'Courses',
    items: [
      { name: 'Courses', path: '/admin/courses', icon: BookOpen },
      { name: 'Batches', path: '/admin/batches', icon: CalendarDays },
      { name: 'Course Content', path: '/admin/courses/content', icon: BookOpen },
    ],
  },
  {
    label: 'Enrollment',
    items: [
      { name: 'Batch Instructors', path: '/admin/batch-instructors', icon: UserCheck },
      { name: 'Batch Students', path: '/admin/batch-students', icon: GraduationCap },
    ],
  },
  {
    label: 'Operations',
    items: [
      { name: 'Scheduling', path: '/admin/scheduling', icon: CalendarDays },
      { name: 'Attendance', path: '/admin/attendance', icon: CheckSquare },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { name: 'Reports', path: '/admin/reports', icon: BarChart3 },
    ],
  },
  {
    label: 'System',
    items: [
      { name: 'Notifications', path: '/admin/notifications', icon: Bell },
      { name: 'Settings', path: '/admin/settings', icon: Settings },
    ],
  },
];

  const fullName = user
    ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username
    : 'Administrator';

  const initials = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`.toUpperCase() || 'A';

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
        style={{
          borderRight: '1px solid #ECEEF2',
        }}
      >
        {/* ─── Mobile-only close button (brand lives in navbar) ─── */}
        <div className="flex items-center justify-end px-4 pt-4 pb-1 flex-shrink-0 lg:hidden">
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg transition-colors flex-shrink-0"
            style={{ color: '#9CA3AF' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#111827'; e.currentTarget.style.background = '#F3F4F6'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#9CA3AF'; e.currentTarget.style.background = 'transparent'; }}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* ─── Navigation (Scrollable) ─── */}
        <div className="flex-1 overflow-y-auto pt-6 pb-4 px-3.5 space-y-6 admin-sidebar-scroll">
          {navGroups.map((group) => (
            <div key={group.label}>
              {/* Group label */}
              <p
                className="px-2.5 mb-1.5 text-[11px] font-semibold uppercase select-none"
                style={{ color: '#A3A9B7', letterSpacing: '0.08em' }}
              >
                {group.label}
              </p>

              {/* Group items */}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => { if (onClose) onClose(); }}
                      className="group relative flex items-center gap-3 pl-2.5 pr-2.5 py-2.5 rounded-lg text-[14px] font-medium transition-all duration-150"
                      style={({ isActive }) => ({
                        color: isActive ? '#111827' : '#6B7280',
                        background: isActive ? '#F3F1FF' : 'transparent',
                        boxShadow: isActive ? 'inset 0 0 0 1px #E4DFFC' : 'none',
                      })}
                      onMouseEnter={(e) => {
                        const isActive = e.currentTarget.getAttribute('aria-current') === 'page';
                        if (!isActive) e.currentTarget.style.background = '#F7F7F9';
                      }}
                      onMouseLeave={(e) => {
                        const isActive = e.currentTarget.getAttribute('aria-current') === 'page';
                        if (!isActive) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      {({ isActive }) => (
                        <>
                          <span
                            className="flex items-center justify-center h-7 w-7 rounded-md flex-shrink-0 transition-colors duration-150"
                            style={{
                              background: isActive ? '#7C6AEF' : '#F3F4F6',
                              color: isActive ? '#fff' : '#6B7280',
                            }}
                          >
                            <IconComponent size={15} strokeWidth={2} />
                          </span>
                          <span className="truncate flex-1">{item.name}</span>
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* ─── Bottom User Profile ─── */}
        <div
          className="px-3.5 py-4 flex-shrink-0"
          style={{ borderTop: '1px solid #ECEEF2' }}
        >
          <div
            className="flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-colors duration-150"
            style={{ background: '#F9FAFB' }}
          >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div
                className="h-9 w-9 rounded-lg text-white font-bold text-[13px] flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #7C6AEF 0%, #4F46E5 100%)',
                  boxShadow: '0 2px 8px rgba(124, 106, 239, 0.3)',
                }}
              >
                {initials}
              </div>
              <span
                className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full"
                style={{ background: '#34D399', border: '2px solid #F9FAFB' }}
              />
            </div>

            {/* Name & role */}
            <div className="flex-1 min-w-0">
              <p className="text-[13.5px] font-semibold truncate leading-tight" style={{ color: '#111827' }}>
                {fullName}
              </p>
              <p className="text-[11.5px] font-medium mt-0.5" style={{ color: '#9CA3AF' }}>
                Administrator
              </p>
            </div>

            {/* Logout */}
            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 rounded-lg transition-colors flex-shrink-0"
              style={{ color: '#9CA3AF' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.background = '#FEF2F2'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#9CA3AF'; e.currentTarget.style.background = 'transparent'; }}
              title="Logout"
              aria-label="Logout"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
