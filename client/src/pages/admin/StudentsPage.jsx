import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileUp, UserPlus, RefreshCw, GraduationCap, Users } from 'lucide-react';
import { getUsers, updateUserStatus } from '../../services/adminUserService';
import UserTable from '../../components/admin/UserTable';
import SearchBar from '../../components/admin/SearchBar';
import FilterBar from '../../components/admin/FilterBar';
import AddUserModal from '../../components/admin/AddUserModal';
import ImportStudentsModal from '../../components/admin/ImportStudentsModal';
import UserDetailsModal from '../../components/admin/UserDetailsModal';
import EditUserModal from '../../components/admin/EditUserModal';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import LoadingState from '../../components/admin/LoadingState';
import EmptyState from '../../components/admin/EmptyState';
import ErrorState from '../../components/admin/ErrorState';

export default function StudentsPage() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const handleViewPortal = useCallback((user) => {
    if (!user?.id) return;
    navigate(`/admin/students/${user.id}/portal`);
  }, [navigate]);

  // Modals & Dialogs
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedUserForDetails, setSelectedUserForDetails] = useState(null);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState(null);
  const [confirmDialogData, setConfirmDialogData] = useState({
    isOpen: false,
    user: null,
    targetStatus: null,
    isLoading: false,
  });

  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      // Fetch users with role_id=3 (STUDENT)
      const data = await getUsers({ role_id: 3 });
      setStudents(data);
    } catch (err) {
      setError(err.message || 'Failed to load students list');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Client-side filtering across the fetched student records
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesStatus =
        statusFilter === 'ALL' || student.status === statusFilter;

      const q = searchQuery.toLowerCase().trim();
      const fullName = `${student.first_name || ''} ${student.last_name || ''}`.toLowerCase();
      const matchesSearch =
        !q ||
        fullName.includes(q) ||
        (student.username && student.username.toLowerCase().includes(q)) ||
        (student.email && student.email.toLowerCase().includes(q));

      return matchesStatus && matchesSearch;
    });
  }, [students, statusFilter, searchQuery]);

  // Status update handler with confirm dialog
  const handleStatusChangeRequest = (user, newStatus) => {
    setConfirmDialogData({
      isOpen: true,
      user,
      targetStatus: newStatus,
      isLoading: false,
    });
  };

  const handleConfirmStatusChange = async () => {
    const { user, targetStatus } = confirmDialogData;
    if (!user || !targetStatus) return;

    setConfirmDialogData((prev) => ({ ...prev, isLoading: true }));
    try {
      await updateUserStatus(user.id, targetStatus);
      // Update local state
      setStudents((prev) =>
        prev.map((s) => (s.id === user.id ? { ...s, status: targetStatus } : s))
      );
      setConfirmDialogData({
        isOpen: false,
        user: null,
        targetStatus: null,
        isLoading: false,
      });
    } catch (err) {
      alert(err.message || 'Failed to update student status');
      setConfirmDialogData((prev) => ({ ...prev, isLoading: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 mb-1">
            <GraduationCap size={20} />
            <span className="text-xs font-bold uppercase tracking-wider">People Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Students
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage student accounts and learning access.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={fetchStudents}
            disabled={isLoading}
            className="p-2.5 sm:px-3 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-600 border border-slate-300 rounded-xl shadow-2xs transition disabled:opacity-50 min-h-[42px] min-w-[42px] flex items-center justify-center cursor-pointer"
            title="Refresh list"
            aria-label="Refresh student list"
          >
            <RefreshCw size={17} className={isLoading ? 'animate-spin text-indigo-600' : ''} />
          </button>

          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-white hover:bg-indigo-50 active:bg-indigo-100 px-3.5 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold text-indigo-700 shadow-xs transition min-h-[42px] cursor-pointer flex-1 sm:flex-none"
          >
            <FileUp size={17} />
            <span>Import CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition min-h-[42px] cursor-pointer flex-1 sm:flex-none"
          >
            <UserPlus size={17} />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
        <SearchBar
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClear={() => setSearchQuery('')}
          placeholder="Search students by name, username, or email..."
        />

        <FilterBar
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
        />
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <LoadingState rows={6} />
      ) : error ? (
        <ErrorState
          title="Unable to load students"
          message={error}
          onRetry={fetchStudents}
        />
      ) : filteredStudents.length === 0 ? (
        <EmptyState
          title={students.length === 0 ? 'No students enrolled yet' : 'No matching students found'}
          description={
            students.length === 0
              ? 'Get started by creating your first student account for the LMS platform.'
              : 'Try clearing your search query or changing status filters.'
          }
          icon={<Users size={32} />}
          actionLabel={students.length === 0 ? '+ Add First Student' : undefined}
          onAction={students.length === 0 ? () => setIsAddModalOpen(true) : undefined}
        />
      ) : (
        <UserTable
          users={filteredStudents}
          showRoleColumn={false}
          onViewDetails={(user) => setSelectedUserForDetails(user)}
          onEditUser={(user) => setSelectedUserForEdit(user)}
          onUpdateStatus={handleStatusChangeRequest}
          onViewPortal={handleViewPortal}
        />
      )}

      {/* Modals & Dialogs */}
      <AddUserModal
        isOpen={isAddModalOpen}
        roleType="student"
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          fetchStudents();
        }}
      />

      <ImportStudentsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={fetchStudents}
      />

      <UserDetailsModal
        isOpen={Boolean(selectedUserForDetails)}
        user={selectedUserForDetails}
        onClose={() => setSelectedUserForDetails(null)}
        onEdit={(user) => setSelectedUserForEdit(user)}
        onViewPortal={handleViewPortal}
      />

      <EditUserModal
        isOpen={Boolean(selectedUserForEdit)}
        user={selectedUserForEdit}
        onClose={() => setSelectedUserForEdit(null)}
        onSuccess={() => {
          fetchStudents();
        }}
      />

      <ConfirmDialog
        isOpen={confirmDialogData.isOpen}
        title={
          confirmDialogData.targetStatus === 'ACTIVE'
            ? 'Activate Student'
            : confirmDialogData.targetStatus === 'SUSPENDED'
            ? 'Suspend Student Account'
            : 'Deactivate Student'
        }
        message={`Are you sure you want to change the status of ${
          confirmDialogData.user?.first_name || confirmDialogData.user?.username || 'this student'
        } to ${confirmDialogData.targetStatus}?`}
        confirmLabel={
          confirmDialogData.targetStatus === 'ACTIVE'
            ? 'Activate'
            : confirmDialogData.targetStatus === 'SUSPENDED'
            ? 'Suspend'
            : 'Deactivate'
        }
        variant={confirmDialogData.targetStatus === 'SUSPENDED' ? 'danger' : 'warning'}
        isLoading={confirmDialogData.isLoading}
        onConfirm={handleConfirmStatusChange}
        onCancel={() =>
          setConfirmDialogData({
            isOpen: false,
            user: null,
            targetStatus: null,
            isLoading: false,
          })
        }
      />
    </div>
  );
}
