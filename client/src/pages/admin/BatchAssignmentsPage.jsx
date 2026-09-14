import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  CheckSquare,
  GraduationCap,
  ListFilter,
  RefreshCw,
  Search,
  Square,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
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
  const [selectedStudentIds, setSelectedStudentIds] = useState(new Set());
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [selectionMode, setSelectionMode] = useState('checkbox'); // 'checkbox' | 'single'
  const [notification, setNotification] = useState(null);
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

  useEffect(() => {
    setSelectedStudentIds(new Set());
    setNotification(null);
  }, [selectedBatchId]);

  const assignedUserIds = useMemo(() => {
    return new Set(
      assignments
        .filter((row) => row.status !== 'INACTIVE')
        .map((row) => String(isInstructorMode ? row.instructor_id : row.student_id))
    );
  }, [assignments, isInstructorMode]);

  const availableUsers = useMemo(() => {
    return users.filter((user) => !assignedUserIds.has(String(user.id)));
  }, [users, assignedUserIds]);

  const filteredAvailableStudents = useMemo(() => {
    if (!studentSearchTerm.trim()) return availableUsers;
    const term = studentSearchTerm.toLowerCase();
    return availableUsers.filter((user) => {
      const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
      const username = (user.username || '').toLowerCase();
      const email = (user.email || '').toLowerCase();
      return fullName.includes(term) || username.includes(term) || email.includes(term);
    });
  }, [availableUsers, studentSearchTerm]);

  const allFilteredSelected =
    filteredAvailableStudents.length > 0 &&
    filteredAvailableStudents.every((u) => selectedStudentIds.has(u.id));

  const toggleStudentSelection = (userId) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const handleSelectAllToggle = () => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filteredAvailableStudents.forEach((u) => next.delete(u.id));
      } else {
        filteredAvailableStudents.forEach((u) => next.add(u.id));
      }
      return next;
    });
  };

  const handleAdd = async (event) => {
    event.preventDefault();
    if (!selectedBatchId || !selectedUserId) return;
    setIsSaving(true);
    setNotification(null);
    try {
      if (isInstructorMode) {
        await assignBatchInstructor(selectedBatchId, selectedUserId);
      } else {
        await enrollBatchStudent(selectedBatchId, selectedUserId);
      }
      setSelectedUserId('');
      await loadAssignments();
      setNotification({
        type: 'success',
        message: `${isInstructorMode ? 'Instructor assigned' : 'Student enrolled'} successfully.`,
      });
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.message || 'Failed to save assignment',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBulkEnroll = async () => {
    if (!selectedBatchId || selectedStudentIds.size === 0) return;
    setIsSaving(true);
    setNotification(null);
    try {
      const ids = Array.from(selectedStudentIds);
      const results = await Promise.allSettled(
        ids.map((id) => enrollBatchStudent(selectedBatchId, id))
      );

      const successful = results.filter((r) => r.status === 'fulfilled');
      const failed = results.filter((r) => r.status === 'rejected');

      // Keep only failed ones selected
      setSelectedStudentIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id, index) => {
          if (results[index].status === 'fulfilled') {
            next.delete(id);
          }
        });
        return next;
      });

      await loadAssignments();

      if (failed.length === 0) {
        setNotification({
          type: 'success',
          message: `Successfully enrolled ${successful.length} student${successful.length === 1 ? '' : 's'} into this batch!`,
        });
      } else if (successful.length > 0) {
        setNotification({
          type: 'warning',
          message: `Enrolled ${successful.length} student(s). Failed to enroll ${failed.length} student(s): ${failed.map((f) => f.reason?.message || 'Error').join(', ')}`,
        });
      } else {
        setNotification({
          type: 'error',
          message: `Failed to enroll student(s): ${failed[0]?.reason?.message || 'Error occurred'}`,
        });
      }
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.message || 'Failed to enroll students',
      });
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
            {isInstructorMode
              ? 'Assign instructors to course batches and manage assignment status.'
              : 'Enroll students into course batches with checkbox selection and manage enrollment progress.'}
          </p>
        </div>
        <button
          type="button"
          onClick={loadAssignments}
          disabled={isLoading || !selectedBatchId}
          className="course-admin-icon-btn min-h-[42px] cursor-pointer w-full sm:w-auto"
          title="Refresh assignments list"
        >
          <RefreshCw size={17} className={isLoading ? 'animate-spin text-indigo-600' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="course-admin-assignment-grid">
        <label className="course-admin-label min-w-0">
          Course
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="course-admin-select w-full mt-1.5 truncate"
          >
            <option value="">Select a course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.code || course.course_code} - {course.name}
              </option>
            ))}
          </select>
        </label>
        <label className="course-admin-label min-w-0">
          Batch
          <select
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            className="course-admin-select w-full mt-1.5 truncate"
          >
            <option value="">Select a batch</option>
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.batch_code} - {batch.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {notification && (
        <div
          className={`flex items-center justify-between rounded-xl px-4 py-3 text-xs font-semibold ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : notification.type === 'warning'
              ? 'bg-amber-50 text-amber-800 border border-amber-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-[11px] font-bold underline opacity-80 hover:opacity-100 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Student Enrollment Section with Checkbox Option */}
      {!isInstructorMode ? (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-white p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#e7e9fb] text-[#3c4cb8] shrink-0">
                  <UserPlus size={16} />
                </span>
                <h3 className="font-[family-name:var(--font-display)] text-base font-bold text-[var(--text-primary)]">
                  Enroll Students
                </h3>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Select one or more students using checkboxes, then click enroll to assign them to this batch.
              </p>
            </div>

            {/* View Mode Toggle: Checkbox vs Single Dropdown */}
            <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setSelectionMode('checkbox')}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition min-h-[34px] cursor-pointer ${
                  selectionMode === 'checkbox'
                    ? 'bg-white text-[#3c4cb8] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CheckSquare size={14} />
                <span>Checkbox Selection</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectionMode('single')}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition min-h-[34px] cursor-pointer ${
                  selectionMode === 'single'
                    ? 'bg-white text-[#3c4cb8] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ListFilter size={14} />
                <span>Single Dropdown</span>
              </button>
            </div>
          </div>

          {selectionMode === 'checkbox' ? (
            <div className="space-y-3">
              {/* Checkbox Toolbar: Search + Select All + Stats */}
              <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
                <div className="relative flex-1 min-w-0">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search available students by name, username, or email..."
                    value={studentSearchTerm}
                    onChange={(e) => setStudentSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3c4cb8] transition min-h-[38px]"
                  />
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <button
                    type="button"
                    onClick={handleSelectAllToggle}
                    disabled={filteredAvailableStudents.length === 0}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition disabled:opacity-50 min-h-[38px] cursor-pointer flex-1 sm:flex-none"
                  >
                    {allFilteredSelected ? (
                      <>
                        <CheckSquare size={15} className="text-[#3c4cb8]" />
                        <span>Deselect All ({filteredAvailableStudents.length})</span>
                      </>
                    ) : (
                      <>
                        <Square size={15} className="text-slate-400" />
                        <span>Select All ({filteredAvailableStudents.length})</span>
                      </>
                    )}
                  </button>

                  {selectedStudentIds.size > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedStudentIds(new Set())}
                      className="px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition min-h-[38px] cursor-pointer"
                    >
                      Clear ({selectedStudentIds.size})
                    </button>
                  )}
                </div>
              </div>

              {/* Scrollable Checkbox List */}
              <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200/80 bg-slate-50/40 p-2 space-y-1.5">
                {availableUsers.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 font-medium">
                    All active students are already enrolled in this batch, or no active students exist.
                  </div>
                ) : filteredAvailableStudents.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 font-medium">
                    No available students matching &quot;{studentSearchTerm}&quot;.
                  </div>
                ) : (
                  filteredAvailableStudents.map((user) => {
                    const isChecked = selectedStudentIds.has(user.id);
                    const initials = `${user.first_name?.[0] || user.username?.[0] || 'S'}${user.last_name?.[0] || ''}`.toUpperCase();

                    return (
                      <label
                        key={user.id}
                        className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl border transition cursor-pointer select-none gap-2.5 ${
                          isChecked
                            ? 'bg-[#e7e9fb]/60 border-[#3c4cb8]/40 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleStudentSelection(user.id)}
                            className="h-4 w-4 rounded border-slate-300 text-[#3c4cb8] focus:ring-[#3c4cb8] cursor-pointer shrink-0"
                          />
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                              isChecked ? 'bg-[#3c4cb8] text-white shadow-xs' : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {initials}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-slate-900 truncate flex flex-wrap items-center gap-1.5">
                              <span>{userName(user)}</span>
                              <span className="text-[11px] font-normal text-slate-400">@{user.username}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">{user.email || 'No email'}</div>
                          </div>
                        </div>

                        <div className="shrink-0 ml-1">
                          <span
                            className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md ${
                              isChecked ? 'bg-[#3c4cb8] text-white' : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {isChecked ? 'Selected' : 'Choose'}
                          </span>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>

              {/* Action Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                <div className="text-xs text-slate-600 font-medium">
                  {selectedStudentIds.size > 0 ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                      <strong>{selectedStudentIds.size}</strong> student{selectedStudentIds.size === 1 ? '' : 's'} selected for enrollment.
                    </span>
                  ) : (
                    <span>Check the boxes next to students you want to enroll.</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleBulkEnroll}
                  disabled={isSaving || !selectedBatchId || selectedStudentIds.size === 0}
                  className="course-admin-primary-btn w-full sm:w-auto min-h-[42px] cursor-pointer"
                >
                  <Users size={16} className={isSaving ? 'animate-spin' : ''} />
                  <span>{isSaving ? 'Enrolling...' : `Enroll Selected Students (${selectedStudentIds.size})`}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Single Select Dropdown Option */
            <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
              <label className="course-admin-label flex-1 min-w-0 w-full">
                Student
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="course-admin-select w-full mt-1.5 truncate"
                >
                  <option value="">Select student</option>
                  {availableUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {userName(user)} - @{user.username} ({user.email || 'No email'})
                    </option>
                  ))}
                </select>
              </label>
              <button
                disabled={isSaving || !selectedBatchId || !selectedUserId}
                className="course-admin-primary-btn w-full sm:w-auto min-h-[42px] cursor-pointer"
              >
                <Users size={16} />
                <span>Enroll Single Student</span>
              </button>
            </form>
          )}
        </div>
      ) : (
        /* Instructor Mode Simple Assignment */
        <form onSubmit={handleAdd} className="course-admin-assignment-form">
          <label className="course-admin-label course-admin-assignment-field">
            Instructor
            <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} className="course-admin-select w-full mt-1.5 truncate">
              <option value="">Select instructor</option>
              {availableUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {userName(user)} - @{user.username}
                </option>
              ))}
            </select>
          </label>
          <button disabled={isSaving || !selectedBatchId || !selectedUserId} className="course-admin-primary-btn w-full sm:w-auto min-h-[42px] cursor-pointer">
            <Users size={16} />
            <span>Assign Instructor</span>
          </button>
        </form>
      )}

      {isLoading ? (
        <LoadingState rows={6} />
      ) : error ? (
        <ErrorState title={`Unable to load ${title.toLowerCase()}`} message={error} onRetry={loadAssignments} />
      ) : assignments.length === 0 ? (
        <EmptyState
          title={`No ${isInstructorMode ? 'instructors assigned' : 'students enrolled'}`}
          description={`Choose a course and batch, then select ${isInstructorMode ? 'an instructor' : 'students'} to assign.`}
          icon={<Icon size={32} />}
        />
      ) : (
        <div className="space-y-4 min-w-0">
          {/* Mobile Cards (sm:hidden) */}
          <div className="sm:hidden space-y-3">
            {assignments.map((assignment) => {
              const person = isInstructorMode ? assignment.instructor : assignment.student;
              const initials = `${person?.first_name?.[0] || person?.username?.[0] || (isInstructorMode ? 'I' : 'S')}${person?.last_name?.[0] || ''}`.toUpperCase();

              return (
                <div key={assignment.id} className="course-admin-card">
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${isInstructorMode ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'}`}>
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-sm text-slate-900 truncate leading-snug">
                          {userName(person)}
                        </h4>
                        <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                          @{person?.username}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <StatusBadge status={assignment.status} size="sm" />
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="text-slate-400 font-medium">Email:</span>
                    <span className="font-medium text-slate-700 truncate max-w-[200px]" title={person?.email || ''}>
                      {person?.email || 'No email'}
                    </span>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2">
                    {isInstructorMode ? (
                      <button
                        type="button"
                        onClick={() =>
                          updateStatus(assignment, assignment.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')
                        }
                        className="course-admin-neutral-btn"
                      >
                        {assignment.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      </button>
                    ) : (
                      <select
                        value={assignment.status}
                        onChange={(e) => updateStatus(assignment, e.target.value)}
                        className="course-admin-inline-select min-h-[34px]"
                      >
                        {enrollmentStatuses.map((status) => (
                          <option key={status}>{status}</option>
                        ))}
                      </select>
                    )}
                    <button
                      type="button"
                      onClick={() => removeAssignment(assignment)}
                      className="course-admin-danger-btn"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop & Tablet Table (hidden sm:block) */}
          <div className="hidden sm:block course-admin-table-wrap">
            <div className="course-admin-table-scroll">
              <table className="course-admin-table">
                <thead>
                  <tr>
                    <th className="px-5 py-3">User</th>
                    <th className="px-5 py-3">Email</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((assignment) => {
                    const person = isInstructorMode ? assignment.instructor : assignment.student;
                    return (
                      <tr key={assignment.id} className="course-admin-table-row">
                        <td>
                          <p className="course-admin-row-title">{userName(person)}</p>
                          <p className="course-admin-row-meta">@{person?.username}</p>
                        </td>
                        <td className="course-admin-muted">{person?.email || 'No email'}</td>
                        <td>
                          <StatusBadge status={assignment.status} />
                        </td>
                        <td className="course-admin-actions">
                          {isInstructorMode ? (
                            <button
                              type="button"
                              onClick={() =>
                                updateStatus(assignment, assignment.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')
                              }
                              className="course-admin-neutral-btn"
                            >
                              {assignment.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                            </button>
                          ) : (
                            <select
                              value={assignment.status}
                              onChange={(e) => updateStatus(assignment, e.target.value)}
                              className="course-admin-inline-select"
                            >
                              {enrollmentStatuses.map((status) => (
                                <option key={status}>{status}</option>
                              ))}
                            </select>
                          )}
                          <button
                            type="button"
                            onClick={() => removeAssignment(assignment)}
                            className="course-admin-danger-btn"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

