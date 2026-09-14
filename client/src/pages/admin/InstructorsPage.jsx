import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, RefreshCw, Users, BookOpen } from 'lucide-react';
import { getUsers, updateUserStatus } from '../../services/adminUserService';
import UserTable from '../../components/admin/UserTable';
import SearchBar from '../../components/admin/SearchBar';
import FilterBar from '../../components/admin/FilterBar';
import AddUserModal from '../../components/admin/AddUserModal';
import UserDetailsModal from '../../components/admin/UserDetailsModal';
import EditUserModal from '../../components/admin/EditUserModal';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import LoadingState from '../../components/admin/LoadingState';
import EmptyState from '../../components/admin/EmptyState';
import ErrorState from '../../components/admin/ErrorState';

export default function InstructorsPage() {
  const navigate = useNavigate();
  const [instructors, setInstructors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const handleViewPortal = useCallback((user) => {
    if (!user?.id) return;
    navigate(`/admin/instructors/${user.id}/portal`);
  }, [navigate]);

  // Modals & Dialogs
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedUserForDetails, setSelectedUserForDetails] = useState(null);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState(null);
  const [confirmDialogData, setConfirmDialogData] = useState({
    isOpen: false,
    user: null,
    targetStatus: null,
    isLoading: false,
  });

  const fetchInstructors = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      // Fetch users with role_id=2 (INSTRUCTOR)
      const data = await getUsers({ role_id: 2 });
      setInstructors(data);
    } catch (err) {
      setError(err.message || 'Failed to load instructors list');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInstructors();
  }, [fetchInstructors]);

  // Client-side filtering
  const filteredInstructors = useMemo(() => {
    return instructors.filter((instructor) => {
      const matchesStatus =
        statusFilter === 'ALL' || instructor.status === statusFilter;

      const q = searchQuery.toLowerCase().trim();
      const fullName = `${instructor.first_name || ''} ${instructor.last_name || ''}`.toLowerCase();
      const matchesSearch =
        !q ||
        fullName.includes(q) ||
        (instructor.username && instructor.username.toLowerCase().includes(q)) ||
        (instructor.email && instructor.email.toLowerCase().includes(q));

      return matchesStatus && matchesSearch;
    });
  }, [instructors, statusFilter, searchQuery]);

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
      setInstructors((prev) =>
        prev.map((inst) => (inst.id === user.id ? { ...inst, status: targetStatus } : inst))
      );
      setConfirmDialogData({
        isOpen: false,
        user: null,
        targetStatus: null,
        isLoading: false,
      });
    } catch (err) {
      alert(err.message || 'Failed to update instructor status');
      setConfirmDialogData((prev) => ({ ...prev, isLoading: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-600 mb-1">
            <BookOpen size={20} />
            <span className="text-xs font-bold uppercase tracking-wider">Teaching Faculty</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Instructors
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage instructor accounts and teaching access.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={fetchInstructors}
            disabled={isLoading}
            className="p-2.5 sm:px-3 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-600 border border-slate-300 rounded-xl shadow-2xs transition disabled:opacity-50 min-h-[42px] min-w-[42px] flex items-center justify-center cursor-pointer"
            title="Refresh list"
            aria-label="Refresh instructor list"
          >
            <RefreshCw size={17} className={isLoading ? 'animate-spin text-teal-600' : ''} />
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition min-h-[42px] cursor-pointer flex-1 sm:flex-none"
          >
            <UserPlus size={17} />
            <span>Add Instructor</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
        <SearchBar
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClear={() => setSearchQuery('')}
          placeholder="Search instructors by name, username, or email..."
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
          title="Unable to load instructors"
          message={error}
          onRetry={fetchInstructors}
        />
      ) : filteredInstructors.length === 0 ? (
        <EmptyState
          title={instructors.length === 0 ? 'No instructors added yet' : 'No matching instructors found'}
          description={
            instructors.length === 0
              ? 'Get started by creating your first instructor account for course facilitation.'
              : 'Try clearing your search query or changing status filters.'
          }
          icon={<Users size={32} />}
          actionLabel={instructors.length === 0 ? '+ Add First Instructor' : undefined}
          onAction={instructors.length === 0 ? () => setIsAddModalOpen(true) : undefined}
        />
      ) : (
        <UserTable
          users={filteredInstructors}
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
        roleType="instructor"
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          fetchInstructors();
        }}
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
          fetchInstructors();
        }}
      />

      <ConfirmDialog
        isOpen={confirmDialogData.isOpen}
        title={
          confirmDialogData.targetStatus === 'ACTIVE'
            ? 'Activate Instructor'
            : confirmDialogData.targetStatus === 'SUSPENDED'
            ? 'Suspend Instructor Account'
            : 'Deactivate Instructor'
        }
        message={`Are you sure you want to change the status of ${
          confirmDialogData.user?.first_name || confirmDialogData.user?.username || 'this instructor'
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
