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
                Assessment Center
              </span>
              <span className="text-xs text-slate-400 font-medium">Production Support & IT LMS</span>
            </div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              Quiz & Assessment Management
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-center">
          <button
            onClick={loadData}
            title="Refresh quizzes"
            disabled={loading}
            className="p-2 text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors shadow-2xs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => setShowCsvModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-all shadow-2xs hover:border-[#3c4cb8] hover:text-[#3c4cb8]"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#3c4cb8]" />
            <span>Upload CSV to Create Test</span>
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-xs hover:opacity-95"
            style={{ background: ADMIN_PRIMARY }}
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Assessment</span>
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
      <div className="bg-white p-4 rounded-2xl border border-[#ECEEF2] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search quizzes by title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#3c4cb8] focus:ring-1 focus:ring-[#3c4cb8]"
          />
        </form>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50 focus:outline-none focus:border-[#3c4cb8]"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="CLOSED">Closed</option>
          </select>

          {courses.length > 0 && (
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50 focus:outline-none focus:border-[#3c4cb8] max-w-[200px] truncate"
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

      {/* ── Quizzes Table ── */}
      <div className="bg-white rounded-2xl border border-[#ECEEF2] shadow-xs overflow-hidden">
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
          <div className="table-container overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-xs text-slate-600 border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 font-bold text-slate-700 uppercase text-[11px] tracking-wider">
                  <th className="py-3.5 px-4">Quiz</th>
                  <th className="py-3.5 px-4">Course & Module</th>
                  <th className="py-3.5 px-4">Questions & Marks</th>
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
                          className="p-1.5 text-slate-600 hover:text-[#3c4cb8] hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Edit / Build */}
                        <button
                          type="button"
                          onClick={() => navigate(`${basePath}/quizzes/builder/${quiz.id}`)}
                          title="Open Quiz & Question Builder"
                          className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {/* Publish (if Draft) */}
                        {quiz.status === 'DRAFT' && (
                          <button
                            type="button"
                            onClick={() => handlePublish(quiz.id)}
                            title="Verify & Publish Quiz"
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
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
                            className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => handleDelete(quiz.id)}
                          title="Delete Quiz"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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
