import { useCallback, useEffect, useMemo, useState } from 'react';
import { GraduationCap, RefreshCw, UserCheck, Users } from 'lucide-react';
import StatusBadge from '../../components/admin/StatusBadge';
import LoadingState from '../../components/admin/LoadingState';
import EmptyState from '../../components/admin/EmptyState';
import ErrorState from '../../components/admin/ErrorState';
import { getUsers } from '../../services/adminUserService';
import {
  assignBatchInstructor,
  enrollBatchStudent,
  getBatchInstructors,
  getBatchStudents,
  getCourseBatches,
  getCourses,
  removeBatchInstructor,
  removeBatchStudent,
  updateBatchInstructorStatus,
  updateBatchStudentStatus,
} from '../../services/courseAdminService';

const enrollmentStatuses = ['ENROLLED', 'INACTIVE', 'COMPLETED', 'DROPPED'];

function userName(user) {
  return `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username || 'User';
}

export default function BatchAssignmentsPage({ mode = 'instructors' }) {
  const isInstructorMode = mode === 'instructors';
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [users, setUsers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const title = isInstructorMode ? 'Batch Instructors' : 'Batch Students';
  const Icon = isInstructorMode ? UserCheck : GraduationCap;

  const loadBaseData = useCallback(async () => {
    setError('');
    try {
      const [courseRows, userRows] = await Promise.all([
        getCourses(),
        getUsers({ role_id: isInstructorMode ? 2 : 3, status: 'ACTIVE' }),
      ]);
      setCourses(courseRows);
      setUsers(userRows);
      setSelectedCourseId((current) => current || courseRows[0]?.id || '');
    } catch (err) {
      setError(err.message || `Failed to load ${title.toLowerCase()}`);
      setIsLoading(false);
    }
  }, [isInstructorMode, title]);

  const loadBatches = useCallback(async () => {
    if (!selectedCourseId) {
      setBatches([]);
      setSelectedBatchId('');
      return;
    }
    try {
      const batchRows = await getCourseBatches(selectedCourseId);
      setBatches(batchRows);
      setSelectedBatchId((current) =>
        batchRows.some((batch) => String(batch.id) === String(current)) ? current : batchRows[0]?.id || ''
      );
    } catch (err) {
      setError(err.message || 'Failed to load batches');
    }
  }, [selectedCourseId]);

  const loadAssignments = useCallback(async () => {
    if (!selectedBatchId) {
      setAssignments([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const rows = isInstructorMode
        ? await getBatchInstructors(selectedBatchId)
        : await getBatchStudents(selectedBatchId);
      setAssignments(rows);
    } catch (err) {
      setError(err.message || `Failed to load ${title.toLowerCase()}`);
    } finally {
      setIsLoading(false);
    }
  }, [isInstructorMode, selectedBatchId, title]);

  useEffect(() => {
    loadBaseData();
  }, [loadBaseData]);

  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  const assignedUserIds = useMemo(() => {
    return new Set(assignments.filter((row) => row.status !== 'INACTIVE').map((row) => String(isInstructorMode ? row.instructor_id : row.student_id)));
  }, [assignments, isInstructorMode]);

  const availableUsers = users.filter((user) => !assignedUserIds.has(String(user.id)));

  const handleAdd = async (event) => {
    event.preventDefault();
    if (!selectedBatchId || !selectedUserId) return;
    setIsSaving(true);
    try {
      if (isInstructorMode) {
        await assignBatchInstructor(selectedBatchId, selectedUserId);
      } else {
        await enrollBatchStudent(selectedBatchId, selectedUserId);
      }
      setSelectedUserId('');
      await loadAssignments();
    } catch (err) {
      alert(err.message || 'Failed to save assignment');
    } finally {
      setIsSaving(false);
    }
  };

  const updateStatus = async (assignment, status) => {
    try {
      if (isInstructorMode) {
        await updateBatchInstructorStatus(selectedBatchId, assignment.instructor_id, status);
      } else {
        await updateBatchStudentStatus(selectedBatchId, assignment.student_id, status);
      }
      await loadAssignments();
    } catch (err) {
      alert(err.message || 'Failed to update status');
    }
  };

  const removeAssignment = async (assignment) => {
    try {
      if (isInstructorMode) {
        await removeBatchInstructor(selectedBatchId, assignment.instructor_id);
      } else {
        await removeBatchStudent(selectedBatchId, assignment.student_id);
      }
      await loadAssignments();
    } catch (err) {
      alert(err.message || 'Failed to remove assignment');
    }
  };

  return (
    <div className="course-admin-page">
      <div className="course-admin-header">
        <div>
          <div className="course-admin-kicker">
            <Icon size={20} />
            <span>Assignments</span>
          </div>
          <h1 className="course-admin-title">{title}</h1>
          <p className="course-admin-subtitle">
            {isInstructorMode ? 'Assign instructors to course batches and manage assignment status.' : 'Enroll students into course batches and manage enrollment progress.'}
          </p>
        </div>
        <button onClick={loadAssignments} disabled={isLoading || !selectedBatchId} className="course-admin-icon-btn">
          <RefreshCw size={17} className={isLoading ? 'animate-spin text-indigo-600' : ''} />
          Refresh
        </button>
      </div>

      <div className="course-admin-assignment-grid">
        <label className="course-admin-label">Course
          <select value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)} className="course-admin-select">
            <option value="">Select a course</option>
            {courses.map((course) => <option key={course.id} value={course.id}>{course.code || course.course_code} - {course.name}</option>)}
          </select>
        </label>
        <label className="course-admin-label">Batch
          <select value={selectedBatchId} onChange={(e) => setSelectedBatchId(e.target.value)} className="course-admin-select">
            <option value="">Select a batch</option>
            {batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.batch_code} - {batch.name}</option>)}
          </select>
        </label>
      </div>

      <form onSubmit={handleAdd} className="course-admin-assignment-form">
        <label className="course-admin-label course-admin-assignment-field">
          {isInstructorMode ? 'Instructor' : 'Student'}
          <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} className="course-admin-select">
            <option value="">Select {isInstructorMode ? 'instructor' : 'student'}</option>
            {availableUsers.map((user) => <option key={user.id} value={user.id}>{userName(user)} - @{user.username}</option>)}
          </select>
        </label>
        <button disabled={isSaving || !selectedBatchId || !selectedUserId} className="course-admin-primary-btn">
          <Users size={16} />
          {isInstructorMode ? 'Assign' : 'Enroll'}
        </button>
      </form>

      {isLoading ? <LoadingState rows={6} /> : error ? <ErrorState title={`Unable to load ${title.toLowerCase()}`} message={error} onRetry={loadAssignments} /> : assignments.length === 0 ? (
        <EmptyState title={`No ${isInstructorMode ? 'instructors assigned' : 'students enrolled'}`} description="Choose a course and batch, then add a user from the dropdown." icon={<Icon size={32} />} />
      ) : (
        <div className="course-admin-table-wrap">
          <div className="course-admin-table-scroll">
          <table className="course-admin-table">
            <thead>
              <tr><th className="px-5 py-3">User</th><th className="px-5 py-3">Email</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Actions</th></tr>
            </thead>
            <tbody>
              {assignments.map((assignment) => {
                const person = isInstructorMode ? assignment.instructor : assignment.student;
                return (
                  <tr key={assignment.id} className="course-admin-table-row">
                    <td><p className="course-admin-row-title">{userName(person)}</p><p className="course-admin-row-meta">@{person?.username}</p></td>
                    <td className="course-admin-muted">{person?.email || 'No email'}</td>
                    <td><StatusBadge status={assignment.status} /></td>
                    <td className="course-admin-actions">
                      {isInstructorMode ? (
                        <button onClick={() => updateStatus(assignment, assignment.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')} className="course-admin-neutral-btn">
                          {assignment.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        </button>
                      ) : (
                        <select value={assignment.status} onChange={(e) => updateStatus(assignment, e.target.value)} className="course-admin-inline-select">
                          {enrollmentStatuses.map((status) => <option key={status}>{status}</option>)}
                        </select>
                      )}
                      <button onClick={() => removeAssignment(assignment)} className="course-admin-danger-btn">Remove</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
