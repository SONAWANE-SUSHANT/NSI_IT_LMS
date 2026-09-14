import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  BookOpen,
  Calendar,
  Clock,
  User,
  ChevronRight,
  Layers,
  Search,
  RefreshCw,
  Video,
  FileText,
  ExternalLink,
  ChevronDown,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';
import { fetchMyBatches, fetchBatchCourseContent } from '../../services/studentService';
import VideoPlayerModal from '../../components/shared/VideoPlayerModal';
import CourseLearningPlayerView from '../../components/student/CourseLearningPlayerView';
import StarRating from '../../components/common/StarRating';
import { fetchCourseReviewSummary } from '../../services/courseReviewService';

const ADMIN_PRIMARY = '#3c4cb8';
const ADMIN_LIGHT = '#e7e9fb';
const ADMIN_DARK = '#2e3a8c';

function CourseCardRating({ courseId }) {
  const [ratingInfo, setRatingInfo] = useState(null);

  useEffect(() => {
    if (!courseId) return;
    let mounted = true;
    fetchCourseReviewSummary(courseId)
      .then((data) => {
        if (mounted && data) setRatingInfo(data);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [courseId]);

  if (!ratingInfo || ratingInfo.total_reviews === 0) return null;

  return (
    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mt-1">
      <StarRating rating={ratingInfo.average_rating} size="sm" />
      <span className="text-[11px] font-extrabold text-slate-800">
        {Number(ratingInfo.average_rating).toFixed(2)}
      </span>
      <span className="text-[10px] text-slate-400 font-normal">
        ({ratingInfo.total_reviews} {ratingInfo.total_reviews === 1 ? 'review' : 'reviews'})
      </span>
    </div>
  );
}

export default function StudentCoursesPage() {
  const location = useLocation();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected course for detailed curriculum view
  const [activeBatch, setActiveBatch] = useState(null);
  const [courseContent, setCourseContent] = useState(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [expandedModules, setExpandedModules] = useState({});

  // In-app video player state
  const [playingLecture, setPlayingLecture] = useState(null);
  const [playingModule, setPlayingModule] = useState(null);

  const openCourse = async (batch) => {
    setActiveBatch(batch);
    setContentLoading(true);
    try {
      const data = await fetchBatchCourseContent(batch.id);
      setCourseContent(data);
      if (data?.modules?.length > 0) {
        setExpandedModules({ [data.modules[0].id]: true });
      }
    } catch (err) {
      setError(err.message || 'Failed to load course modules');
    } finally {
      setContentLoading(false);
    }
  };

  const loadBatches = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchMyBatches();
      setBatches(data);
      if (location.state?.batchId) {
        const target = data.find((b) => String(b.id) === String(location.state.batchId));
        if (target) {
          openCourse(target);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load enrolled courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBatches();
  }, [location.state?.batchId]);

  const toggleModule = (id) => {
    setExpandedModules((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredBatches = batches.filter((b) => {
    const term = searchTerm.toLowerCase();
    const courseName = b.course?.name?.toLowerCase() || '';
    const courseCode = b.course?.code?.toLowerCase() || '';
    const batchName = b.name?.toLowerCase() || '';
    const batchCode = b.batch_code?.toLowerCase() || '';
    return (
      courseName.includes(term) ||
      courseCode.includes(term) ||
      batchName.includes(term) ||
      batchCode.includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-xs font-semibold text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── DETAIL VIEW: Single Course Learning & Content Player ── */}
      {activeBatch ? (
        contentLoading ? (
          <div className="space-y-6 animate-pulse">
            <div className="h-24 bg-white rounded-2xl border border-slate-200" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 space-y-4">
                <div className="aspect-video bg-slate-900 rounded-3xl" />
                <div className="h-40 bg-white rounded-3xl border border-slate-200" />
              </div>
              <div className="lg:col-span-4 h-96 bg-white rounded-3xl border border-slate-200" />
            </div>
          </div>
        ) : (
          <CourseLearningPlayerView
            batch={activeBatch}
            courseContent={courseContent}
            onBack={() => setActiveBatch(null)}
          />
        )
      ) : (
        /* ── LIST VIEW: All Enrolled Courses ── */
        <div className="space-y-6">
          {/* Top Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#ECEEF2] shadow-xs">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0"
                style={{ background: ADMIN_PRIMARY }}
              >
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md border"
                    style={{ background: ADMIN_LIGHT, color: ADMIN_DARK, borderColor: '#c7cef5' }}
                  >
                    Student Workspace
                  </span>
                  <span className="text-xs text-slate-400 font-medium">NSI IT LMS</span>
                </div>
                <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                  My Enrolled Courses
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2.5 self-end sm:self-center">
              <button
                onClick={loadBatches}
                title="Refresh Courses"
                disabled={loading}
                className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search enrolled courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 min-h-[40px] bg-white rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 shadow-xs focus:outline-hidden focus:ring-2 focus:ring-[#3c4cb8] transition-all"
              />
            </div>

            <div className="text-xs font-bold text-slate-500 self-end sm:self-center">
              Enrolled in {filteredBatches.length} of {batches.length} Courses
            </div>
          </div>

          {/* Cards Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-slate-200/60 animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : filteredBatches.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#ECEEF2] p-12 text-center shadow-xs">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No Enrolled Courses Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {searchTerm
                  ? 'No course matches your search filter.'
                  : 'You are currently not registered into any courses. Contact your LMS administrator to enroll.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {filteredBatches.map((batch) => {
                const course = batch.course || {};
                const instructors = batch.instructors || [];

                return (
                  <div
                    key={batch.id}
                    className="bg-white rounded-2xl sm:rounded-3xl border border-[#ECEEF2] shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
                  >
                    <div className="p-5 sm:p-6 flex flex-col flex-1">
                      {/* Top Row: Learning Status & Rating */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            batch.course_progress?.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : batch.course_progress?.status === 'IN_PROGRESS'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              batch.course_progress?.status === 'COMPLETED'
                                ? 'bg-emerald-500'
                                : batch.course_progress?.status === 'IN_PROGRESS'
                                ? 'bg-indigo-600'
                                : 'bg-slate-400'
                            }`}
                          />
                          {batch.course_progress?.status === 'COMPLETED'
                            ? 'Completed'
                            : batch.course_progress?.status === 'IN_PROGRESS'
                            ? 'In Progress'
                            : 'Ready to Start'}
                        </span>

                        <CourseCardRating courseId={course.id || batch.course_id} />
                      </div>

                      {/* Course Title & De-emphasized Metadata */}
                      <div>
                        <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug break-words">
                          {course.name || batch.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-400 font-medium mt-1">
                          {course.code && <span className="font-semibold text-slate-500">{course.code}</span>}
                          {course.code && course.duration && <span>&bull;</span>}
                          {course.duration && <span>{course.duration}</span>}
                          {batch.batch_code && (
                            <>
                              <span>&bull;</span>
                              <span className="font-mono text-[11px] text-slate-400">Cohort: {batch.batch_code}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Primary Focus: Progress Section */}
                      <div className="my-4 p-3.5 rounded-xl bg-slate-50/80 border border-slate-100">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-bold text-slate-700">Course Progress</span>
                          <span className="font-extrabold text-[#3c4cb8]">
                            {Math.round(batch.course_progress?.progress_percentage || 0)}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              (batch.course_progress?.progress_percentage || 0) >= 100
                                ? 'bg-emerald-500'
                                : 'bg-[#3c4cb8]'
                            }`}
                            style={{
                              width: `${Math.min(100, Math.max(0, batch.course_progress?.progress_percentage || 0))}%`,
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 font-medium">
                          <span>
                            {batch.course_progress?.completed_sessions || 0} of {batch.course_progress?.total_sessions || 0} sessions completed
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {batch.batch_mode || 'Online'}
                          </span>
                        </div>
                      </div>

                      {/* Secondary Info: Faculty, Schedule & Modules */}
                      <div className="mt-auto space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                        {instructors.length > 0 && (
                          <div className="flex items-center gap-2">
                            <div
                              className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] shrink-0"
                              style={{ background: ADMIN_LIGHT, color: ADMIN_PRIMARY }}
                            >
                              <User className="w-3 h-3" />
                            </div>
                            <span className="truncate text-[11px]">
                              Instructor:{' '}
                              <strong className="text-slate-800 font-semibold">
                                {instructors[0]?.instructor?.first_name} {instructors[0]?.instructor?.last_name}
                              </strong>
                            </span>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="capitalize">{batch.batch_schedule?.toLowerCase() || 'Flexible'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="capitalize">{batch.batch_time?.toLowerCase() || 'Standard'}</span>
                          </div>
                          <div className="flex items-center gap-1 ml-auto">
                            <Layers className="w-3 h-3 text-indigo-600 shrink-0" />
                            <span className="font-semibold text-slate-700">{batch.module_count || 0} Modules</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Footer */}
                    <div className="p-4 bg-slate-50/70 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => openCourse(batch)}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white transition-all shadow-xs cursor-pointer hover:opacity-95 active:scale-[0.99] min-h-[42px]"
                        style={{ background: ADMIN_PRIMARY }}
                      >
                        <BookOpen className="w-4 h-4" />
                        <span>
                          {batch.course_progress?.status === 'COMPLETED'
                            ? 'Review Course'
                            : batch.course_progress?.status === 'IN_PROGRESS'
                            ? 'Continue Learning'
                            : 'Start Learning'}
                        </span>
                        <ChevronRight className="w-4 h-4 ml-0.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── In-LMS Video Player Modal ── */}
      <VideoPlayerModal
        isOpen={!!playingLecture}
        onClose={() => {
          setPlayingLecture(null);
          setPlayingModule(null);
        }}
        lecture={playingLecture}
        moduleName={playingModule?.name || playingModule?.title}
        courseName={activeBatch?.course?.name || activeBatch?.name}
      />
    </div>
  );
}
