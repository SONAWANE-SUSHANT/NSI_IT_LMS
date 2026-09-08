import React from 'react';
import { BookOpen, Clock, Calendar, User, ChevronRight, Layers } from 'lucide-react';

export default function StudentBatchCard({ batch, onOpenCurriculum }) {
  const course = batch.course || {};
  const instructors = batch.instructors || [];

  const getModeBadge = (mode) => {
    switch (mode) {
      case 'ONLINE':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'OFFLINE':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'HYBRID':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between">
      <div className="p-5">
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-[11px] font-mono font-bold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
            {batch.batch_code || `BATCH-${batch.id}`}
          </span>
          <span
            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getModeBadge(
              batch.batch_mode
            )}`}
          >
            {batch.batch_mode || 'ONLINE'}
          </span>
        </div>

        {/* Course Header */}
        <div className="mb-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {course.code || 'COURSE'} &bull; {course.duration || 'Flexible'}
          </p>
          <h3 className="text-base font-bold text-slate-900 mt-0.5 leading-snug line-clamp-2">
            {course.name || batch.name}
          </h3>
          <p className="text-xs text-slate-600 font-medium mt-1">Batch: {batch.name}</p>
        </div>

        {/* Instructors */}
        {instructors.length > 0 && (
          <div className="flex items-center gap-2 py-2.5 border-t border-slate-100 text-xs text-slate-600">
            <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-[10px] shrink-0">
              <User className="w-3.5 h-3.5" />
            </div>
            <span className="truncate">
              Instructor:{' '}
              <strong className="text-slate-800">
                {instructors[0]?.instructor?.first_name} {instructors[0]?.instructor?.last_name}
              </strong>
            </span>
          </div>
        )}

        {/* Meta details */}
        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="capitalize">{batch.batch_time?.toLowerCase() || 'Morning'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="capitalize">{batch.batch_schedule?.toLowerCase() || 'Weekdays'}</span>
          </div>
          <div className="flex items-center gap-1.5 col-span-2">
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span className="font-semibold text-slate-800">
              {batch.module_count || 0} Modules Available
            </span>
          </div>
        </div>
      </div>

      {/* Card Action */}
      <div className="p-4 bg-slate-50 border-t border-slate-100">
        <button
          onClick={() => onOpenCurriculum(batch)}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 transition-colors shadow-xs"
        >
          <BookOpen className="w-4 h-4" />
          <span>View Curriculum & Notes</span>
          <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
        </button>
      </div>
    </div>
  );
}
