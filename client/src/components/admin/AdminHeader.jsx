import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import RoleBadge from './RoleBadge';
import {
  Menu,
  Bell,
  Search,
  ChevronDown,
  LogOut,
  GraduationCap,
  BookOpen,
  Shield,
  LayoutGrid,
  Check,
} from 'lucide-react';

/**
 * AdminHeader component
 * @param {object} props
 * @param {string} [props.title]
 * @param {Function} props.onToggleSidebar
 */
export default function AdminHeader({ title, onToggleSidebar }) {
  const { user, allowedPortals, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fullName = user
    ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username
    : 'Administrator';

  const initials = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`.toUpperCase() || 'A';

  const portalConfigs = {
    student: {
      name: 'Student Portal',
      path: '/student',
      icon: GraduationCap,
      color: 'text-blue-600',
    },
    instructor: {
      name: 'Instructor Portal',
      path: '/instructor',
      icon: BookOpen,
      color: 'text-teal-600',
    },
    admin: {
      name: 'Admin Portal',
      path: '/admin/dashboard',
      icon: Shield,
      color: 'text-indigo-600',
    },
  };

  // Extract breadcrumb title based on path
  const getBreadcrumbTitle = () => {
    if (title) return title;
    const path = location.pathname;
    if (path.includes('/admin/students')) return 'Students';
    if (path.includes('/admin/instructors')) return 'Instructors';
    if (path.includes('/admin/admins')) return 'Administrators';
    if (path.includes('/admin/batches')) return 'Batches';
    if (path.includes('/admin/batch-instructors')) return 'Batch Instructors';
    if (path.includes('/admin/batch-students')) return 'Batch Students';
    if (path.includes('/admin/courses/content')) return 'Course Content';
    if (path.includes('/admin/courses')) return 'Courses';
    if (path.includes('/admin/scheduling')) return 'Scheduling';
    if (path.includes('/admin/attendance')) return 'Attendance';
    if (path.includes('/admin/reports')) return 'Reports';
    if (path.includes('/admin/notifications')) return 'Notifications';
    if (path.includes('/admin/settings')) return 'Settings';
    return 'Dashboard';
  };

  return (
    <header className="admin-header sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
      <div className="admin-header-inner flex items-center justify-between px-4 sm:px-6 gap-4">

        {/* Left: Hamburger + Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 lg:hidden transition flex-shrink-0"
            aria-label="Toggle Navigation Drawer"
          >
            <Menu size={20} />
          </button>

          <div className="hidden sm:flex items-center gap-2">
            <span className="text-sm text-slate-400">Admin Portal</span>
            <span className="text-slate-300">/</span>
            <span className="text-sm font-semibold text-slate-800">{getBreadcrumbTitle()}</span>
          </div>

          {/* Mobile: just show page title */}
          <span className="sm:hidden text-sm font-semibold text-slate-800 truncate">
            {getBreadcrumbTitle()}
          </span>
        </div>

        {/* Center: Global Search */}
        <div className="hidden md:flex items-center flex-1 max-w-sm lg:max-w-md mx-4">
          <div className="relative w-full">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search LMS platform..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 focus:bg-white transition"
            />
          </div>
        </div>

        {/* Right: Bell + Divider + User */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
              aria-label="Notifications"
            >
              <Bell size={19} />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-indigo-500 ring-2 ring-white" />
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Notifications</h4>
                  <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">Live</span>
                </div>
                <div className="px-4 py-5 text-center">
                  <p className="text-sm text-slate-500">No new notifications</p>
                  <p className="text-xs text-slate-400 mt-1">All LMS system operations normal.</p>
                </div>
              </div>
            )}
          </div>

          <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block" />

          {/* User Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition"
            >
              <div className="h-8 w-8 rounded-lg bg-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-sm flex-shrink-0">
                {initials}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-sm font-semibold text-slate-800 leading-tight truncate max-w-[110px]">
                  {fullName}
                </span>
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Administrator</span>
              </div>
              <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">

                {/* User info header */}
                <div className="px-4 py-3.5 bg-slate-50 border-b border-slate-100">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className="text-sm font-bold text-slate-900 truncate">{fullName}</p>
                    <RoleBadge role={user?.role} size="sm" />
                  </div>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>

                {/* Switch Portal */}
                <div className="p-2">
                  <p className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <LayoutGrid size={11} />
                    Switch Portal
                  </p>
                  <div className="space-y-0.5 mt-0.5">
                    {allowedPortals.map((portalKey) => {
                      const portal = portalConfigs[portalKey];
                      if (!portal) return null;
                      const Icon = portal.icon;
                      const isCurrent = portalKey === 'admin';

                      return (
                        <Link
                          key={portalKey}
                          to={portal.path}
                          onClick={() => setIsProfileOpen(false)}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition ${
                            isCurrent
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon size={15} className={portal.color} />
                            <span>{portal.name}</span>
                          </div>
                          {isCurrent && <Check size={14} className="text-indigo-600" />}
                        </Link>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-slate-100" />

                {/* Logout */}
                <div className="p-2">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  >
                    <LogOut size={15} />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
