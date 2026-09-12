import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  BookOpen,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  ChevronRight,
  FileQuestion,
  Calendar,
  Play,
  RotateCcw,
} from 'lucide-react';
import { fetchAvailableQuizzes } from '../../services/studentQuizService';
import { useStudentPortal } from '../../context/StudentPortalContext';

const ADMIN_PRIMARY = '#3c4cb8';
const ADMIN_LIGHT = '#e7e9fb';
const ADMIN_DARK = '#2e3a8c';

export default function StudentQuizzesPage({ basePathOverride }) {
  const navigate = useNavigate();
  const { isViewingAsAdmin, baseRoute } = useStudentPortal();
  const basePath = basePathOverride || (isViewingAsAdmin ? baseRoute || '/student' : '/student');

  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'COMPLETED'

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchAvailableQuizzes();
      setQuizzes(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuizzes();
  }, []);

  const filteredQuizzes = quizzes.filter((q) => {
    const matchesSearch =
      (q.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.session_title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.description || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterTab === 'ACTIVE') {
      return q.has_active_attempt;
    }
    if (filterTab === 'COMPLETED') {
      return q.attempts_count > 0;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ── Header Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#ECEEF2] shadow-xs">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0"
            style={{ background: ADMIN_PRIMARY }}
          >
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border"
                style={{ background: ADMIN_LIGHT, color: ADMIN_DARK, borderColor: '#c7cef5' }}
              >
                Tests & Examinations
              </span>
              <span className="text-xs text-slate-400 font-medium">Production Support LMS</span>
            </div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              My Available Tests
            </h1>
          </div>
        </div>

        <button
          onClick={loadQuizzes}
          title="Refresh Tests"
          disabled={loading}
          className="p-2 text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors self-end sm:self-center"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-xs font-semibold text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Filter Tabs & Search Bar ── */}
      <div className="bg-white p-4 rounded-2xl border border-[#ECEEF2] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search tests & quizzes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#3c4cb8]"
          />
        </div>

        {/* Tab Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 self-stretch sm:self-auto">
          <button
            type="button"
            onClick={() => setFilterTab('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterTab === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            All Tests ({quizzes.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('ACTIVE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterTab === 'ACTIVE'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            In Progress ({quizzes.filter((q) => q.has_active_attempt).length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('COMPLETED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterTab === 'COMPLETED'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Completed ({quizzes.filter((q) => q.attempts_count > 0).length})
          </button>
        </div>
      </div>

      {/* ── Quizzes Grid ── */}
      {loading ? (
        <div className="py-24 text-center flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-[#3c4cb8] animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Loading your tests...</p>
        </div>
      ) : filteredQuizzes.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-[#ECEEF2] p-8 space-y-3">
          <FileQuestion className="w-10 h-10 mx-auto text-slate-300" />
          <h3 className="text-sm font-bold text-slate-800">No tests found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchTerm || filterTab !== 'ALL'
              ? 'No tests match the selected search or filter criteria.'
              : 'There are no active tests scheduled for your enrolled courses at this time.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredQuizzes.map((quiz) => {
            const hasActive = quiz.has_active_attempt;
            const canAttempt = quiz.is_available || hasActive;

            return (
              <div
                key={quiz.id}
                className="bg-white rounded-2xl border border-[#ECEEF2] shadow-xs p-5 flex flex-col justify-between hover:shadow-md transition-all relative overflow-hidden group"
              >
                {/* Active in-progress banner */}
                {hasActive && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
                )}

                <div>
                  {/* Course & Module pill & Status */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                      {quiz.course_name && (
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold truncate max-w-[130px]" title={quiz.course_name}>
                          {quiz.course_name}
                        </span>
                      )}
                      {quiz.module_name && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[10px] font-bold truncate max-w-[140px]" title={quiz.module_name}>
                          {quiz.module_name}
                        </span>
                      )}
                      {!quiz.course_name && !quiz.module_name && quiz.session_title && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold truncate max-w-[130px]">
                          {quiz.session_title}
                        </span>
                      )}
                    </div>

                    {hasActive ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0 animate-pulse">
                        <Clock className="w-3 h-3" />
                        In Progress
                      </span>
                    ) : quiz.is_available ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                        <CheckCircle2 className="w-3 h-3" />
                        Available
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                        {quiz.availability_message || 'Unavailable'}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-[#3c4cb8] transition-colors line-clamp-1">
                    {quiz.title}
                  </h3>

                  {/* Description */}
                  {quiz.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {quiz.description}
                    </p>
                  )}

                  {/* Badges / Metrics */}
                  <div className="mt-4 p-3 rounded-xl bg-slate-50/70 border border-slate-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-600 font-medium">
                      <span>{quiz.question_count} Questions</span>
                      <span>•</span>
                      <span>{quiz.duration_minutes ? `${quiz.duration_minutes} Mins` : 'No Timer'}</span>
                      <span>•</span>
                      <span className="font-bold text-slate-800">{Number(quiz.total_marks)} Marks</span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                      <span className="text-slate-500">
                        Attempts:{' '}
                        <strong className="text-slate-800">
                          {quiz.attempts_count} / {quiz.max_attempts}
                        </strong>
                      </span>
                      {quiz.best_score !== null && (
                        <span className="text-emerald-700 font-bold">
                          Best: {quiz.best_score} / {Number(quiz.total_marks)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Available until timestamp */}
                  {quiz.available_until && (
                    <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
                      <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">
                        Available until: {new Date(quiz.available_until).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Action Button */}
                <div className="mt-5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => navigate(`${basePath}/quizzes/${quiz.id}`)}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-xs transition-all flex items-center justify-center gap-2 hover:opacity-95"
                    style={{ background: hasActive ? '#f59e0b' : ADMIN_PRIMARY }}
                  >
                    {hasActive ? (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Resume Test</span>
                      </>
                    ) : (
                      <>
                        <span>Take Test</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
