import React, { useState, useRef } from 'react';
import { Play, RotateCcw, Copy, Check, Terminal, Clock, Cpu, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function QuizCodeEditor({
  code = '',
  onChange,
  starterCode = '',
  language = 'python',
  onRun,
  running = false,
  executionResult = null,
  disabled = false,
  readOnly = false,
}) {
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef(null);

  const handleKeyDown = (e) => {
    if (readOnly || disabled) return;
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const val = e.target.value;
      const updated = val.substring(0, start) + '    ' + val.substring(end);
      onChange?.(updated);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4;
        }
      }, 0);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore
    }
  };

  const handleReset = () => {
    if (readOnly || disabled) return;
    if (window.confirm('Reset code to initial template? Any unsaved edits will be replaced.')) {
      onChange?.(starterCode || '');
    }
  };

  const lineCount = Math.max(1, (code || '').split('\n').length);
  const lines = Array.from({ length: lineCount }, (_, i) => i + 1);

  // Status mapping
  const getStatusBadge = (status) => {
    if (!status) return null;
    const lower = String(status).toLowerCase();
    if (lower.includes('accepted') || lower.includes('success')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Status: Accepted / Successful</span>
        </span>
      );
    }
    if (lower.includes('compilation')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Status: Compilation Error</span>
        </span>
      );
    }
    if (lower.includes('runtime')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Status: Runtime Error</span>
        </span>
      );
    }
    if (lower.includes('time limit')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
          <Clock className="w-3.5 h-3.5" />
          <span>Status: Time Limit Exceeded</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-500/20 text-slate-300 border border-slate-500/30">
        <span>Status: {status}</span>
      </span>
    );
  };

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-950 overflow-hidden shadow-md flex flex-col font-mono text-xs">
      {/* ── Editor Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-slate-300 select-none">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-rose-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
            {language || 'code'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {!readOnly && starterCode && (
            <button
              type="button"
              onClick={handleReset}
              disabled={disabled}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors disabled:opacity-50"
              title="Reset code to starter template"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Copy code"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {!readOnly && onRun && (
            <button
              type="button"
              onClick={onRun}
              disabled={running || disabled}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 transition-all shadow-xs disabled:opacity-60"
            >
              <Play className={`w-3 h-3 fill-current ${running ? 'animate-spin' : ''}`} />
              <span>{running ? 'Running...' : 'Run Code'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Editor Canvas ── */}
      <div className="relative flex min-h-[240px] max-h-[480px] overflow-y-auto bg-slate-950 text-slate-100">
        {/* Line numbers */}
        <div className="w-9 sm:w-12 py-3 bg-slate-950 text-right pr-2 sm:pr-3 select-none text-slate-600 border-r border-slate-850 font-mono text-[12px] sm:text-[13px] leading-relaxed shrink-0">
          {lines.map((num) => (
            <div key={num} className="leading-relaxed">
              {num}
            </div>
          ))}
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={code || ''}
          onChange={(e) => onChange?.(e.target.value)}
          onKeyDown={handleKeyDown}
          readOnly={readOnly || disabled}
          spellCheck="false"
          placeholder="# Write your solution here..."
          className="flex-1 p-2.5 sm:p-3 bg-transparent text-slate-100 font-mono text-[12px] sm:text-[13px] leading-relaxed resize-none focus:outline-none placeholder-slate-600 selection:bg-indigo-500/30 overflow-x-auto whitespace-pre tab-4"
          rows={Math.max(10, lineCount)}
        />
      </div>

      {/* ── Execution Output Console ── */}
      {(running || executionResult) && (
        <div className="border-t border-slate-800 bg-slate-900/95 p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-slate-300">
              <Terminal className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold uppercase tracking-wider">Execution Console</span>
            </div>

            {running ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-indigo-400 font-medium animate-pulse">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                Executing in isolated environment...
              </span>
            ) : (
              <div className="flex items-center gap-2.5">
                {executionResult?.time && (
                  <span className="text-[11px] text-slate-400 inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {executionResult.time}
                  </span>
                )}
                {executionResult?.memory && (
                  <span className="text-[11px] text-slate-400 inline-flex items-center gap-1">
                    <Cpu className="w-3 h-3" />
                    {executionResult.memory}
                  </span>
                )}
                {getStatusBadge(executionResult?.status)}
              </div>
            )}
          </div>

          {/* Console Text Output */}
          {!running && executionResult && (
            <div className="space-y-2 text-xs">
              {/* Stdout */}
              {executionResult.stdout && (
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Standard Output:</div>
                  <pre className="p-3 rounded-xl bg-black/60 text-emerald-300 border border-slate-800 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
                    {executionResult.stdout}
                  </pre>
                </div>
              )}

              {/* Stderr */}
              {executionResult.stderr && (
                <div>
                  <div className="text-[10px] uppercase font-bold text-rose-400 mb-1">Standard Error:</div>
                  <pre className="p-3 rounded-xl bg-rose-950/40 text-rose-300 border border-rose-900/40 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
                    {executionResult.stderr}
                  </pre>
                </div>
              )}

              {/* Compile output */}
              {executionResult.compile_output && (
                <div>
                  <div className="text-[10px] uppercase font-bold text-amber-400 mb-1">Compilation Output:</div>
                  <pre className="p-3 rounded-xl bg-amber-950/40 text-amber-300 border border-amber-900/40 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
                    {executionResult.compile_output}
                  </pre>
                </div>
              )}

              {/* Friendly message if no stdout and no stderr */}
              {!executionResult.stdout && !executionResult.stderr && !executionResult.compile_output && (
                <div className="p-3 rounded-xl bg-black/40 text-slate-400 border border-slate-800 italic">
                  {executionResult.message || 'Execution completed with no standard output.'}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
