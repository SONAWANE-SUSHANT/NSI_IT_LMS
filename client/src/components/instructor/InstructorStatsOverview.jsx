import React from 'react';
import { Users, BookOpen, Layers, Video } from 'lucide-react';

export default function InstructorStatsOverview({ batches = [] }) {
  const totalStudents = batches.reduce((acc, b) => acc + (Number(b.student_count) || 0), 0);
  const totalModules = batches.reduce((acc, b) => acc + (Number(b.module_count) || 0), 0);
  const activeBatchesCount = batches.filter((b) => b.status === 'ACTIVE').length;

  const stats = [
    {
      title: 'Assigned Batches',
      value: batches.length,
      subtext: `${activeBatchesCount} currently active`,
      icon: BookOpen,
      iconBg: 'bg-teal-50',
      iconColor: 'text-teal-600',
      borderColor: 'border-teal-100',
    },
    {
      title: 'Enrolled Students',
      value: totalStudents,
      subtext: 'Across all cohorts',
      icon: Users,
      iconBg: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      borderColor: 'border-indigo-100',
    },
    {
      title: 'Course Modules',
      value: totalModules,
      subtext: 'Active curriculum units',
      icon: Layers,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      borderColor: 'border-amber-100',
    },
    {
      title: 'Delivery Mode',
      value: 'Hybrid & Live',
      subtext: 'Online Google Meet ready',
      icon: Video,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      borderColor: 'border-emerald-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className={`bg-white rounded-2xl p-4 sm:p-5 border ${stat.borderColor} shadow-xs transition-transform hover:-translate-y-0.5`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {stat.title}
              </span>
              <div className={`p-2.5 rounded-xl ${stat.iconBg} ${stat.iconColor}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-extrabold text-slate-900 tracking-tight">{stat.value}</p>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">{stat.subtext}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
