import React, { useState, useEffect } from 'react';
import {
  X,
  BookOpen,
  Layers,
  Video,
  FileText,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Clock,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { fetchBatchCourseContent } from '../../services/studentService';
import VideoPlayerModal from '../shared/VideoPlayerModal';

export default function StudentCurriculumModal({ batch, onClose }) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedModules, setExpandedModules] = useState({});
  const [playingLecture, setPlayingLecture] = useState(null);

  useEffect(() => {
    if (!batch) return;
    const loadContent = async () => {
      try {
        setLoading(true);
        const data = await fetchBatchCourseContent(batch.id);
        setContent(data);
        if (data?.modules?.length > 0) {
          setExpandedModules({ [data.modules[0].id]: true });
        }
      } catch (err) {
        setError(err.message || 'Failed to load course syllabus');
      } finally {
        setLoading(false);
      }
    };
    loadContent();
  }, [batch]);

  const toggleModule = (id) => {
    setExpandedModules((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (!batch) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-100 overflow-hidden my-8 flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {content?.course?.name || batch.name}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {content?.course?.code} &bull; Batch: {batch.name} ({batch.batch_code})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-slate-100 animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : !content?.modules || content.modules.length === 0 ? (
            <div className="text-center py-12">
              <Layers className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No modules available yet</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Your instructor will upload modules and live lecture slots soon.
              </p>
            </div>
          ) : (
            content.modules.map((mod, index) => {
              const isExpanded = !!expandedModules[mod.id];
              const lectures = mod.lectures || [];

              return (
                <div
                  key={mod.id}
                  className="rounded-2xl border border-slate-200 bg-white overflow-hidden transition-all shadow-xs"
                >
                  {/* Module Header Bar */}
                  <div
                    onClick={() => toggleModule(mod.id)}
                    className="p-4 flex items-center justify-between cursor-pointer bg-slate-50/70 hover:bg-slate-100/70 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{mod.name}</h4>
                        <div className="flex items-center gap-3 mt-0.5 text-[11px] text-slate-500 font-medium">
                          {mod.duration && <span>Duration: {mod.duration}</span>}
                          <span>&bull;</span>
                          <span>{lectures.length} Classes / Lectures</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Module Content */}
                  {isExpanded && (
                    <div className="p-4 border-t border-slate-100 space-y-3 bg-white">
                      {mod.description && (
                        <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                          {mod.description}
                        </p>
                      )}

                      {/* Sessions */}
                      {lectures.length === 0 ? (
                        <div className="p-4 text-center rounded-xl bg-slate-50/50 border border-dashed border-slate-200">
                          <p className="text-xs font-medium text-slate-500">
                            No published lectures yet in this module.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {lectures.map((lec) => (
                            <div
                              key={lec.id}
                              className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/40 hover:bg-slate-50 transition-colors"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${
                                        lec.session_type === 'LIVE'
                                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                                          : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                      }`}
                                    >
                                      {lec.session_type}
                                    </span>
                                    <h5 className="text-xs font-bold text-slate-900">{lec.title}</h5>
                                  </div>
                                  {lec.description && (
                                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                                      {lec.description}
                                    </p>
                                  )}

                                  <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-500">
                                    {lec.scheduled_at && (
                                      <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3 text-slate-400" />
                                        {new Date(lec.scheduled_at).toLocaleString([], {
                                          dateStyle: 'medium',
                                          timeStyle: 'short',
                                        })}
                                      </span>
                                    )}
                                    {lec.duration_minutes && (
                                      <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3 text-slate-400" />
                                        {lec.duration_minutes} mins
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {(() => {
                                  const isLive = (lec.session_type || lec.lecture_type) === 'LIVE';
                                  const meetUrl = isLive ? (lec.session_url || lec.meet_url) : null;
                                  const recUrl = lec.recording_url || (!isLive ? (lec.session_url || lec.meet_url) : null);

                                  if (isLive) {
                                    if (meetUrl) {
                                      return (
                                        <a
                                          href={meetUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 transition-colors shadow-2xs"
                                        >
                                          <span>Join Class</span>
                                          <ExternalLink className="w-3 h-3" />
                                        </a>
                                      );
                                    }
                                    if (recUrl) {
                                      return (
                                        <button
                                          type="button"
                                          onClick={() => setPlayingLecture({ ...lec, recording_url: recUrl })}
                                          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 hover:text-indigo-700 transition-colors cursor-pointer"
                                        >
                                          <Video className="w-3.5 h-3.5 text-indigo-600" />
                                          <span>Watch Recording</span>
                                        </button>
                                      );
                                    }
                                    return null;
                                  }

                                  // RECORDED
                                  if (recUrl) {
                                    return (
                                      <button
                                        type="button"
                                        onClick={() => setPlayingLecture({ ...lec, recording_url: recUrl })}
                                        className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors cursor-pointer shadow-2xs"
                                      >
                                        <Video className="w-3.5 h-3.5" />
                                        <span>Watch Recording</span>
                                      </button>
                                    );
                                  }
                                  return (
                                    <span className="shrink-0 text-[11px] text-slate-400 italic">Pending upload</span>
                                  );
                                })()}
                              </div>

                              {/* Notes */}
                              {lec.notes && lec.notes.length > 0 && (
                                <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap gap-2">
                                  {lec.notes.map((note) => (
                                    <a
                                      key={note.id}
                                      href={note.external_url || note.file_url || '#'}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 hover:bg-amber-100 transition-colors"
                                    >
                                      <FileText className="w-3 h-3" />
                                      <span>{note.title}</span>
                                      <ExternalLink className="w-2.5 h-2.5 ml-0.5 opacity-60" />
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>

      {/* ── In-LMS Video Player Modal ── */}
      <VideoPlayerModal
        isOpen={!!playingLecture}
        onClose={() => setPlayingLecture(null)}
        lecture={playingLecture}
        courseName={batch?.course?.name || batch?.name}
      />
    </div>
  );
}
