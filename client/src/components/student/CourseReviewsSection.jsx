import React, { useState, useEffect, useCallback } from 'react';
import {
  Star,
  MessageSquare,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Sparkles,
  Send,
  X,
} from 'lucide-react';
import StarRating from '../common/StarRating';
import {
  fetchCourseReviews,
  fetchCourseReviewSummary,
  fetchMyCourseReview,
  submitCourseReview,
  updateCourseReview,
  deleteCourseReview,
} from '../../services/courseReviewService';

export default function CourseReviewsSection({ courseId, isEnrolled = true }) {
  const [summary, setSummary] = useState({
    average_rating: 0,
    total_reviews: 0,
    rating_distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });
  const [reviews, setReviews] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 5, total: 0, totalPages: 1 });
  const [myReview, setMyReview] = useState(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form input state (strictly integer 1-5)
  const [formRating, setFormRating] = useState(5);
  const [formText, setFormText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Load reviews & summary
  const loadData = useCallback(async (page = 1) => {
    if (!courseId) return;
    try {
      setLoading(true);
      setErrorMsg('');

      // Fetch summary & review list in parallel
      const [summaryData, reviewRes] = await Promise.all([
        fetchCourseReviewSummary(courseId),
        fetchCourseReviews(courseId, { page, limit: 5 }),
      ]);

      if (summaryData) setSummary(summaryData);
      if (reviewRes?.data) {
        setReviews(reviewRes.data);
        if (reviewRes.pagination) {
          setPagination({
            page: reviewRes.pagination.page,
            limit: reviewRes.pagination.limit,
            total: reviewRes.pagination.total,
            totalPages: reviewRes.pagination.total_pages,
          });
        }
      }

      // Fetch current student's review if logged in
      try {
        const mine = await fetchMyCourseReview(courseId);
        setMyReview(mine || null);
      } catch {
        // May fail if not enrolled or unauthenticated
        setMyReview(null);
      }
    } catch (err) {
      console.error('Error loading course reviews:', err);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadData(1);
  }, [loadData]);

  // Handle start editing
  const handleStartEdit = () => {
    if (myReview) {
      setFormRating(myReview.rating || 5);
      setFormText(myReview.review || '');
      setIsEditing(true);
      setErrorMsg('');
      setSuccessMsg('');
    }
  };

  // Handle cancel editing
  const handleCancelEdit = () => {
    setIsEditing(false);
    setErrorMsg('');
    setSuccessMsg('');
  };

  // Handle form submission (create or update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!formRating || formRating < 1 || formRating > 5) {
      setErrorMsg('Please select a rating between 1 and 5 stars.');
      return;
    }

    try {
      setSubmitting(true);
      if (isEditing && myReview) {
        await updateCourseReview(courseId, {
          rating: formRating,
          review: formText.trim() || null,
        });
        setSuccessMsg('Your review was updated successfully!');
      } else {
        await submitCourseReview(courseId, {
          rating: formRating,
          review: formText.trim() || null,
        });
        setSuccessMsg('Thank you! Your review has been submitted.');
      }

      setIsEditing(false);
      setFormText('');
      setFormRating(5);
      await loadData(1);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete own review
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to remove your review?')) return;
    try {
      setSubmitting(true);
      await deleteCourseReview(courseId);
      setMyReview(null);
      setIsEditing(false);
      setSuccessMsg('Your review was removed.');
      await loadData(1);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to delete review.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalReviews = summary.total_reviews || 0;
  const avgRating = summary.average_rating ? Number(summary.average_rating).toFixed(2) : '0.00';
  const dist = summary.rating_distribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

  return (
    <div className="space-y-7">
      {/* ── 1. Top Section: Course Rating Summary & Distribution ── */}
      <div className="bg-gradient-to-br from-slate-50 to-indigo-50/40 rounded-2xl sm:rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-2xs">
        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
          {/* Average Rating Block */}
          <div className="flex flex-col items-center justify-center text-center shrink-0 min-w-[160px] pb-4 md:pb-0 md:border-r border-slate-200/80 md:pr-10">
            <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
              {avgRating}
            </span>
            <div className="mt-2">
              <StarRating rating={Number(avgRating)} size="lg" />
            </div>
            <span className="text-xs font-semibold text-slate-500 mt-1.5">
              Course Rating &bull; {totalReviews} {totalReviews === 1 ? 'Review' : 'Reviews'}
            </span>
          </div>

          {/* Rating Distribution Bars */}
          <div className="flex-1 w-full space-y-2">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = dist[stars] || 0;
              const percentage = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;

              return (
                <div key={stars} className="flex items-center gap-3 text-xs font-semibold text-slate-600">
                  <span className="w-8 shrink-0 flex items-center gap-0.5 text-slate-700">
                    {stars} <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  </span>

                  <div className="flex-1 h-3 rounded-full bg-slate-200/70 overflow-hidden relative">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-500 ease-out shadow-xs"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <span className="w-10 text-right text-slate-500 font-mono text-[11px] shrink-0">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Status Feedback Alerts ── */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-xs font-medium animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-800 text-xs font-medium animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── 2. Review Eligibility / Write Review / Your Review ── */}
      {!isEnrolled ? (
        <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-center gap-3 text-amber-800 text-xs font-medium">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <span>Enroll in this course to leave a review.</span>
        </div>
      ) : myReview && !isEditing ? (
        /* Display Student's Existing Review */
        <div className="bg-white rounded-2xl p-5 sm:p-6 border-2 border-indigo-100 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg border border-indigo-200">
                Your Review
              </span>
              {myReview.status === 'HIDDEN' && (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-200">
                  Hidden by Moderator
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleStartEdit}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Review</span>
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={submitting}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Delete your review"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <StarRating rating={myReview.rating} size="md" />
            <span className="text-xs text-slate-400 font-medium">
              {new Date(myReview.created_at || myReview.updated_at).toLocaleDateString([], {
                dateStyle: 'medium',
              })}
            </span>
          </div>

          {myReview.review ? (
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              "{myReview.review}"
            </p>
          ) : (
            <p className="text-xs text-slate-400 italic">No written comment provided.</p>
          )}
        </div>
      ) : (
        /* Write / Edit Review Form */
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>{isEditing ? 'Edit Your Review' : 'Write a Review'}</span>
            </h3>
            {isEditing && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-xs font-semibold text-slate-400 hover:text-slate-700 inline-flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Rating Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Rating (1–5 Stars)
              </label>
              <div className="flex items-center gap-3">
                <StarRating
                  rating={formRating}
                  interactive={true}
                  onChange={(val) => setFormRating(val)}
                  size="lg"
                />
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                  {formRating} / 5 Stars
                </span>
              </div>
            </div>

            {/* Review Comment Area */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Review (Optional)
              </label>
              <textarea
                value={formText}
                onChange={(e) => setFormText(e.target.value)}
                maxLength={5000}
                rows={3}
                placeholder="Share your learning experience, course structure, instructor feedback..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
              <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1">
                <span>Constructive feedback helps fellow learners and instructors.</span>
                <span>{formText.length}/5000</span>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-xs hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? 'Submitting…' : isEditing ? 'Save Changes' : 'Submit Review'}</span>
              </button>

              {isEditing && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={submitting}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* ── 3. Student Reviews List (ACTIVE only) ── */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
            Student Reviews ({totalReviews})
          </h3>
          <span className="text-xs font-medium text-slate-400">
            Showing verified enrolled student feedback
          </span>
        </div>

        {loading && reviews.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">No reviews yet</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Be the first enrolled student to share your review!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((rev) => {
              const studentName = rev.student
                ? `${rev.student.first_name} ${rev.student.last_name || ''}`.trim()
                : 'Student Learner';

              return (
                <div
                  key={rev.id}
                  className="p-4 sm:p-5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50/50 transition-all space-y-2 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                        {studentName[0]?.toUpperCase() || 'S'}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{studentName}</h4>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Date(rev.created_at).toLocaleDateString([], {
                            dateStyle: 'medium',
                          })}
                        </span>
                      </div>
                    </div>

                    <StarRating rating={rev.rating} size="sm" />
                  </div>

                  {rev.review && (
                    <p className="text-xs text-slate-600 leading-relaxed pl-10">
                      "{rev.review}"
                    </p>
                  )}
                </div>
              );
            })}

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-3">
                <span className="text-xs text-slate-500">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={pagination.page <= 1 || loading}
                    onClick={() => loadData(pagination.page - 1)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={pagination.page >= pagination.totalPages || loading}
                    onClick={() => loadData(pagination.page + 1)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
