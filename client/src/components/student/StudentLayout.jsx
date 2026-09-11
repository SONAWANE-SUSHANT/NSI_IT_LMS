import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Navbar from '../common/Navbar';
import StudentSidebar from './StudentSidebar';

export default function StudentLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="portal-page-layout admin-shell">
      <Navbar currentPortal="student" />

      <div className="admin-body">
        <StudentSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="admin-main">
          <div className="admin-mobile-bar">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="admin-mobile-menu-btn"
              aria-label="Open student menu"
            >
              <Menu size={18} />
              <span>Student Menu</span>
            </button>
          </div>

          <main className="admin-content">
            <div className="admin-content-inner">
              <Outlet />
            </div>
          </main>

          <footer className="admin-footer">
            <p>
              &copy; {new Date().getFullYear()} Nityashree Infosystems — NSI IT LMS Student Portal
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
