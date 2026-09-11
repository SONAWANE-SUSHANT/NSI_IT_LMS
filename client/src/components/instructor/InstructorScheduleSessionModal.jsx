import React, { useState, useEffect } from 'react';
import { X, Video, Calendar, Clock, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { fetchBatchCourseContent, createBatchSession } from '../../services/instructorService';

export default function InstructorScheduleSessionModal({ batch, onClose, onSuccess }) {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    module_id: '',
    title: '',
    description: '',
    session_type: 'LIVE',
    scheduled_at: '',
    duration_minutes: 60,
    session_url: '',
  });

  useEffect(() => {
    if (!batch) return;
    const loadModules = async () => {
      try {
        setLoading(true);
        const data = await fetchBatchCourseContent(batch.id);
        const mods = data?.modules || [];
        setModules(mods);
        if (mods.length > 0) {
          setFormData((prev) => ({ ...prev, module_id: mods[0].id }));
        }
      } catch (err) {
        setError(err.message || 'Failed to load course modules');
      } finally {
        setLoading(false);
      }
    };
    loadModules();
  }, [batch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.module_id) {
      setError('Please select a course module');
      return;
    }
    if (!formData.title.trim()) {
      setError('Session title is required');
      return;
    }

    try {
      setSubmitting(true);
      const isRecorded = formData.session_type === 'RECORDED';
      const payload = {
        ...formData,
        recording_url: isRecorded ? (formData.session_url?.trim() || null) : null,
        session_url: isRecorded ? null : (formData.session_url?.trim() || null),
      };
      await createBatchSession(batch.id, payload);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to schedule session');
    } finally {
      setSubmitting(false);
    }
  };

  if (!batch) return null;

  const isRecorded = formData.session_type === 'RECORDED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-100 text-teal-700 rounded-xl">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isRecorded ? 'Add Pre-recorded Lecture' : 'Schedule Session'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Batch: {batch.name} ({batch.batch_code})
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

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Module Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Course Module <span className="text-rose-500">*</span>
            </label>
            {loading ? (
              <div className="h-10 bg-slate-100 animate-pulse rounded-xl" />
            ) : modules.length === 0 ? (
              <p className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                No active modules found for this course. Please create a module first.
              </p>
            ) : (
              <select
                value={formData.module_id}
                onChange={(e) => setFormData({ ...formData, module_id: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                required
              >
                {modules.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.duration ? `(${m.duration})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Session Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Session Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Advanced Component Patterns & State Hooks"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              required
            />
          </div>

          {/* Type & Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Session Type</label>
              <select
                value={formData.session_type}
                onChange={(e) => setFormData({ ...formData, session_type: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              >
                <option value="LIVE">Live Interactive Class</option>
                <option value="RECORDED">Pre-recorded Lecture</option>
                <option value="DOUBT_SESSION">Doubt Clearing Session</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Duration (Minutes)
              </label>
              <input
                type="number"
                min="15"
                step="15"
                value={formData.duration_minutes}
                onChange={(e) =>
                  setFormData({ ...formData, duration_minutes: Number(e.target.value) })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Date & Time */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Scheduled At</label>
            <input
              type="datetime-local"
              value={formData.scheduled_at}
              onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Meeting / Session URL */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isRecorded
                ? 'Recorded Video URL (YouTube, Google Drive, Vimeo, MP4)'
                : 'Live Meeting URL (Google Meet, Zoom, Teams)'}
            </label>
            <div className="relative">
              <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="url"
                placeholder={
                  isRecorded
                    ? 'https://youtu.be/... or https://drive.google.com/...'
                    : 'https://meet.google.com/xyz-abc-def'
                }
                value={formData.session_url}
                onChange={(e) => setFormData({ ...formData, session_url: e.target.value })}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Description / Topics */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Agenda & Key Learning Outcomes
            </label>
            <textarea
              rows="3"
              placeholder="Outline what topics and exercises will be covered in this session..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || modules.length === 0}
              className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {submitting ? 'Publishing...' : 'Schedule & Publish Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
