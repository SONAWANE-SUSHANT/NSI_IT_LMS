import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import RoleBadge from './RoleBadge';
import nsiLogo from '../../assets/NSI_LOGO.png';
import { LogOut, User, Menu } from 'lucide-react';
import { getDefaultRouteForRole } from '../../utils/roleUtils';
import NotificationBell from './NotificationBell';

export default function Navbar({ onToggleSidebar, currentPortal }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const fullName = user
    ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username
    : 'User';

  const brandHomeLink = getDefaultRouteForRole(user?.role);

  return (
    <header className="navbar sticky top-0 z-40 w-full border-b bg-white/95 backdrop-blur-md">
      <div className="navbar-container mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 sm:px-6 py-2 sm:py-2.5 min-h-[58px] sm:min-h-[64px]">
        {/* Left: Mobile hamburger (if in layout) + Brand */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 max-w-[60%] sm:max-w-none">
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="inline-flex items-center justify-center p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 active:bg-slate-200 transition-colors lg:hidden shrink-0 min-h-[38px] min-w-[38px] cursor-pointer"
              aria-label="Open navigation drawer"
              title="Open menu"
            >
              <Menu size={20} />
            </button>
          )}

          <Link to={brandHomeLink} className="navbar-brand flex items-center gap-2 sm:gap-3 min-w-0">
            <img src={nsiLogo} alt="NSI IT LMS" className="navbar-logo h-7 sm:h-9 w-auto object-contain shrink-0" />
            <div className="navbar-brand-text min-w-0 flex flex-col">
              <span className="navbar-title text-sm sm:text-base font-extrabold text-slate-900 tracking-tight truncate leading-tight">
                NSI IT LMS
              </span>
              <span className="navbar-subtitle text-[10px] sm:text-xs font-semibold text-slate-400 hidden sm:block truncate leading-tight">
                Nityashree Infosystems
              </span>
            </div>
          </Link>
        </div>

        {/* Right: User Info, Role, Notification & Logout */}
        <div className="navbar-user-section flex items-center gap-2 sm:gap-3 shrink-0">
          <NotificationBell />

          <div className="user-profile-summary flex items-center gap-1.5 sm:gap-2.5">
            <div className="user-avatar h-8 w-8 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center shrink-0 text-slate-700 bg-slate-100 border border-slate-200 shadow-2xs">
              <User size={16} />
            </div>

            {/* Role badge visible on small mobile next to avatar */}
            <div className="sm:hidden shrink-0">
              <RoleBadge role={user?.role} size="sm" />
            </div>

            {/* Full user details on tablet/desktop */}
            <div className="user-details hidden sm:flex min-w-0 flex-col">
              <span className="user-name truncate max-w-[110px] md:max-w-[150px] text-xs font-bold text-slate-900 leading-tight">
                {fullName}
              </span>
              <div className="user-meta flex items-center gap-1.5 mt-0.5">
                <span className="user-username truncate max-w-[85px] text-[11px] text-slate-400 font-medium hidden md:inline">
                  @{user?.username}
                </span>
                <RoleBadge role={user?.role} size="sm" />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="btn-logout inline-flex items-center justify-center gap-1.5 p-2 sm:px-3 sm:py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:text-rose-700 hover:border-rose-200 hover:bg-rose-50 transition-colors shrink-0 min-h-[38px] shadow-2xs cursor-pointer"
            title="Log out of NSI IT LMS"
            aria-label="Log out"
          >
            <LogOut size={15} />
            <span className="logout-text hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
