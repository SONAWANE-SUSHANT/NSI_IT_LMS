import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { GraduationCap, LogOut, ArrowLeft, User } from 'lucide-react';

export default function StudentHeader({ activeTab, setActiveTab }) {
  const { user, allowedPortals, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const fullName = user
    ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username
    : 'Student';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Portal Identification */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  Learner Portal
                </span>
                <span className="text-xs text-slate-400 font-medium">NSI IT LMS</span>
              </div>
              <h1 className="text-base font-bold text-slate-800 tracking-tight">
                Student Learning Hub
              </h1>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab('courses')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'courses'
                  ? 'bg-white text-amber-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              My Enrolled Courses
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'sessions'
                  ? 'bg-white text-amber-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Live Sessions & Schedule
            </button>
          </nav>

          {/* User Controls & Logout */}
          <div className="flex items-center gap-3">

            <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs border border-amber-200">
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
          onClick={() => setActiveTab('courses')}
          className={`px-3 py-1 text-xs font-semibold rounded-md shrink-0 ${
            activeTab === 'courses' ? 'bg-amber-600 text-white' : 'text-slate-600'
          }`}
        >
          My Courses
        </button>
        <button
          onClick={() => setActiveTab('sessions')}
          className={`px-3 py-1 text-xs font-semibold rounded-md shrink-0 ${
            activeTab === 'sessions' ? 'bg-amber-600 text-white' : 'text-slate-600'
          }`}
        >
          Live Classes
        </button>
      </div>
    </header>
  );
}
