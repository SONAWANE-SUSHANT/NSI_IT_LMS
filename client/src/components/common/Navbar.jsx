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
    <header className="navbar">
      <div className="navbar-container">
        {/* Left: Mobile hamburger (if in layout) + Brand */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="inline-flex items-center justify-center p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 active:bg-slate-200 transition-colors lg:hidden shrink-0"
              aria-label="Open navigation drawer"
              title="Open menu"
            >
              <Menu size={20} />
            </button>
          )}

          <Link to={brandHomeLink} className="navbar-brand min-w-0">
            <img src={nsiLogo} alt="NSI IT LMS" className="navbar-logo h-8 sm:h-10 w-auto object-contain shrink-0" />
            <div className="navbar-brand-text min-w-0">
              <span className="navbar-title truncate">NSI IT LMS</span>
              <span className="navbar-subtitle hidden sm:block truncate">Nityashree Infosystems</span>
            </div>
          </Link>
        </div>

        {/* Right: User Info & Logout */}
        <div className="navbar-user-section flex items-center gap-2 sm:gap-3 shrink-0">
          <NotificationBell />

          <div className="user-profile-summary flex items-center gap-2 sm:gap-3">
            <div className="user-avatar h-8 w-8 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center shrink-0">
              <User size={16} className="sm:w-[18px] sm:h-[18px]" />
            </div>
            <div className="user-details hidden md:flex min-w-0 flex-col">
              <span className="user-name truncate max-w-[140px]">{fullName}</span>
              <div className="user-meta">
                <span className="user-username truncate max-w-[110px]">@{user?.username}</span>
                <RoleBadge role={user?.role} size="sm" />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="btn-logout p-2 sm:px-3 sm:py-2"
            title="Log out of NSI IT LMS"
            aria-label="Log out"
          >
            <LogOut size={16} />
            <span className="logout-text hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
