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
            <span>Batches</span>
          </div>
          <h1 className="course-admin-title">Course Batches</h1>
          <p className="course-admin-subtitle">Organize and manage upcoming, active, and completed course cohorts.</p>
        </div>
        <button onClick={loadBatches} disabled={isLoading || !selectedCourseId} className="course-admin-icon-btn">
          <RefreshCw size={17} className={isLoading ? 'animate-spin text-indigo-600' : ''} />
          Refresh
        </button>
      </div>

      <div className="course-admin-toolbar">
        <label className="course-admin-label">Course
          <select value={selectedCourseId} onChange={(e) => { setSelectedCourseId(e.target.value); resetForm(); }} className="course-admin-select">
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
                <input value={editing.batch_code} disabled className="course-admin-input bg-gray-50 opacity-80" />
              </label>
            )}
            <label className="course-admin-label">Batch Name
              <input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                required
                maxLength={100}
                placeholder="e.g. MERN-FEB-2026"
                className="course-admin-input"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="course-admin-label">Start Date
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
            <div className="grid grid-cols-3 gap-2">
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
              {editing ? 'Save' : 'Create'}
            </button>
            {editing && <button type="button" onClick={resetForm} className="course-admin-secondary-btn">Cancel</button>}
          </div>
        </form>

        {isLoading ? (
          <LoadingState rows={6} />
        ) : error ? (
          <ErrorState title="Unable to load batches" message={error} onRetry={loadBatches} />
        ) : batches.length === 0 ? (
          <EmptyState title="No batches found" description="Select a course and create the first batch." icon={<CalendarDays size={32} />} />
        ) : (
          <div className="course-admin-table-wrap">
            <div className="course-admin-table-scroll">
              <table className="course-admin-table">
                <thead>
                  <tr>
                    <th className="px-5 py-3">Batch</th>
                    <th className="px-5 py-3">Mode & Schedule</th>
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
                        <span className="font-semibold">{batch.batch_mode || 'ONLINE'}</span> • {batch.batch_time || 'MORNING'} • {batch.batch_schedule || 'WEEKDAYS'}
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
        )}
      </div>
    </div>
  );
}
