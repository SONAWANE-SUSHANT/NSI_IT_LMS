import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  Plus,
  Search,
  RefreshCw,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Eye,
  FileQuestion,
  Clock,
  Calendar,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Filter,
  FileSpreadsheet,
  Upload,
} from 'lucide-react';
import CreateQuizCsvModal from '../../components/quiz/CreateQuizCsvModal';
import {
  fetchQuizzes,
  deleteQuiz,
  publishQuiz,
  closeQuiz,
  createQuiz,
  fetchCourses,
  fetchModulesByCourse,
  fetchAvailableSessions,
} from '../../services/quizService';
import { useInstructorPortal } from '../../context/InstructorPortalContext';

const ADMIN_PRIMARY = '#3c4cb8';
const ADMIN_LIGHT = '#e7e9fb';
const ADMIN_DARK = '#2e3a8c';

export default function InstructorQuizzesPage({ basePathOverride }) {
  const navigate = useNavigate();
  const { isViewingAsAdmin, baseRoute } = useInstructorPortal();
  const basePath = basePathOverride || (isViewingAsAdmin ? baseRoute || '/instructor' : '/instructor');

  const [quizzes, setQuizzes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [modules, setModules] = useState([]);
  const [loadingModules, setLoadingModules] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [courseFilter, setCourseFilter] = useState('ALL');

  // Create Quiz Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [newQuiz, setNewQuiz] = useState({
    course_id: '',
    module_id: '',
    title: '',
    description: '',
    instructions: '',
    duration_minutes: 30,
    passing_marks: 25,
    max_attempts: 2,
    available_from: '',
    available_until: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [quizList, courseList] = await Promise.all([
        fetchQuizzes({
          status: statusFilter,
          search: searchTerm,
        }),
        fetchCourses().catch(() => []),
      ]);
      setQuizzes(quizList || []);
      setCourses(Array.isArray(courseList) ? courseList : []);
    } catch (err) {
      setError(err.message || 'Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = async () => {
    setShowCreateModal(true);
    if (!courses || courses.length === 0) {
      try {
        const cList = await fetchCourses();
        if (cList && cList.length > 0) setCourses(cList);
      } catch {}
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleCourseChange = async (e) => {
    const cid = e.target.value;
    setNewQuiz((prev) => ({ ...prev, course_id: cid, module_id: '' }));
    if (!cid) {
      setModules([]);
      return;
    }
    try {
      setLoadingModules(true);
      const mods = await fetchModulesByCourse(cid);
      const safeMods = Array.isArray(mods) ? mods : mods?.modules || [];
      setModules(safeMods);
      if (safeMods.length > 0) {
        setNewQuiz((prev) => ({ ...prev, module_id: safeMods[0].id }));
      }
    } catch {
      setModules([]);
    } finally {
      setLoadingModules(false);
    }
  };

  const handlePublish = async (quizId) => {
    if (!window.confirm('Are you sure you want to publish this quiz? It will become visible to eligible students.')) {
      return;
    }
    try {
      await publishQuiz(quizId);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to publish quiz');
    }
  };

  const handleClose = async (quizId) => {
    if (!window.confirm('Close this quiz? Students will no longer be able to start new attempts.')) {
      return;
    }
    try {
      await closeQuiz(quizId);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to close quiz');
    }
  };

  const handleDelete = async (quizId) => {
    if (!window.confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
      return;
    }
    try {
      await deleteQuiz(quizId);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to delete quiz');
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateError('');

    if (!newQuiz.title.trim()) {
      setCreateError('Quiz title is required');
      return;
    }
    if (!newQuiz.module_id) {
      setCreateError('Please select a course module for this assessment');
      return;
    }

    try {
      setCreating(true);
      const created = await createQuiz({
        ...newQuiz,
        course_id: Number(newQuiz.course_id),
        module_id: Number(newQuiz.module_id),
        duration_minutes: newQuiz.duration_minutes ? Number(newQuiz.duration_minutes) : null,
        passing_marks: newQuiz.passing_marks ? Number(newQuiz.passing_marks) : null,
        max_attempts: Number(newQuiz.max_attempts) || 1,
        available_from: newQuiz.available_from || null,
        available_until: newQuiz.available_until || null,
      });

      setShowCreateModal(false);
      navigate(`${basePath}/quizzes/builder/${created.id}`);
    } catch (err) {
      setCreateError(err.message || 'Failed to create quiz');
    } finally {
      setCreating(false);
    }
  };

  const filteredQuizzes = quizzes.filter((q) => {
    if (courseFilter !== 'ALL') {
      const qCourseId = q.course_id || q.module?.course_id || q.session?.module?.course_id;
      if (String(qCourseId) !== String(courseFilter)) {
        return false;
      }
    }
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PUBLISHED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Published
          </span>
        );
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Draft
          </span>
        );
      case 'CLOSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Closed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0"
            style={{ background: ADMIN_PRIMARY }}
          >
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border"
                style={{ background: ADMIN_LIGHT, color: ADMIN_DARK, borderColor: '#c7cef5' }}
              >
                Assessment Center
              </span>
              <span className="text-xs text-slate-400 font-medium hidden sm:inline">Production Support & IT LMS</span>
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              Quiz & Assessment Management
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full sm:w-auto justify-start sm:justify-end">
          <button
            onClick={loadData}
            title="Refresh quizzes"
            disabled={loading}
            className="p-2 sm:px-2.5 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 rounded-xl border border-slate-300 transition-colors shadow-2xs min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => setShowCsvModal(true)}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 transition-all shadow-2xs hover:border-[#3c4cb8] hover:text-[#3c4cb8] min-h-[40px] cursor-pointer flex-1 sm:flex-none"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#3c4cb8]" />
            <span>Upload CSV</span>
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-xs hover:opacity-95 min-h-[40px] cursor-pointer flex-1 sm:flex-none"
            style={{ background: ADMIN_PRIMARY }}
          >
            <Plus className="w-4 h-4" />
            <span>Create Assessment</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-xs font-semibold text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Filters & Search Controls ── */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search quizzes by title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#3c4cb8] focus:ring-1 focus:ring-[#3c4cb8] min-h-[40px] bg-slate-50/50"
          />
        </form>

        {/* Filter Dropdowns */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 w-full md:w-auto flex-wrap">
          <div className="flex items-center gap-2 flex-1 sm:flex-initial">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold shrink-0">
              <Filter className="w-3.5 h-3.5" />
              <span>Status:</span>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-[#3c4cb8] min-h-[40px] cursor-pointer shadow-2xs"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          {courses.length > 0 && (
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-[#3c4cb8] max-w-full sm:max-w-[220px] truncate min-h-[40px] cursor-pointer shadow-2xs"
            >
              <option value="ALL">All Courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* ── No Assigned Courses Banner ── */}
      {!loading && courses.length === 0 && !isViewingAsAdmin && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-amber-900">No Assigned Courses</h4>
            <p className="text-xs text-amber-700 mt-0.5">
              You are currently not assigned to any courses. You can only view and manage assessments for courses or batches you are assigned to teach.
            </p>
          </div>
        </div>
      )}

      {/* ── Quizzes Container ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 text-[#3c4cb8] animate-spin" />
            <p className="text-xs font-semibold text-slate-500">Loading assessments...</p>
          </div>
        ) : filteredQuizzes.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3 px-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
              <FileQuestion className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No quizzes found</h3>
            <p className="text-xs text-slate-500 max-w-sm">
              {searchTerm || statusFilter !== 'ALL'
                ? 'Try adjusting your search criteria or status filter to locate existing quizzes.'
                : 'Create your first MCQ or Coding assessment for your students using the button above.'}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-xs hover:opacity-95"
              style={{ background: ADMIN_PRIMARY }}
            >
              <Plus className="w-4 h-4" />
              <span>Create New Quiz</span>
            </button>
          </div>
        ) : (
          <>
            {/* ── Mobile & Tablet Assessment Cards (lg:hidden) ── */}
            <div className="lg:hidden divide-y divide-slate-100">
              {filteredQuizzes.map((quiz) => (
                <div key={quiz.id} className="p-4 space-y-3 hover:bg-slate-50/50 transition-colors">
                  {/* Header: Course/Module Badge & Status Badge */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="min-w-0 flex-1 flex flex-wrap items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-800 text-[11px] font-bold truncate max-w-full sm:max-w-xs">
                        {quiz.course?.name || quiz.module?.course?.name || quiz.session?.title || 'General Course'}
                      </span>
                      {(quiz.module?.name || quiz.session?.module?.name) && (
                        <span className="text-[11px] font-semibold text-slate-500 truncate max-w-full sm:max-w-xs">
                          &bull; {quiz.module?.name || quiz.session?.module?.name}
                        </span>
                      )}
                    </div>
                    <div className="shrink-0">
                      {getStatusBadge(quiz.status)}
                    </div>
                  </div>

                  {/* Quiz Title & Description */}
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm leading-snug break-words">
                      {quiz.title}
                    </h3>
                    {quiz.description && (
                      <p className="text-slate-500 text-xs mt-1 line-clamp-2 leading-relaxed">
                        {quiz.description}
                      </p>
                    )}
                  </div>

                  {/* Metrics Row: Duration, Pass Marks, Questions, Attempts */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2.5 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-medium">
                        {quiz.duration_minutes ? `${quiz.duration_minutes} mins` : 'No time limit'}
                      </span>
                      {quiz.passing_marks && (
                        <span className="text-slate-400 text-[11px]">
                          (Pass: {Number(quiz.passing_marks)})
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap text-slate-700">
                      <span className="font-bold text-slate-800">
                        {quiz.question_count || 0} Questions
                      </span>
                      <span className="text-slate-400">&bull;</span>
                      <span className="font-semibold text-slate-700">
                        {Number(quiz.total_marks || 0)} Marks
                      </span>
                      <div className="flex items-center gap-1 ml-auto sm:ml-0">
                        <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                          {quiz.mcq_count || 0} MCQ
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                          {quiz.coding_count || 0} Code
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-1.5 text-slate-600">
                      <span className="text-slate-400 text-[11px]">Attempts:</span>
                      <span className="font-semibold text-slate-800 text-xs">
                        {quiz.max_attempts} {quiz.max_attempts === 1 ? 'attempt' : 'attempts'}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons Footer */}
                  <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(`${basePath}/quizzes/${quiz.id}/attempts`)}
                      title="View Student Attempts"
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition min-h-[38px] cursor-pointer flex-1 sm:flex-initial"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>Attempts</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate(`${basePath}/quizzes/builder/${quiz.id}`)}
                      title="Open Quiz & Question Builder"
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-xs font-semibold text-indigo-700 transition min-h-[38px] cursor-pointer flex-1 sm:flex-initial"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Builder</span>
                    </button>

                    {quiz.status === 'DRAFT' && (
                      <button
                        type="button"
                        onClick={() => handlePublish(quiz.id)}
                        title="Verify & Publish Quiz"
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-xs font-bold text-emerald-700 transition min-h-[38px] cursor-pointer flex-1 sm:flex-initial"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Publish</span>
                      </button>
                    )}

                    {quiz.status === 'PUBLISHED' && (
                      <button
                        type="button"
                        onClick={() => handleClose(quiz.id)}
                        title="Close Quiz"
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-xs font-bold text-amber-700 transition min-h-[38px] cursor-pointer flex-1 sm:flex-initial"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Close</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDelete(quiz.id)}
                      title="Delete Quiz"
                      className="inline-flex items-center justify-center p-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 transition min-h-[38px] min-w-[38px] cursor-pointer ml-auto sm:ml-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Desktop Quizzes Table (hidden lg:block) ── */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 font-bold text-slate-700 uppercase text-[11px] tracking-wider">
                    <th className="py-3.5 px-4">Quiz</th>
                    <th className="py-3.5 px-4">Course &amp; Module</th>
                    <th className="py-3.5 px-4">Questions &amp; Marks</th>
                    <th className="py-3.5 px-4">Attempts Allowed</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredQuizzes.map((quiz) => (
                    <tr key={quiz.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Quiz title & desc */}
                      <td className="py-4 px-4">
                        <div>
                          <span className="font-bold text-slate-900 text-[13px] block">
                            {quiz.title}
                          </span>
                          {quiz.description && (
                            <p className="text-slate-400 text-[11px] truncate max-w-xs mt-0.5">
                              {quiz.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                            {quiz.duration_minutes ? (
                              <span className="inline-flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {quiz.duration_minutes} mins
                              </span>
                            ) : (
                              <span>No time limit</span>
                            )}
                            {quiz.passing_marks && (
                              <span>Pass: {Number(quiz.passing_marks)} marks</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Course & Module */}
                      <td className="py-4 px-4">
                        <span className="px-2 py-1 rounded-md bg-indigo-50 text-indigo-800 text-[11px] font-bold block max-w-xs truncate">
                          {quiz.course?.name || quiz.module?.course?.name || quiz.session?.title || 'General Course'}
                        </span>
                        {(quiz.module?.name || quiz.session?.module?.name) && (
                          <span className="text-[11px] font-semibold text-slate-600 block mt-1 truncate max-w-xs">
                            {quiz.module?.name || quiz.session?.module?.name}
                          </span>
                        )}
                      </td>

                      {/* Questions & Marks */}
                      <td className="py-4 px-4">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-800 text-[12px] block">
                            {quiz.question_count || 0} Questions • {Number(quiz.total_marks || 0)} Total Marks
                          </span>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                            <span className="px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-semibold">
                              {quiz.mcq_count || 0} MCQ
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-semibold">
                              {quiz.coding_count || 0} Coding
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Max attempts */}
                      <td className="py-4 px-4">
                        <span className="text-slate-700 font-semibold">
                          {quiz.max_attempts} {quiz.max_attempts === 1 ? 'attempt' : 'attempts'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">{getStatusBadge(quiz.status)}</td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Attempts */}
                          <button
                            type="button"
                            onClick={() => navigate(`${basePath}/quizzes/${quiz.id}/attempts`)}
                            title="View Student Attempts"
                            className="p-1.5 text-slate-600 hover:text-[#3c4cb8] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit / Build */}
                          <button
                            type="button"
                            onClick={() => navigate(`${basePath}/quizzes/builder/${quiz.id}`)}
                            title="Open Quiz & Question Builder"
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Publish (if Draft) */}
                          {quiz.status === 'DRAFT' && (
                            <button
                              type="button"
                              onClick={() => handlePublish(quiz.id)}
                              title="Verify & Publish Quiz"
                              className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}

                          {/* Close (if Published) */}
                          {quiz.status === 'PUBLISHED' && (
                            <button
                              type="button"
                              onClick={() => handleClose(quiz.id)}
                              title="Close Quiz"
                              className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDelete(quiz.id)}
                            title="Delete Quiz"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ── Create Quiz Modal ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-100 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
                  style={{ background: ADMIN_PRIMARY }}
                >
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Create New Assessment</h3>
                  <p className="text-[11px] text-slate-400 font-medium">Configure quiz settings and initial parameters</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {createError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-medium text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Quiz Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Linux Fundamentals & Shell Scripting"
                  value={newQuiz.title}
                  onChange={(e) => setNewQuiz({ ...newQuiz, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#3c4cb8] focus:ring-1 focus:ring-[#3c4cb8]"
                  required
                />
              </div>

              {/* Course Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Course <span className="text-rose-500">*</span>
                </label>
                {courses.length === 0 ? (
                  <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                    No assigned courses found. You can only create assessments for courses you are assigned to teach.
                  </p>
                ) : (
                  <select
                    value={newQuiz.course_id}
                    onChange={handleCourseChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#3c4cb8] bg-white"
                    required
                  >
                    <option value="">Select a course...</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.code ? `(${c.code})` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Module Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Curriculum Module <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newQuiz.module_id}
                  onChange={(e) => setNewQuiz({ ...newQuiz, module_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#3c4cb8] bg-white disabled:opacity-50"
                  required
                  disabled={!newQuiz.course_id || loadingModules}
                >
                  <option value="">
                    {loadingModules
                      ? 'Loading modules...'
                      : !newQuiz.course_id
                      ? 'Select a course first...'
                      : modules.length === 0
                      ? 'No modules in this course'
                      : 'Select a module...'}
                  </option>
                  {modules.map((m, idx) => (
                    <option key={m.id} value={m.id}>
                      Module {idx + 1}: {m.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Assessments are linked directly to syllabus modules for clear curriculum tracking.
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief summary of the topics covered in this quiz..."
                  value={newQuiz.description}
                  onChange={(e) => setNewQuiz({ ...newQuiz, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#3c4cb8]"
                />
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Instructions for Students</label>
                <textarea
                  rows={2}
                  placeholder="e.g. You have 30 minutes. Ensure you run your code before submitting."
                  value={newQuiz.instructions}
                  onChange={(e) => setNewQuiz({ ...newQuiz, instructions: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#3c4cb8]"
                />
              </div>

              {/* Numerical Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="30"
                    value={newQuiz.duration_minutes}
                    onChange={(e) => setNewQuiz({ ...newQuiz, duration_minutes: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#3c4cb8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Passing Marks</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="25"
                    value={newQuiz.passing_marks}
                    onChange={(e) => setNewQuiz({ ...newQuiz, passing_marks: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#3c4cb8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Max Attempts</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="1"
                    value={newQuiz.max_attempts}
                    onChange={(e) => setNewQuiz({ ...newQuiz, max_attempts: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#3c4cb8]"
                    required
                  />
                </div>
              </div>

              {/* Schedule Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Available From</label>
                  <input
                    type="datetime-local"
                    value={newQuiz.available_from}
                    onChange={(e) => setNewQuiz({ ...newQuiz, available_from: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#3c4cb8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Available Until</label>
                  <input
                    type="datetime-local"
                    value={newQuiz.available_until}
                    onChange={(e) => setNewQuiz({ ...newQuiz, available_until: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#3c4cb8]"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                  style={{ background: ADMIN_PRIMARY }}
                >
                  {creating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  <span>Save Draft & Build Questions</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Create Test via CSV Modal ── */}
      <CreateQuizCsvModal
        isOpen={showCsvModal}
        onClose={() => setShowCsvModal(false)}
        onSuccess={(created) => {
          loadData();
          if (created?.id) {
            navigate(`${basePath}/quizzes/builder/${created.id}`);
          }
        }}
        courses={courses}
      />
    </div>
  );
}
