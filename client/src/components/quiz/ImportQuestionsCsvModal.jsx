import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
  ChevronDown,
  ChevronUp,
  Code2,
  ListOrdered,
  Check,
} from 'lucide-react';
import { importQuestionsFromCsv } from '../../services/quizService';
import { parseAndValidateQuizCsv, downloadSampleQuizCsv } from '../../utils/quizCsvParser';

const ADMIN_PRIMARY = '#3c4cb8';
const ADMIN_LIGHT = '#e7e9fb';
const ADMIN_DARK = '#2e3a8c';

export default function ImportQuestionsCsvModal({ isOpen, onClose, onSuccess, quizId, quizTitle }) {
  const fileInputRef = useRef(null);

  const [fileName, setFileName] = useState('');
  const [rawCsvText, setRawCsvText] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [parseError, setParseError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [showPreviewTable, setShowPreviewTable] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setFileName('');
      setRawCsvText('');
      setParsedData(null);
      setParseError('');
      setSubmitError('');
      setShowPreviewTable(true);
    }
  }, [isOpen]);

  const questions = parsedData?.questions || [];

  const summary = useMemo(() => {
    const total = questions.length;
    const mcqCount = questions.filter((q) => q.question_type === 'MCQ').length;
    const codingCount = questions.filter((q) => q.question_type === 'CODING').length;
    const totalMarks = questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);
    const validCount = questions.filter((q) => q.isValid).length;
    const invalidCount = total - validCount;

    return {
      total,
      mcqCount,
      codingCount,
      totalMarks,
      validCount,
      invalidCount,
      hasErrors: invalidCount > 0,
    };
  }, [questions]);

  if (!isOpen) return null;

  const handleProcessFile = async (file) => {
    if (!file) return;
    setParseError('');
    setSubmitError('');

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setParseError('Please upload a valid .csv file.');
      return;
    }

    setFileName(file.name);

    try {
      const text = await file.text();
      setRawCsvText(text);

      const parsed = parseAndValidateQuizCsv(text);
      setParsedData(parsed);
    } catch (err) {
      setParsedData(null);
      setParseError(err.message || 'Unable to parse CSV file.');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) handleProcessFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!parsedData || questions.length === 0) {
      setSubmitError('Please upload a CSV file containing questions.');
      return;
    }
    if (summary.hasErrors) {
      setSubmitError(
        `Cannot import: ${summary.invalidCount} question(s) contain errors. Please fix them in the CSV or upload a corrected file.`
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const updatedQuiz = await importQuestionsFromCsv(quizId, {
        csv_content: rawCsvText,
        questions: questions,
      });

      onSuccess?.(updatedQuiz);
      onClose();
    } catch (err) {
      setSubmitError(err.message || 'Failed to import questions from CSV.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-xs">
      <div className="my-6 w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-4">
          <div className="flex items-start gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-xs"
              style={{ background: ADMIN_PRIMARY }}
            >
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border"
                  style={{ background: ADMIN_LIGHT, color: ADMIN_DARK, borderColor: '#c7cef5' }}
                >
                  Bulk Question Importer
                </span>
                <span className="text-xs text-slate-400 font-medium">Append to Assessment</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                Import Questions into &ldquo;{quizTitle || 'Assessment'}&rdquo;
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {submitError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* CSV Upload Box */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#3c4cb8]" />
                <span>Upload CSV Questions File</span>
              </label>

              <button
                type="button"
                onClick={downloadSampleQuizCsv}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#3c4cb8] hover:text-[#2e3a8c] hover:underline"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Sample CSV Template</span>
              </button>
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-[#3c4cb8] bg-[#f2f4fd]'
                  : fileName
                  ? 'border-emerald-300 bg-emerald-50/40'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv"
                className="hidden"
                onChange={(e) => handleProcessFile(e.target.files?.[0])}
              />

              <div className="flex flex-col items-center justify-center gap-2">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                    fileName
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-indigo-50 text-indigo-600'
                  }`}
                >
                  {fileName ? <CheckCircle2 className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
                </div>

                {fileName ? (
                  <div>
                    <p className="text-xs font-bold text-slate-900">{fileName}</p>
                    <p className="text-[11px] text-slate-500">Click or drag a new CSV to replace</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      Drag & drop your CSV file here, or{' '}
                      <span className="text-[#3c4cb8] underline font-semibold">browse files</span>
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      New questions will be appended to the current assessment preserving existing order.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {parseError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-medium text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{parseError}</span>
              </div>
            )}
          </div>

          {/* Real-time Preview */}
          {parsedData && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Import Preview
                </span>
                <button
                  type="button"
                  onClick={() => setShowPreviewTable(!showPreviewTable)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                >
                  {showPreviewTable ? (
                    <>
                      <span>Hide Table</span>
                      <ChevronUp className="w-3.5 h-3.5" />
                    </>
                  ) : (
                    <>
                      <span>Inspect {questions.length} Questions</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Questions to Add</span>
                  <span className="text-base font-extrabold text-slate-900">{summary.total}</span>
                </div>
                <div className="bg-indigo-50/60 border border-indigo-100 p-3 rounded-xl text-center">
                  <span className="text-[10px] font-bold uppercase text-indigo-500 block">MCQ</span>
                  <span className="text-base font-extrabold text-indigo-700">{summary.mcqCount}</span>
                </div>
                <div className="bg-purple-50/60 border border-purple-100 p-3 rounded-xl text-center">
                  <span className="text-[10px] font-bold uppercase text-purple-500 block">Coding</span>
                  <span className="text-base font-extrabold text-purple-700">{summary.codingCount}</span>
                </div>
                <div className="bg-amber-50/60 border border-amber-100 p-3 rounded-xl text-center">
                  <span className="text-[10px] font-bold uppercase text-amber-500 block">Added Marks</span>
                  <span className="text-base font-extrabold text-amber-700">+{summary.totalMarks} pts</span>
                </div>
              </div>

              {/* Collapsible Questions Table */}
              {showPreviewTable && (
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Question Prompt</th>
                        <th className="py-2.5 px-3">Details / Answer</th>
                        <th className="py-2.5 px-3 text-right">Marks</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {questions.map((q, idx) => (
                        <tr
                          key={idx}
                          className={q.isValid ? 'hover:bg-slate-50/50' : 'bg-rose-50/40 hover:bg-rose-50/70'}
                        >
                          <td className="py-2 px-3 font-semibold text-slate-400">
                            {q.rowNumber ? `L${q.rowNumber}` : idx + 1}
                          </td>
                          <td className="py-2 px-3">
                            {q.question_type === 'CODING' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                                <Code2 className="w-3 h-3" />
                                Coding
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
                                <ListOrdered className="w-3 h-3" />
                                MCQ
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 font-medium text-slate-800 max-w-xs truncate" title={q.question_text}>
                            {q.question_text}
                          </td>
                          <td className="py-2 px-3 text-slate-500 max-w-xs">
                            {q.question_type === 'MCQ' ? (
                              <div className="flex items-center gap-1 flex-wrap">
                                {q.options.map((opt) => (
                                  <span
                                    key={opt.option_label}
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                      opt.is_correct
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                        : 'bg-slate-100 text-slate-600'
                                    }`}
                                  >
                                    {opt.option_label}
                                    {opt.is_correct ? ' ✓' : ''}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-600 font-mono">
                                Lang: {q.programming_language || 'python'}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-slate-700">
                            {q.marks}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {q.isValid ? (
                              <span className="inline-flex items-center text-emerald-600 text-[11px] font-semibold">
                                <Check className="w-3.5 h-3.5" />
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center gap-1 text-rose-600 text-[10px] font-bold"
                                title={q.errors.join(', ')}
                              >
                                <AlertCircle className="w-3 h-3" />
                                Error
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !parsedData || summary.hasErrors}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-xs hover:opacity-95 disabled:opacity-50"
              style={{ background: ADMIN_PRIMARY }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Importing Questions...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Import {questions.length} Questions</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
