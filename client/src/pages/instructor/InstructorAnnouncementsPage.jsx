import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Plus,
  Search,
  BookOpen,
  Users,
  Clock,
  CheckCircle2,
  Archive,
  Edit3,
  Send,
  AlertCircle,
  X,
  RefreshCw,
} from 'lucide-react';
import {
  fetchInstructorAnnouncements,
  createInstructorAnnouncement,
  updateInstructorAnnouncement,
  publishInstructorAnnouncement,
  archiveInstructorAnnouncement,
} from '../../services/announcementService';
import { fetchMyBatches } from '../../services/instructorService';

const PRIMARY_COLOR = '#3c4cb8';

export default function InstructorAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [myBatches, setMyBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Form fields
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    scope: 'BATCH', // 'BATCH' | 'COURSE'
    course_id: '',
    batch_id: '',
    status: 'DRAFT',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [annRes, batchesData] = await Promise.all([
        fetchInstructorAnnouncements({ status: statusFilter || undefined, search: searchTerm || undefined }),
        fetchMyBatches().catch(() => []),
      ]);

      setAnnouncements(annRes?.data || []);
      setMyBatches(batchesData || []);
    } catch (err) {
      console.error('Failed to load instructor announcements:', err);
      setError(err.response?.data?.message || 'Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  // Derive unique assigned courses from batches
  const assignedCourses = React.useMemo(() => {
    const map = new Map();
    myBatches.forEach((b) => {
      if (b.course && b.course_id) {
        map.set(b.course_id, b.course);
      }
    });
    return Array.from(map.values());
  }, [myBatches]);

  const handleOpenCreateModal = () => {
    setEditingAnnouncement(null);
    const defaultBatch = myBatches[0]?.id ? String(myBatches[0].id) : '';
    setFormData({
      title: '',
      message: '',
      scope: 'BATCH',
      course_id: myBatches[0]?.course_id ? String(myBatches[0].course_id) : '',
      batch_id: defaultBatch,
      status: 'DRAFT',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (ann) => {
    setEditingAnnouncement(ann);
    setFormData({
      title: ann.title || '',
      message: ann.message || '',
      scope: ann.batch_id ? 'BATCH' : 'COURSE',
      course_id: ann.course_id ? String(ann.course_id) : '',
      batch_id: ann.batch_id ? String(ann.batch_id) : '',
      status: ann.status || 'DRAFT',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAnnouncement(null);
  };

  const handleFormSubmit = async (e, forcePublish = false) => {
    if (e) e.preventDefault();
    if (!formData.title.trim() || !formData.message.trim()) {
      setFormError('Please provide both title and message');
      return;
    }

    if (formData.scope === 'COURSE' && !formData.course_id) {
      setFormError('Please select one of your assigned courses');
      return;
    }

    if (formData.scope === 'BATCH' && !formData.batch_id) {
      setFormError('Please select one of your assigned batches');
      return;
    }

    try {
      setModalSubmitting(true);
      setFormError('');

      const payload = {
        title: formData.title.trim(),
        message: formData.message.trim(),
        course_id: formData.scope === 'COURSE' ? Number(formData.course_id) : null,
        batch_id: formData.scope === 'BATCH' ? Number(formData.batch_id) : null,
        status: forcePublish ? 'PUBLISHED' : formData.status,
      };

      if (editingAnnouncement) {
        await updateInstructorAnnouncement(editingAnnouncement.id, payload);
        setSuccessMsg('Announcement updated successfully');
      } else {
        await createInstructorAnnouncement(payload);
        setSuccessMsg(
          forcePublish
            ? 'Announcement published and student notifications sent!'
            : 'Announcement saved as draft'
        );
      }

      handleCloseModal();
      loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Error saving announcement:', err);
      setFormError(err.response?.data?.message || 'Failed to save announcement');
    } finally {
      setModalSubmitting(false);
    }
  };

  const handlePublish = async (ann) => {
    if (!window.confirm(`Publish "${ann.title}" now? Students will immediately receive notifications.`)) {
      return;
    }
    try {
      await publishInstructorAnnouncement(ann.id);
      setSuccessMsg('Announcement published and notifications sent!');
      loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to publish announcement');
    }
  };

  const handleArchive = async (ann) => {
    if (!window.confirm(`Archive "${ann.title}"? Students will no longer see it.`)) {
      return;
    }
    try {
      await archiveInstructorAnnouncement(ann.id);
      setSuccessMsg('Announcement archived');
      loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to archive announcement');
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-200">
              Instructor Communication
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Class Announcements
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Publish notices, syllabus updates, and reminders for your assigned cohorts.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          disabled={myBatches.length === 0}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white shadow-md hover:shadow-lg transition-all cursor-pointer w-full sm:w-auto min-h-[42px] disabled:opacity-50"
          style={{ background: PRIMARY_COLOR }}
        >
          <Plus className="w-4 h-4" />
          <span>New Announcement</span>
        </button>
      </div>

      {/* Success alert */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-xs font-bold text-emerald-800 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-xs font-semibold text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search class notices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full min-h-[40px] pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 flex-1 md:flex-initial">
            {[
              { id: '', label: 'All Status' },
              { id: 'PUBLISHED', label: 'Published' },
              { id: 'DRAFT', label: 'Draft' },
              { id: 'ARCHIVED', label: 'Archived' },
            ].map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setStatusFilter(pill.id)}
                className={`px-3 py-2 sm:py-1.5 min-h-[36px] sm:min-h-0 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  statusFilter === pill.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={loadData}
            title="Refresh"
            className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Announcements List */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-semibold">Loading announcements...</p>
          </div>
        ) : announcements.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Megaphone className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No announcements yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Create an announcement to communicate schedule updates or important class news to your students.
            </p>
            {myBatches.length > 0 && (
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs hover:shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
                style={{ background: PRIMARY_COLOR }}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Announcement</span>
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[700px] text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-5">Title & Message</th>
                    <th className="py-3.5 px-4">Target</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {announcements.map((ann) => {
                    const isBatch = Boolean(ann.batch_id);

                    return (
                      <tr key={ann.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-4 px-5 max-w-xs sm:max-w-md">
                          <div className="font-bold text-slate-900 leading-snug break-words">{ann.title}</div>
                          <p className="text-slate-500 text-[11px] line-clamp-2 mt-0.5 whitespace-pre-line leading-relaxed break-words">
                            {ann.message}
                          </p>
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap">
                          {isBatch ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 truncate max-w-[200px]" title={`Batch: ${ann.batch?.name || 'Class'}`}>
                              <Users className="w-3 h-3 shrink-0" />
                              <span className="truncate">Batch: {ann.batch?.name || 'Class'}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 truncate max-w-[200px]" title={`Course: ${ann.course?.name || 'Course'}`}>
                              <BookOpen className="w-3 h-3 shrink-0" />
                              <span className="truncate">Course: {ann.course?.name || 'Course'}</span>
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap">
                          <span
                            className={`font-extrabold px-2.5 py-0.5 rounded-full text-[10px] tracking-wider uppercase border ${
                              ann.status === 'PUBLISHED'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : ann.status === 'DRAFT'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {ann.status}
                          </span>
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap text-slate-500 text-[11px]">
                          {ann.published_at ? (
                            <span>
                              {new Date(ann.published_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Draft</span>
                          )}
                        </td>

                        <td className="py-4 px-5 whitespace-nowrap text-right space-x-1">
                          {ann.status === 'DRAFT' && (
                            <button
                              type="button"
                              onClick={() => handlePublish(ann)}
                              title="Publish & Notify Students"
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 border border-emerald-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span className="text-[11px] font-bold">Publish</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(ann)}
                            title="Edit"
                            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {ann.status !== 'ARCHIVED' && (
                            <button
                              type="button"
                              onClick={() => handleArchive(ann)}
                              title="Archive"
                              className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 border border-amber-200 transition-colors cursor-pointer"
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-slate-100">
              {announcements.map((ann) => {
                const isBatch = Boolean(ann.batch_id);

                return (
                  <div key={ann.id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="min-w-0">
                        {isBatch ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 truncate max-w-[200px]">
                            <Users className="w-3 h-3 shrink-0" />
                            <span className="truncate">Batch: {ann.batch?.name || 'Class'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 truncate max-w-[200px]">
                            <BookOpen className="w-3 h-3 shrink-0" />
                            <span className="truncate">Course: {ann.course?.name || 'Course'}</span>
                          </span>
                        )}
                      </div>

                      <span
                        className={`font-extrabold px-2.5 py-0.5 rounded-full text-[10px] tracking-wider uppercase border shrink-0 ${
                          ann.status === 'PUBLISHED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : ann.status === 'DRAFT'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {ann.status}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 leading-snug break-words text-sm">
                        {ann.title}
                      </h4>
                      <p className="text-slate-500 text-xs line-clamp-3 mt-1 whitespace-pre-line leading-relaxed break-words">
                        {ann.message}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>
                          {ann.published_at
                            ? new Date(ann.published_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : 'Draft'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center gap-2 flex-wrap">
                      {ann.status === 'DRAFT' && (
                        <button
                          type="button"
                          onClick={() => handlePublish(ann)}
                          title="Publish & Notify Students"
                          className="flex-1 min-h-[38px] px-3 py-1.5 rounded-xl text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer font-bold text-xs"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Publish</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(ann)}
                        title="Edit"
                        className="flex-1 min-h-[38px] px-3 py-1.5 rounded-xl text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer font-bold text-xs"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      {ann.status !== 'ARCHIVED' && (
                        <button
                          type="button"
                          onClick={() => handleArchive(ann)}
                          title="Archive"
                          className="min-h-[38px] px-3 py-1.5 rounded-xl text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer font-bold text-xs"
                        >
                          <Archive className="w-3.5 h-3.5" />
                          <span>Archive</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200/90 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingAnnouncement ? 'Edit Announcement' : 'Post Class Announcement'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Send updates to your assigned cohorts.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => handleFormSubmit(e, false)} className="space-y-4 pt-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Next live session time adjusted"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Audience <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, scope: 'BATCH' })}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      formData.scope === 'BATCH'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Specific Batch</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, scope: 'COURSE', batch_id: '' })}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      formData.scope === 'COURSE'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Assigned Course</span>
                  </button>
                </div>

                {formData.scope === 'BATCH' ? (
                  <select
                    value={formData.batch_id}
                    onChange={(e) => setFormData({ ...formData, batch_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="">-- Choose Assigned Batch --</option>
                    {myBatches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.course?.name || 'Cohort'})
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={formData.course_id}
                    onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="">-- Choose Assigned Course --</option>
                    {assignedCourses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Message <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder="Type your message for the cohort..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-y"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {modalSubmitting ? 'Saving...' : 'Save Draft'}
                </button>

                <button
                  type="button"
                  disabled={modalSubmitting}
                  onClick={() => handleFormSubmit(null, true)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                  style={{ background: PRIMARY_COLOR }}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Publish & Notify</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
