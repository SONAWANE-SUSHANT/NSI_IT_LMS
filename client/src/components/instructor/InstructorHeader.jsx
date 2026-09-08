import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { BookOpen, LogOut, ArrowLeft, User } from 'lucide-react';

export default function InstructorHeader({ activeTab, setActiveTab }) {
  const { user, allowedPortals, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const fullName = user
    ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username
    : 'Instructor';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Portal Identification */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                  Faculty Portal
                </span>
                <span className="text-xs text-slate-400 font-medium">NSI IT LMS</span>
              </div>
              <h1 className="text-base font-bold text-slate-800 tracking-tight">
                Instructor Workspace
              </h1>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab('batches')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'batches'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              My Batches & Courses
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'schedule'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Live Sessions
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'students'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Student Directory
            </button>
          </nav>

          {/* User Controls & Logout */}
          <div className="flex items-center gap-3">
            {allowedPortals.length > 1 && (
              <Link
                to="/portal-selection"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Switch Portal</span>
              </Link>
            )}

            <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs border border-teal-200">
                {user?.first_name ? user.first_name[0].toUpperCase() : <User className="w-4 h-4" />}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-semibold text-slate-800 leading-tight">{fullName}</p>
                <p className="text-[11px] text-slate-500 leading-tight">@{user?.username}</p>
              </div>
              <button
                onClick={handleLogout}
                title="Log out"
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Tabs */}
      <div className="flex md:hidden border-t border-slate-200 px-4 py-2 bg-slate-50 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('batches')}
          className={`px-3 py-1 text-xs font-semibold rounded-md shrink-0 ${
            activeTab === 'batches' ? 'bg-teal-600 text-white' : 'text-slate-600'
          }`}
        >
          My Batches
        </button>
        <button
          onClick={() => setActiveTab('schedule')}
          className={`px-3 py-1 text-xs font-semibold rounded-md shrink-0 ${
            activeTab === 'schedule' ? 'bg-teal-600 text-white' : 'text-slate-600'
          }`}
        >
          Live Sessions
        </button>
        <button
          onClick={() => setActiveTab('students')}
          className={`px-3 py-1 text-xs font-semibold rounded-md shrink-0 ${
            activeTab === 'students' ? 'bg-teal-600 text-white' : 'text-slate-600'
          }`}
        >
          Students
        </button>
      </div>
    </header>
  );
}
