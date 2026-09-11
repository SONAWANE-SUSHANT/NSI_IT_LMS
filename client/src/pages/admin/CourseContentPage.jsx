import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BookOpen, ChevronRight, Layers, Plus, RefreshCw, Trash2, Video, X, AlertCircle, FileText, ExternalLink, ChevronDown,
} from 'lucide-react';
import StatusBadge from '../../components/admin/StatusBadge';
import LoadingState from '../../components/admin/LoadingState';
import EmptyState from '../../components/admin/EmptyState';
import ErrorState from '../../components/admin/ErrorState';
import { useAuth } from '../../context/useAuth';
import { fetchMyBatches } from '../../services/instructorService';
import VideoPlayerModal from '../../components/shared/VideoPlayerModal';
import {
  getCourses,
  getModulesByCourse,
  createModule,
  updateModule,
  updateModuleStatus,
  deleteModule,
  getLecturesByModule,
  createLecture,
  updateLecture,
  updateLectureStatus,
  deleteLecture,
  createLectureNote,
  updateLectureNoteStatus,
  deleteLectureNote,
} from '../../services/courseAdminService';

// ─── Empty forms ──────────────────────────────────────────────────────────────

const emptyModule = { title: '', description: '', display_order: '' };

const emptyLecture = {
  title: '',
  description: '',
  lecture_type: 'LIVE',
  display_order: '',
  scheduled_at: '',
  duration_minutes: '',
  meet_url: '',
  recording_url: '',
  recording_provider: '',
  recording_status: 'NOT_AVAILABLE',
};

const MODULE_STATUSES = ['ACTIVE', 'INACTIVE'];
const LECTURE_STATUSES = ['DRAFT', 'SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED', 'PUBLISHED'];
const NOTE_TYPES = ['PDF', 'PPT', 'DOC', 'EXCEL', 'ZIP', 'CODE', 'LINK', 'OTHER'];

function formatDateTime(dt) {
  if (!dt) return '—';
  const d = new Date(dt);
  return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

// ─── Module Panel ─────────────────────────────────────────────────────────────

function ModulePanel({ courseId, selectedModuleId, onModuleSelect }) {
  const [modules, setModules] = useState([]);
  const [form, setForm] = useState(emptyModule);
  const [editing, setEditing] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const loadModules = useCallback(async () => {
    if (!courseId) { setModules([]); return; }
    setIsLoading(true);
    setError('');
    try {
      const data = await getModulesByCourse(courseId);
      setModules(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load modules');
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => { loadModules(); }, [loadModules]);

  const resetForm = () => { setEditing(null); setForm(emptyModule); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        display_order: form.display_order !== '' ? Number(form.display_order) : undefined,
      };
      if (editing) {
        await updateModule(editing.id, payload);
      } else {
        await createModule(courseId, payload);
      }
      resetForm();
      await loadModules();
    } catch (err) {
      alert(err.message || 'Failed to save module');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (mod) => {
    setEditing(mod);
    setForm({
      title: mod.title || '',
      description: mod.description || '',
      display_order: mod.display_order ?? '',
    });
  };

  const handleStatusChange = async (mod, status) => {
    try {
      await updateModuleStatus(mod.id, status);
      setModules((prev) => prev.map((m) => m.id === mod.id ? { ...m, status } : m));
    } catch (err) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleDelete = async (mod) => {
    if (!window.confirm(`Archive module "${mod.title}"?`)) return;
    try {
      await deleteModule(mod.id);
      if (selectedModuleId === mod.id) onModuleSelect(null);
      await loadModules();
    } catch (err) {
      alert(err.message || 'Failed to archive module');
    }
  };

  return (
    <div className="content-panel">
      <div className="content-panel-header">
        <div className="content-panel-kicker">
          <Layers size={15} />
          <span>Modules</span>
        </div>
        <button onClick={loadModules} disabled={isLoading || !courseId} className="content-icon-btn-sm">
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {courseId && (
        <form onSubmit={handleSubmit} className="content-inline-form">
          <div className="content-inline-form-fields">
            <input
              required
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="Module title *"
              maxLength={200}
              className="course-admin-input"
            />
            <input
              type="number"
              min="0"
              value={form.display_order}
              onChange={(e) => setForm((p) => ({ ...p, display_order: e.target.value }))}
              placeholder="Order"
              className="course-admin-input content-order-input"
            />
          </div>
          <textarea
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            placeholder="Description (optional)"
            rows={2}
            className="course-admin-textarea"
          />
          <div className="content-form-actions">
            <button disabled={isSaving} className="course-admin-primary-btn content-action-btn">
              <Plus size={14} />
              {editing ? 'Save Module' : 'Add Module'}
            </button>
            {editing && (
              <button type="button" onClick={resetForm} className="course-admin-secondary-btn content-action-btn">
                <X size={14} /> Cancel
              </button>
            )}
          </div>
        </form>
      )}

      <div className="content-list">
        {!courseId ? (
          <p className="content-empty-hint">Select a course above to manage its modules.</p>
        ) : isLoading ? (
          <LoadingState rows={3} />
        ) : error ? (
          <ErrorState title="Failed to load modules" message={error} onRetry={loadModules} />
        ) : modules.length === 0 ? (
          <EmptyState title="No modules yet" description="Add the first module for this course." icon={<Layers size={28} />} />
        ) : (
          modules.map((mod) => (
            <div
              key={mod.id}
              className={`content-list-item ${selectedModuleId === mod.id ? 'content-list-item--active' : ''}`}
              onClick={() => onModuleSelect(mod.id === selectedModuleId ? null : mod.id)}
            >
              <div className="content-list-item-body">
                <div className="content-list-item-title">
                  <span className="content-order-badge">{mod.display_order ?? '—'}</span>
                  <span className="flex-1 truncate">{mod.title}</span>
                  {selectedModuleId === mod.id && <ChevronRight size={14} className="shrink-0 text-[var(--admin-primary)]" />}
                </div>
                <div className="content-list-item-meta">
                  <StatusBadge status={mod.status} />
                  {mod.description && <span className="content-desc-snippet">{mod.description}</span>}
                </div>
              </div>
              <div className="content-list-item-actions" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => handleEdit(mod)} className="course-admin-text-btn">Edit</button>
                <select
                  value={mod.status}
                  onChange={(e) => handleStatusChange(mod, e.target.value)}
                  className="course-admin-inline-select"
                >
                  {MODULE_STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
                <button onClick={() => handleDelete(mod)} className="course-admin-danger-btn">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Lecture Notes & Resources Section ────────────────────────────────────────

function LectureNotesSection({ lecture, onNotesUpdated }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState(lecture.notes || []);
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [noteType, setNoteType] = useState('PDF');
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    setNotes(lecture.notes || []);
  }, [lecture.notes]);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);
    setActionError('');
    try {
      const newNote = await createLectureNote(lecture.id, {
        title: title.trim(),
        note_type: noteType,
        external_url: url.trim() || null,
        file_url: url.trim() || null,
        status: status,
      });
      setNotes((prev) => [...prev, newNote]);
      setTitle('');
      setUrl('');
      setStatus('ACTIVE');
      setShowAddForm(false);
      if (onNotesUpdated) onNotesUpdated();
    } catch (err) {
      setActionError(err.message || 'Failed to add note');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (noteId, newStatus) => {
    try {
      await updateLectureNoteStatus(noteId, newStatus);
      setNotes((prev) =>
        prev.map((n) => (n.id === noteId ? { ...n, status: newStatus } : n))
      );
      if (onNotesUpdated) onNotesUpdated();
    } catch (err) {
      alert(err.message || 'Failed to update note status');
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Delete this lecture note?')) return;
    try {
      await deleteLectureNote(noteId);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      if (onNotesUpdated) onNotesUpdated();
    } catch (err) {
      alert(err.message || 'Failed to delete note');
    }
  };

  const activeCount = notes.filter((n) => n.status === 'ACTIVE').length;

  return (
    <div className="mt-2.5 pt-2 border-t border-slate-100 w-full" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3c4cb8] hover:text-[#2e3a8c] py-0.5 px-2 rounded-md hover:bg-indigo-50 transition-colors"
        >
          <FileText size={13} />
          <span>Lecture Notes ({notes.length})</span>
          {activeCount < notes.length && (
            <span className="text-[10px] text-amber-600 font-normal">({notes.length - activeCount} inactive)</span>
          )}
          <ChevronDown size={13} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && !showAddForm && (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#3c4cb8] hover:underline"
          >
            <Plus size={12} /> Add Note
          </button>
        )}
      </div>

      {isOpen && (
        <div className="mt-2 pl-2 border-l-2 border-indigo-200 space-y-2">
          {actionError && (
            <p className="text-xs text-rose-600 font-medium">{actionError}</p>
          )}

          {showAddForm && (
            <form onSubmit={handleAddNote} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="font-bold text-slate-700 flex items-center justify-between">
                <span>Add New Note / Material</span>
                <button
                  type="button"
                  onClick={() => { setShowAddForm(false); setActionError(''); }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={13} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  required
                  placeholder="Note / Resource Title *"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="course-admin-input text-xs"
                />
                <select
                  value={noteType}
                  onChange={(e) => setNoteType(e.target.value)}
                  className="course-admin-select text-xs"
                >
                  {NOTE_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="url"
                  placeholder="Resource / Download URL (optional)"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="course-admin-input text-xs sm:col-span-2"
                />
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="course-admin-select text-xs font-semibold"
                >
                  <option value="ACTIVE">Status: ACTIVE</option>
                  <option value="INACTIVE">Status: INACTIVE</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="course-admin-primary-btn text-xs py-1 px-3"
                >
                  {isSubmitting ? 'Adding...' : 'Save Note'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="course-admin-secondary-btn text-xs py-1 px-2"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {notes.length === 0 && !showAddForm ? (
            <p className="text-[11px] text-slate-400 italic">No notes attached yet. Click &quot;Add Note&quot; to attach study material.</p>
          ) : (
            <div className="space-y-1.5">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-white border border-slate-200 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                      {note.note_type || 'FILE'}
                    </span>
                    <span className="font-semibold text-slate-800 truncate" title={note.title}>
                      {note.title}
                    </span>
                    {(note.external_url || note.file_url) && (
                      <a
                        href={note.external_url || note.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-[#3c4cb8] hover:underline inline-flex items-center gap-0.5 shrink-0"
                      >
                        <ExternalLink size={11} /> Link
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={note.status}
                      onChange={(e) => handleStatusChange(note.id, e.target.value)}
                      className={`text-[11px] font-bold py-0.5 px-1.5 rounded border focus:outline-none ${
                        note.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border-slate-300'
                      }`}
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleDeleteNote(note.id)}
                      title="Delete Note"
                      className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Lecture Panel ────────────────────────────────────────────────────────────

function LecturePanel({ moduleId, user, onPlayLecture }) {
  const [lectures, setLectures] = useState([]);
  const [form, setForm] = useState(emptyLecture);
  const [editing, setEditing] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const loadLectures = useCallback(async () => {
    if (!moduleId) { setLectures([]); return; }
    setIsLoading(true);
    setError('');
    try {
      const data = await getLecturesByModule(moduleId);
      setLectures(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load lectures');
    } finally {
      setIsLoading(false);
    }
  }, [moduleId]);

  useEffect(() => {
    loadLectures();
    setShowForm(false);
    setEditing(null);
    setForm(emptyLecture);
  }, [loadLectures]);

  const resetForm = () => { setEditing(null); setForm(emptyLecture); setShowForm(false); };

  const buildPayload = () => {
    const isRecorded = form.lecture_type === 'RECORDED';
    const recUrl = form.recording_url.trim() || null;
    return {
      title: form.title.trim(),
      description: form.description.trim() || null,
      lecture_type: form.lecture_type,
      display_order: form.display_order !== '' ? Number(form.display_order) : undefined,
      scheduled_at: form.scheduled_at || null,
      duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : null,
      meet_url: isRecorded ? null : (form.meet_url.trim() || null),
      recording_url: recUrl,
      recording_provider: form.recording_provider || null,
      recording_status: recUrl ? (form.recording_status === 'NOT_AVAILABLE' ? 'AVAILABLE' : form.recording_status) : form.recording_status,
      ...(user?.role === 'INSTRUCTOR' ? { instructor_id: user.id } : {}),
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editing) {
        await updateLecture(editing.id, buildPayload());
      } else {
        await createLecture(moduleId, buildPayload());
      }
      resetForm();
      await loadLectures();
    } catch (err) {
      alert(err.message || 'Failed to save lecture');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (lec) => {
    const isRecorded = (lec.lecture_type || lec.session_type) === 'RECORDED';
    setEditing(lec);
    setForm({
      title: lec.title || '',
      description: lec.description || '',
      lecture_type: lec.lecture_type || lec.session_type || 'LIVE',
      display_order: lec.display_order ?? '',
      scheduled_at: lec.scheduled_at ? lec.scheduled_at.slice(0, 16) : '',
      duration_minutes: lec.duration_minutes ?? '',
      meet_url: isRecorded ? '' : (lec.meet_url || ''),
      recording_url: lec.recording_url || (isRecorded ? lec.session_url : '') || '',
      recording_provider: lec.recording_provider || '',
      recording_status: lec.recording_status || (isRecorded ? 'AVAILABLE' : 'NOT_AVAILABLE'),
    });
    setShowForm(true);
  };

  const handleStatusChange = async (lec, status) => {
    try {
      await updateLectureStatus(lec.id, status);
      setLectures((prev) => prev.map((l) => l.id === lec.id ? { ...l, status } : l));
    } catch (err) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleDelete = async (lec) => {
    if (!window.confirm(`Archive lecture "${lec.title}"?`)) return;
    try {
      await deleteLecture(lec.id);
      await loadLectures();
    } catch (err) {
      alert(err.message || 'Failed to archive lecture');
    }
  };

  const isLive = form.lecture_type === 'LIVE';

  return (
    <div className="content-panel">
      <div className="content-panel-header">
        <div className="content-panel-kicker">
          <Video size={15} />
          <span>Lectures</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadLectures} disabled={isLoading || !moduleId} className="content-icon-btn-sm">
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
          {moduleId && !showForm && (
            <button onClick={() => setShowForm(true)} className="course-admin-primary-btn content-action-btn">
              <Plus size={14} /> Add Lecture
            </button>
          )}
        </div>
      </div>

      {showForm && moduleId && (
        <form onSubmit={handleSubmit} className="content-lecture-form">
          <h3 className="content-form-heading">{editing ? 'Edit Lecture' : 'New Lecture'}</h3>
          <div className="content-lecture-form-grid">
            <label className="course-admin-label sm:col-span-2">
              Title *
              <input required value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} maxLength={250} className="course-admin-input" />
            </label>
            <label className="course-admin-label">
              Type
              <select value={form.lecture_type} onChange={(e) => setForm((p) => ({ ...p, lecture_type: e.target.value }))} className="course-admin-select">
                <option value="LIVE">Live</option>
                <option value="RECORDED">Recorded</option>
              </select>
            </label>
            <label className="course-admin-label">
              Order
              <input type="number" min="0" value={form.display_order} onChange={(e) => setForm((p) => ({ ...p, display_order: e.target.value }))} className="course-admin-input" />
            </label>
            {isLive ? (
              <>
                <label className="course-admin-label">
                  Scheduled At
                  <input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm((p) => ({ ...p, scheduled_at: e.target.value }))} className="course-admin-input" />
                </label>
                <label className="course-admin-label">
                  Duration (min)
                  <input type="number" min="1" value={form.duration_minutes} onChange={(e) => setForm((p) => ({ ...p, duration_minutes: e.target.value }))} className="course-admin-input" />
                </label>
                <label className="course-admin-label sm:col-span-2">
                  Live Meet URL
                  <input type="url" value={form.meet_url} onChange={(e) => setForm((p) => ({ ...p, meet_url: e.target.value }))} placeholder="https://meet.google.com/..." className="course-admin-input" />
                </label>
                <label className="course-admin-label sm:col-span-2">
                  Session Recording URL (Optional - after class ends)
                  <input type="url" value={form.recording_url} onChange={(e) => setForm((p) => ({ ...p, recording_url: e.target.value }))} placeholder="https://drive.google.com/..." className="course-admin-input" />
                </label>
              </>
            ) : (
              <>
                <label className="course-admin-label sm:col-span-2">
                  Recorded Video URL (YouTube, Google Drive, Vimeo, MP4) *
                  <input
                    type="url"
                    required
                    value={form.recording_url}
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm((p) => ({
                        ...p,
                        recording_url: val,
                        recording_status: val.trim() ? 'AVAILABLE' : p.recording_status,
                      }));
                    }}
                    placeholder="https://youtu.be/... or https://drive.google.com/..."
                    className="course-admin-input"
                  />
                </label>
                <label className="course-admin-label">
                  Duration (min)
                  <input type="number" min="1" value={form.duration_minutes} onChange={(e) => setForm((p) => ({ ...p, duration_minutes: e.target.value }))} className="course-admin-input" />
                </label>
                <label className="course-admin-label">
                  Recording Status
                  <select value={form.recording_status} onChange={(e) => setForm((p) => ({ ...p, recording_status: e.target.value }))} className="course-admin-select">
                    <option value="AVAILABLE">Available</option>
                    <option value="NOT_AVAILABLE">Not Available</option>
                  </select>
                </label>
              </>
            )}
            <label className="course-admin-label sm:col-span-2">
              Description
              <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={2} className="course-admin-textarea" />
            </label>
          </div>
          <div className="content-form-actions">
            <button disabled={isSaving} className="course-admin-primary-btn content-action-btn">
              <Plus size={14} />{editing ? 'Save Lecture' : 'Create Lecture'}
            </button>
            <button type="button" onClick={resetForm} className="course-admin-secondary-btn content-action-btn">
              <X size={14} /> Cancel
            </button>
          </div>
        </form>
      )}

      <div className="content-list">
        {!moduleId ? (
          <p className="content-empty-hint">Select a module on the left to see its lectures.</p>
        ) : isLoading ? (
          <LoadingState rows={3} />
        ) : error ? (
          <ErrorState title="Failed to load lectures" message={error} onRetry={loadLectures} />
        ) : lectures.length === 0 ? (
          <EmptyState title="No lectures yet" description="Add the first lecture for this module." icon={<Video size={28} />} />
        ) : (
          lectures.map((lec) => (
            <div key={lec.id} className="content-list-item content-list-item--lecture">
              <div className="content-list-item-body">
                <div className="content-list-item-title">
                  <span className="content-order-badge">{lec.display_order ?? '—'}</span>
                  <span className="flex-1 truncate">{lec.title}</span>
                  <span className={`content-type-pill ${lec.lecture_type === 'LIVE' ? 'content-type-live' : 'content-type-recorded'}`}>
                    {lec.lecture_type}
                  </span>
                </div>
                <div className="content-list-item-meta flex-wrap gap-y-1">
                  <StatusBadge status={lec.status} />
                  {lec.scheduled_at && <span className="content-desc-snippet">📅 {formatDateTime(lec.scheduled_at)}</span>}
                  {lec.duration_minutes && <span className="content-desc-snippet">⏱ {lec.duration_minutes} min</span>}
                  {lec.lecture_type === 'LIVE' && lec.meet_url && (
                    <a href={lec.meet_url} target="_blank" rel="noopener noreferrer" className="content-url-link" onClick={(e) => e.stopPropagation()}>Meet ↗</a>
                  )}
                  {(lec.recording_url || (lec.lecture_type === 'RECORDED' && (lec.session_url || lec.meet_url))) && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onPlayLecture) {
                          onPlayLecture({
                            ...lec,
                            recording_url: lec.recording_url || lec.session_url || lec.meet_url,
                          });
                        }
                      }}
                      className="content-url-link content-url-recording cursor-pointer"
                      title="Play lecture recording on screen"
                    >
                      Watch Recording ▶
                    </button>
                  )}
                </div>
              </div>
              <div className="content-list-item-actions">
                <button onClick={() => handleEdit(lec)} className="course-admin-text-btn">Edit</button>
                <select value={lec.status} onChange={(e) => handleStatusChange(lec, e.target.value)} className="course-admin-inline-select">
                  {LECTURE_STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
                <button onClick={() => handleDelete(lec)} className="course-admin-danger-btn"><Trash2 size={13} /></button>
              </div>

              {/* Lecture Notes & Study Materials */}
              <LectureNotesSection lecture={lec} onNotesUpdated={loadLectures} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CourseContentPage() {
  const { user } = useAuth();
  const isInstructor = user?.role === 'INSTRUCTOR';

  const [courses, setCourses] = useState([]);
  const [assignedCourseIds, setAssignedCourseIds] = useState(new Set());
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [courseError, setCourseError] = useState('');
  const [playingLecture, setPlayingLecture] = useState(null);

  const loadCoursesData = useCallback(async () => {
    setIsLoadingCourses(true);
    setCourseError('');
    try {
      let myCourseIds = new Set();
      if (isInstructor) {
        try {
          const myBatches = await fetchMyBatches();
          myCourseIds = new Set(
            myBatches
              .map((b) => b.course_id || b.course?.id)
              .filter(Boolean)
          );
          setAssignedCourseIds(myCourseIds);
        } catch {
          // Non-critical fallback if batches fail
        }
      }

      const allCourses = await getCourses();
      const list = allCourses || [];
      setCourses(list);

      // Auto-select course if none selected yet
      setSelectedCourseId((prev) => {
        if (prev && list.some((c) => String(c.id) === String(prev))) {
          return prev;
        }
        if (list.length === 0) return '';
        if (isInstructor && myCourseIds.size > 0) {
          const firstAssigned = list.find((c) => myCourseIds.has(c.id));
          if (firstAssigned) return String(firstAssigned.id);
        }
        return String(list[0].id);
      });
    } catch (err) {
      setCourseError(err.message || 'Failed to load courses');
    } finally {
      setIsLoadingCourses(false);
    }
  }, [isInstructor]);

  useEffect(() => {
    loadCoursesData();
  }, [loadCoursesData]);

  const selectedCourse = useMemo(
    () => courses.find((c) => String(c.id) === String(selectedCourseId)),
    [courses, selectedCourseId]
  );

  const handleCourseChange = (e) => {
    setSelectedCourseId(e.target.value);
    setSelectedModuleId(null);
  };

  return (
    <div className="course-admin-page">
      <div className="course-admin-header">
        <div>
          <div className="course-admin-kicker">
            <BookOpen size={20} />
            <span>Course Content</span>
          </div>
          <h1 className="course-admin-title">Course Content</h1>
          <p className="course-admin-subtitle">
            Manage modules and lectures for each course. Select a course, then click a module to view its lectures.
          </p>
        </div>
      </div>

      <div className="content-course-selector-wrap">
        <label className="course-admin-label" style={{ maxWidth: 520 }}>
          Select Course
          {isLoadingCourses ? (
            <div className="course-admin-input flex items-center gap-2 text-[var(--text-muted)]">
              <RefreshCw size={14} className="animate-spin" /> Loading courses…
            </div>
          ) : courseError ? (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-rose-600 flex items-center gap-1">
                <AlertCircle size={14} /> {courseError}
              </span>
              <button
                type="button"
                onClick={loadCoursesData}
                className="text-xs text-[var(--admin-primary)] font-semibold underline"
              >
                Retry
              </button>
            </div>
          ) : (
            <select value={selectedCourseId} onChange={handleCourseChange} className="course-admin-select">
              <option value="">— Choose a course —</option>
              {courses.map((c) => {
                const isAssigned = assignedCourseIds.has(c.id);
                return (
                  <option key={c.id} value={c.id}>
                    {(c.code || c.course_code) ? `[${c.code || c.course_code}] ` : ''}
                    {c.name}
                    {isAssigned ? ' ★ (Assigned to you)' : ''}
                  </option>
                );
              })}
            </select>
          )}
        </label>
        {selectedCourse && (
          <div className="content-selected-course-pill">
            <BookOpen size={14} />
            <span>{selectedCourse.name}</span>
            {assignedCourseIds.has(selectedCourse.id) && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                Assigned
              </span>
            )}
            {selectedCourse.status && <StatusBadge status={selectedCourse.status} />}
          </div>
        )}
      </div>

      <div className="content-two-panel-grid">
        <ModulePanel
          courseId={selectedCourseId || null}
          selectedModuleId={selectedModuleId}
          onModuleSelect={setSelectedModuleId}
        />
        <LecturePanel
          moduleId={selectedModuleId}
          user={user}
          onPlayLecture={setPlayingLecture}
        />
      </div>

      {/* ── In-LMS Video Player Modal ── */}
      <VideoPlayerModal
        isOpen={!!playingLecture}
        onClose={() => setPlayingLecture(null)}
        lecture={playingLecture}
        courseName={selectedCourse?.name}
      />
    </div>
  );
}
