import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Navbar from '../common/Navbar';
import InstructorSidebar from './InstructorSidebar';

export default function InstructorLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="portal-page-layout admin-shell">
      <Navbar currentPortal="instructor" />

      <div className="admin-body">
        <InstructorSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="admin-main">
          <div className="admin-mobile-bar">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="admin-mobile-menu-btn"
              aria-label="Open instructor menu"
            >
              <Menu size={18} />
              <span>Instructor Menu</span>
            </button>
          </div>

          <main className="admin-content">
            <div className="admin-content-inner">
              <Outlet />
            </div>
          </main>

          <footer className="admin-footer">
            <p>
              &copy; {new Date().getFullYear()} Nityashree Infosystems — NSI IT LMS Instructor Portal
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
