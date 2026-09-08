import React from 'react';
import { Users, Calendar, Clock, Video, BookOpen, ChevronRight, Layers } from 'lucide-react';

export default function InstructorBatchCard({
  batch,
  onOpenSchedule,
  onOpenStudents,
  onOpenContent,
}) {
  const course = batch.course || {};

  const getModeBadgeColor = (mode) => {
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
          <span className="text-[11px] font-mono font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
            {batch.batch_code || `BATCH-${batch.id}`}
          </span>
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${getModeBadgeColor(
              batch.batch_mode
            )}`}
          >
            {batch.batch_mode || 'ONLINE'}
          </span>
        </div>

        {/* Course Info */}
        <div className="mb-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {course.code || 'COURSE'} &bull; {course.duration || 'Flexible'}
          </p>
          <h3 className="text-base font-bold text-slate-900 mt-0.5 leading-snug line-clamp-1">
            {course.name || batch.name}
          </h3>
          <p className="text-xs text-slate-600 font-medium mt-1">Batch: {batch.name}</p>
        </div>

        {/* Batch Metadata Grid */}
        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="capitalize">{batch.batch_time?.toLowerCase() || 'Morning'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="capitalize">{batch.batch_schedule?.toLowerCase() || 'Weekdays'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-teal-600" />
            <span className="font-semibold text-slate-800">{batch.student_count || 0} Students</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span className="font-semibold text-slate-800">{batch.module_count || 0} Modules</span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenStudents(batch)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors shadow-2xs"
          >
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span>Students ({batch.student_count || 0})</span>
          </button>
          <button
            onClick={() => onOpenContent(batch)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors shadow-2xs"
          >
            <BookOpen className="w-3.5 h-3.5 text-slate-500" />
            <span>Syllabus</span>
          </button>
        </div>

        <button
          onClick={() => onOpenSchedule(batch)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors shadow-xs ml-auto"
        >
          <Video className="w-3.5 h-3.5" />
          <span>Live Session</span>
          <ChevronRight className="w-3 h-3 ml-0.5" />
        </button>
      </div>
    </div>
  );
}
