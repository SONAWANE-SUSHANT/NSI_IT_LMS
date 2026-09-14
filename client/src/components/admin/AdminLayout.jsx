import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Navbar from '../common/Navbar';
import AdminSidebar from './AdminSidebar';

/**
 * AdminLayout wrapper component
 * @param {object} props
 * @param {React.ReactNode} [props.children]
 * @param {string} [props.pageTitle]
 */
export default function AdminLayout({ children, pageTitle }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="portal-page-layout admin-shell">
      <Navbar currentPortal="admin" onToggleSidebar={() => setSidebarOpen(true)} />

      <div className="admin-body">
        <AdminSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="admin-main">
          <div className="admin-mobile-bar">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="admin-mobile-menu-btn"
              aria-label="Open admin menu"
            >
              <Menu size={18} />
              <span>Admin Menu</span>
            </button>
          </div>

          <main className="admin-content">
            <div className="admin-content-inner">
              {children || <Outlet />}
            </div>
          </main>

          <footer className="admin-footer">
            <p>
              &copy; {new Date().getFullYear()} Nityashree Infosystems - NSI IT LMS Administration Portal
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
