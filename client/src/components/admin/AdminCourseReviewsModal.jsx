import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Star,
  EyeOff,
  Eye,
  RefreshCw,
  Search,
  AlertCircle,
  CheckCircle2,
  MessageSquare,
} from 'lucide-react';
import StarRating from '../common/StarRating';
import {
  fetchAdminCourseReviews,
  hideReview,
  restoreReview,
} from '../../services/courseReviewService';

export default function AdminCourseReviewsModal({ isOpen, onClose, course }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(null);
  const [statusFilter, setStatusFilter] = useState(''); // '' | 'ACTIVE' | 'HIDDEN'
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });

  const courseId = course?.id;

  const loadReviews = useCallback(async (page = 1) => {
    if (!courseId) return;
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await fetchAdminCourseReviews(courseId, {
        status: statusFilter || undefined,
        page,
        limit: 20,
      });

      if (res?.data) {
        setReviews(res.data);
        if (res.pagination) {
          setPagination({
            page: res.pagination.page,
            limit: res.pagination.limit,
            total: res.pagination.total,
            totalPages: res.pagination.total_pages,
          });
        }
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to load course reviews' });
    } finally {
      setLoading(false);
    }
  }, [courseId, statusFilter]);

  useEffect(() => {
    if (isOpen && courseId) {
      loadReviews(1);
    }
  }, [isOpen, courseId, loadReviews]);

  if (!isOpen || !course) return null;

  const handleHide = async (reviewId) => {
    if (!window.confirm('Are you sure you want to hide this review from public display?')) return;
    try {
      setActionInProgress(reviewId);
      await hideReview(reviewId);
      setMessage({ type: 'success', text: 'Review hidden successfully' });
      // Optimistically update local status
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, status: 'HIDDEN' } : r))
      );
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to hide review' });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleRestore = async (reviewId) => {
    try {
      setActionInProgress(reviewId);
      await restoreReview(reviewId);
      setMessage({ type: 'success', text: 'Review restored to ACTIVE' });
      // Optimistically update local status
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, status: 'ACTIVE' } : r))
      );
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to restore review' });
    } finally {
      setActionInProgress(null);
    }
  };

  // Filter reviews locally by search query
  const filteredReviews = reviews.filter((r) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const studentName = `${r.student?.first_name || ''} ${r.student?.last_name || ''}`.toLowerCase();
    const studentEmail = (r.student?.email || '').toLowerCase();
    const reviewText = (r.review || '').toLowerCase();
    return studentName.includes(q) || studentEmail.includes(q) || reviewText.includes(q);
  });

  const activeCount = reviews.filter((r) => r.status === 'ACTIVE').length;
  const hiddenCount = reviews.filter((r) => r.status === 'HIDDEN').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-md border border-indigo-200">
                Moderation
              </span>
              <span className="text-xs text-slate-400 font-mono font-bold">
                {course.code || course.course_code || 'COURSE'}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
              Course Reviews &bull; {course.name || course.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Filter Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Filter buttons */}
            {[
              { id: '', label: `All (${pagination.total})` },
              { id: 'ACTIVE', label: `Active (${activeCount})` },
              { id: 'HIDDEN', label: `Hidden (${hiddenCount})` },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === f.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                }`}
              >
                {f.label}
              </button>
            ))}

            <button
              onClick={() => loadReviews(pagination.page)}
              disabled={loading}
              title="Refresh"
              className="p-2 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer ml-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Search input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter by student or text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Message Banner */}
        {message.text && (
          <div
            className={`px-5 py-3 text-xs font-medium flex items-center gap-2 border-b ${
              message.type === 'error'
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            {message.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {loading && reviews.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-800">No Course Reviews Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {searchQuery || statusFilter
                  ? 'No reviews match your filter criteria.'
                  : 'Students have not submitted reviews for this course yet.'}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 overflow-x-auto shadow-2xs">
              <table className="w-full min-w-[620px] text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Rating</th>
                    <th className="px-4 py-3">Review</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredReviews.map((rev) => {
                    const studentName = rev.student
                      ? `${rev.student.first_name} ${rev.student.last_name || ''}`.trim()
                      : 'Unknown';

                    const isBusy = actionInProgress === rev.id;

                    return (
                      <tr key={rev.id} className="hover:bg-slate-50/60 transition-colors">
                        {/* Student */}
                        <td className="px-4 py-3.5">
                          <p className="font-bold text-slate-900">{studentName}</p>
                          <p className="text-[11px] text-slate-400">{rev.student?.email || '—'}</p>
                        </td>

                        {/* Rating */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <StarRating rating={rev.rating} size="sm" showValue={true} />
                        </td>

                        {/* Review text */}
                        <td className="px-4 py-3.5 max-w-xs">
                          {rev.review ? (
                            <p className="text-slate-700 italic truncate" title={rev.review}>
                              "{rev.review}"
                            </p>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Rating only</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              rev.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {rev.status}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3.5 whitespace-nowrap text-slate-400 text-[11px]">
                          {new Date(rev.created_at).toLocaleDateString([], {
                            dateStyle: 'medium',
                          })}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          {rev.status === 'ACTIVE' ? (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleHide(rev.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              <EyeOff className="w-3.5 h-3.5" />
                              <span>Hide</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleRestore(rev.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Restore</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {filteredReviews.length} of {pagination.total} reviews
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
