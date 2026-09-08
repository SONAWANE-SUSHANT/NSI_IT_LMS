import React, { useState, useEffect } from 'react';
import InstructorHeader from '../components/instructor/InstructorHeader';
import InstructorStatsOverview from '../components/instructor/InstructorStatsOverview';
import InstructorBatchCard from '../components/instructor/InstructorBatchCard';
import InstructorScheduleSessionModal from '../components/instructor/InstructorScheduleSessionModal';
import InstructorStudentsModal from '../components/instructor/InstructorStudentsModal';
import InstructorCurriculumModal from '../components/instructor/InstructorCurriculumModal';
import { fetchMyBatches } from '../services/instructorService';
import { BookOpen, Search, RefreshCw, Plus, Video, Users, Calendar, AlertCircle } from 'lucide-react';

export default function InstructorDashboard() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('batches'); // 'batches' | 'schedule' | 'students'
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [selectedBatchForSchedule, setSelectedBatchForSchedule] = useState(null);
  const [selectedBatchForStudents, setSelectedBatchForStudents] = useState(null);
  const [selectedBatchForContent, setSelectedBatchForContent] = useState(null);

  const loadBatches = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchMyBatches();
      setBatches(data);
    } catch (err) {
      setError(err.message || 'Failed to load instructor batches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBatches();
  }, []);

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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <InstructorHeader activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Banner Section */}
        <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-emerald-800 rounded-3xl p-6 sm:p-8 text-white shadow-lg mb-8 relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-white/10 to-transparent pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-teal-100 border border-white/20 mb-3">
                <BookOpen className="w-3.5 h-3.5" />
                <span>NSI IT Academic Faculty</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Faculty Teaching Space
              </h1>
              <p className="text-sm text-teal-100 mt-1 max-w-xl">
                Deliver live lectures, manage cohort curricula, review student rosters, and track batch progression.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={loadBatches}
                title="Refresh Batches"
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/20 shadow-xs"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              {batches.length > 0 && (
                <button
                  onClick={() => setSelectedBatchForSchedule(batches[0])}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-teal-900 font-bold text-xs hover:bg-teal-50 transition-all shadow-md active:scale-98"
                >
                  <Plus className="w-4 h-4 text-teal-700" />
                  <span>Schedule Live Session</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats Overview */}
        <InstructorStatsOverview batches={batches} />

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-xs font-semibold text-rose-700 mb-6 shadow-xs">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* TAB 1: BATCHES VIEW */}
        {activeTab === 'batches' && (
          <div>
            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Filter courses or batches..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 shadow-xs focus:outline-hidden focus:ring-2 focus:ring-teal-500 transition-all"
                />
              </div>

              <div className="text-xs font-semibold text-slate-500 self-end sm:self-center">
                Showing {filteredBatches.length} of {batches.length} Assigned Batches
              </div>
            </div>

            {/* Batch Cards Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-64 bg-slate-200/60 animate-pulse rounded-2xl" />
                ))}
              </div>
            ) : filteredBatches.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">No Batches Assigned</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  {searchTerm
                    ? 'No batches match your filter query. Clear search to see all batches.'
                    : 'You currently have no batches assigned by administrator. Check back once courses are scheduled.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBatches.map((batch) => (
                  <InstructorBatchCard
                    key={batch.id}
                    batch={batch}
                    onOpenSchedule={(b) => setSelectedBatchForSchedule(b)}
                    onOpenStudents={(b) => setSelectedBatchForStudents(b)}
                    onOpenContent={(b) => setSelectedBatchForContent(b)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SCHEDULE VIEW */}
        {activeTab === 'schedule' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Live Session Hub</h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Schedule, launch, and host interactive live classes with students
                </p>
              </div>
              {batches.length > 0 && (
                <button
                  onClick={() => setSelectedBatchForSchedule(batches[0])}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition-colors shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Session</span>
                </button>
              )}
            </div>

            {batches.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No active batches assigned</p>
              </div>
            ) : (
              <div className="space-y-4">
                {batches.map((batch) => (
                  <div
                    key={batch.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          {batch.batch_code}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">{batch.name}</h4>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Course: {batch.course?.name} &bull; Mode: {batch.batch_mode} &bull; Schedule: {batch.batch_schedule}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedBatchForContent(batch)}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 shadow-2xs"
                      >
                        View Syllabus
                      </button>
                      <button
                        onClick={() => setSelectedBatchForSchedule(batch)}
                        className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 shadow-xs"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Schedule Session</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: STUDENTS DIRECTORY VIEW */}
        {activeTab === 'students' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Student Cohorts Directory</h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Select a batch cohort to view enrolled learners and contact details
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {batches.map((b) => (
                <div
                  key={b.id}
                  onClick={() => setSelectedBatchForStudents(b)}
                  className="p-5 rounded-2xl border border-slate-200 hover:border-teal-300 hover:shadow-md cursor-pointer transition-all bg-white flex items-center justify-between"
                >
                  <div>
                    <span className="text-[10px] font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                      {b.batch_code}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-1.5">{b.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{b.course?.name}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-lg font-extrabold text-teal-700">
                      {b.student_count || 0}
                    </span>
                    <p className="text-[10px] text-slate-400 font-medium">Students</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* MODALS */}
      {selectedBatchForSchedule && (
        <InstructorScheduleSessionModal
          batch={selectedBatchForSchedule}
          onClose={() => setSelectedBatchForSchedule(null)}
          onSuccess={loadBatches}
        />
      )}

      {selectedBatchForStudents && (
        <InstructorStudentsModal
          batch={selectedBatchForStudents}
          onClose={() => setSelectedBatchForStudents(null)}
        />
      )}

      {selectedBatchForContent && (
        <InstructorCurriculumModal
          batch={selectedBatchForContent}
          onClose={() => setSelectedBatchForContent(null)}
          onScheduleSession={(b) => setSelectedBatchForSchedule(b)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-center text-xs text-slate-500 font-medium">
        &copy; {new Date().getFullYear()} Nityashree Infosystems (NSI IT LMS). All rights reserved.
      </footer>
    </div>
  );
}
