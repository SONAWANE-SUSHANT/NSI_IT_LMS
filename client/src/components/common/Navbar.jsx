import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import RoleBadge from './RoleBadge';
import nsiLogo from '../../assets/NSI_LOGO.png';
import { LogOut, User } from 'lucide-react';
import { getDefaultRouteForRole } from '../../utils/roleUtils';
import NotificationBell from './NotificationBell';

export default function Navbar() {
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
        {/* Brand */}
        <Link to={brandHomeLink} className="navbar-brand">
          <img src={nsiLogo} alt="NSI IT LMS" className="navbar-logo" />
          <div className="navbar-brand-text">
            <span className="navbar-title">NSI IT LMS</span>
            <span className="navbar-subtitle">Nityashree Infosystems</span>
          </div>
        </Link>

        {/* User Info & Logout */}
        <div className="navbar-user-section">
          <NotificationBell />

          <div className="user-profile-summary">
            <div className="user-avatar">
              <User size={18} />
            </div>
            <div className="user-details">
              <span className="user-name">{fullName}</span>
              <div className="user-meta">
                <span className="user-username">@{user?.username}</span>
                <RoleBadge role={user?.role} size="sm" />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="btn-logout"
            title="Log out of NSI IT LMS"
          >
            <LogOut size={16} />
            <span className="logout-text">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
