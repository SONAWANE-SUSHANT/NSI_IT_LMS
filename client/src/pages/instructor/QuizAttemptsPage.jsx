import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  AlertCircle,
  FileQuestion,
  User,
  Check,
  X,
  Code,
  Calendar,
} from 'lucide-react';
import { fetchQuizAttempts, fetchAttemptDetails } from '../../services/quizService';
import { useInstructorPortal } from '../../context/InstructorPortalContext';

const ADMIN_PRIMARY = '#3c4cb8';
const ADMIN_LIGHT = '#e7e9fb';
const ADMIN_DARK = '#2e3a8c';

export default function QuizAttemptsPage({ basePathOverride }) {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { isViewingAsAdmin, baseRoute } = useInstructorPortal();
  const basePath = basePathOverride || (isViewingAsAdmin ? baseRoute || '/instructor' : '/instructor');

  const [attemptsData, setAttemptsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected attempt detail modal state
  const [selectedAttemptId, setSelectedAttemptId] = useState(null);
  const [attemptDetail, setAttemptDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState('');

  const loadAttempts = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchQuizAttempts(quizId);
      setAttemptsData(data);
    } catch (err) {
      setError(err.message || 'Failed to load quiz attempts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (quizId) {
      loadAttempts();
    }
  }, [quizId]);

  const openAttemptModal = async (attemptId) => {
    setSelectedAttemptId(attemptId);
    setLoadingDetail(true);
    setDetailError('');
    try {
      const data = await fetchAttemptDetails(attemptId);
      setAttemptDetail(data);
    } catch (err) {
      setDetailError(err.message || 'Failed to fetch attempt details');
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeAttemptModal = () => {
    setSelectedAttemptId(null);
    setAttemptDetail(null);
    setDetailError('');
  };

  const quiz = attemptsData?.quiz;
  const attempts = attemptsData?.attempts || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#ECEEF2] shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(`${basePath}/quizzes`)}
            className="p-2 text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
            title="Back to Quizzes List"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span
                className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border"
                style={{ background: ADMIN_LIGHT, color: ADMIN_DARK, borderColor: '#c7cef5' }}
              >
                Attempts & Submissions
              </span>
              <span className="text-xs text-slate-400 font-medium">Evaluation Workspace</span>
            </div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              {quiz?.title || 'Quiz Submissions'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-center">
          <button
            onClick={loadAttempts}
            title="Refresh Attempts"
            disabled={loading}
            className="p-2 text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => navigate(`${basePath}/quizzes/builder/${quizId}`)}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
          >
            Edit Assessment
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-xs font-semibold text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#ECEEF2] shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#3c4cb8] flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase text-slate-400">Total Attempts</p>
            <p className="text-lg font-extrabold text-slate-900">{attempts.length}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#ECEEF2] shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase text-slate-400">Passed Students</p>
            <p className="text-lg font-extrabold text-emerald-700">
              {attempts.filter((a) => a.passed).length}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#ECEEF2] shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase text-slate-400">Failed / Incomplete</p>
            <p className="text-lg font-extrabold text-rose-700">
              {attempts.filter((a) => !a.passed && ['SUBMITTED', 'AUTO_SUBMITTED'].includes(a.status)).length}
            </p>
          </div>
        </div>
      </div>

      {/* ── Attempts Table ── */}
      <div className="bg-white rounded-2xl border border-[#ECEEF2] shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 text-[#3c4cb8] animate-spin" />
            <p className="text-xs font-semibold text-slate-500">Loading student submissions...</p>
          </div>
        ) : attempts.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-2 px-4">
            <FileQuestion className="w-8 h-8 text-slate-300" />
            <h3 className="text-sm font-bold text-slate-800">No attempts yet</h3>
            <p className="text-xs text-slate-400 max-w-sm">
              Students who start or complete this quiz will appear here with their detailed scores.
            </p>
          </div>
        ) : (
          <div className="table-container overflow-x-auto">
            <table className="w-full min-w-[660px] text-left text-xs text-slate-600 border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 font-bold text-slate-700 uppercase text-[11px] tracking-wider">
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Attempt #</th>
                  <th className="py-3.5 px-4">Score</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Submitted At</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {attempts.map((att) => {
                  const student = att.student;
                  const fullName = student
                    ? `${student.first_name || ''} ${student.last_name || ''}`.trim() || student.username
                    : 'Unknown Student';
                  const initials = `${student?.first_name?.[0] || ''}${student?.last_name?.[0] || ''}`.toUpperCase() || 'S';

                  return (
                    <tr key={att.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0"
                            style={{ background: ADMIN_LIGHT, color: ADMIN_PRIMARY }}
                          >
                            {initials}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 text-xs block">
                              {fullName}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {student?.email || `@${student?.username}`}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        Attempt {att.attempt_number}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 text-[13px]">
                          {att.score !== null ? Number(att.score) : 0}
                        </span>
                        <span className="text-slate-400"> / {Number(att.total_marks || quiz?.total_marks || 0)}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        {att.status === 'IN_PROGRESS' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3" />
                            In Progress
                          </span>
                        ) : att.passed ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Passed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3 h-3" />
                            Failed
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {att.submitted_at
                          ? new Date(att.submitted_at).toLocaleString()
                          : att.started_at
                          ? `Started: ${new Date(att.started_at).toLocaleTimeString()}`
                          : '—'}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => openAttemptModal(att.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-[#3c4cb8] bg-slate-100 hover:bg-slate-200 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Attempt Details Modal ── */}
      {selectedAttemptId && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] border border-slate-100 shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Attempt Review & Answer Breakdown
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Student submission evaluation for {attemptDetail?.quiz?.title || quiz?.title}
                </p>
              </div>
              <button
                onClick={closeAttemptModal}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {loadingDetail ? (
                <div className="py-16 text-center flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-6 h-6 text-[#3c4cb8] animate-spin" />
                  <p className="text-xs font-semibold text-slate-500">Loading student answers...</p>
                </div>
              ) : detailError ? (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                  {detailError}
                </div>
              ) : attemptDetail ? (
                <>
                  {/* Student & Score Banner */}
                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          {attemptDetail.student?.first_name} {attemptDetail.student?.last_name}
                        </span>
                        <span className="text-xs text-slate-400">
                          (@{attemptDetail.student?.username})
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Attempt #{attemptDetail.attempt_number} • Submitted{' '}
                        {attemptDetail.submitted_at
                          ? new Date(attemptDetail.submitted_at).toLocaleString()
                          : 'In Progress'}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block font-medium">Final Score</span>
                        <span className="text-xl font-extrabold text-slate-900">
                          {Number(attemptDetail.score || 0)} / {Number(attemptDetail.total_marks || 0)}
                        </span>
                      </div>
                      <div>
                        {attemptDetail.passed ? (
                          <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            PASSED
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-xl text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            FAILED
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Question-by-Question breakdown */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Detailed Answers Breakdown
                    </h4>

                    {(attemptDetail.quiz?.questions || []).map((q, idx) => {
                      const answer = (attemptDetail.answers || []).find((a) => a.question_id === q.id);
                      const isCorrect = Boolean(answer?.is_correct);
                      const marksAwarded = answer?.marks_awarded !== null ? Number(answer?.marks_awarded) : 0;

                      return (
                        <div
                          key={q.id}
                          className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 shadow-2xs"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <span className="text-xs font-bold text-slate-900">
                                {q.question_text}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs font-bold text-slate-700">
                                {marksAwarded} / {Number(q.marks)} Marks
                              </span>
                              {isCorrect ? (
                                <span className="p-1 rounded bg-emerald-50 text-emerald-600">
                                  <Check className="w-3.5 h-3.5" />
                                </span>
                              ) : (
                                <span className="p-1 rounded bg-rose-50 text-rose-600">
                                  <X className="w-3.5 h-3.5" />
                                </span>
                              )}
                            </div>
                          </div>

                          {/* MCQ Answer View */}
                          {q.question_type === 'MCQ' && (
                            <div className="space-y-1.5 pt-1">
                              {(q.options || []).map((opt) => {
                                const isStudentSelection = answer?.selected_option_id === opt.id;
                                const isOfficialCorrect = opt.is_correct;

                                let itemStyle = 'border-slate-100 bg-slate-50/50 text-slate-600';
                                if (isStudentSelection && isOfficialCorrect) {
                                  itemStyle = 'border-emerald-300 bg-emerald-50 text-emerald-900 font-bold';
                                } else if (isStudentSelection && !isOfficialCorrect) {
                                  itemStyle = 'border-rose-300 bg-rose-50 text-rose-900 font-bold';
                                } else if (isOfficialCorrect) {
                                  itemStyle = 'border-emerald-200 bg-emerald-50/60 text-emerald-800 font-semibold';
                                }

                                return (
                                  <div
                                    key={opt.id}
                                    className={`px-3 py-2 rounded-xl border text-xs flex items-center justify-between ${itemStyle}`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold">{opt.option_label}.</span>
                                      <span>{opt.option_text}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-[11px]">
                                      {isStudentSelection && (
                                        <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold mr-1">
                                          Student Answer
                                        </span>
                                      )}
                                      {isOfficialCorrect && (
                                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                                          <Check className="w-3 h-3" /> Correct Key
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Coding Answer View */}
                          {q.question_type === 'CODING' && (
                            <div className="space-y-2 pt-1">
                              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                Submitted Code ({q.programming_language || 'code'}):
                              </div>
                              <pre className="p-3.5 rounded-xl bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed">
                                {answer?.code_submission || '# No code submitted'}
                              </pre>
                            </div>
                          )}

                          {/* Explanation */}
                          {q.explanation && (
                            <div className="p-2.5 rounded-lg bg-indigo-50/50 border border-indigo-100 text-[11px] text-indigo-900">
                              <span className="font-bold block mb-0.5">Explanation:</span>
                              {q.explanation}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex justify-end">
              <button
                type="button"
                onClick={closeAttemptModal}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
