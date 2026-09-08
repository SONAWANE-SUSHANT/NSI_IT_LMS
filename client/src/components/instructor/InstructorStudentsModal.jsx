import React, { useState, useEffect } from 'react';
import { X, Users, Mail, Phone, Calendar, User, Search, AlertCircle } from 'lucide-react';
import { fetchBatchStudents } from '../../services/instructorService';

export default function InstructorStudentsModal({ batch, onClose }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!batch) return;
    const loadStudents = async () => {
      try {
        setLoading(true);
        const data = await fetchBatchStudents(batch.id);
        setStudents(data);
      } catch (err) {
        setError(err.message || 'Failed to load students');
      } finally {
        setLoading(false);
      }
    };
    loadStudents();
  }, [batch]);

  const filteredStudents = students.filter((s) => {
    const term = searchTerm.toLowerCase();
    const st = s.student || {};
    const fullName = `${st.first_name || ''} ${st.last_name || ''}`.toLowerCase();
    return (
      fullName.includes(term) ||
      (st.email && st.email.toLowerCase().includes(term)) ||
      (st.username && st.username.toLowerCase().includes(term))
    );
  });

  if (!batch) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden my-8 flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Enrolled Student Cohort</h2>
              <p className="text-xs text-slate-500 font-medium">
                {batch.name} &bull; {batch.batch_code} ({students.length} total)
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

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search students by name, email, or username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Body / Student List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-slate-100 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-10">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No students found</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {searchTerm
                  ? 'Try adjusting your search query'
                  : 'No students have been enrolled into this batch yet.'}
              </p>
            </div>
          ) : (
            filteredStudents.map((enrollment) => {
              const st = enrollment.student || {};
              const fullName = `${st.first_name || ''} ${st.last_name || ''}`.trim() || st.username;
              return (
                <div
                  key={enrollment.id}
                  className="p-3.5 rounded-xl border border-slate-200/80 bg-white hover:border-indigo-200 hover:shadow-xs transition-all flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-700 font-bold text-sm flex items-center justify-center border border-indigo-100 shrink-0">
                      {st.first_name ? st.first_name[0].toUpperCase() : <User className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-900">{fullName}</h4>
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                          @{st.username}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" />
                          {st.email}
                        </span>
                        {st.contact_no && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {st.contact_no}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        enrollment.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {enrollment.status}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 justify-end">
                      <Calendar className="w-3 h-3" />
                      {enrollment.enrollment_date
                        ? new Date(enrollment.enrollment_date).toLocaleDateString()
                        : 'Enrolled'}
                    </p>
                  </div>
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
    </div>
  );
}
