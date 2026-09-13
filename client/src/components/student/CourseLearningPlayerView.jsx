import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Play,
  Pause,
  Video,
  Clock,
  BookOpen,
  Calendar,
  User,
  Star,
  Share2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  ExternalLink,
  Download,
  AlertCircle,
  Sparkles,
  MessageSquare,
  Bell,
  Check,
  Radio,
  Award,
} from 'lucide-react';
import { parseVideoUrl } from '../../utils/videoUtils';
import { useStudentPortal } from '../../context/StudentPortalContext';
import { recordSessionAccess, markSessionComplete } from '../../services/progressService';
import CourseReviewsSection from './CourseReviewsSection';

const PRIMARY_COLOR = '#4f46e5'; // Indigo matching the design

export default function CourseLearningPlayerView({
  batch,
  courseContent,
  onBack,
}) {
  const navigate = useNavigate();
  const { isViewingAsAdmin, baseRoute } = useStudentPortal();
  const basePath = isViewingAsAdmin ? (baseRoute || '/student') : '/student';

  const course = courseContent?.course || batch?.course || {};
  const modules = courseContent?.modules || [];
  const instructors = courseContent?.instructors || [];

  // Flatten all published lectures across modules
  const allLectures = useMemo(() => {
    const list = [];
    modules.forEach((mod, modIdx) => {
      (mod.lectures || []).forEach((lec) => {
        list.push({
          ...lec,
          module_id: mod.id,
          module_name: mod.name,
          module_index: modIdx,
        });
      });
    });
    return list;
  }, [modules]);

  // Session progress map: sessionId -> { completed, completed_at, last_accessed_at }
  const [sessionProgressMap, setSessionProgressMap] = useState(() => {
    const map = {};
    modules.forEach((mod) => {
      (mod.lectures || []).forEach((lec) => {
        const prog = lec.sessionProgress?.[0];
        if (prog) {
          map[lec.id] = {
            completed: Boolean(prog.completed),
            completed_at: prog.completed_at,
            last_accessed_at: prog.updated_at || prog.last_accessed_at,
          };
        }
      });
    });
    return map;
  });

  const [courseProgress, setCourseProgress] = useState(
    courseContent?.course_progress || null
  );
  const [isCompleting, setIsCompleting] = useState(false);
  const [completeError, setCompleteError] = useState('');

  // Selected active lecture or quiz
  const [selectedLecture, setSelectedLecture] = useState(null);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [expandedModules, setExpandedModules] = useState({});
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'author' | 'notes' | 'announcements' | 'reviews'
  const [shareCopied, setShareCopied] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);

  // Resume / Initialize selected lecture:
  // 1. Incomplete last accessed session from course progress
  // 2. Incomplete accessed session
  // 3. First incomplete session
  // 4. Fallback to first session
  useEffect(() => {
    if (allLectures.length > 0 && !selectedLecture) {
      let targetLecture = null;

      const lastSessionId = courseProgress?.last_session_id;
      if (lastSessionId) {
        const found = allLectures.find((l) => l.id === lastSessionId);
        if (found && !sessionProgressMap[found.id]?.completed) {
          targetLecture = found;
        }
      }

      if (!targetLecture) {
        targetLecture = allLectures.find(
          (l) => sessionProgressMap[l.id]?.last_accessed_at && !sessionProgressMap[l.id]?.completed
        );
      }

      if (!targetLecture) {
        targetLecture = allLectures.find((l) => !sessionProgressMap[l.id]?.completed);
      }

      if (!targetLecture) {
        targetLecture =
          allLectures.find((l) => l.recording_url || l.session_url) || allLectures[0];
      }

      if (targetLecture) {
        setSelectedLecture(targetLecture);
        setExpandedModules((prev) => ({
          ...prev,
          [targetLecture.module_id]: true,
        }));
      }
    }
  }, [allLectures, selectedLecture, courseProgress]);

  // Record session access on lecture select
  useEffect(() => {
    if (selectedLecture?.id) {
      recordSessionAccess(selectedLecture.id)
        .then((data) => {
          if (data) {
            setSessionProgressMap((prev) => ({
              ...prev,
              [selectedLecture.id]: {
                ...prev[selectedLecture.id],
                completed: Boolean(data.completed),
                completed_at: data.completed_at,
                last_accessed_at: data.last_accessed_at,
              },
            }));
          }
        })
        .catch((err) => {
          console.error('Failed to record session access:', err);
        });
    }
  }, [selectedLecture?.id]);

  const handleCompleteSession = async (sessionId) => {
    if (!sessionId || isCompleting) return;
    try {
      setIsCompleting(true);
      setCompleteError('');
      const res = await markSessionComplete(sessionId);

      if (res?.session_progress) {
        setSessionProgressMap((prev) => ({
          ...prev,
          [sessionId]: {
            completed: Boolean(res.session_progress.completed),
            completed_at: res.session_progress.completed_at,
            last_accessed_at: res.session_progress.last_accessed_at,
          },
        }));
      }

      if (res?.course_progress) {
        setCourseProgress(res.course_progress);
      }
    } catch (err) {
      setCompleteError(err.message || 'Failed to mark session as completed');
    } finally {
      setIsCompleting(false);
    }
  };

  // Reset loading whenever selected lecture changes
  useEffect(() => {
    setIframeLoading(true);
  }, [selectedLecture?.id]);

  // Toggle module expansion
  const toggleModule = (modId) => {
    setExpandedModules((prev) => ({
      ...prev,
      [modId]: !prev[modId],
    }));
  };

  // Calculate total course duration in minutes
  const totalDurationMinutes = useMemo(() => {
    return allLectures.reduce((acc, lec) => acc + (Number(lec.duration_minutes) || 0), 0);
  }, [allLectures]);

  const formatDuration = (mins) => {
    if (!mins) return 'Flexible';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0 && m > 0) return `${h}h ${m}min`;
    if (h > 0) return `${h}h`;
    return `${m}min`;
  };

  // Resolve video URL for selected lecture
  const isSelectedLive =
    selectedLecture &&
    (selectedLecture.session_type === 'LIVE' || selectedLecture.lecture_type === 'LIVE');

  const handleOpenLiveMeeting = () => {
    if (selectedLecture?.session_url) {
      window.open(selectedLecture.session_url, '_blank', 'noopener,noreferrer');
    }
  };

  const selectedRecUrl = selectedLecture
    ? selectedLecture.recording_url ||
      (!isSelectedLive ? selectedLecture.session_url : null)
    : null;

  const parsedVideo = selectedRecUrl ? parseVideoUrl(selectedRecUrl) : null;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2500);
  };

  const currentLectureNotes = (selectedLecture?.notes || []).filter(
    (n) => n.status !== 'INACTIVE'
  );

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* ── Top Header Bar ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            {/* Back Arrow Button */}
            <button
              onClick={onBack}
              title="Back to Enrolled Courses"
              className="mt-0.5 sm:mt-0 p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-colors shadow-2xs shrink-0 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {course.name || batch?.name}
                </h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {course.category || course.code || 'Curriculum'}
                </span>
              </div>

              {/* Course Meta Row */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-semibold text-slate-500">
                <span className="flex items-center gap-1.5 text-indigo-600">
                  <Play className="w-3.5 h-3.5 fill-indigo-600" />
                  <span>{allLectures.length} lessons</span>
                </span>
                <span className="text-slate-300">&bull;</span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{formatDuration(totalDurationMinutes)}</span>
                </span>
                <span className="text-slate-300">&bull;</span>
                <span className="flex items-center gap-1 text-amber-600">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-bold text-slate-800">4.8</span>
                  <span className="text-slate-400 font-medium">(128 reviews)</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right Actions: Share & Enrolled Status */}
          <div className="flex items-center gap-2.5 self-end lg:self-center">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            >
              {shareCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Share</span>
                </>
              )}
            </button>

            <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#4f46e5] shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-white/90" />
              <span>Enrolled & Active</span>
            </div>
          </div>
        </div>

        {/* Course Progress Header Bar */}
        {courseProgress && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-800">Course Progress</span>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                      courseProgress.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : courseProgress.status === 'IN_PROGRESS'
                        ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {courseProgress.status === 'COMPLETED'
                      ? 'COMPLETED'
                      : courseProgress.status === 'IN_PROGRESS'
                      ? 'IN PROGRESS'
                      : 'NOT STARTED'}
                  </span>
                  {courseProgress.status === 'COMPLETED' && (
                    <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Course Completed
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-500 mt-0.5">
                  {courseProgress.completed_sessions || 0} of {courseProgress.total_sessions || allLectures.length} Sessions Completed ({courseProgress.progress_percentage || 0}%)
                </span>
              </div>
            </div>

            <div className="w-full sm:w-64">
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Overall Completion</span>
                <span className="text-indigo-600 font-extrabold">{Math.round(courseProgress.progress_percentage || 0)}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    courseProgress.progress_percentage >= 100
                      ? 'bg-emerald-500'
                      : 'bg-gradient-to-r from-indigo-500 to-indigo-600'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, courseProgress.progress_percentage || 0))}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Main Two-Column Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── LEFT COLUMN (Cinema Player & Tabs OR Assessment View) ~68% ── */}
        <div className="lg:col-span-8 space-y-5">
          {selectedQuiz ? (
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 p-6 sm:p-8 space-y-6 shadow-xs animate-fadeIn">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-md shrink-0">
                    <Award className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                        Module Assessment
                      </span>
                      <span className="text-xs text-slate-500 font-semibold">
                        {selectedQuiz.moduleName || 'Curriculum Assessment'}
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-1.5">
                      {selectedQuiz.title}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">
                      Course: {selectedQuiz.courseName || course.name}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate(`${basePath}/quizzes/${selectedQuiz.id}`)}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs sm:text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-md hover:shadow-lg transition-all self-start sm:self-center cursor-pointer shrink-0"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>
                    {selectedQuiz.attempts && selectedQuiz.attempts.length > 0
                      ? selectedQuiz.attempts[0].status === 'IN_PROGRESS'
                        ? 'Resume Assessment'
                        : 'View Results / Retake'
                      : 'Start Assessment'}
                  </span>
                </button>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100/80">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Duration</span>
                  <span className="text-sm font-extrabold text-slate-900 mt-1 block">
                    {selectedQuiz.duration_minutes ? `${selectedQuiz.duration_minutes} Mins` : 'No Time Limit'}
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100/80">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Total Marks</span>
                  <span className="text-sm font-extrabold text-slate-900 mt-1 block">
                    {Number(selectedQuiz.total_marks || 0)} Marks
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100/80">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Passing Marks</span>
                  <span className="text-sm font-extrabold text-emerald-600 mt-1 block">
                    {selectedQuiz.passing_marks ? `${Number(selectedQuiz.passing_marks)} Marks` : 'N/A'}
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100/80">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Max Attempts</span>
                  <span className="text-sm font-extrabold text-slate-900 mt-1 block">
                    {selectedQuiz.max_attempts || 1} Attempt{selectedQuiz.max_attempts > 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Description & Instructions */}
              {selectedQuiz.description && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">About This Assessment</h4>
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    {selectedQuiz.description}
                  </p>
                </div>
              )}

              {selectedQuiz.instructions && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Test Instructions</h4>
                  <p className="text-xs text-slate-600 leading-relaxed bg-indigo-50/40 p-4 rounded-2xl border border-indigo-100/80">
                    {selectedQuiz.instructions}
                  </p>
                </div>
              )}

              {/* Attempt History */}
              {selectedQuiz.attempts && selectedQuiz.attempts.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Your Past Attempts</h4>
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden text-xs">
                    {selectedQuiz.attempts.map((att) => (
                      <div key={att.id} className="p-4 bg-white flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <span className="font-bold text-slate-900">Attempt #{att.attempt_number}</span>
                          <span className="text-slate-400 text-[11px] ml-2">
                            {att.submitted_at ? new Date(att.submitted_at).toLocaleDateString() : 'In Progress'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-slate-900">
                            Score: {att.score ?? 0} / {att.total_marks ?? selectedQuiz.total_marks}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            att.passed ? 'bg-emerald-100 text-emerald-800' : att.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {att.passed ? 'PASSED' : att.status === 'IN_PROGRESS' ? 'IN PROGRESS' : 'FAILED'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Video Player Box (16:9) */}
              <div className="bg-black rounded-2xl sm:rounded-3xl shadow-lg border border-slate-800 overflow-hidden relative aspect-video flex items-center justify-center">
            {!selectedLecture ? (
              <div className="text-center p-8 text-slate-400">
                <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-600 opacity-60" />
                <h4 className="text-base font-bold text-slate-200">Select a Lesson to Start</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  Choose a lecture from the Course Content sidebar on the right.
                </p>
              </div>
            ) : isSelectedLive ? (
              /* LIVE CLASS INTERACTIVE CARD */
              <div className="w-full h-full p-6 sm:p-10 flex flex-col items-center justify-center text-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-black tracking-wider uppercase mb-3 animate-pulse">
                  <Radio className="w-3.5 h-3.5" />
                  <span>Live Interactive Session</span>
                </div>
                <h3 className="text-lg sm:text-2xl font-extrabold max-w-lg mb-2">
                  {selectedLecture.title}
                </h3>
                {selectedLecture.scheduled_at && (
                  <p className="text-xs text-slate-300 font-medium mb-4 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    Scheduled:{' '}
                    {new Date(selectedLecture.scheduled_at).toLocaleString([], {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                )}

                {/* Action: Open Live Google Meet */}
                <div className="flex flex-wrap items-center justify-center gap-3 mt-1">
                  {selectedLecture.session_url ? (
                    <button
                      type="button"
                      onClick={handleOpenLiveMeeting}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 transition-all shadow-lg hover:scale-105 cursor-pointer"
                    >
                      <Video className="w-4 h-4" />
                      <span>Join Live Meeting Now</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 italic bg-white/10 px-4 py-2 rounded-xl">
                      Live link will be activated right before class begins
                    </span>
                  )}
                </div>
              </div>
            ) : selectedRecUrl && parsedVideo ? (
              /* RECORDED VIDEO STREAM */
              parsedVideo.type === 'video' ? (
                <video
                  key={parsedVideo.embedUrl}
                  src={parsedVideo.embedUrl}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                >
                  Your browser does not support HTML5 video streaming.
                </video>
              ) : (
                <div className="relative w-full h-full">
                  {iframeLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-slate-300 z-10">
                      <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
                      <span className="text-xs font-semibold">Loading Lecture Video…</span>
                    </div>
                  )}
                  <iframe
                    src={parsedVideo.embedUrl}
                    title={selectedLecture.title}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    onLoad={() => setIframeLoading(false)}
                  />
                </div>
              )
            ) : (
              /* PENDING RECORDING UPLOAD */
              <div className="text-center p-8 text-slate-400 bg-slate-900/90 w-full h-full flex flex-col items-center justify-center">
                <Video className="w-12 h-12 mx-auto mb-2 text-indigo-400 opacity-60" />
                <h4 className="text-sm sm:text-base font-bold text-slate-200">
                  {selectedLecture.title}
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  This recorded class is scheduled in the syllabus. The instructor will upload the
                  recording video shortly.
                </p>
              </div>
            )}
          </div>

          {/* ── Lesson Title & Explicit Mark as Completed Action ── */}
          {selectedLecture && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                    {selectedLecture.module_name || 'Lesson'}
                  </span>
                  {isSelectedLive ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100 flex items-center gap-1">
                      <Radio className="w-2.5 h-2.5" />
                      Live Session
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                      Recorded Lesson
                    </span>
                  )}
                </div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                  {selectedLecture.title}
                </h2>
              </div>

              {/* Live Session Action: Join Live Meeting */}
              {isSelectedLive && selectedLecture.session_url && (
                <div className="shrink-0 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenLiveMeeting}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white text-xs font-bold transition-all shadow-xs hover:shadow-md cursor-pointer"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Join Live Meeting Now</span>
                    <ExternalLink className="w-3 h-3 opacity-80" />
                  </button>
                </div>
              )}

              {/* Completion Control: Explicit Mark as Completed for recorded sessions */}
              {!isSelectedLive && (
                <div className="shrink-0 flex items-center gap-2">
                  {sessionProgressMap[selectedLecture.id]?.completed ? (
                    <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold shadow-2xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Completed</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleCompleteSession(selectedLecture.id)}
                      disabled={isCompleting}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white text-xs font-bold transition-all shadow-xs hover:shadow-md cursor-pointer disabled:opacity-50"
                    >
                      <div className="w-3.5 h-3.5 border-2 border-white rounded-xs flex items-center justify-center">
                        {isCompleting && <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />}
                      </div>
                      <span>{isCompleting ? 'Saving...' : 'Mark as Completed'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {completeError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{completeError}</span>
            </div>
          )}



          {/* ── Navigation Tabs ── */}
          <div className="flex items-center gap-1 sm:gap-2 border-b border-slate-200 overflow-x-auto no-scrollbar py-1">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'author', label: 'Author' },
              { id: 'notes', label: `Notes & Resources (${currentLectureNotes.length})` },
              { id: 'announcements', label: 'Announcements' },
              { id: 'reviews', label: 'Reviews' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-indigo-50 text-[#4f46e5] border border-indigo-200 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/70 border border-transparent'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Tab Content Panels ── */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 mb-2">About Course</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {course.description ||
                      'Unlock the power of modern skills with our comprehensive curriculum. Whether you are starting out or looking to enhance your industry readiness, this program provides hands-on modules, recorded lessons, and expert-led projects.'}
                  </p>
                </div>

                {/* What You'll Learn Grid */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    What You'll Learn & Key Outcomes
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      'Master core concepts and production-grade architectures',
                      'Build interactive hands-on real world projects',
                      'Develop best practices in code quality and deployment',
                      'Gain industry certification and portfolio ready skills',
                    ].map((outcome, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs font-medium text-slate-700"
                      >
                        <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                        <span>{outcome}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Active Lecture Details */}
                {selectedLecture && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/40 border border-indigo-100 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                        Current Lesson
                      </span>
                      <span className="text-xs font-bold text-slate-900">
                        {selectedLecture.title}
                      </span>
                    </div>
                    {selectedLecture.description && (
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {selectedLecture.description}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'author' && (
              <div className="space-y-4">
                <h3 className="text-base font-extrabold text-slate-900 mb-3">Course Instructor</h3>
                {instructors.length === 0 ? (
                  <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-slate-50 border border-slate-200/60">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-base">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Faculty Instructor</h4>
                      <p className="text-xs text-slate-500">NSI IT Academy Lead Instructor</p>
                    </div>
                  </div>
                ) : (
                  instructors.map((ins) => (
                    <div
                      key={ins.id}
                      className="flex items-start gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200/60"
                    >
                      <div className="w-13 h-13 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
                        {ins.photo ? (
                          <img
                            src={ins.photo}
                            alt={ins.first_name}
                            className="w-full h-full object-cover rounded-2xl"
                          />
                        ) : (
                          `${ins.first_name?.[0] || 'I'}${ins.last_name?.[0] || ''}`
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">
                          Prof. {ins.first_name} {ins.last_name}
                        </h4>
                        <p className="text-xs font-semibold text-indigo-600 mt-0.5">{ins.email}</p>
                        <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                          Senior Industry Mentor and Technical Trainer with extensive expertise in
                          full-stack engineering, production architecture, and hands-on developer
                          mentorship.
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-slate-900">
                    Study Notes & Resources
                  </h3>
                  <span className="text-xs font-medium text-slate-400">
                    Attached to {selectedLecture?.title || 'current lesson'}
                  </span>
                </div>

                {currentLectureNotes.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-medium text-slate-600">
                      No study notes attached to this lesson.
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Course notes and downloadable cheat sheets will show here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {currentLectureNotes.map((note) => (
                      <div
                        key={note.id}
                        className="p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/80 transition-all flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <h5 className="text-xs font-bold text-slate-900 truncate">
                              {note.title}
                            </h5>
                            {note.content && (
                              <p className="text-[11px] text-slate-500 truncate">{note.content}</p>
                            )}
                          </div>
                        </div>

                        <a
                          href={note.external_url || note.file_url || '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-[#4f46e5] bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 shrink-0 transition-colors cursor-pointer"
                        >
                          <span>Open Resource</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'announcements' && (
              <div className="space-y-4">
                <h3 className="text-base font-extrabold text-slate-900 mb-2">
                  Class Announcements
                </h3>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                  <Bell className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">
                      Welcome to Batch {batch?.name || batch?.batch_code}!
                    </h5>
                    <p className="text-xs text-slate-600 mt-1">
                      All live classes and recorded sessions are updated in real time. Remember to
                      review lecture notes and submit assignments on schedule.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <CourseReviewsSection
                courseId={course?.id || batch?.course_id}
                isEnrolled={true}
              />
            )}
          </div>
        </>
      )}
    </div>

        {/* ── RIGHT COLUMN ("Course content" Sidebar) ~32% ── */}
        <div className="lg:col-span-4 sticky top-6">
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            {/* Sidebar Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Course content</h3>
                <span className="text-xs text-slate-500 font-medium">
                  {modules.length} Modules &bull; {allLectures.length} Lessons
                </span>
              </div>
              {courseProgress && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {courseProgress.completed_sessions || 0}/{courseProgress.total_sessions || allLectures.length} Done
                </span>
              )}
            </div>

            {/* Accordion Module List */}
            <div className="divide-y divide-slate-100 max-h-[78vh] overflow-y-auto">
              {modules.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs font-medium">
                  No modules published yet.
                </div>
              ) : (
                modules.map((mod, modIdx) => {
                  const isExpanded = !!expandedModules[mod.id];
                  const lectures = mod.lectures || [];

                  // Calculate module duration
                  const modDurationMinutes = lectures.reduce(
                    (acc, l) => acc + (Number(l.duration_minutes) || 0),
                    0
                  );

                  return (
                    <div key={mod.id} className="bg-white">
                      {/* Module Header Row */}
                      <div
                        onClick={() => toggleModule(mod.id)}
                        className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/80 transition-colors select-none"
                      >
                        <div className="min-w-0 pr-2">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {String(modIdx + 1).padStart(2, '0')}: {mod.name}
                          </h4>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          <span className="text-xs font-semibold text-slate-500">
                            {modDurationMinutes > 0 ? `${modDurationMinutes}min` : mod.duration || ''}
                          </span>
                          <div className="p-1 text-slate-400 hover:text-slate-700 transition-colors">
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Nested Lecture Items & Module Assessments */}
                      {isExpanded && (
                        <div className="bg-slate-50/40 divide-y divide-slate-100/60 border-t border-slate-100">
                          {lectures.length === 0 && (!mod.quizzes || mod.quizzes.length === 0) ? (
                            <div className="p-4 text-center text-xs text-slate-400 italic">
                              No lectures or assessments in this unit yet
                            </div>
                          ) : (
                            <>
                              {lectures.map((lec) => {
                                const isSelected = selectedLecture?.id === lec.id && !selectedQuiz;
                                const isLecLive =
                                  lec.session_type === 'LIVE' || lec.lecture_type === 'LIVE';
                                const isLecCompleted = sessionProgressMap[lec.id]?.completed;
                                const isLecAccessed = !!sessionProgressMap[lec.id]?.last_accessed_at;

                                return (
                                  <div
                                    key={lec.id}
                                    onClick={() => {
                                      setSelectedLecture(lec);
                                      setSelectedQuiz(null);
                                    }}
                                    className={`px-5 py-3 flex items-center justify-between cursor-pointer transition-all ${
                                      isSelected
                                        ? 'bg-indigo-50/90 border-l-4 border-[#4f46e5] text-indigo-900 font-bold'
                                        : 'hover:bg-white text-slate-700 font-medium'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3 min-w-0 pr-2">
                                      <div
                                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                                          isLecCompleted
                                            ? 'bg-emerald-100 text-emerald-700 font-bold'
                                            : isSelected
                                            ? 'bg-indigo-600 text-white'
                                            : isLecLive
                                            ? 'bg-rose-100 text-rose-600'
                                            : isLecAccessed
                                            ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                                            : 'bg-slate-200/80 text-slate-600'
                                        }`}
                                      >
                                        {isLecCompleted ? (
                                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                                        ) : isLecLive ? (
                                          <Radio className="w-3 h-3" />
                                        ) : isLecAccessed ? (
                                          <Clock className="w-3 h-3" />
                                        ) : (
                                          <Play className="w-2.5 h-2.5 ml-0.5 fill-current" />
                                        )}
                                      </div>
                                      <span className="text-xs truncate" title={lec.title}>
                                        {lec.title}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                      {isLecCompleted && (
                                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                          ✓ Done
                                        </span>
                                      )}
                                      <span
                                        className={`text-[11px] ${
                                          isSelected
                                            ? 'text-indigo-600 font-bold'
                                            : 'text-slate-400 font-normal'
                                        }`}
                                      >
                                        {lec.duration_minutes
                                          ? `${lec.duration_minutes} min`
                                          : isLecLive
                                          ? 'Live'
                                          : ''}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}

                              {/* Module Assessments */}
                              {mod.quizzes && mod.quizzes.map((quiz) => {
                                const isQuizSelected = selectedQuiz?.id === quiz.id;
                                const attempt = quiz.attempts?.[0];
                                const hasPassed = attempt?.passed;

                                return (
                                  <div
                                    key={`quiz-${quiz.id}`}
                                    onClick={() => {
                                      setSelectedQuiz({ ...quiz, moduleName: mod.name, courseName: course.name });
                                      setSelectedLecture(null);
                                    }}
                                    className={`px-5 py-3 flex items-center justify-between cursor-pointer transition-all ${
                                      isQuizSelected
                                        ? 'bg-amber-50/90 border-l-4 border-amber-500 text-amber-950 font-bold shadow-2xs'
                                        : 'bg-amber-50/25 hover:bg-amber-50/60 text-slate-700 font-medium'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3 min-w-0 pr-2">
                                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 shadow-2xs ${
                                        isQuizSelected ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-700'
                                      }`}>
                                        <Award className="w-3.5 h-3.5" />
                                      </div>
                                      <div className="min-w-0">
                                        <span className="text-xs truncate block font-bold text-slate-900" title={quiz.title}>
                                          {quiz.title}
                                        </span>
                                        <span className="text-[10px] text-amber-700 font-semibold block">
                                          Module Test {quiz.total_marks ? `• ${Number(quiz.total_marks)} Marks` : ''}
                                        </span>
                                      </div>
                                    </div>

                                    <span
                                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                                        hasPassed
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : attempt
                                          ? 'bg-blue-100 text-blue-800'
                                          : 'bg-amber-100 text-amber-800'
                                      }`}
                                    >
                                      {hasPassed ? 'PASSED' : attempt ? (attempt.status === 'IN_PROGRESS' ? 'IN PROGRESS' : 'COMPLETED') : 'TAKE TEST'}
                                    </span>
                                  </div>
                                );
                              })}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
