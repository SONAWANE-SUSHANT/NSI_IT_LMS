import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import Navbar from '../components/common/Navbar';
import RoleBadge from '../components/common/RoleBadge';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function UnauthorizedPage() {
  const { user } = useAuth();

  return (
    <div className="portal-page-layout">
      <Navbar currentPortal="unauthorized" />

      <main className="portal-selection-main">
        <div className="unauthorized-card">
          <div className="unauthorized-icon-wrapper">
            <ShieldAlert size={48} className="unauthorized-icon" />
          </div>

          <h1 className="unauthorized-title">Access Restricted</h1>
          <p className="unauthorized-description">
            Your authenticated role does not have authorization to access this portal or resource.
          </p>

          <div className="unauthorized-role-info">
            <span className="unauthorized-info-label">Your Current Role:</span>
            <RoleBadge role={user?.role} size="md" />
          </div>

          <div className="unauthorized-actions">
            <Link to={user?.role?.toUpperCase() === 'ADMIN' ? '/admin' : user?.role?.toUpperCase() === 'INSTRUCTOR' ? '/instructor' : '/student'} className="btn-primary">
              <ArrowLeft size={18} />
              <span>Return to Dashboard</span>
            </Link>
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <p>&copy; {new Date().getFullYear()} Nityashree Infosystems. All rights reserved. | NSI IT LMS</p>
      </footer>
    </div>
  );
}
