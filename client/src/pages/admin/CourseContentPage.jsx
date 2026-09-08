import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BookOpen, ChevronRight, Layers, Plus, RefreshCw, Trash2, Video, X,
} from 'lucide-react';
import StatusBadge from '../../components/admin/StatusBadge';
import LoadingState from '../../components/admin/LoadingState';
import EmptyState from '../../components/admin/EmptyState';
import ErrorState from '../../components/admin/ErrorState';
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

const MODULE_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];
const LECTURE_STATUSES = ['DRAFT', 'SCHEDULED', 'LIVE', 'COMPLETED', 'RECORDING_AVAILABLE', 'CANCELLED', 'PUBLISHED'];

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

// ─── Lecture Panel ────────────────────────────────────────────────────────────

function LecturePanel({ moduleId }) {
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

  const buildPayload = () => ({
    title: form.title.trim(),
    description: form.description.trim() || null,
    lecture_type: form.lecture_type,
    display_order: form.display_order !== '' ? Number(form.display_order) : undefined,
    scheduled_at: form.scheduled_at || null,
    duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : null,
    meet_url: form.meet_url.trim() || null,
    recording_url: form.recording_url.trim() || null,
    recording_provider: form.recording_provider || null,
    recording_status: form.recording_status,
  });

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
    setEditing(lec);
    setForm({
      title: lec.title || '',
      description: lec.description || '',
      lecture_type: lec.lecture_type || 'LIVE',
      display_order: lec.display_order ?? '',
      scheduled_at: lec.scheduled_at ? lec.scheduled_at.slice(0, 16) : '',
      duration_minutes: lec.duration_minutes ?? '',
      meet_url: lec.meet_url || '',
      recording_url: lec.recording_url || '',
      recording_provider: lec.recording_provider || '',
      recording_status: lec.recording_status || 'NOT_AVAILABLE',
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
            {isLive && (
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
                  Meet URL
                  <input type="url" value={form.meet_url} onChange={(e) => setForm((p) => ({ ...p, meet_url: e.target.value }))} placeholder="https://meet.google.com/..." className="course-admin-input" />
                </label>
              </>
            )}
            <label className="course-admin-label sm:col-span-2">
              Recording URL
              <input type="url" value={form.recording_url} onChange={(e) => setForm((p) => ({ ...p, recording_url: e.target.value }))} placeholder="https://drive.google.com/..." className="course-admin-input" />
            </label>
            <label className="course-admin-label">
              Recording Provider
              <select value={form.recording_provider} onChange={(e) => setForm((p) => ({ ...p, recording_provider: e.target.value }))} className="course-admin-select">
                <option value="">None</option>
                <option value="GOOGLE_DRIVE">Google Drive</option>
                <option value="S3">S3</option>
              </select>
            </label>
            <label className="course-admin-label">
              Recording Status
              <select value={form.recording_status} onChange={(e) => setForm((p) => ({ ...p, recording_status: e.target.value }))} className="course-admin-select">
                <option value="NOT_AVAILABLE">Not Available</option>
                <option value="AVAILABLE">Available</option>
              </select>
            </label>
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
                  {lec.meet_url && (
                    <a href={lec.meet_url} target="_blank" rel="noopener noreferrer" className="content-url-link" onClick={(e) => e.stopPropagation()}>Meet ↗</a>
                  )}
                  {lec.recording_url && (
                    <a href={lec.recording_url} target="_blank" rel="noopener noreferrer" className="content-url-link content-url-recording" onClick={(e) => e.stopPropagation()}>Recording ↗</a>
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
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CourseContentPage() {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);

  useEffect(() => {
    setIsLoadingCourses(true);
    getCourses()
      .then(setCourses)
      .catch(() => {})
      .finally(() => setIsLoadingCourses(false));
  }, []);

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
        <label className="course-admin-label" style={{ maxWidth: 480 }}>
          Select Course
          {isLoadingCourses ? (
            <div className="course-admin-input flex items-center gap-2 text-[var(--text-muted)]">
              <RefreshCw size={14} className="animate-spin" /> Loading courses…
            </div>
          ) : (
            <select value={selectedCourseId} onChange={handleCourseChange} className="course-admin-select">
              <option value="">— Choose a course —</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {(c.code || c.course_code) ? `[${c.code || c.course_code}] ` : ''}{c.name}
                </option>
              ))}
            </select>
          )}
        </label>
        {selectedCourse && (
          <div className="content-selected-course-pill">
            <BookOpen size={14} />
            <span>{selectedCourse.name}</span>
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
        <LecturePanel moduleId={selectedModuleId} />
      </div>
    </div>
  );
}
