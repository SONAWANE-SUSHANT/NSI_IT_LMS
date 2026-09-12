import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  BookOpen,
} from 'lucide-react';
import { fetchAttemptResult } from '../../services/studentQuizService';
import { useStudentPortal } from '../../context/StudentPortalContext';

const ADMIN_PRIMARY = '#3c4cb8';
const ADMIN_LIGHT = '#e7e9fb';
const ADMIN_DARK = '#2e3a8c';

export default function StudentQuizResultPage({ basePathOverride }) {
  const { quizId, attemptId } = useParams();
  const navigate = useNavigate();
  const { isViewingAsAdmin, baseRoute } = useStudentPortal();
  const basePath = basePathOverride || (isViewingAsAdmin ? baseRoute || '/student' : '/student');

  const [resultData, setResultData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showReview, setShowReview] = useState(false);

  const loadResult = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchAttemptResult(attemptId);
      setResultData(data);
    } catch (err) {
      setError(err.message || 'Failed to load assessment result');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (attemptId) {
      loadResult();
    }
  }, [attemptId]);

  if (loading) {
    return (
      <div className="py-24 text-center flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 text-[#3c4cb8] animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Calculating your official score and compiling feedback...</p>
      </div>
    );
  }

  if (error || !resultData) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-2xl border border-rose-200 space-y-4 text-center">
        <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
        <h3 className="text-sm font-bold text-slate-800">Result Error</h3>
        <p className="text-xs text-slate-600">{error || 'Could not load quiz result'}</p>
        <button
          onClick={() => navigate(`${basePath}/quizzes`)}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 rounded-xl"
        >
          Return to Quizzes
        </button>
      </div>
    );
  }

  const attempt = resultData.attempt || {};
  const rawQuestions = resultData.breakdown || resultData.questions || [];
  const questions = rawQuestions.map((q) => ({
    id: q.question_id || q.id,
    question_type: q.question_type,
    question_text: q.question_text,
    marks: q.marks,
    explanation: q.explanation,
    options: q.options || [],
    selected_option_id: q.student_answer?.selected_option_id || q.selected_option_id,
    code_submission: q.student_answer?.code_submission || q.code_submission,
    marks_awarded: q.student_answer?.marks_awarded ?? q.marks_awarded,
    is_correct: q.student_answer?.is_correct ?? q.is_correct,
  }));

  const score = Number(attempt.score || 0);
  const totalMarks = Number(attempt.total_marks || 0);
  const passed = Boolean(attempt.passed);
  const correctCount = questions.filter((q) => q.is_correct).length;
  const incorrectCount = questions.length - correctCount;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* ── Top Navigation Bar ── */}
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
            <span
              className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border"
              style={{ background: ADMIN_LIGHT, color: ADMIN_DARK, borderColor: '#c7cef5' }}
            >
              Performance Summary
            </span>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              Assessment Report
            </h1>
          </div>
        </div>

        <button
          onClick={() => navigate(`${basePath}/quizzes`)}
          className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
        >
          Back to Quizzes
        </button>
      </div>

      {/* ── Hero Result Card ── */}
      <div className="bg-white rounded-2xl border border-[#ECEEF2] shadow-sm p-8 text-center space-y-6 relative overflow-hidden">
        {/* Pass/Fail top indicator bar */}
        <div
          className={`absolute top-0 left-0 right-0 h-1.5 ${
            passed ? 'bg-emerald-500' : 'bg-rose-500'
          }`}
        />

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Official Evaluation
          </span>
          <h2 className="text-xl font-bold text-slate-800">Quiz Completed</h2>
        </div>

        {/* Score Hero */}
        <div className="py-2">
          <div className="text-5xl font-extrabold text-slate-900 tracking-tight">
            {score} <span className="text-2xl font-bold text-slate-400">/ {totalMarks}</span>
          </div>

          <div className="mt-3">
            {passed ? (
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <CheckCircle2 className="w-4 h-4" />
                PASSED
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
                <XCircle className="w-4 h-4" />
                FAILED
              </span>
            )}
          </div>
        </div>

        {/* Breakdown Metric Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto pt-2">
          <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
            <span className="text-[11px] font-bold text-emerald-700 uppercase block">Correct</span>
            <span className="text-xl font-extrabold text-emerald-800">
              {correctCount}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-100">
            <span className="text-[11px] font-bold text-rose-700 uppercase block">Incorrect</span>
            <span className="text-xl font-extrabold text-rose-800">
              {incorrectCount}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-bold text-slate-500 uppercase block">Attempt</span>
            <span className="text-xl font-extrabold text-slate-800">
              #{attempt.attempt_number || 1}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-bold text-slate-500 uppercase block">Passing Mark</span>
            <span className="text-xl font-extrabold text-slate-800">
              {attempt.passing_marks ? Number(attempt.passing_marks) : '—'}
            </span>
          </div>
        </div>

        {/* Timestamp */}
        {attempt.submitted_at && (
          <p className="text-xs text-slate-400">
            Submitted: {new Date(attempt.submitted_at).toLocaleString()}
          </p>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => setShowReview(!showReview)}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-xs transition-all hover:opacity-95"
            style={{ background: ADMIN_PRIMARY }}
          >
            <BookOpen className="w-4 h-4" />
            <span>{showReview ? 'Hide Answer Details' : 'View Answer Details'}</span>
            {showReview ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => navigate(`${basePath}/quizzes`)}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            Back to Assessments
          </button>
        </div>
      </div>

      {/* ── Detailed Question-by-Question Review ── */}
      {showReview && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Question Review & Explanations ({questions.length})
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Review correct solutions and official explanations
            </span>
          </div>

          <div className="space-y-4">
            {questions.map((q, idx) => {
              const isCorrect = Boolean(q.is_correct);
              const marksAwarded = q.marks_awarded !== null ? Number(q.marks_awarded) : 0;

              return (
                <div
                  key={q.id}
                  className={`p-5 rounded-2xl border bg-white space-y-4 shadow-2xs ${
                    isCorrect ? 'border-emerald-200/80' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                              q.question_type === 'CODING'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            }`}
                          >
                            {q.question_type}
                          </span>
                          <span className="text-xs font-semibold text-slate-500">
                            {marksAwarded} / {Number(q.marks)} Marks
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 leading-snug">
                          {q.question_text}
                        </h4>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isCorrect ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Check className="w-3.5 h-3.5" /> Correct
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <X className="w-3.5 h-3.5" /> Incorrect
                        </span>
                      )}
                    </div>
                  </div>

                  {/* MCQ Options Display */}
                  {q.question_type === 'MCQ' && (
                    <div className="space-y-2 pt-1">
                      {(q.options || []).map((opt) => {
                        const isStudentChoice = opt.is_student_selection || opt.id === q.selected_option_id;
                        const isCorrectKey = Boolean(opt.is_correct);

                        let cardStyle = 'border-slate-100 bg-slate-50/60 text-slate-700';
                        if (isStudentChoice && isCorrectKey) {
                          cardStyle = 'border-emerald-300 bg-emerald-50 text-emerald-900 font-bold';
                        } else if (isStudentChoice && !isCorrectKey) {
                          cardStyle = 'border-rose-300 bg-rose-50 text-rose-900 font-bold';
                        } else if (isCorrectKey) {
                          cardStyle = 'border-emerald-300 bg-emerald-50/50 text-emerald-800 font-semibold';
                        }

                        return (
                          <div
                            key={opt.id}
                            className={`px-3.5 py-2.5 rounded-xl border text-xs flex items-center justify-between ${cardStyle}`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="font-bold w-5">{opt.option_label}.</span>
                              <span>{opt.option_text}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px]">
                              {isStudentChoice && (
                                <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-800 font-semibold">
                                  Your Choice
                                </span>
                              )}
                              {isCorrectKey && (
                                <span className="text-emerald-700 font-bold flex items-center gap-1">
                                  <Check className="w-3.5 h-3.5" /> Correct Answer
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Coding Answer Display */}
                  {q.question_type === 'CODING' && (
                    <div className="space-y-2 pt-1">
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Your Submitted Solution:
                      </div>
                      <pre className="p-3.5 rounded-xl bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed">
                        {q.code_submission || '# No solution submitted'}
                      </pre>
                    </div>
                  )}

                  {/* Official Explanation Box */}
                  {q.explanation && (
                    <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs text-indigo-950 space-y-1">
                      <span className="font-bold text-indigo-900 block">Explanation:</span>
                      <p className="leading-relaxed">{q.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
