import React, { useState } from 'react';
import { Video, Calendar, Clock, User, ExternalLink } from 'lucide-react';
import VideoPlayerModal from '../shared/VideoPlayerModal';

export default function StudentUpcomingSessionCard({ session }) {
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const isLive = session.session_type === 'LIVE';

  return (
    <>
      <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${
              isLive ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-indigo-50 text-indigo-600 border border-indigo-200'
            }`}
          >
            <Video className="w-5 h-5" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isLive
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                }`}
              >
                {session.session_type}
              </span>
              <span className="text-[10px] font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {session.batch_code || session.batch_name}
              </span>
            </div>

            <h4 className="text-sm font-bold text-slate-900 leading-snug">{session.title}</h4>

            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500">
              <span className="flex items-center gap-1 font-medium">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                {new Date(session.scheduled_at).toLocaleDateString([], {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>

              <span className="flex items-center gap-1 font-medium">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {new Date(session.scheduled_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                ({session.duration_minutes || 60}m)
              </span>

              {session.instructor && (
                <span className="flex items-center gap-1 font-medium">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  Prof. {session.instructor.first_name} {session.instructor.last_name}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
          {isLive ? (
            session.session_url ? (
              <a
                href={session.session_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition-colors shadow-xs"
              >
                <Video className="w-4 h-4" />
                <span>Join Live Class</span>
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </a>
            ) : session.recording_url ? (
              <button
                type="button"
                onClick={() => setIsPlayerOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 hover:text-indigo-700 transition-colors cursor-pointer"
              >
                <Video className="w-3.5 h-3.5 text-indigo-600" />
                <span>Watch Recording</span>
              </button>
            ) : (
              <span className="text-xs text-slate-400 italic bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                Link available soon
              </span>
            )
          ) : (
            /* RECORDED session */
            (session.recording_url || session.session_url) ? (
              <button
                type="button"
                onClick={() => setIsPlayerOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer"
              >
                <Video className="w-4 h-4" />
                <span>Watch Recording</span>
              </button>
            ) : (
              <span className="text-xs text-slate-400 italic bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                Recording available soon
              </span>
            )
          )}
        </div>
      </div>

      <VideoPlayerModal
        isOpen={isPlayerOpen}
        onClose={() => setIsPlayerOpen(false)}
        lecture={{
          ...session,
          recording_url: session.recording_url || session.session_url,
        }}
        courseName={session.course_name || session.batch_name}
      />
    </>
  );
}
