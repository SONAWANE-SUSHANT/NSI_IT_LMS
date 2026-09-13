import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Camera,
  CheckCircle2,
  AlertCircle,
  Lock,
  Sparkles,
  Save,
  RotateCcw,
  ShieldCheck,
  Upload,
  Link as LinkIcon,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import {
  fetchMyProfile,
  updateMyProfile,
  uploadProfilePhoto,
} from '../../services/profileService';

const PRIMARY_COLOR = '#3c4cb8';
const LIGHT_BG = '#e7e9fb';
const DARK_ACCENT = '#2e3a8c';

export default function UserProfilePage({ role = 'STUDENT' }) {
  const { user: authUser, updateUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Editable Form State
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    contact_no: '',
    date_of_birth: '',
    gender: 'MALE',
  });

  // Photo URL modal / input toggle
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customPhotoUrl, setCustomPhotoUrl] = useState('');

  // Status & Feedback
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const fileInputRef = useRef(null);

  // Load Profile Data
  const loadProfile = async () => {
    try {
      setLoading(true);
      setServerError('');
      const data = await fetchMyProfile();
      setProfile(data);
      setFormData({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        contact_no: data.contact_no || '',
        date_of_birth: data.date_of_birth ? data.date_of_birth.split('T')[0] : '',
        gender: data.gender || 'MALE',
      });
      setHasUnsavedChanges(false);
    } catch (err) {
      setServerError(err.message || 'Unable to load profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      setHasUnsavedChanges(true);
      return next;
    });
    setServerError('');
    setSuccessMessage('');
  };

  const handleReset = () => {
    if (!profile) return;
    setFormData({
      first_name: profile.first_name || '',
      last_name: profile.last_name || '',
      contact_no: profile.contact_no || '',
      date_of_birth: profile.date_of_birth ? profile.date_of_birth.split('T')[0] : '',
      gender: profile.gender || 'MALE',
    });
    setHasUnsavedChanges(false);
    setServerError('');
    setSuccessMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setSuccessMessage('');

    // Validation
    if (!formData.first_name.trim()) {
      setServerError('First name is required.');
      return;
    }
    if (!formData.last_name.trim()) {
      setServerError('Last name is required.');
      return;
    }
    if (formData.contact_no && formData.contact_no.trim().length > 20) {
      setServerError('Contact number cannot exceed 20 characters.');
      return;
    }

    try {
      setSaving(true);
      const updated = await updateMyProfile({
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        contact_no: formData.contact_no.trim() || null,
        date_of_birth: formData.date_of_birth || null,
        gender: formData.gender,
      });

      setProfile(updated);
      setHasUnsavedChanges(false);
      setSuccessMessage('Profile updated successfully.');

      // Sync auth state for immediate navbar & sidebar updates
      updateUser({
        first_name: updated.first_name,
        last_name: updated.last_name,
        username: updated.username,
        photo: updated.photo,
      });
    } catch (err) {
      setServerError(err.message || 'Unable to update profile.');
    } finally {
      setSaving(false);
    }
  };

  // Handle Photo File Upload
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setServerError('Please select a valid image format (JPEG, PNG, or WEBP).');
      return;
    }

    // Validate size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      setServerError('Image file size exceeds maximum limit of 2MB.');
      return;
    }

    try {
      setUploadingPhoto(true);
      setServerError('');
      setSuccessMessage('');

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          const res = await uploadProfilePhoto({ image: reader.result });
          setProfile((prev) => ({ ...prev, photo: res.photo }));
          setSuccessMessage('Profile photo updated successfully.');

          // Sync auth state
          updateUser({ photo: res.photo });
        } catch (err) {
          setServerError(err.message || 'Failed to upload photo.');
        } finally {
          setUploadingPhoto(false);
        }
      };
    } catch (err) {
      setServerError(err.message || 'Failed to process file.');
      setUploadingPhoto(false);
    }
  };

  // Handle Custom Photo URL submit
  const handleCustomUrlSubmit = async (e) => {
    e.preventDefault();
    if (!customPhotoUrl.trim()) return;

    try {
      setUploadingPhoto(true);
      setServerError('');
      setSuccessMessage('');

      const res = await uploadProfilePhoto({ photo_url: customPhotoUrl.trim() });
      setProfile((prev) => ({ ...prev, photo: res.photo }));
      setCustomPhotoUrl('');
      setShowUrlInput(false);
      setSuccessMessage('Profile photo URL updated.');

      // Sync auth state
      updateUser({ photo: res.photo });
    } catch (err) {
      setServerError(err.message || 'Failed to update photo URL.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const fullName = profile
    ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
    : 'User';

  const initials = profile
    ? `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase()
    : 'U';

  const photoUrl = profile?.photo || authUser?.photo;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-2xl sm:rounded-3xl border border-[#ECEEF2] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xs shrink-0"
            style={{ background: PRIMARY_COLOR }}
          >
            <User className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md border"
                style={{ background: LIGHT_BG, color: DARK_ACCENT, borderColor: '#c7cef5' }}
              >
                {role === 'INSTRUCTOR' ? 'Instructor Profile' : 'Student Profile'}
              </span>
              <span className="text-xs text-slate-400 font-medium">NSI IT LMS</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
              Personal Profile & Settings
            </h1>
          </div>
        </div>

        {hasUnsavedChanges && (
          <span className="self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Unsaved Changes
          </span>
        )}
      </div>

      {/* Alerts */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-3 animate-fadeIn shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
      {serverError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-3 animate-fadeIn shadow-2xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-3xl border border-[#ECEEF2] p-12 text-center space-y-3 shadow-xs">
          <div className="w-10 h-10 border-3 border-[#3c4cb8] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-600">Loading your profile…</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* ── Left Column: Avatar & Account Badge (1 Col) ── */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#ECEEF2] p-6 text-center shadow-xs flex flex-col items-center">
              {/* Avatar Circle */}
              <div className="relative group">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden border-4 border-slate-100 shadow-md bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white text-3xl font-black">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>

                {/* Camera Overlay button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="absolute bottom-1 right-1 p-2.5 rounded-xl text-white bg-slate-900/90 hover:bg-slate-950 shadow-md border-2 border-white transition-all transform hover:scale-105 cursor-pointer disabled:opacity-50"
                  title="Upload new photo"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />

              <h2 className="text-base font-extrabold text-slate-900 mt-4 leading-tight">
                {fullName}
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                @{profile?.username || 'user'}
              </p>

              {/* Photo Actions */}
              <div className="w-full pt-4 mt-4 border-t border-slate-100 space-y-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200/80 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadingPhoto ? 'Uploading…' : 'Change Photo'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  <LinkIcon className="w-3 h-3" />
                  <span>{showUrlInput ? 'Cancel URL' : 'Use Photo URL'}</span>
                </button>

                {showUrlInput && (
                  <form onSubmit={handleCustomUrlSubmit} className="pt-2 space-y-2 animate-fadeIn">
                    <input
                      type="url"
                      placeholder="https://images.example.com/avatar.jpg"
                      value={customPhotoUrl}
                      onChange={(e) => setCustomPhotoUrl(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="submit"
                      disabled={uploadingPhoto || !customPhotoUrl.trim()}
                      className="w-full py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors cursor-pointer disabled:opacity-40"
                    >
                      Save URL
                    </button>
                  </form>
                )}
              </div>

              {/* Role & Status Pill */}
              <div className="w-full pt-4 mt-2 flex items-center justify-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {profile?.role || role}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {profile?.status || 'ACTIVE'}
                </span>
              </div>
            </div>
          </div>

          {/* ── Right Column: Form Fields (2 Cols) ── */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#ECEEF2] p-6 sm:p-7 shadow-xs">
              <div className="border-b border-slate-100 pb-4 mb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Profile Information
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Update your account identity and contact profile.
                  </p>
                </div>
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* First Name & Last Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      First Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={100}
                      value={formData.first_name}
                      onChange={(e) => handleChange('first_name', e.target.value)}
                      placeholder="Enter first name"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Last Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={100}
                      value={formData.last_name}
                      onChange={(e) => handleChange('last_name', e.target.value)}
                      placeholder="Enter last name"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Read Only: Username & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 flex items-center gap-1">
                      <span>Username</span>
                      <Lock className="w-3 h-3 text-slate-400" />
                      <span className="text-[10px] text-slate-400 font-normal">(System Generated)</span>
                    </label>
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={profile?.username || ''}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100/70 text-xs font-mono text-slate-500 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 flex items-center gap-1">
                      <span>Email Address</span>
                      <Lock className="w-3 h-3 text-slate-400" />
                      <span className="text-[10px] text-slate-400 font-normal">(Read Only)</span>
                    </label>
                    <input
                      type="email"
                      readOnly
                      disabled
                      value={profile?.email || ''}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100/70 text-xs font-medium text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Contact Number & Gender */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Contact Number
                    </label>
                    <input
                      type="text"
                      maxLength={20}
                      value={formData.contact_no}
                      onChange={(e) => handleChange('contact_no', e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Gender
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => handleChange('gender', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => handleChange('date_of_birth', e.target.value)}
                    className="w-full sm:w-1/2 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>

                {/* Form Buttons */}
                <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-xs hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-50"
                    style={{ background: PRIMARY_COLOR }}
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{saving ? 'Saving…' : 'Save Changes'}</span>
                  </button>

                  {hasUnsavedChanges && (
                    <button
                      type="button"
                      onClick={handleReset}
                      disabled={saving}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Discard Changes</span>
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
