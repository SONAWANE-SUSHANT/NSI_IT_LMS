import { useCallback, useEffect, useMemo, useState } from 'react';
import { BookOpen, Plus, RefreshCw } from 'lucide-react';
import SearchBar from '../../components/admin/SearchBar';
import StatusBadge from '../../components/admin/StatusBadge';
import LoadingState from '../../components/admin/LoadingState';
import EmptyState from '../../components/admin/EmptyState';
import ErrorState from '../../components/admin/ErrorState';
import {
  createCourse,
  getCourses,
  updateCourse,
  updateCourseStatus,
} from '../../services/courseAdminService';
import AdminCourseReviewsModal from '../../components/admin/AdminCourseReviewsModal';

const emptyCourse = {
  code: '',
  name: '',
  description: '',
  thumbnail_url: '',
  duration: '',
};

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState(emptyCourse);
  const [editing, setEditing] = useState(null);
  const [reviewModalCourse, setReviewModalCourse] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const courseRows = await getCourses();
      setCourses(courseRows || []);
    } catch (err) {
      setError(err.message || 'Failed to load courses');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredCourses = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return courses;
    return courses.filter((course) =>
      `${course.code || course.course_code || ''} ${course.name || ''} ${course.description || ''} ${course.duration || ''}`.toLowerCase().includes(q)
    );
  }, [courses, searchQuery]);

  const resetForm = () => {
    setEditing(null);
    setForm(emptyCourse);
  };

  const buildPayload = () => ({
    code: form.code.trim(),
    course_code: form.code.trim(), // backward-compatible alias
    name: form.name.trim(),
    description: form.description.trim() || null,
    thumbnail_url: form.thumbnail_url.trim() || null,
    duration: form.duration.trim() || null,
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      if (editing) {
        await updateCourse(editing.id, buildPayload());
      } else {
        await createCourse(buildPayload());
      }
      resetForm();
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to save course');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (course) => {
    setEditing(course);
    setForm({
      code: course.code || course.course_code || '',
      name: course.name || '',
      description: course.description || '',
      thumbnail_url: course.thumbnail_url || '',
      duration: course.duration || '',
    });
  };

  const setStatus = async (course, status) => {
    try {
      await updateCourseStatus(course.id, status);
      setCourses((current) => current.map((item) => (item.id === course.id ? { ...item, status } : item)));
    } catch (err) {
      alert(err.message || 'Failed to update course status');
    }
  };

  return (
    <div className="course-admin-page">
      <div className="course-admin-header">
        <div>
          <div className="course-admin-kicker">
            <BookOpen size={20} />
            <span>Courses</span>
          </div>
          <h1 className="course-admin-title">Courses</h1>
          <p className="course-admin-subtitle">Manage core course information, duration, thumbnail, and availability.</p>
        </div>
        <button onClick={loadData} disabled={isLoading} className="course-admin-icon-btn">
          <RefreshCw size={17} className={isLoading ? 'animate-spin text-indigo-600' : ''} />
          Refresh
        </button>
      </div>

      <div className="course-admin-grid">
        <form onSubmit={handleSubmit} className="course-admin-panel">
          <h2 className="course-admin-panel-title">{editing ? 'Edit Course' : 'Add Course'}</h2>
          <div className="course-admin-form-grid">
            <label className="course-admin-label">Course Code
              <input
                value={form.code}
                onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
                required
                maxLength={30}
                placeholder="e.g. FS-MERN-101"
                className="course-admin-input"
              />
            </label>
            <label className="course-admin-label">Course Name
              <input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                required
                maxLength={200}
                placeholder="e.g. Full Stack MERN Development"
                className="course-admin-input"
              />
            </label>
            <label className="course-admin-label">Duration
              <input
                value={form.duration}
                onChange={(e) => setForm((p) => ({ ...p, duration: e.target.value }))}
                maxLength={20}
                placeholder="e.g. 6 Months or 12 Weeks"
                className="course-admin-input"
              />
            </label>
            <label className="course-admin-label">Thumbnail URL
              <input
                value={form.thumbnail_url}
                onChange={(e) => setForm((p) => ({ ...p, thumbnail_url: e.target.value }))}
                placeholder="https://..."
                className="course-admin-input"
              />
            </label>
            <label className="course-admin-label sm:col-span-2 xl:col-span-1">Description
              <textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Detailed overview of course curriculum and outcomes..."
                className="course-admin-textarea"
              />
            </label>
          </div>
          <div className="course-admin-form-actions">
            <button disabled={isSaving} className="course-admin-primary-btn">
              <Plus size={16} />
              {editing ? 'Save' : 'Create'}
            </button>
            {editing && <button type="button" onClick={resetForm} className="course-admin-secondary-btn">Cancel</button>}
          </div>
        </form>

        <div className="space-y-4">
          <div className="course-admin-toolbar">
            <SearchBar
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
              placeholder="Search courses by code or name..."
            />
          </div>

          {isLoading ? (
            <LoadingState rows={6} />
          ) : error ? (
            <ErrorState title="Unable to load courses" message={error} onRetry={loadData} />
          ) : filteredCourses.length === 0 ? (
            <EmptyState title="No courses found" description="Create a course before adding batches or assignments." icon={<BookOpen size={32} />} />
          ) : (
            <div className="course-admin-table-wrap">
              <div className="course-admin-table-scroll">
                <table className="course-admin-table">
                  <thead>
                    <tr>
                      <th className="px-5 py-3">Course</th>
                      <th className="px-5 py-3">Duration</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCourses.map((course) => (
                      <tr key={course.id} className="course-admin-table-row">
                        <td>
                          <p className="course-admin-row-title">{course.name}</p>
                          <p className="course-admin-row-meta">{course.code || course.course_code}</p>
                        </td>
                        <td className="course-admin-muted">{course.duration || 'Not set'}</td>
                        <td><StatusBadge status={course.status} /></td>
                        <td className="course-admin-actions">
                          <button onClick={() => setReviewModalCourse(course)} className="course-admin-neutral-btn text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 font-bold">Reviews</button>
                          <button onClick={() => handleEdit(course)} className="course-admin-text-btn">Edit</button>
                          {['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED'].filter((s) => s !== course.status).map((status) => (
                            <button key={status} onClick={() => setStatus(course, status)} className="course-admin-neutral-btn">{status}</button>
                          ))}
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

      {/* Admin Course Reviews & Ratings Moderation Modal */}
      <AdminCourseReviewsModal
        isOpen={!!reviewModalCourse}
        course={reviewModalCourse}
        onClose={() => setReviewModalCourse(null)}
      />
    </div>
  );
}
