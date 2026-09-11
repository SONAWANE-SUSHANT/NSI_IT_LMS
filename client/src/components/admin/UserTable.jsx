import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Eye, Edit, CheckCircle, XCircle, AlertOctagon, LayoutDashboard } from 'lucide-react';
import StatusBadge from './StatusBadge';
import RoleBadge from './RoleBadge';

/**
 * Reusable UserTable component
 * @param {object} props
 * @param {Array} props.users
 * @param {boolean} [props.showRoleColumn]
 * @param {Function} props.onViewDetails
 * @param {Function} props.onEditUser
 * @param {Function} props.onUpdateStatus - (user, newStatus)
 * @param {Function} [props.onViewPortal] - (user)
 */
export default function UserTable({
  users = [],
  showRoleColumn = false,
  onViewDetails,
  onEditUser,
  onUpdateStatus,
  onViewPortal,
}) {
  const [activeDropdownId, setActiveDropdownId] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const getInitials = (user) => {
    const first = user.first_name?.[0] || '';
    const last = user.last_name?.[0] || '';
    return (first + last).toUpperCase() || 'U';
  };

  return (
    <div className="admin-table-card w-full bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="py-3.5 px-4 sm:px-6">User</th>
              <th className="py-3.5 px-4 hidden md:table-cell">Email</th>
              {showRoleColumn && <th className="py-3.5 px-4 hidden sm:table-cell">Role</th>}
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 hidden lg:table-cell">Joined</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
            {users.map((user) => {
              const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username;
              const isDropdownOpen = activeDropdownId === user.id;

              return (
                <tr
                  key={user.id}
                  className="hover:bg-slate-50/60 transition duration-150 group"
                >
                  {/* User info */}
                  <td className="py-3.5 px-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      {user.profile_photo ? (
                        <img
                          src={user.profile_photo}
                          alt={fullName}
                          className="h-9 w-9 rounded-full object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-slate-100 text-indigo-700 border border-slate-200 flex items-center justify-center font-bold text-xs">
                          {getInitials(user)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => onViewDetails(user)}
                          className="font-semibold text-slate-900 hover:text-indigo-600 truncate block text-left transition"
                        >
                          {fullName}
                        </button>
                        <span className="text-xs text-slate-400 block truncate">
                          @{user.username}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="py-3.5 px-4 hidden md:table-cell text-slate-600 text-xs">
                    {user.email || '—'}
                  </td>

                  {/* Role Column */}
                  {showRoleColumn && (
                    <td className="py-3.5 px-4 hidden sm:table-cell">
                      <RoleBadge role={user.role} size="sm" />
                    </td>
                  )}

                  {/* Status */}
                  <td className="py-3.5 px-4">
                    <StatusBadge status={user.status} size="sm" />
                  </td>

                  {/* Joined Date */}
                  <td className="py-3.5 px-4 hidden lg:table-cell text-xs text-slate-500">
                    {formatDate(user.created_at)}
                  </td>

                  {/* Actions Dropdown */}
                  <td className="py-3.5 px-4 text-right relative">
                    <div className="inline-flex items-center justify-end">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdownId(isDropdownOpen ? null : user.id);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                        aria-label="User actions"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {isDropdownOpen && (
                        <div
                          ref={dropdownRef}
                          className="absolute right-4 top-10 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30 animate-fade-in text-left"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setActiveDropdownId(null);
                              onViewDetails(user);
                            }}
                            className="w-full px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2 transition"
                          >
                            <Eye size={14} />
                            <span>View Details</span>
                          </button>

                          {onViewPortal && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveDropdownId(null);
                                onViewPortal(user);
                              }}
                              className="w-full px-3.5 py-2 text-xs font-medium text-teal-700 hover:bg-teal-50 hover:text-teal-800 flex items-center gap-2 transition"
                            >
                              <LayoutDashboard size={14} className="text-teal-600" />
                              <span>View Portal</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setActiveDropdownId(null);
                              onEditUser(user);
                            }}
                            className="w-full px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2 transition"
                          >
                            <Edit size={14} />
                            <span>Edit Account</span>
                          </button>

                          <div className="my-1 border-t border-slate-100" />

                          {user.status !== 'ACTIVE' && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveDropdownId(null);
                                onUpdateStatus(user, 'ACTIVE');
                              }}
                              className="w-full px-3.5 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 transition"
                            >
                              <CheckCircle size={14} />
                              <span>Activate</span>
                            </button>
                          )}

                          {user.status !== 'INACTIVE' && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveDropdownId(null);
                                onUpdateStatus(user, 'INACTIVE');
                              }}
                              className="w-full px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2 transition"
                            >
                              <XCircle size={14} />
                              <span>Deactivate</span>
                            </button>
                          )}

                          {user.status !== 'SUSPENDED' && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveDropdownId(null);
                                onUpdateStatus(user, 'SUSPENDED');
                              }}
                              className="w-full px-3.5 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50 flex items-center gap-2 transition"
                            >
                              <AlertOctagon size={14} />
                              <span>Suspend</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
