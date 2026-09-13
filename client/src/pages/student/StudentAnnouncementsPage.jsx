import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Calendar,
  Search,
  BookOpen,
  Users,
  Globe,
  Clock,
  Sparkles,
  AlertCircle,
  User,
} from 'lucide-react';
import { fetchStudentAnnouncements } from '../../services/announcementService';

export default function StudentAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [scopeFilter, setScopeFilter] = useState('ALL'); // 'ALL' | 'GLOBAL' | 'COURSE' | 'BATCH'

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchStudentAnnouncements();
      setAnnouncements(data);
    } catch (err) {
      console.error('Failed to load announcements:', err);
      setError(err.response?.data?.message || 'Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const filteredAnnouncements = announcements.filter((ann) => {
    // Scope filter
    if (scopeFilter === 'GLOBAL' && (ann.course_id || ann.batch_id)) return false;
    if (scopeFilter === 'COURSE' && (!ann.course_id || ann.batch_id)) return false;
    if (scopeFilter === 'BATCH' && !ann.batch_id) return false;

    // Search filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchTitle = ann.title?.toLowerCase().includes(q);
      const matchMessage = ann.message?.toLowerCase().includes(q);
      const matchCourse = ann.course?.name?.toLowerCase().includes(q);
      const matchBatch = ann.batch?.name?.toLowerCase().includes(q);
      return matchTitle || matchMessage || matchCourse || matchBatch;
    }

    return true;
  });

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-indigo-200">
              <Megaphone className="w-3.5 h-3.5 text-amber-400" />
              <span>Campus & Course Broadcasts</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Announcements & Notices
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200/90 max-w-xl">
              Stay up to date with schedule adjustments, batch updates, live session links, and academy news.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 px-6 border border-white/15 text-center self-start md:self-auto">
            <div className="text-2xl sm:text-3xl font-black text-white">
              {announcements.length}
            </div>
            <div className="text-[11px] font-semibold text-indigo-200 uppercase tracking-wider">
              Total Notices
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search announcements..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        {/* Scope Pill Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { id: 'ALL', label: 'All Notices' },
            { id: 'GLOBAL', label: 'Academy Global' },
            { id: 'COURSE', label: 'Course Specific' },
            { id: 'BATCH', label: 'My Batches' },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setScopeFilter(pill.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                scopeFilter === pill.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-xs font-semibold text-rose-700">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Content Stream */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold">Loading announcements...</p>
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Megaphone className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No announcements yet.</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            When instructors or administrators post new announcements for your courses or batches, they will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAnnouncements.map((ann) => {
            const isBatch = Boolean(ann.batch_id);
            const isCourse = Boolean(ann.course_id) && !ann.batch_id;
            const isGlobal = !ann.course_id && !ann.batch_id;

            return (
              <div
                key={ann.id}
                className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all space-y-3"
              >
                {/* Header: Scope Tag & Date */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {isGlobal && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-bold">
                        <Globe className="w-3 h-3" />
                        <span>Academy Wide Announcement</span>
                      </span>
                    )}
                    {isCourse && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-bold">
                        <BookOpen className="w-3 h-3" />
                        <span>Course: {ann.course?.name || 'Assigned Course'}</span>
                      </span>
                    )}
                    {isBatch && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                        <Users className="w-3 h-3" />
                        <span>Batch: {ann.batch?.name || 'Class Batch'}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {new Date(ann.published_at || ann.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                  {ann.title}
                </h2>

                {/* Message Body */}
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {ann.message}
                </p>

                {/* Footer: Posted By */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[10px]">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-medium">
                      Posted by{' '}
                      <strong className="text-slate-700 font-bold">
                        {ann.creator
                          ? `${ann.creator.first_name || ''} ${ann.creator.last_name || ''}`.trim() || 'Staff'
                          : 'Faculty / Administration'}
                      </strong>
                    </span>
                  </div>

                  {ann.course && ann.batch && (
                    <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline">
                      {ann.course.code} &bull; {ann.batch.name}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
