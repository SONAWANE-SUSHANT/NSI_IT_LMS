import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  Award,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  FileQuestion,
  HelpCircle,
  Calendar,
  Eye,
  Check,
  X,
  RefreshCw,
} from 'lucide-react';
import {
  fetchQuizDetails,
  startQuiz,
  fetchAttemptHistory,
} from '../../services/studentQuizService';
import { useStudentPortal } from '../../context/StudentPortalContext';

const ADMIN_PRIMARY = '#3c4cb8';
const ADMIN_LIGHT = '#e7e9fb';
const ADMIN_DARK = '#2e3a8c';

export default function StudentQuizDetailPage({ basePathOverride }) {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { isViewingAsAdmin, baseRoute } = useStudentPortal();
  const basePath = basePathOverride || (isViewingAsAdmin ? baseRoute || '/student' : '/student');

  const [quiz, setQuiz] = useState(null);
  const [pastAttempts, setPastAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [quizData, historyData] = await Promise.all([
        fetchQuizDetails(quizId),
        fetchAttemptHistory(quizId).catch(() => []),
      ]);
      setQuiz(quizData);
      setPastAttempts(historyData || []);
    } catch (err) {
      setError(err.message || 'Failed to load quiz details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (quizId) {
      loadData();
    }
  }, [quizId]);

  const handleStartQuiz = async () => {
    try {
      setStarting(true);
      setError('');
      const startData = await startQuiz(quizId);
      const attemptId = startData.attempt?.id;
      if (!attemptId) {
        throw new Error('Failed to retrieve active attempt ID');
      }
      navigate(`${basePath}/quizzes/${quizId}/attempt/${attemptId}`);
    } catch (err) {
      setError(err.message || 'Unable to start assessment');
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 text-[#3c4cb8] animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Loading quiz overview...</p>
      </div>
    );
  }

  if (error && !quiz) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-2xl border border-rose-200 space-y-4">
        <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
          <AlertCircle className="w-5 h-5" />
          <span>Error loading assessment</span>
        </div>
        <p className="text-xs text-slate-600">{error}</p>
        <button
          onClick={() => navigate(`${basePath}/quizzes`)}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 rounded-xl"
        >
          Back to Assessments
        </button>
      </div>
    );
  }

  const completedAttempts = pastAttempts.filter((a) =>
    ['SUBMITTED', 'AUTO_SUBMITTED'].includes(a.status)
  );
  const activeAttempt = pastAttempts.find((a) => a.status === 'IN_PROGRESS');
  const attemptsLeft = Math.max(0, (quiz?.max_attempts || 1) - completedAttempts.length);
  const canStart = Boolean(activeAttempt || attemptsLeft > 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#ECEEF2] shadow-xs">
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
                Assessment Overview
              </span>
              <span className="text-xs text-slate-400 font-medium">NSI IT LMS</span>
            </div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              {quiz?.title}
            </h1>
          </div>
        </div>

        <button
          onClick={loadData}
          title="Refresh"
          className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-xs font-semibold text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Main Details Card ── */}
      <div className="bg-white rounded-2xl border border-[#ECEEF2] shadow-xs p-6 space-y-6">
        {/* Description & Instructions */}
        <div className="space-y-4">
          {quiz?.description && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Description
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                {quiz.description}
              </p>
            </div>
          )}

          {quiz?.instructions && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Instructions
              </h3>
              <div className="text-xs text-slate-700 leading-relaxed bg-amber-50/50 p-3.5 rounded-xl border border-amber-200/60 whitespace-pre-line">
                {quiz.instructions}
              </div>
            </div>
          )}
        </div>

        {/* Key Metrics Grid */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
            Assessment Details & Passing Criteria
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                <span>Duration</span>
              </div>
              <p className="text-base font-extrabold text-slate-900">
                {quiz?.duration_minutes ? `${quiz.duration_minutes} Mins` : 'Unlimited'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <Award className="w-3.5 h-3.5 text-emerald-500" />
                <span>Total Marks</span>
              </div>
              <p className="text-base font-extrabold text-slate-900">
                {Number(quiz?.total_marks || 0)}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
                <span>Passing Marks</span>
              </div>
              <p className="text-base font-extrabold text-slate-900">
                {quiz?.passing_marks ? Number(quiz.passing_marks) : '—'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <RotateCcw className="w-3.5 h-3.5 text-[#3c4cb8]" />
                <span>Your Attempts</span>
              </div>
              <p className="text-base font-extrabold text-slate-900">
                {completedAttempts.length} / {quiz?.max_attempts}
              </p>
            </div>
          </div>
        </div>

        {/* Schedule window info */}
        {(quiz?.available_from || quiz?.available_until) && (
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            {quiz.available_from && (
              <span>Opens: {new Date(quiz.available_from).toLocaleString()}</span>
            )}
            {quiz.available_until && (
              <span>Closes: {new Date(quiz.available_until).toLocaleString()}</span>
            )}
          </div>
        )}

        {/* Assessment Action Button */}
        <div className="pt-2">
          {activeAttempt ? (
            <button
              type="button"
              onClick={handleStartQuiz}
              disabled={starting}
              className="w-full py-3.5 px-6 rounded-xl text-sm font-bold text-white shadow-md transition-all flex items-center justify-center gap-2 hover:opacity-95"
              style={{ background: '#f59e0b' }}
            >
              {starting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4 fill-current" />
              )}
              <span>Resume In-Progress Assessment (Attempt #{activeAttempt.attempt_number})</span>
            </button>
          ) : canStart ? (
            <button
              type="button"
              onClick={handleStartQuiz}
              disabled={starting}
              className="w-full py-3.5 px-6 rounded-xl text-sm font-bold text-white shadow-md transition-all flex items-center justify-center gap-2 hover:opacity-95"
              style={{ background: ADMIN_PRIMARY }}
            >
              {starting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4 fill-current" />
              )}
              <span>Start Assessment</span>
            </button>
          ) : (
            <div className="p-4 rounded-xl bg-slate-100 text-center text-xs font-bold text-slate-500">
              You have exhausted all allowed attempts ({quiz?.max_attempts}) for this assessment.
            </div>
          )}
        </div>
      </div>

      {/* ── Attempt History Section ── */}
      {pastAttempts.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#ECEEF2] shadow-xs p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">
            My Previous Attempts ({pastAttempts.length})
          </h3>

          <div className="table-container overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-xs text-slate-600">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 font-bold text-slate-700 uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-4">Attempt #</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Status / Result</th>
                  <th className="py-3 px-4">Submitted At</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {pastAttempts.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      Attempt {att.attempt_number}
                    </td>
                    <td className="py-3.5 px-4">
                      {att.score !== null ? (
                        <span className="font-extrabold text-slate-900">
                          {Number(att.score)} / {Number(att.total_marks || quiz?.total_marks || 0)}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {att.status === 'IN_PROGRESS' ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          In Progress
                        </span>
                      ) : att.passed ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Passed
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {att.submitted_at
                        ? new Date(att.submitted_at).toLocaleString()
                        : 'Not yet submitted'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {['SUBMITTED', 'AUTO_SUBMITTED'].includes(att.status) ? (
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`${basePath}/quizzes/${quizId}/results/${att.id}`)
                          }
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-[#3c4cb8] bg-[#e7e9fb] hover:bg-[#d8ddf9] transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Result</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`${basePath}/quizzes/${quizId}/attempt/${att.id}`)
                          }
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 transition-colors"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Resume</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
