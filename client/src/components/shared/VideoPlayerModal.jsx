import { useEffect, useState } from 'react';
import {
  X,
  ExternalLink,
  Video,
  Calendar,
  Clock,
  User,
  FileText,
  AlertCircle,
  Maximize2,
  BookOpen,
} from 'lucide-react';
import { parseVideoUrl } from '../../utils/videoUtils';

const ADMIN_PRIMARY = '#3c4cb8';
const ADMIN_LIGHT = '#e7e9fb';

export default function VideoPlayerModal({
  isOpen,
  onClose,
  lecture,
  moduleName,
  courseName,
}) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'notes'
  const [iframeLoading, setIframeLoading] = useState(true);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Reset loading state when lecture changes
  useEffect(() => {
    setIframeLoading(true);
  }, [lecture?.id, lecture?.recording_url]);

  if (!isOpen || !lecture) return null;

  const recordingUrl = lecture.recording_url || lecture.session_url || '';
  const parsed = parseVideoUrl(recordingUrl);
  const notes = (lecture.notes || []).filter((n) => n.status !== 'INACTIVE');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md transition-all animate-fadeIn">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Player Window */}
      <div className="relative z-10 w-full max-w-5xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header Bar */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/80 shrink-0">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-[#3c4cb8] border border-indigo-200">
                <Video className="w-3 h-3" />
                <span>Recorded Class</span>
              </span>

              {courseName && (
                <span className="text-xs font-semibold text-slate-500 truncate max-w-[200px]">
                  {courseName}
                </span>
              )}

              {moduleName && (
                <>
                  <span className="text-slate-300 text-xs">&bull;</span>
                  <span className="text-xs font-semibold text-slate-500 truncate max-w-[200px]">
                    {moduleName}
                  </span>
                </>
              )}
            </div>

            <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate" title={lecture.title}>
              {lecture.title}
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {recordingUrl && (
              <a
                href={recordingUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Open video in external browser tab"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Externally</span>
              </a>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
              title="Close Player (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Screen Viewport (16:9) */}
        <div className="relative bg-black w-full aspect-video shrink-0 max-h-[56vh] flex items-center justify-center overflow-hidden">
          {!recordingUrl ? (
            <div className="text-center p-8 text-slate-400">
              <AlertCircle className="w-10 h-10 mx-auto mb-2 text-slate-500" />
              <p className="text-sm font-semibold">No recording URL available for this lecture.</p>
              <p className="text-xs text-slate-500 mt-1">Please check back once the instructor uploads the recording.</p>
            </div>
          ) : parsed.type === 'video' ? (
            <video
              src={parsed.embedUrl}
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
                  <span className="text-xs font-semibold">Buffering LMS Video Player…</span>
                </div>
              )}
              <iframe
                src={parsed.embedUrl}
                title={lecture.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                onLoad={() => setIframeLoading(false)}
              />
            </div>
          )}
        </div>

        {/* Bottom Tabs & Details Drawer */}
        <div className="flex-1 overflow-y-auto p-5 bg-white space-y-4">
          {/* Tabs bar */}
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <button
              onClick={() => setActiveTab('overview')}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'overview'
                  ? 'bg-indigo-50 text-[#3c4cb8]'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Lecture Details</span>
            </button>

            <button
              onClick={() => setActiveTab('notes')}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'notes'
                  ? 'bg-indigo-50 text-[#3c4cb8]'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Study Notes & Materials ({notes.length})</span>
            </button>
          </div>

          {/* Tab 1: Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-3">
              {/* Meta stats */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                {lecture.duration_minutes && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Duration: {lecture.duration_minutes} mins</span>
                  </div>
                )}

                {lecture.scheduled_at && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    <span>
                      Conducted:{' '}
                      {new Date(lecture.scheduled_at).toLocaleString([], {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>
                )}

                {lecture.instructor && (
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      Instructor: {lecture.instructor.first_name} {lecture.instructor.last_name}
                    </span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  About this Lecture
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {lecture.description || 'No detailed synopsis provided for this recorded lecture.'}
                </p>
              </div>
            </div>
          )}

          {/* Tab 2: Attached Notes */}
          {activeTab === 'notes' && (
            <div className="space-y-2">
              {notes.length === 0 ? (
                <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <FileText className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                  <p className="text-xs font-semibold text-slate-600">No study notes attached</p>
                  <p className="text-[11px] text-slate-400">The instructor has not uploaded supplementary notes for this session yet.</p>
                </div>
              ) : (
                notes.map((note) => (
                  <div
                    key={note.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-white text-indigo-700 border border-indigo-200 shrink-0">
                        {note.note_type || 'PDF'}
                      </span>
                      <span className="text-xs font-bold text-slate-800 truncate" title={note.title}>
                        {note.title}
                      </span>
                    </div>

                    {(note.external_url || note.file_url) ? (
                      <a
                        href={note.external_url || note.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#3c4cb8] hover:underline shrink-0"
                      >
                        <span>View / Download</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">No URL</span>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
