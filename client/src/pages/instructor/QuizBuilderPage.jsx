import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  CheckCircle,
  Plus,
  Trash2,
  Edit2,
  ChevronUp,
  ChevronDown,
  Code2,
  CheckSquare,
  Clock,
  Award,
  AlertCircle,
  Settings,
  RefreshCw,
  Terminal,
  HelpCircle,
  Check,
} from 'lucide-react';
import {
  fetchQuizById,
  updateQuiz,
  publishQuiz,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  reorderQuestions,
  addOption,
  updateOption,
  deleteOption,
  fetchSupportedLanguages,
} from '../../services/quizService';
import { useInstructorPortal } from '../../context/InstructorPortalContext';

const ADMIN_PRIMARY = '#3c4cb8';
const ADMIN_LIGHT = '#e7e9fb';
const ADMIN_DARK = '#2e3a8c';

export default function QuizBuilderPage({ basePathOverride }) {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { isViewingAsAdmin, baseRoute } = useInstructorPortal();
  const basePath = basePathOverride || (isViewingAsAdmin ? baseRoute || '/instructor' : '/instructor');

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [supportedLanguages, setSupportedLanguages] = useState([]);

  // Quiz Settings Modal
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    title: '',
    description: '',
    instructions: '',
    duration_minutes: 30,
    passing_marks: 25,
    max_attempts: 1,
    available_from: '',
    available_until: '',
  });

  // Question Form State
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [questionType, setQuestionType] = useState('MCQ');
  const [questionText, setQuestionText] = useState('');
  const [questionMarks, setQuestionMarks] = useState(5);
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [explanation, setExplanation] = useState('');

  // MCQ specific state
  const [mcqOptions, setMcqOptions] = useState([
    { label: 'A', text: '', is_correct: true },
    { label: 'B', text: '', is_correct: false },
    { label: 'C', text: '', is_correct: false },
    { label: 'D', text: '', is_correct: false },
  ]);

  // Coding specific state
  const [programmingLanguage, setProgrammingLanguage] = useState('python');
  const [starterCode, setStarterCode] = useState('def solution():\n    # Write your solution here\n    pass');
  const [constraints, setConstraints] = useState('');
  const [expectedOutput, setExpectedOutput] = useState('');

  const [savingQuestion, setSavingQuestion] = useState(false);
  const [questionError, setQuestionError] = useState('');

  const loadQuiz = async () => {
    try {
      setLoading(true);
      setError('');
      const [quizData, langData] = await Promise.all([
        fetchQuizById(quizId),
        fetchSupportedLanguages().catch(() => null),
      ]);
      setQuiz(quizData);
      if (langData?.supported_languages) {
        setSupportedLanguages(langData.supported_languages);
      }
      setSettingsForm({
        title: quizData.title || '',
        description: quizData.description || '',
        instructions: quizData.instructions || '',
        duration_minutes: quizData.duration_minutes || '',
        passing_marks: quizData.passing_marks || '',
        max_attempts: quizData.max_attempts || 1,
        available_from: quizData.available_from ? quizData.available_from.substring(0, 16) : '',
        available_until: quizData.available_until ? quizData.available_until.substring(0, 16) : '',
      });
    } catch (err) {
      setError(err.message || 'Failed to load quiz');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (quizId) {
      loadQuiz();
    }
  }, [quizId]);

  // Reset question form
  const resetQuestionForm = () => {
    setEditingQuestionId(null);
    setQuestionType('MCQ');
    setQuestionText('');
    setQuestionMarks(5);
    setDifficulty('MEDIUM');
    setExplanation('');
    setMcqOptions([
      { label: 'A', text: '', is_correct: true },
      { label: 'B', text: '', is_correct: false },
      { label: 'C', text: '', is_correct: false },
      { label: 'D', text: '', is_correct: false },
    ]);
    setProgrammingLanguage(supportedLanguages[0]?.key || 'python');
    setStarterCode('def solution():\n    # Write your solution here\n    pass');
    setConstraints('');
    setExpectedOutput('');
    setQuestionError('');
  };

  // Load question into form for editing
  const handleEditQuestion = (q) => {
    setEditingQuestionId(q.id);
    setQuestionType(q.question_type);
    setQuestionText(q.question_text || '');
    setQuestionMarks(Number(q.marks) || 1);
    setDifficulty(q.difficulty || 'MEDIUM');
    setExplanation(q.explanation || '');

    if (q.question_type === 'MCQ') {
      const existingOptions = (q.options || []).map((opt) => ({
        id: opt.id,
        label: opt.option_label,
        text: opt.option_text,
        is_correct: Boolean(opt.is_correct),
      }));

      // Ensure at least 4 options A, B, C, D
      const labels = ['A', 'B', 'C', 'D'];
      const merged = labels.map((lbl, idx) => {
        const found = existingOptions.find((o) => o.label === lbl) || existingOptions[idx];
        if (found) return found;
        return { label: lbl, text: '', is_correct: false };
      });
      setMcqOptions(merged);
    } else {
      setProgrammingLanguage(q.programming_language || 'python');
      setStarterCode(q.starter_code || '');
      setConstraints(q.constraints || '');
      setExpectedOutput(q.expected_output || '');
    }

    // Scroll smoothly to question builder
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Save question handler
  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    setQuestionError('');

    if (!questionText.trim()) {
      setQuestionError('Question text cannot be empty');
      return;
    }
    if (Number(questionMarks) <= 0) {
      setQuestionError('Marks must be greater than 0');
      return;
    }

    if (questionType === 'MCQ') {
      const validOptions = mcqOptions.filter((opt) => opt.text.trim());
      if (validOptions.length < 2) {
        setQuestionError('MCQ questions require at least 2 non-empty options');
        return;
      }
      const hasCorrect = validOptions.some((opt) => opt.is_correct);
      if (!hasCorrect) {
        setQuestionError('Please mark at least one option as the correct answer');
        return;
      }
    }

    try {
      setSavingQuestion(true);

      const questionPayload = {
        question_type: questionType,
        question_text: questionText.trim(),
        marks: Number(questionMarks),
        difficulty,
        explanation: explanation?.trim() || null,
        programming_language: questionType === 'CODING' ? programmingLanguage : null,
        starter_code: questionType === 'CODING' ? starterCode : null,
        constraints: questionType === 'CODING' ? constraints?.trim() || null : null,
        expected_output: questionType === 'CODING' ? expectedOutput?.trim() || null : null,
      };

      if (editingQuestionId) {
        // Update question
        await updateQuestion(editingQuestionId, questionPayload);

        // Update MCQ options
        if (questionType === 'MCQ') {
          const currentQuestion = (quiz.questions || []).find((q) => q.id === editingQuestionId);
          const existingMap = new Map((currentQuestion?.options || []).map((o) => [o.id, o]));

          for (const opt of mcqOptions) {
            if (!opt.text.trim()) continue;
            if (opt.id && existingMap.has(opt.id)) {
              await updateOption(opt.id, {
                option_label: opt.label,
                option_text: opt.text.trim(),
                is_correct: opt.is_correct,
              });
            } else {
              await addOption(editingQuestionId, {
                option_label: opt.label,
                option_text: opt.text.trim(),
                is_correct: opt.is_correct,
              });
            }
          }
        }
        setActionSuccess('Question updated successfully!');
      } else {
        // Create question
        const createdQ = await addQuestion(quizId, questionPayload);

        // Add options if MCQ
        if (questionType === 'MCQ') {
          for (let i = 0; i < mcqOptions.length; i++) {
            const opt = mcqOptions[i];
            if (!opt.text.trim()) continue;
            await addOption(createdQ.id, {
              option_label: opt.label,
              option_text: opt.text.trim(),
              is_correct: opt.is_correct,
              display_order: i + 1,
            });
          }
        }
        setActionSuccess('Question saved and added to assessment!');
      }

      resetQuestionForm();
      await loadQuiz();
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err) {
      setQuestionError(err.message || 'Failed to save question');
    } finally {
      setSavingQuestion(false);
    }
  };

  // Delete question handler
  const handleDeleteQuestion = async (qId) => {
    if (!window.confirm('Delete this question from the quiz?')) return;
    try {
      await deleteQuestion(qId);
      if (editingQuestionId === qId) resetQuestionForm();
      await loadQuiz();
    } catch (err) {
      alert(err.message || 'Failed to delete question');
    }
  };

  // Reorder questions
  const handleMoveQuestion = async (index, direction) => {
    const questions = [...(quiz.questions || [])];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= questions.length) return;

    const temp = questions[index];
    questions[index] = questions[targetIndex];
    questions[targetIndex] = temp;

    const orderList = questions.map((q, idx) => ({
      id: q.id,
      display_order: idx + 1,
    }));

    try {
      await reorderQuestions(quizId, orderList);
      await loadQuiz();
    } catch (err) {
      alert(err.message || 'Failed to reorder questions');
    }
  };

  // Publish Quiz
  const handlePublishQuiz = async () => {
    try {
      await publishQuiz(quizId);
      setActionSuccess('Quiz successfully verified and published!');
      await loadQuiz();
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err) {
      alert(err.message || 'Failed to publish quiz');
    }
  };

  // Update Quiz Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await updateQuiz(quizId, {
        ...settingsForm,
        duration_minutes: settingsForm.duration_minutes ? Number(settingsForm.duration_minutes) : null,
        passing_marks: settingsForm.passing_marks ? Number(settingsForm.passing_marks) : null,
        max_attempts: Number(settingsForm.max_attempts) || 1,
        available_from: settingsForm.available_from || null,
        available_until: settingsForm.available_until || null,
      });
      setShowSettingsModal(false);
      setActionSuccess('Quiz settings updated!');
      await loadQuiz();
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err) {
      alert(err.message || 'Failed to update quiz settings');
    }
  };

  if (loading && !quiz) {
    return (
      <div className="py-24 text-center flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 text-[#3c4cb8] animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Loading quiz builder workspace...</p>
      </div>
    );
  }

  const questionsList = quiz?.questions || [];
  const totalCalculatedMarks = questionsList.reduce((sum, q) => sum + Number(q.marks || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ── Top Navigation / Control Bar ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#ECEEF2] shadow-xs">
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
                {quiz?.status || 'DRAFT'}
              </span>
              <span className="text-xs text-slate-500 font-semibold">
                {quiz?.course?.name || quiz?.module?.course?.name
                  ? `${quiz.course?.name || quiz.module?.course?.name} • ${quiz.module?.name || quiz.session?.title || 'Module Assessment'}`
                  : quiz?.session?.title || quiz?.module?.name || 'Assessment'}
              </span>
            </div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              {quiz?.title}
              <button
                type="button"
                onClick={() => setShowSettingsModal(true)}
                className="p-1 text-slate-400 hover:text-[#3c4cb8] rounded-md hover:bg-slate-100 transition-colors"
                title="Edit Quiz Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </h1>
          </div>
        </div>

        {/* Action Buttons & Badges */}
        <div className="flex items-center gap-3 self-end md:self-center flex-wrap">
          {/* Total Marks Pill */}
          <div className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-[#3c4cb8]" />
            <span>Total Marks: {totalCalculatedMarks}</span>
          </div>

          {/* Attempts view link */}
          <button
            type="button"
            onClick={() => navigate(`${basePath}/quizzes/${quiz.id}/attempts`)}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
          >
            View Student Attempts
          </button>

          {/* Publish button */}
          {quiz?.status !== 'PUBLISHED' ? (
            <button
              type="button"
              onClick={handlePublishQuiz}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition-all hover:opacity-95"
              style={{ background: '#10b981' }}
            >
              <CheckCircle className="w-4 h-4" />
              <span>Publish Quiz</span>
            </button>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200">
              <CheckCircle className="w-4 h-4" />
              <span>Live / Published</span>
            </span>
          )}
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs font-semibold text-emerald-800 animate-in fade-in">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-xs font-semibold text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Two-Column Main Builder Area ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── Left Column: Question Builder Form (7 cols) ── */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-[#ECEEF2] shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 font-bold text-xs"
                style={{ background: ADMIN_PRIMARY }}
              >
                {editingQuestionId ? '✎' : '+'}
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  {editingQuestionId ? 'Edit Question' : 'Add New Question'}
                </h2>
                <p className="text-[11px] text-slate-400">
                  Select question type, marks, difficulty, and answer criteria
                </p>
              </div>
            </div>

            {editingQuestionId && (
              <button
                type="button"
                onClick={resetQuestionForm}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSaveQuestion} className="space-y-4">
            {questionError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-medium text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{questionError}</span>
              </div>
            )}

            {/* Question Type Switcher */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Question Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setQuestionType('MCQ')}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition-all ${
                    questionType === 'MCQ'
                      ? 'border-[#3c4cb8] bg-[#e7e9fb] text-[#2e3a8c] shadow-2xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <CheckSquare className="w-4 h-4" />
                  <span>Multiple Choice (MCQ)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setQuestionType('CODING')}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition-all ${
                    questionType === 'CODING'
                      ? 'border-[#3c4cb8] bg-[#e7e9fb] text-[#2e3a8c] shadow-2xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Code2 className="w-4 h-4" />
                  <span>Coding Assessment</span>
                </button>
              </div>
            </div>

            {/* Question Text */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Question Prompt / Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                placeholder={
                  questionType === 'MCQ'
                    ? 'e.g. Which command is used to inspect disk space utilization in Linux?'
                    : 'e.g. Write a script to find all .log files in /var/log modified in the last 24 hours.'
                }
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#3c4cb8]"
                required
              />
            </div>

            {/* Marks and Difficulty */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Marks</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={questionMarks}
                  onChange={(e) => setQuestionMarks(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#3c4cb8]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-[#3c4cb8]"
                >
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </div>
            </div>

            {/* ── MCQ Options Section ── */}
            {questionType === 'MCQ' && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    Answer Options & Correct Key <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">Select the radio button for the correct answer</span>
                </div>

                <div className="space-y-2.5">
                  {mcqOptions.map((opt, idx) => (
                    <div
                      key={opt.label}
                      className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all ${
                        opt.is_correct
                          ? 'border-emerald-500 bg-emerald-50/40'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="correct_option_radio"
                        checked={opt.is_correct}
                        onChange={() => {
                          setMcqOptions((prev) =>
                            prev.map((o, i) => ({ ...o, is_correct: i === idx }))
                          );
                        }}
                        className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer ml-1"
                        title="Mark as correct answer"
                      />
                      <span className="w-6 text-center font-bold text-xs text-slate-700">
                        {opt.label}
                      </span>
                      <input
                        type="text"
                        placeholder={`Option ${opt.label} text...`}
                        value={opt.text}
                        onChange={(e) => {
                          const val = e.target.value;
                          setMcqOptions((prev) =>
                            prev.map((o, i) => (i === idx ? { ...o, text: val } : o))
                          );
                        }}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#3c4cb8]"
                      />
                      {opt.is_correct && (
                        <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 pr-2">
                          <Check className="w-3.5 h-3.5" /> Correct
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Coding Question Section ── */}
            {questionType === 'CODING' && (
              <div className="space-y-3 pt-2">
                {/* Language selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Programming Language <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={programmingLanguage}
                    onChange={(e) => setProgrammingLanguage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:border-[#3c4cb8]"
                  >
                    {supportedLanguages.length > 0 ? (
                      supportedLanguages.map((lang) => (
                        <option key={lang.key} value={lang.key}>
                          {lang.name}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="python">Python (3.8.1)</option>
                        <option value="bash">Bash (5.0.0)</option>
                        <option value="javascript">JavaScript (Node.js)</option>
                        <option value="java">Java (OpenJDK 13)</option>
                        <option value="c">C (GCC 9.2)</option>
                        <option value="cpp">C++ (GCC 9.2)</option>
                        <option value="go">Go (1.13)</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Starter Code */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Starter Code Template</label>
                  <textarea
                    rows={4}
                    value={starterCode}
                    onChange={(e) => setStarterCode(e.target.value)}
                    spellCheck="false"
                    className="w-full p-3 rounded-xl border border-slate-700 bg-slate-950 text-slate-100 font-mono text-xs leading-relaxed focus:outline-none"
                    placeholder="def solution():&#10;    # Starter code"
                  />
                </div>

                {/* Constraints */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Constraints</label>
                  <input
                    type="text"
                    placeholder="e.g. Must execute in < 2 seconds, no external libraries"
                    value={constraints}
                    onChange={(e) => setConstraints(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#3c4cb8]"
                  />
                </div>

                {/* Expected Output */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Expected Output / Test Case Hints</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Standard output should contain the list of matching file paths."
                    value={expectedOutput}
                    onChange={(e) => setExpectedOutput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#3c4cb8]"
                  />
                </div>
              </div>
            )}

            {/* Explanation Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Explanation (Shown after test completion)</label>
              <textarea
                rows={2}
                placeholder="Explain why the answer is correct or key concepts behind the solution..."
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#3c4cb8]"
              />
            </div>

            {/* Save Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={savingQuestion}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-xs transition-all flex items-center justify-center gap-2 hover:opacity-95"
                style={{ background: ADMIN_PRIMARY }}
              >
                {savingQuestion ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{editingQuestionId ? 'Update Question' : 'Save Question'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* ── Right Column: Question List (5 cols) ── */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-[#ECEEF2] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Questions ({questionsList.length})
              </h2>
              <p className="text-[11px] text-slate-400">
                Total Marks: <span className="font-bold text-slate-700">{totalCalculatedMarks}</span>
              </p>
            </div>

            <button
              type="button"
              onClick={resetQuestionForm}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#3c4cb8] hover:underline"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
          </div>

          {questionsList.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <HelpCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-medium">No questions added yet</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Use the form on the left to add your first question.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[850px] overflow-y-auto pr-1">
              {questionsList.map((q, idx) => (
                <div
                  key={q.id}
                  className={`p-4 rounded-xl border transition-all ${
                    editingQuestionId === q.id
                      ? 'border-[#3c4cb8] bg-[#e7e9fb]/20 ring-1 ring-[#3c4cb8]'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          q.question_type === 'CODING'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        }`}
                      >
                        {q.question_type}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500">
                        {Number(q.marks)} marks
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                        {q.difficulty}
                      </span>
                    </div>

                    {/* Order & Edit buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveQuestion(idx, -1)}
                        disabled={idx === 0}
                        title="Move Up"
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-100"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveQuestion(idx, 1)}
                        disabled={idx === questionsList.length - 1}
                        title="Move Down"
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-100"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEditQuestion(q)}
                        title="Edit Question"
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100 ml-1"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(q.id)}
                        title="Delete Question"
                        className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Question text */}
                  <p className="text-xs font-bold text-slate-800 mt-2 line-clamp-2">
                    {q.question_text}
                  </p>

                  {/* MCQ Options list */}
                  {q.question_type === 'MCQ' && q.options && (
                    <div className="mt-2.5 grid grid-cols-2 gap-1.5 text-[11px]">
                      {q.options.map((opt) => (
                        <div
                          key={opt.id}
                          className={`p-1.5 rounded-lg border text-xs truncate ${
                            opt.is_correct
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-900 font-semibold'
                              : 'border-slate-100 bg-slate-50 text-slate-600'
                          }`}
                        >
                          <span className="font-bold mr-1">{opt.option_label}.</span>
                          {opt.option_text}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Coding snippet */}
                  {q.question_type === 'CODING' && (
                    <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-2">
                      <span className="font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-200">
                        {q.programming_language || 'code'}
                      </span>
                      {q.constraints && (
                        <span className="truncate max-w-[200px]">
                          Constraints: {q.constraints}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Quiz Settings Modal ── */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-100 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#3c4cb8]" />
                <h3 className="text-sm font-bold text-slate-900">Quiz Metadata & Settings</h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  value={settingsForm.title}
                  onChange={(e) => setSettingsForm({ ...settingsForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#3c4cb8]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={settingsForm.description}
                  onChange={(e) => setSettingsForm({ ...settingsForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#3c4cb8]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Instructions</label>
                <textarea
                  rows={2}
                  value={settingsForm.instructions}
                  onChange={(e) => setSettingsForm({ ...settingsForm, instructions: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#3c4cb8]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    value={settingsForm.duration_minutes}
                    onChange={(e) => setSettingsForm({ ...settingsForm, duration_minutes: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#3c4cb8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Passing Marks</label>
                  <input
                    type="number"
                    value={settingsForm.passing_marks}
                    onChange={(e) => setSettingsForm({ ...settingsForm, passing_marks: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#3c4cb8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Max Attempts</label>
                  <input
                    type="number"
                    min="1"
                    value={settingsForm.max_attempts}
                    onChange={(e) => setSettingsForm({ ...settingsForm, max_attempts: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#3c4cb8]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Available From</label>
                  <input
                    type="datetime-local"
                    value={settingsForm.available_from}
                    onChange={(e) => setSettingsForm({ ...settingsForm, available_from: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#3c4cb8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Available Until</label>
                  <input
                    type="datetime-local"
                    value={settingsForm.available_until}
                    onChange={(e) => setSettingsForm({ ...settingsForm, available_until: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#3c4cb8]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs"
                  style={{ background: ADMIN_PRIMARY }}
                >
                  Update Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
