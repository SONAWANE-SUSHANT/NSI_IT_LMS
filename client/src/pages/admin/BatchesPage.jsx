import { useCallback, useEffect, useState } from 'react';
import { CalendarDays, Plus, RefreshCw } from 'lucide-react';
import StatusBadge from '../../components/admin/StatusBadge';
import LoadingState from '../../components/admin/LoadingState';
import EmptyState from '../../components/admin/EmptyState';
import ErrorState from '../../components/admin/ErrorState';
import {
  createCourseBatch,
  getCourseBatches,
  getCourses,
  updateCourseBatch,
  updateCourseBatchStatus,
} from '../../services/courseAdminService';

const emptyBatch = {
  name: '',
  description: '',
  start_date: '',
  end_date: '',
  batch_mode: 'ONLINE',
  batch_time: 'MORNING',
  batch_schedule: 'WEEKDAYS',
};

const batchStatuses = ['UPCOMING', 'ACTIVE', 'COMPLETED', 'CANCELLED'];

export default function BatchesPage() {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [batches, setBatches] = useState([]);
  const [form, setForm] = useState(emptyBatch);
  const [editing, setEditing] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const loadCourses = useCallback(async () => {
    setError('');
    try {
      const courseRows = await getCourses();
      setCourses(courseRows || []);
      setSelectedCourseId((current) => current || courseRows[0]?.id || '');
    } catch (err) {
      setError(err.message || 'Failed to load courses');
      setIsLoading(false);
    }
  }, []);

  const loadBatches = useCallback(async () => {
    if (!selectedCourseId) {
      setBatches([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      setBatches(await getCourseBatches(selectedCourseId));
    } catch (err) {
      setError(err.message || 'Failed to load batches');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCourseId]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  const resetForm = () => {
    setEditing(null);
    setForm(emptyBatch);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedCourseId) return;
    setIsSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        start_date: form.start_date,
        end_date: form.end_date || null,
        batch_mode: form.batch_mode || 'ONLINE',
        batch_time: form.batch_time || 'MORNING',
        batch_schedule: form.batch_schedule || 'WEEKDAYS',
      };
      if (editing) {
        await updateCourseBatch(editing.id, payload);
      } else {
        await createCourseBatch(selectedCourseId, payload);
      }
      resetForm();
      await loadBatches();
    } catch (err) {
      alert(err.message || 'Failed to save batch');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (batch) => {
    setEditing(batch);
    setForm({
      name: batch.name || '',
      description: batch.description || '',
      start_date: batch.start_date || '',
      end_date: batch.end_date || '',
      batch_mode: batch.batch_mode || 'ONLINE',
      batch_time: batch.batch_time || 'MORNING',
      batch_schedule: batch.batch_schedule || 'WEEKDAYS',
    });
  };

  const setStatus = async (batch, status) => {
    try {
      await updateCourseBatchStatus(batch.id, status);
      setBatches((current) => current.map((item) => (item.id === batch.id ? { ...item, status } : item)));
    } catch (err) {
      alert(err.message || 'Failed to update batch status');
    }
  };

  return (
    <div className="course-admin-page">
      <div className="course-admin-header">
        <div>
          <div className="course-admin-kicker">
            <CalendarDays size={20} />
            <span>Cohorts & Batches</span>
          </div>
          <h1 className="course-admin-title">Course Batches</h1>
          <p className="course-admin-subtitle">Organize and manage upcoming, active, and completed course cohorts.</p>
        </div>
        <button
          type="button"
          onClick={loadBatches}
          disabled={isLoading || !selectedCourseId}
          className="course-admin-icon-btn min-h-[42px] cursor-pointer w-full sm:w-auto"
          title="Refresh batches list"
        >
          <RefreshCw size={17} className={isLoading ? 'animate-spin text-indigo-600' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="course-admin-toolbar">
        <label className="course-admin-label w-full block">
          Course
          <select
            value={selectedCourseId}
            onChange={(e) => { setSelectedCourseId(e.target.value); resetForm(); }}
            className="course-admin-select w-full mt-1.5"
          >
            <option value="">Select a course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.code || course.course_code} - {course.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="course-admin-grid">
        <form onSubmit={handleSubmit} className="course-admin-panel">
          <h2 className="course-admin-panel-title">{editing ? 'Edit Batch' : 'Add Batch'}</h2>
          <div className="course-admin-form">
            {editing && editing.batch_code && (
              <label className="course-admin-label">Batch Code (Auto-generated)
                <input value={editing.batch_code} disabled className="course-admin-input bg-slate-50 text-slate-500 opacity-90 cursor-not-allowed" />
              </label>
            )}
            <label className="course-admin-label">Batch Name *
              <input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                required
                maxLength={100}
                placeholder="e.g. MERN-FEB-2026"
                className="course-admin-input"
              />
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="course-admin-label">Start Date *
                <input
                  type="date"
                  required
                  value={form.start_date}
                  onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))}
                  className="course-admin-input"
                />
              </label>
              <label className="course-admin-label">End Date
                <input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))}
                  className="course-admin-input"
                />
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-2">
              <label className="course-admin-label">Mode
                <select
                  value={form.batch_mode}
                  onChange={(e) => setForm((p) => ({ ...p, batch_mode: e.target.value }))}
                  className="course-admin-select"
                >
                  <option value="ONLINE">ONLINE</option>
                  <option value="OFFLINE">OFFLINE</option>
                  <option value="HYBRID">HYBRID</option>
                </select>
              </label>
              <label className="course-admin-label">Time
                <select
                  value={form.batch_time}
                  onChange={(e) => setForm((p) => ({ ...p, batch_time: e.target.value }))}
                  className="course-admin-select"
                >
                  <option value="MORNING">MORNING</option>
                  <option value="EVENING">EVENING</option>
                </select>
              </label>
              <label className="course-admin-label">Schedule
                <select
                  value={form.batch_schedule}
                  onChange={(e) => setForm((p) => ({ ...p, batch_schedule: e.target.value }))}
                  className="course-admin-select"
                >
                  <option value="WEEKDAYS">WEEKDAYS</option>
                  <option value="WEEKENDS">WEEKENDS</option>
                </select>
              </label>
            </div>
            <label className="course-admin-label">Description
              <textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Batch timings, details, special notes..."
                className="course-admin-textarea"
              />
            </label>
          </div>
          <div className="course-admin-form-actions">
            <button disabled={isSaving || !selectedCourseId} className="course-admin-primary-btn">
              <Plus size={16} />
              {editing ? 'Save Batch' : 'Create Batch'}
            </button>
            {editing && <button type="button" onClick={resetForm} className="course-admin-secondary-btn">Cancel</button>}
          </div>
        </form>

        <div className="space-y-4 min-w-0">
          {isLoading ? (
            <LoadingState rows={6} />
          ) : error ? (
            <ErrorState title="Unable to load batches" message={error} onRetry={loadBatches} />
          ) : batches.length === 0 ? (
            <EmptyState title="No batches found" description="Select a course and create the first batch." icon={<CalendarDays size={32} />} />
          ) : (
            <>
              {/* Mobile Card List (sm:hidden) */}
              <div className="sm:hidden space-y-3">
                {batches.map((batch) => (
                  <div key={batch.id} className="course-admin-card">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        {batch.batch_code && (
                          <span className="inline-block text-[11px] font-mono font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-md mb-1.5">
                            {batch.batch_code}
                          </span>
                        )}
                        <h3 className="font-bold text-sm text-slate-900 leading-snug">
                          {batch.name}
                        </h3>
                      </div>
                      <StatusBadge status={batch.status} size="sm" />
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
                      <span className="font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {batch.batch_mode || 'ONLINE'}
                      </span>
                      <span className="font-medium text-slate-400">&bull;</span>
                      <span className="font-medium text-slate-600">
                        {batch.batch_time || 'MORNING'}
                      </span>
                      <span className="font-medium text-slate-400">&bull;</span>
                      <span className="font-medium text-slate-600">
                        {batch.batch_schedule || 'WEEKDAYS'}
                      </span>
                    </div>

                    <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Timeline:</span>
                      <span className="font-semibold text-slate-700">
                        {batch.start_date || 'No start'} &rarr; {batch.end_date || 'Ongoing'}
                      </span>
                    </div>

                    {batch.description && (
                      <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {batch.description}
                      </p>
                    )}

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(batch)}
                        className="course-admin-text-btn"
                      >
                        Edit
                      </button>
                      <select
                        value={batch.status}
                        onChange={(e) => setStatus(batch, e.target.value)}
                        className="course-admin-inline-select min-h-[34px]"
                      >
                        {batchStatuses.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tablet & Desktop Table View (hidden sm:block) */}
              <div className="hidden sm:block course-admin-table-wrap">
                <div className="course-admin-table-scroll">
                  <table className="course-admin-table">
                    <thead>
                      <tr>
                        <th className="px-5 py-3">Batch</th>
                        <th className="px-5 py-3">Mode &amp; Schedule</th>
                        <th className="px-5 py-3">Dates</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batches.map((batch) => (
                        <tr key={batch.id} className="course-admin-table-row">
                          <td>
                            <p className="course-admin-row-title">{batch.name}</p>
                            <p className="course-admin-row-meta">{batch.batch_code}</p>
                          </td>
                          <td className="course-admin-muted text-xs">
                            <span className="font-semibold text-slate-800">{batch.batch_mode || 'ONLINE'}</span> &bull; {batch.batch_time || 'MORNING'} &bull; {batch.batch_schedule || 'WEEKDAYS'}
                          </td>
                          <td className="course-admin-muted text-xs">
                            {batch.start_date || 'No start'} to {batch.end_date || 'Ongoing'}
                          </td>
                          <td><StatusBadge status={batch.status} /></td>
                          <td className="course-admin-actions">
                            <button onClick={() => handleEdit(batch)} className="course-admin-text-btn">Edit</button>
                            <select value={batch.status} onChange={(e) => setStatus(batch, e.target.value)} className="course-admin-inline-select">
                              {batchStatuses.map((st) => <option key={st} value={st}>{st}</option>)}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
