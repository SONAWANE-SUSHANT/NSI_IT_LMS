import React from 'react';
import { Video, Calendar, Clock, User, ExternalLink } from 'lucide-react';

export default function StudentUpcomingSessionCard({ session }) {
  const isLive = session.session_type === 'LIVE';

  return (
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
            <span className="text-xs text-slate-400 font-medium">&bull;</span>
            <span className="text-xs text-slate-500 font-medium">{session.module_name}</span>
          </div>

          <h4 className="text-sm font-bold text-slate-900 leading-snug">{session.title}</h4>

          {session.description && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-1">{session.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-4 mt-2.5 text-xs text-slate-600">
            {session.scheduled_at && (
              <span className="flex items-center gap-1.5 font-medium">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                {new Date(session.scheduled_at).toLocaleString([], {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
            )}
            {session.duration_minutes && (
              <span className="flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {session.duration_minutes} Minutes
              </span>
            )}
            {session.instructor && (
              <span className="flex items-center gap-1.5 font-medium">
                <User className="w-3.5 h-3.5 text-teal-600" />
                Prof. {session.instructor.first_name} {session.instructor.last_name}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
        {session.session_url ? (
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
          <a
            href={session.recording_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <span>Watch Recording</span>
            <ExternalLink className="w-3 h-3 ml-0.5" />
          </a>
        ) : (
          <span className="text-xs text-slate-400 italic bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            Link available soon
          </span>
        )}
      </div>
    </div>
  );
}
