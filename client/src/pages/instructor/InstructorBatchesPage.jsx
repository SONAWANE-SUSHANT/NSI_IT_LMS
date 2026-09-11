import React, { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  Clock,
  Video,
  BookOpen,
  Search,
  RefreshCw,
  Plus,
  Layers,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { fetchMyBatches } from '../../services/instructorService';
import InstructorScheduleSessionModal from '../../components/instructor/InstructorScheduleSessionModal';
import InstructorStudentsModal from '../../components/instructor/InstructorStudentsModal';
import InstructorCurriculumModal from '../../components/instructor/InstructorCurriculumModal';

const ADMIN_PRIMARY = '#3c4cb8';
const ADMIN_LIGHT = '#e7e9fb';
const ADMIN_DARK = '#2e3a8c';

export default function InstructorBatchesPage() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
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
      setError(err.message || 'Failed to load assigned batches');
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
    <div className="space-y-6">
      {/* ── Top Header Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#ECEEF2] shadow-xs">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0"
            style={{ background: ADMIN_PRIMARY }}
          >
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border"
                style={{ background: ADMIN_LIGHT, color: ADMIN_DARK, borderColor: '#c7cef5' }}
              >
                Faculty Workspace
              </span>
              <span className="text-xs text-slate-400 font-medium">NSI IT LMS</span>
            </div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              My Assigned Batches & Student Cohorts
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-center">
          <button
            onClick={loadBatches}
            title="Refresh Batches"
            disabled={loading}
            className="p-2 text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors shadow-2xs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {batches.length > 0 && (
            <button
              onClick={() => setSelectedBatchForSchedule(batches[0])}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-xs"
              style={{ background: ADMIN_PRIMARY }}
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Live Session</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-xs font-semibold text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Search Bar ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search batches by name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 shadow-xs focus:outline-hidden focus:ring-2 focus:ring-[#3c4cb8] transition-all"
          />
        </div>

        <div className="text-xs font-bold text-slate-500 self-end sm:self-center">
          Assigned to {filteredBatches.length} of {batches.length} Batches
        </div>
      </div>

      {/* ── Batch Cards Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-slate-200/60 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : filteredBatches.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#ECEEF2] p-12 text-center shadow-xs">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Batches Assigned</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchTerm
              ? 'No batches match your search filter.'
              : 'You have not been assigned to any course batches yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBatches.map((batch) => {
            const course = batch.course || {};

            return (
              <div
                key={batch.id}
                className="bg-white rounded-2xl border border-[#ECEEF2] shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
              >
                <div className="p-5">
                  {/* Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-md border"
                      style={{
                        background: ADMIN_LIGHT,
                        color: ADMIN_DARK,
                        borderColor: '#c7cef5',
                      }}
                    >
                      {batch.batch_code || `BATCH-${batch.id}`}
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-200">
                      {batch.batch_mode || 'ONLINE'}
                    </span>
                  </div>

                  {/* Course Info */}
                  <div className="mb-2">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      {course.code || 'COURSE'} &bull; {course.duration || 'Flexible'}
                    </p>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5 leading-snug line-clamp-1">
                      {course.name || batch.name}
                    </h3>
                    <p className="text-xs text-slate-600 font-medium mt-1">Batch: {batch.name}</p>
                  </div>

                  {/* Meta details */}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span className="capitalize">
                        {batch.batch_time?.toLowerCase() || 'Morning'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span className="capitalize">
                        {batch.batch_schedule?.toLowerCase() || 'Weekdays'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="font-semibold text-slate-800">
                        {batch.student_count || 0} Students
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="font-semibold text-slate-800">
                        {batch.module_count || 0} Modules
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedBatchForStudents(batch)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors shadow-2xs"
                    >
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      <span>Students ({batch.student_count || 0})</span>
                    </button>
                    <button
                      onClick={() => setSelectedBatchForContent(batch)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors shadow-2xs"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                      <span>Syllabus</span>
                    </button>
                  </div>

                  <button
                    onClick={() => setSelectedBatchForSchedule(batch)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors shadow-xs ml-auto"
                    style={{ background: ADMIN_PRIMARY }}
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Live Class</span>
                    <ChevronRight className="w-3 h-3 ml-0.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── MODALS ── */}
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
    </div>
  );
}
