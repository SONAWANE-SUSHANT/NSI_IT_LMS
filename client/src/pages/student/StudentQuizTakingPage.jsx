import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Send,
  Save,
  Check,
  Code2,
  CheckSquare,
  HelpCircle,
  RefreshCw,
  Terminal,
} from 'lucide-react';
import {
  getCurrentAttempt,
  saveAnswer,
  runCode,
  submitQuiz,
} from '../../services/studentQuizService';
import QuizCodeEditor from '../../components/quiz/QuizCodeEditor';
import { useStudentPortal } from '../../context/StudentPortalContext';

const ADMIN_PRIMARY = '#3c4cb8';
const ADMIN_LIGHT = '#e7e9fb';
const ADMIN_DARK = '#2e3a8c';

export default function StudentQuizTakingPage({ basePathOverride }) {
  const { quizId, attemptId } = useParams();
  const navigate = useNavigate();
  const { isViewingAsAdmin, baseRoute } = useStudentPortal();
  const basePath = basePathOverride || (isViewingAsAdmin ? baseRoute || '/student' : '/student');

  const [attemptData, setAttemptData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Local answers state: map of questionId -> { selected_option_id, answer_text, code_submission, isDirty }
  const [answersMap, setAnswersMap] = useState({});
  const [saveStatus, setSaveStatus] = useState({}); // questionId -> 'idle' | 'saving' | 'saved' | 'error'

  // Code runner state: questionId -> { running, result }
  const [codeRunnerState, setCodeRunnerState] = useState({});

  // Countdown Timer
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const [isTimeExpired, setIsTimeExpired] = useState(false);

  // Submit Modal
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load attempt and questions
  const loadAttempt = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getCurrentAttempt(quizId);

      if (!data) {
        throw new Error('No active assessment attempt found. You may have already submitted or expired.');
      }

      // If already submitted/graded
      if (['SUBMITTED', 'AUTO_SUBMITTED'].includes(data.status || data.attempt?.status)) {
        navigate(`${basePath}/quizzes/${quizId}/results/${attemptId || data.id || data.attempt?.id}`);
        return;
      }

      setAttemptData(data);
      const qList = data.questions || [];
      setQuestions(qList);

      // Populate answersMap from saved_answers
      const map = {};
      (data.saved_answers || []).forEach((ans) => {
        map[ans.question_id] = {
          selected_option_id: ans.selected_option_id || null,
          answer_text: ans.answer_text || '',
          code_submission: ans.code_submission || '',
          isDirty: false,
        };
      });

      // Default starter codes for coding questions without saved code
      qList.forEach((q) => {
        if (!map[q.id]) {
          map[q.id] = {
            selected_option_id: null,
            answer_text: '',
            code_submission: q.question_type === 'CODING' ? (q.starter_code || '') : '',
            isDirty: false,
          };
        } else if (q.question_type === 'CODING' && !map[q.id].code_submission) {
          map[q.id].code_submission = q.starter_code || '';
        }
      });

      setAnswersMap(map);

      // Set initial timer seconds
      const seconds = data.attempt?.remaining_seconds;
      if (seconds !== undefined && seconds !== null) {
        setRemainingSeconds(Math.max(0, seconds));
      }
    } catch (err) {
      setError(err.message || 'Failed to load assessment');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttempt();
  }, [quizId]);

  // Timer Countdown Effect
  useEffect(() => {
    if (remainingSeconds === null || remainingSeconds <= 0) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingSeconds]);

  // Auto-submit when time hits 0
  const handleTimeExpire = async () => {
    setIsTimeExpired(true);
    try {
      setSubmitting(true);
      const result = await submitQuiz(attemptId);
      navigate(`${basePath}/quizzes/${quizId}/results/${attemptId}`);
    } catch {
      // Fallback redirect
      navigate(`${basePath}/quizzes/${quizId}/results/${attemptId}`);
    }
  };

  // Format seconds to MM:SS or HH:MM:SS
  const formatTime = (secs) => {
    if (secs === null || secs === undefined) return '--:--';
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const remainingSecs = secs % 60;

    if (hrs > 0) {
      return `${hrs}:${String(mins).padStart(2, '0')}:${String(remainingSecs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(remainingSecs).padStart(2, '0')}`;
  };

  // Current active question
  const currentQuestion = questions[currentIndex] || null;
  const currentAnswer = currentQuestion ? answersMap[currentQuestion.id] : null;

  // Persist current answer to backend
  const persistAnswer = useCallback(
    async (qId, ansData) => {
      if (!qId || !ansData || isTimeExpired) return;

      try {
        setSaveStatus((prev) => ({ ...prev, [qId]: 'saving' }));
        await saveAnswer(attemptId, {
          question_id: qId,
          selected_option_id: ansData.selected_option_id || null,
          answer_text: ansData.answer_text || null,
          code_submission: ansData.code_submission || null,
        });
        setSaveStatus((prev) => ({ ...prev, [qId]: 'saved' }));
        setAnswersMap((prev) => ({
          ...prev,
          [qId]: { ...prev[qId], isDirty: false },
        }));
        setTimeout(() => {
          setSaveStatus((prev) => ({ ...prev, [qId]: 'idle' }));
        }, 2500);
      } catch {
        setSaveStatus((prev) => ({ ...prev, [qId]: 'error' }));
      }
    },
    [attemptId, isTimeExpired]
  );

  // Handle MCQ selection
  const handleOptionSelect = (optId) => {
    if (isTimeExpired || !currentQuestion) return;
    const qId = currentQuestion.id;
    const updated = {
      ...answersMap[qId],
      selected_option_id: optId,
      isDirty: true,
    };
    setAnswersMap((prev) => ({ ...prev, [qId]: updated }));
    persistAnswer(qId, updated);
  };

  // Handle Coding text change
  const handleCodeChange = (newCode) => {
    if (isTimeExpired || !currentQuestion) return;
    const qId = currentQuestion.id;
    const updated = {
      ...answersMap[qId],
      code_submission: newCode,
      isDirty: true,
    };
    setAnswersMap((prev) => ({ ...prev, [qId]: updated }));
  };

  // Manual save for current question
  const handleManualSave = () => {
    if (!currentQuestion) return;
    persistAnswer(currentQuestion.id, answersMap[currentQuestion.id]);
  };

  // Navigate question with autosave of current
  const handleNavigate = (newIndex) => {
    if (newIndex < 0 || newIndex >= questions.length) return;
    if (currentQuestion && answersMap[currentQuestion.id]?.isDirty) {
      persistAnswer(currentQuestion.id, answersMap[currentQuestion.id]);
    }
    setCurrentIndex(newIndex);
  };

  // Run Code via Judge0 API
  const handleRunCode = async () => {
    if (!currentQuestion || isTimeExpired) return;
    const qId = currentQuestion.id;
    const code = answersMap[qId]?.code_submission || '';

    // Automatically persist answer before running
    persistAnswer(qId, answersMap[qId]);

    try {
      setCodeRunnerState((prev) => ({
        ...prev,
        [qId]: { running: true, result: null },
      }));

      const result = await runCode(attemptId, {
        question_id: qId,
        code,
        language: currentQuestion.programming_language || 'python',
      });

      setCodeRunnerState((prev) => ({
        ...prev,
        [qId]: { running: false, result },
      }));
    } catch (err) {
      setCodeRunnerState((prev) => ({
        ...prev,
        [qId]: {
          running: false,
          result: {
            status: 'Execution Error',
            message: err.message || 'Execution failed',
          },
        },
      }));
    }
  };

  // Final Submit Handler
  const handleFinalSubmit = async () => {
    try {
      setSubmitting(true);
      // Ensure current question answer is saved
      if (currentQuestion && answersMap[currentQuestion.id]?.isDirty) {
        await saveAnswer(attemptId, {
          question_id: currentQuestion.id,
          selected_option_id: answersMap[currentQuestion.id].selected_option_id || null,
          code_submission: answersMap[currentQuestion.id].code_submission || null,
        }).catch(() => {});
      }

      await submitQuiz(attemptId);
      setShowSubmitModal(false);
      navigate(`${basePath}/quizzes/${quizId}/results/${attemptId}`);
    } catch (err) {
      alert(err.message || 'Failed to submit quiz');
      setSubmitting(false);
    }
  };

  // Check if a question is answered
  const isQuestionAnswered = (q) => {
    const ans = answersMap[q.id];
    if (!ans) return false;
    if (q.question_type === 'MCQ') {
      return Boolean(ans.selected_option_id);
    }
    if (q.question_type === 'CODING') {
      return Boolean(ans.code_submission && ans.code_submission.trim().length > 0);
    }
    return false;
  };

  const answeredCount = questions.filter(isQuestionAnswered).length;
  const unansweredCount = questions.length - answeredCount;

  if (loading) {
    return (
      <div className="py-24 text-center flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 text-[#3c4cb8] animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Initializing your assessment interface...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto p-6 bg-white rounded-2xl border border-rose-200 space-y-4 text-center">
        <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
        <h3 className="text-sm font-bold text-slate-800">Assessment Error</h3>
        <p className="text-xs text-slate-600">{error}</p>
        <button
          onClick={() => navigate(`${basePath}/quizzes`)}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 rounded-xl"
        >
          Return to Assessments
        </button>
      </div>
    );
  }

  const timerWarning = remainingSeconds !== null && remainingSeconds < 300; // < 5 mins
  const timerCritical = remainingSeconds !== null && remainingSeconds < 60; // < 1 min

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* ── Top Floating Assessment Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#ECEEF2] shadow-sm sticky top-2 z-30">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Assessment in Progress
          </span>
          <h1 className="text-base font-bold text-slate-900 tracking-tight">
            {attemptData?.quiz?.title || 'Production Support Assessment'}
          </h1>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center">
          {/* Real-time Countdown Timer */}
          <div
            className={`px-3.5 py-1.5 rounded-xl border flex items-center gap-2 font-mono text-xs font-bold transition-colors ${
              timerCritical
                ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
                : timerWarning
                ? 'bg-amber-50 border-amber-300 text-amber-800'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <Clock className={`w-4 h-4 ${timerCritical ? 'text-rose-600' : 'text-slate-500'}`} />
            <span>Time Remaining: {formatTime(remainingSeconds)}</span>
          </div>

          {/* Progress Summary Pill */}
          <div className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hidden md:flex items-center gap-1.5">
            <span>Answered:</span>
            <strong className="text-emerald-700">{answeredCount}</strong> / {questions.length}
          </div>

          {/* Submit Button */}
          <button
            type="button"
            onClick={() => setShowSubmitModal(true)}
            disabled={submitting || isTimeExpired}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition-all hover:opacity-95"
            style={{ background: '#10b981' }}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit Quiz</span>
          </button>
        </div>
      </div>

      {/* ── Main Two-Column Assessment Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ── Left Palette: Question Navigation (3 cols) ── */}
        <div className="lg:col-span-3 bg-white p-4 rounded-2xl border border-[#ECEEF2] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Questions ({questions.length})
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">
              {Math.round((answeredCount / Math.max(1, questions.length)) * 100)}% Done
            </span>
          </div>

          {/* Question Grid Buttons */}
          <div className="grid grid-cols-5 gap-2 max-h-[480px] overflow-y-auto p-0.5">
            {questions.map((q, idx) => {
              const isCurrent = idx === currentIndex;
              const isAnswered = isQuestionAnswered(q);

              let btnStyle = 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100';
              if (isCurrent) {
                btnStyle = 'bg-[#3c4cb8] border-[#3c4cb8] text-white shadow-xs font-extrabold ring-2 ring-[#e7e9fb]';
              } else if (isAnswered) {
                btnStyle = 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold';
              }

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => handleNavigate(idx)}
                  className={`h-9 rounded-xl border flex items-center justify-center text-xs transition-all relative ${btnStyle}`}
                  title={`Question ${idx + 1}: ${q.question_type}`}
                >
                  <span>{idx + 1}</span>
                  {isAnswered && !isCurrent && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-500">
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-md bg-[#3c4cb8]" />
              <span>Current Question</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-md bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold flex items-center justify-center text-[9px]">
                ✓
              </div>
              <span>Answered ({answeredCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-md bg-slate-100 border border-slate-200" />
              <span>Unanswered ({unansweredCount})</span>
            </div>
          </div>
        </div>

        {/* ── Center / Right Area: Active Question Canvas (9 cols) ── */}
        <div className="lg:col-span-9 bg-white p-6 rounded-2xl border border-[#ECEEF2] shadow-xs space-y-6">
          {currentQuestion ? (
            <>
              {/* Question Header & Badges */}
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-bold text-slate-400 text-xs uppercase tracking-wider">
                      Question {currentIndex + 1} of {questions.length}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        currentQuestion.question_type === 'CODING'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      }`}
                    >
                      {currentQuestion.question_type === 'CODING'
                        ? `CODING — ${currentQuestion.programming_language || 'Code'}`
                        : 'MCQ'}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500">
                      {Number(currentQuestion.marks)} Marks
                    </span>
                  </div>

                  <h2 className="text-sm md:text-base font-bold text-slate-900 leading-snug">
                    {currentQuestion.question_text}
                  </h2>
                </div>

                {/* Subtle Autosave Indicator */}
                <div className="shrink-0 flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                  {saveStatus[currentQuestion.id] === 'saving' && (
                    <span className="text-slate-400 flex items-center gap-1">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </span>
                  )}
                  {saveStatus[currentQuestion.id] === 'saved' && (
                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      Saved
                    </span>
                  )}
                  {saveStatus[currentQuestion.id] === 'error' && (
                    <span className="text-rose-600 font-semibold">Save failed</span>
                  )}
                </div>
              </div>

              {/* ── MCQ Options View ── */}
              {currentQuestion.question_type === 'MCQ' && (
                <div className="space-y-3 pt-1">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Select the correct answer:
                  </p>
                  <div className="space-y-2.5">
                    {(currentQuestion.options || []).map((opt) => {
                      const isSelected = currentAnswer?.selected_option_id === opt.id;
                      return (
                        <div
                          key={opt.id}
                          onClick={() => handleOptionSelect(opt.id)}
                          className={`p-3.5 rounded-xl border flex items-center gap-3.5 cursor-pointer transition-all ${
                            isSelected
                              ? 'border-[#3c4cb8] bg-[#e7e9fb]/40 ring-1 ring-[#3c4cb8] shadow-2xs'
                              : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                              isSelected
                                ? 'border-[#3c4cb8] bg-[#3c4cb8] text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                          <span className="font-bold text-xs text-slate-700 w-5">
                            {opt.option_label}.
                          </span>
                          <span className="text-xs font-medium text-slate-800 flex-1">
                            {opt.option_text}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Coding Question View ── */}
              {currentQuestion.question_type === 'CODING' && (
                <div className="space-y-4 pt-1">
                  {/* Constraints & hints */}
                  {(currentQuestion.constraints || currentQuestion.expected_output) && (
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                      {currentQuestion.constraints && (
                        <div>
                          <strong className="text-slate-700">Constraints: </strong>
                          <span className="text-slate-600">{currentQuestion.constraints}</span>
                        </div>
                      )}
                      {currentQuestion.expected_output && (
                        <div>
                          <strong className="text-slate-700">Expected Output: </strong>
                          <span className="text-slate-600">{currentQuestion.expected_output}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Code Editor */}
                  <QuizCodeEditor
                    code={currentAnswer?.code_submission || ''}
                    onChange={handleCodeChange}
                    starterCode={currentQuestion.starter_code || ''}
                    language={currentQuestion.programming_language || 'python'}
                    onRun={handleRunCode}
                    running={Boolean(codeRunnerState[currentQuestion.id]?.running)}
                    executionResult={codeRunnerState[currentQuestion.id]?.result}
                    disabled={isTimeExpired}
                  />

                  {/* Save Answer action button for coding */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-400">
                      Run your code to test standard output, then save your solution.
                    </span>
                    <button
                      type="button"
                      onClick={handleManualSave}
                      disabled={isTimeExpired}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Answer</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ── Footer Navigation Bar ── */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => handleNavigate(currentIndex - 1)}
                  disabled={currentIndex === 0}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <div className="flex items-center gap-2">
                  {currentIndex < questions.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => handleNavigate(currentIndex + 1)}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-xs"
                      style={{ background: ADMIN_PRIMARY }}
                    >
                      <span>Save & Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowSubmitModal(true)}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-xs"
                      style={{ background: '#10b981' }}
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Finish & Submit Quiz</span>
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="py-20 text-center text-slate-400">
              <FileQuestion className="w-8 h-8 mx-auto mb-2" />
              <p className="text-xs">No question selected.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Submit Confirmation Modal ── */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-100 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-slate-900">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">Submit Assessment?</h3>
                <p className="text-xs text-slate-500">Review your completion before final submission</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-700">
                <span>Total Questions:</span>
                <span className="font-bold">{questions.length}</span>
              </div>
              <div className="flex items-center justify-between text-emerald-700 font-semibold">
                <span>Answered:</span>
                <span>{answeredCount} / {questions.length}</span>
              </div>
              {unansweredCount > 0 && (
                <div className="flex items-center justify-between text-amber-700 font-semibold">
                  <span>Unanswered Questions:</span>
                  <span>{unansweredCount}</span>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              You will not be able to modify any answers after final submission. Your assessment will be scored immediately.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                disabled={submitting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Return to Test
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={submitting}
                className="px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                style={{ background: '#10b981' }}
              >
                {submitting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>Confirm & Submit</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
