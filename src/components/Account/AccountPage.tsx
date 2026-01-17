import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Mail, Building, Globe, Save, X, CheckCircle, AlertTriangle, CreditCard, Calendar, XCircle, AlertOctagon, Lock, Image, Upload, Trash2, Key, Copy, ExternalLink, Plus, Download, Shield } from 'lucide-react';
import { User as UserType, ApiKey } from '../../types';
import { getTrialStatus } from '../../utils/mockData';
import { supabase } from '../../lib/supabase';
import { AuthService } from '../../services/authService';
import { ApiKeyService } from '../../services/apiKeyService';
import { AuditLogService } from '../../services/auditLogService';
import TwoFactorSetup from './TwoFactorSetup';

interface AccountPageProps {
  user: UserType;
  onBack: () => void;
  onUpdateProfile: (updates: Partial<UserType>) => void;
}

export default function AccountPage({ user, onBack, onUpdateProfile }: AccountPageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    company: '',
    website: '',
    companyLogoUrl: user.companyLogoUrl || ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelStatus, setCancelStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [cancelMessage, setCancelMessage] = useState('');

  // Change password state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [passwordMessage, setPasswordMessage] = useState('');

  // Logo upload state
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(user.companyLogoUrl || null);

  // API Keys state (Enterprise only)
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);
  const [showCreateKeyModal, setShowCreateKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [isCreatingKey, setIsCreatingKey] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [keyCopied, setKeyCopied] = useState(false);

  // Data export state
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [exportMessage, setExportMessage] = useState('');

  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [deleteMessage, setDeleteMessage] = useState('');

  // 2FA state
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  // Load API keys for Enterprise users
  useEffect(() => {
    if (user.subscription === 'enterprise') {
      loadApiKeys();
    }
  }, [user.subscription]);

  const loadApiKeys = async () => {
    setIsLoadingKeys(true);
    const result = await ApiKeyService.listApiKeys(user.id);
    if (result.success && result.keys) {
      setApiKeys(result.keys.filter(k => !k.revokedAt)); // Only show active keys
    }
    setIsLoadingKeys(false);
  };

  const handleCreateApiKey = async () => {
    setIsCreatingKey(true);
    const result = await ApiKeyService.createApiKey(user.id, newKeyName || 'Default');
    if (result.success && result.key) {
      setNewlyCreatedKey(result.key);
      await loadApiKeys();
    }
    setIsCreatingKey(false);
  };

  const handleRevokeKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This cannot be undone.')) {
      return;
    }
    const result = await ApiKeyService.revokeApiKey(user.id, keyId);
    if (result.success) {
      await loadApiKeys();
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setKeyCopied(true);
    setTimeout(() => setKeyCopied(false), 2000);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, etc.)');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB');
      return;
    }

    setIsUploadingLogo(true);

    try {
      // Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-logo-${Date.now()}.${fileExt}`;
      const filePath = `company-logos/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        alert('Failed to upload logo. Please try again.');
        return;
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('assets')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      // Update form data and preview
      setFormData({ ...formData, companyLogoUrl: publicUrl });
      setLogoPreview(publicUrl);
    } catch (error) {
      console.error('Logo upload failed:', error);
      alert('Failed to upload logo. Please try again.');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleRemoveLogo = () => {
    setFormData({ ...formData, companyLogoUrl: '' });
    setLogoPreview(null);
  };

  const trialStatus = getTrialStatus(user);
  const isPaidPlan = ['starter', 'professional', 'enterprise'].includes(user.subscription);
  const isAdmin = user.isAdmin === true;

  const handleChangePassword = async () => {
    // Validate passwords match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordStatus('error');
      setPasswordMessage('Passwords do not match');
      return;
    }

    // Validate password length
    if (passwordData.newPassword.length < 6) {
      setPasswordStatus('error');
      setPasswordMessage('Password must be at least 6 characters');
      return;
    }

    setIsChangingPassword(true);
    setPasswordStatus('idle');
    setPasswordMessage('');

    try {
      const result = await AuthService.changePassword(passwordData.newPassword);

      if (!result.success) {
        setPasswordStatus('error');
        setPasswordMessage(result.error || 'Failed to change password');
        return;
      }

      setPasswordStatus('success');
      setPasswordMessage('Password changed successfully!');
      setPasswordData({ newPassword: '', confirmPassword: '' });

      // Close modal after 2 seconds
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordStatus('idle');
      }, 2000);
    } catch (error) {
      setPasswordStatus('error');
      setPasswordMessage('An unexpected error occurred');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Handle data export (GDPR right to data portability)
  const handleExportData = async () => {
    setIsExporting(true);
    setExportStatus('idle');
    setExportMessage('');

    try {
      // Fetch all user data from Supabase
      const [profileResult, analysesResult, projectsResult] = await Promise.all([
        supabase.from('users').select('*').eq('id', user.id).single(),
        supabase.from('analyses').select('*').eq('user_id', user.id),
        supabase.from('projects').select('*').eq('user_id', user.id)
      ]);

      // Compile all data
      const exportData = {
        exportedAt: new Date().toISOString(),
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
          subscription: user.subscription
        },
        profile: profileResult.data,
        analyses: analysesResult.data || [],
        projects: projectsResult.data || []
      };

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `llm-navigator-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Log data export for audit
      AuditLogService.logDataExport().catch(() => {});

      setExportStatus('success');
      setExportMessage('Your data has been exported successfully!');

      // Reset status after 3 seconds
      setTimeout(() => {
        setExportStatus('idle');
        setExportMessage('');
      }, 3000);
    } catch (error) {
      console.error('Export error:', error);
      setExportStatus('error');
      setExportMessage('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Handle account deletion (GDPR right to be forgotten)
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setDeleteStatus('error');
      setDeleteMessage('Please type DELETE to confirm');
      return;
    }

    setIsDeleting(true);
    setDeleteStatus('idle');
    setDeleteMessage('');

    try {
      // Call edge function to delete all user data
      const { data, error } = await supabase.functions.invoke('delete-account', {
        body: { userId: user.id }
      });

      if (error) throw error;

      if (data.success) {
        // Log account deletion for audit (before signing out)
        AuditLogService.logAccountDeletion().catch(() => {});

        setDeleteStatus('success');
        setDeleteMessage('Your account has been deleted. Redirecting...');

        // Sign out and redirect after 2 seconds
        setTimeout(async () => {
          await AuthService.signOut();
          window.location.hash = '';
          window.location.reload();
        }, 2000);
      } else {
        throw new Error(data.error || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Delete account error:', error);
      setDeleteStatus('error');
      setDeleteMessage(error instanceof Error ? error.message : 'Failed to delete account. Please contact support.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelSubscription = async () => {
    setIsCancelling(true);
    setCancelStatus('idle');
    setCancelMessage('');

    try {
      const { data, error } = await supabase.functions.invoke('cancel-subscription', {
        body: {
          userId: user.id,
          subscriptionId: user.stripeSubscriptionId
        }
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        setCancelStatus('success');
        if (data.cancelAtPeriodEnd) {
          setCancelMessage(`Your subscription will end on ${new Date(data.subscriptionEndsAt).toLocaleDateString()}`);
          // Update the local user state
          onUpdateProfile({
            cancelAtPeriodEnd: true,
            subscriptionEndsAt: data.subscriptionEndsAt
          });
        } else {
          setCancelMessage('Your subscription has been cancelled.');
          onUpdateProfile({
            subscription: 'trial' as UserType['subscription'],
            cancelAtPeriodEnd: false,
            subscriptionEndsAt: undefined
          });
        }

        // Close modal after 3 seconds
        setTimeout(() => {
          setShowCancelModal(false);
          setCancelStatus('idle');
        }, 3000);
      } else {
        throw new Error(data.error || 'Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      setCancelStatus('error');
      setCancelMessage(error instanceof Error ? error.message : 'Failed to cancel subscription. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update profile (including company logo for Professional/Enterprise)
      const updates: Partial<UserType> = {
        name: formData.name,
      };

      // Only include logo URL for Professional/Enterprise users
      if (['professional', 'enterprise'].includes(user.subscription)) {
        updates.companyLogoUrl = formData.companyLogoUrl || undefined;
      }

      onUpdateProfile(updates);

      setIsSaving(false);
      setSaveStatus('success');

      // Reset form after success
      setTimeout(() => {
        setSaveStatus('idle');
        setIsEditing(false);
      }, 2000);
    } catch {
      setIsSaving(false);
      setSaveStatus('error');
      setErrorMessage('Failed to update profile. Please try again.');
    }
  };
  
  const getSubscriptionBadge = (subscription: string) => {
    switch (subscription) {
      case 'starter':
        return <span className="px-2 py-1 bg-blue-900/50 text-blue-300 rounded-full text-xs font-medium">Starter</span>;
      case 'professional':
        return <span className="px-2 py-1 bg-purple-900/50 text-purple-300 rounded-full text-xs font-medium">Professional</span>;
      case 'enterprise':
        return <span className="px-2 py-1 bg-indigo-900/50 text-indigo-300 rounded-full text-xs font-medium">Enterprise</span>;
      case 'trial':
        return <span className="px-2 py-1 bg-yellow-900/50 text-yellow-300 rounded-full text-xs font-medium">Trial</span>;
      default:
        return <span className="px-2 py-1 bg-slate-700 text-slate-300 rounded-full text-xs font-medium">Free</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-slate-400 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Account Settings</h1>
            <p className="text-slate-400 mt-1">Manage your profile and subscription</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Profile Card */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-semibold mb-4">
                {user.name.charAt(0)}
              </div>
              <h3 className="text-xl font-semibold text-white mb-1">{user.name}</h3>
              <p className="text-slate-400 mb-3">{user.email}</p>
              <div className="mb-4">
                {getSubscriptionBadge(user.subscription)}
              </div>
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit Profile
              </button>
            </div>
          </div>
          
          {/* Subscription Info */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Subscription Details</h3>

            <div className="space-y-4">
              <div>
                <div className="text-sm text-slate-500 mb-1">Current Plan</div>
                <div className="font-medium text-white flex items-center">
                  {user.subscription === 'trial' ? 'Trial (Professional)' :
                   user.subscription.charAt(0).toUpperCase() + user.subscription.slice(1)}
                </div>
              </div>

              {trialStatus && trialStatus.isActive && (
                <div>
                  <div className="text-sm text-slate-500 mb-1">Trial Status</div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-medium text-white">
                      {trialStatus.daysRemaining === 0 ? 'Expires today' :
                       `${trialStatus.daysRemaining} days remaining`}
                    </span>
                  </div>
                </div>
              )}

              {!isAdmin && (
                <div>
                  <div className="text-sm text-slate-500 mb-1">Payment Method</div>
                  <div className="flex items-center space-x-2">
                    {user.paymentMethodAdded ? (
                      <>
                        <CreditCard className="w-4 h-4 text-green-400" />
                        <span className="text-sm font-medium text-white">
                          •••• 4242 (Visa)
                        </span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 text-slate-500" />
                        <span className="text-sm font-medium text-slate-500">
                          No payment method
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {!isAdmin && (
                <div>
                  <div className="text-sm text-slate-500 mb-1">Billing Cycle</div>
                  <div className="text-sm font-medium text-white">
                    {user.subscription === 'trial' ? 'N/A (Trial)' : 'Monthly'}
                  </div>
                </div>
              )}

              {!isAdmin && isPaidPlan && user.currentPeriodEnd && !user.cancelAtPeriodEnd && (
                <div>
                  <div className="text-sm text-slate-500 mb-1">Next Billing Date</div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium text-white">
                      {new Date(user.currentPeriodEnd).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              )}

              {isAdmin && (
                <div>
                  <div className="text-sm text-slate-500 mb-1">Account Type</div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-medium text-green-400">
                      Admin Account (No billing)
                    </span>
                  </div>
                </div>
              )}

              <div>
                <div className="text-sm text-slate-500 mb-1">Member Since</div>
                <div className="text-sm font-medium text-white">
                  {new Date(user.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            {!isAdmin && user.subscription !== 'enterprise' && (
              <div className="mt-6">
                <button
                  onClick={() => window.location.hash = '#pricing'}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Upgrade Plan
                </button>
              </div>
            )}

            {!isAdmin && isPaidPlan && !user.cancelAtPeriodEnd && (
              <div className="mt-3">
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="w-full px-4 py-2 border border-red-700 text-red-400 rounded-lg hover:bg-red-900/30 transition-colors"
                >
                  Cancel Subscription
                </button>
              </div>
            )}

            {user.cancelAtPeriodEnd && user.subscriptionEndsAt && (
              <div className="mt-4 bg-yellow-900/30 border border-yellow-700 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-300">Subscription Ending</p>
                    <p className="text-xs text-yellow-200 mt-1">
                      Your subscription will end on {new Date(user.subscriptionEndsAt).toLocaleDateString()}.
                      You'll retain access until then.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Form */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Profile Information</h3>

            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Status Message */}
                {saveStatus === 'success' && (
                  <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-green-300">Profile updated successfully!</span>
                    </div>
                  </div>
                )}

                {saveStatus === 'error' && (
                  <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                      <span className="text-red-300">{errorMessage}</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-slate-500 cursor-not-allowed"
                      disabled
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Company (Optional)
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Acme Corp"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Website (Optional)
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://example.com"
                    />
                  </div>
                </div>

                {/* Company Logo - Professional/Enterprise only */}
                {['professional', 'enterprise'].includes(user.subscription) && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Company Logo
                      <span className="ml-2 text-xs text-indigo-400 font-normal">(for branded PDF reports)</span>
                    </label>

                    {logoPreview ? (
                      <div className="border border-slate-600 rounded-lg p-4 bg-slate-900/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <img
                              src={logoPreview}
                              alt="Company logo preview"
                              className="max-h-12 max-w-[150px] object-contain"
                              onError={() => setLogoPreview(null)}
                            />
                            <span className="text-sm text-slate-400">Logo uploaded</span>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveLogo}
                            className="p-2 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                            title="Remove logo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                        <input
                          type="file"
                          id="logo-upload"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                          disabled={isUploadingLogo}
                        />
                        <label
                          htmlFor="logo-upload"
                          className="cursor-pointer flex flex-col items-center"
                        >
                          {isUploadingLogo ? (
                            <>
                              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                              <span className="text-sm text-slate-400">Uploading...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-8 h-8 text-slate-500 mb-2" />
                              <span className="text-sm font-medium text-blue-400">Click to upload logo</span>
                              <span className="text-xs text-slate-500 mt-1">PNG, JPG up to 2MB</span>
                            </>
                          )}
                        </label>
                      </div>
                    )}
                    <p className="text-xs text-slate-500 mt-2">
                      Recommended size: 200x50px. Your logo will appear on PDF reports.
                    </p>
                  </div>
                )}

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 px-4 py-3 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors flex items-center justify-center space-x-2"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm text-slate-500 mb-1">Full Name</div>
                    <div className="font-medium text-white">{user.name}</div>
                  </div>

                  <div>
                    <div className="text-sm text-slate-500 mb-1">Email Address</div>
                    <div className="font-medium text-white">{user.email}</div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-700">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Subscription Features */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Your Plan Features</h3>

            <div className="space-y-4">
              {user.subscription === 'trial' && (
                <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <Calendar className="w-5 h-5 text-yellow-400 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-300 mb-1">Trial Status</h4>
                      <p className="text-sm text-yellow-200">
                        {trialStatus && trialStatus.daysRemaining > 0 ?
                          `Your trial expires in ${trialStatus.daysRemaining} days. Upgrade to continue using all features.` :
                          'Your trial has expired. Upgrade to continue using all features.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {user.subscription === 'starter' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                    <span className="text-slate-300">10 AI analyses per month</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                    <span className="text-slate-300">Basic competitor insights</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                    <span className="text-slate-300">Standard optimization recommendations</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                    <span className="text-slate-300">Email support</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                    <span className="text-slate-300">Standard reporting</span>
                  </div>
                </div>
              )}

              {user.subscription === 'professional' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                    <span className="text-slate-300">50 AI analyses per month</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                    <span className="text-slate-300">Advanced competitor strategy</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                    <span className="text-slate-300">Advanced optimization recommendations</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                    <span className="text-slate-300">Email support</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                    <span className="text-slate-300">Advanced reporting & analytics</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                    <span className="text-slate-300">Detailed performance metrics</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                    <span className="text-slate-300">Limited historical data retention (3 months)</span>
                  </div>
                </div>
              )}

              {user.subscription === 'enterprise' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                    <span className="text-slate-300">400 AI analyses per month</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                    <span className="text-slate-300">Advanced competitor strategy</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                    <span className="text-slate-300">White-label reporting & custom branding</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                    <span className="text-slate-300">Priority email support</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                    <span className="text-slate-300">Premium performance metrics</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                    <span className="text-slate-300">Unlimited projects</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                    <span className="text-slate-300">Unlimited users</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                    <span className="text-slate-300">Unlimited historical data retention</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                    <span className="text-slate-300">Access to all AI models including Claude 3 Opus</span>
                  </div>
                </div>
              )}

              {(user.subscription === 'free' || user.subscription === 'trial') && (
                <div className="mt-6">
                  <button
                    onClick={() => window.location.hash = '#pricing'}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Upgrade Your Plan
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Account Security */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Shield className="w-5 h-5 text-indigo-400" />
              <h3 className="text-lg font-semibold text-white">Account Security & Privacy</h3>
            </div>

            <div className="space-y-6">
              {/* Password */}
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-2">Password</h4>
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Change Password
                </button>
              </div>

              {/* Two-Factor Authentication */}
              <div className="pt-4 border-t border-slate-700">
                <TwoFactorSetup
                  isEnabled={is2FAEnabled}
                  onStatusChange={setIs2FAEnabled}
                />
              </div>

              {/* Data Export - GDPR Right to Data Portability */}
              <div className="pt-4 border-t border-slate-700">
                <h4 className="text-sm font-medium text-slate-300 mb-2">Export Your Data</h4>
                <p className="text-sm text-slate-500 mb-3">
                  Download a copy of all your data (profile, analyses, projects) in JSON format.
                </p>
                {exportStatus === 'success' && (
                  <div className="bg-green-900/30 border border-green-700 rounded-lg p-3 mb-3">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-green-300">{exportMessage}</span>
                    </div>
                  </div>
                )}
                {exportStatus === 'error' && (
                  <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 mb-3">
                    <div className="flex items-center space-x-2">
                      <XCircle className="w-4 h-4 text-red-400" />
                      <span className="text-sm text-red-300">{exportMessage}</span>
                    </div>
                  </div>
                )}
                <button
                  onClick={handleExportData}
                  disabled={isExporting}
                  className="flex items-center space-x-2 px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                  {isExporting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin"></div>
                      <span>Exporting...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Download My Data</span>
                    </>
                  )}
                </button>
              </div>

              {/* Delete Account - GDPR Right to be Forgotten */}
              <div className="pt-4 border-t border-slate-700">
                <h4 className="text-sm font-medium text-red-400 mb-2">Delete Account</h4>
                <p className="text-sm text-slate-500 mb-3">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 border border-red-700 text-red-400 rounded-lg hover:bg-red-900/30 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete My Account</span>
                </button>
              </div>

              <div className="pt-4 border-t border-slate-700">
                <div className="text-sm text-slate-500 mb-2">Account Created</div>
                <div className="font-medium text-white">
                  {new Date(user.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* API Access - Enterprise only */}
          {user.subscription === 'enterprise' && (
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <Key className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-lg font-semibold text-white">API Access</h3>
                </div>
                <a
                  href="#api-docs"
                  className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
                >
                  <span>View Docs</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* API Keys List */}
              <div className="space-y-3 mb-4">
                {isLoadingKeys ? (
                  <div className="text-center py-4">
                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-sm text-slate-400 mt-2">Loading API keys...</p>
                  </div>
                ) : apiKeys.length === 0 ? (
                  <div className="text-center py-6 bg-slate-900/50 rounded-lg">
                    <Key className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">No API keys yet</p>
                    <p className="text-xs text-slate-500">Create your first API key to get started</p>
                  </div>
                ) : (
                  apiKeys.map(key => (
                    <div
                      key={key.id}
                      className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <code className="text-sm font-mono text-slate-300 bg-slate-700 px-2 py-1 rounded">
                          {key.keyPrefix}
                        </code>
                        <span className="text-sm text-slate-400">{key.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-slate-500">
                          {key.lastUsedAt
                            ? `Last used ${new Date(key.lastUsedAt).toLocaleDateString()}`
                            : 'Never used'}
                        </span>
                        <button
                          onClick={() => handleRevokeKey(key.id)}
                          className="text-red-400 hover:text-red-300 text-sm font-medium"
                        >
                          Revoke
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Create Key Button */}
              <button
                onClick={() => {
                  setNewKeyName('');
                  setNewlyCreatedKey(null);
                  setShowCreateKeyModal(true);
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create API Key</span>
              </button>

              {/* Usage Info */}
              <div className="mt-4 pt-4 border-t border-slate-700">
                <div className="text-sm text-slate-500">
                  API Rate Limit: <span className="font-medium text-slate-300">400 analyses/month</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create API Key Modal */}
      {showCreateKeyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-700">
            {newlyCreatedKey ? (
              <>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-green-900/50 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">API Key Created</h3>
                </div>

                <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3 mb-4">
                  <p className="text-sm text-yellow-200">
                    <strong>Important:</strong> Copy this key now. You won't be able to see it again!
                  </p>
                </div>

                <div className="flex items-center space-x-2 mb-6">
                  <code className="flex-1 text-sm font-mono bg-slate-900 text-slate-300 p-3 rounded-lg break-all">
                    {newlyCreatedKey}
                  </code>
                  <button
                    onClick={() => copyToClipboard(newlyCreatedKey)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"
                    title="Copy to clipboard"
                  >
                    {keyCopied ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>

                <button
                  onClick={() => {
                    setShowCreateKeyModal(false);
                    setNewlyCreatedKey(null);
                  }}
                  className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Done
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-indigo-900/50 flex items-center justify-center">
                    <Key className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">Create API Key</h3>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Key Name (optional)
                  </label>
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="e.g., Production, CI/CD, Testing"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    A name to help you identify this key
                  </p>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowCreateKeyModal(false)}
                    disabled={isCreatingKey}
                    className="flex-1 px-4 py-3 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateApiKey}
                    disabled={isCreatingKey}
                    className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    {isCreatingKey ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Creating...
                      </>
                    ) : (
                      'Create Key'
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Cancel Subscription Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-700">
            {cancelStatus === 'success' ? (
              <div className="text-center">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Subscription Cancelled</h3>
                <p className="text-slate-400">{cancelMessage}</p>
              </div>
            ) : (
              <>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-red-900/50 flex items-center justify-center">
                    <AlertOctagon className="w-5 h-5 text-red-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">Cancel Subscription</h3>
                </div>

                <p className="text-slate-400 mb-4">
                  Are you sure you want to cancel your <span className="font-medium text-white">{user.subscription}</span> subscription?
                </p>

                <div className="bg-slate-900/50 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-white mb-2">What happens when you cancel:</h4>
                  <ul className="text-sm text-slate-400 space-y-2">
                    <li className="flex items-start space-x-2">
                      <span className="text-slate-500">•</span>
                      <span>You'll keep access until the end of your billing period</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-slate-500">•</span>
                      <span>Your account will revert to trial mode (simulated data only)</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-slate-500">•</span>
                      <span>Your projects and data will be preserved</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-slate-500">•</span>
                      <span>You can resubscribe anytime</span>
                    </li>
                  </ul>
                </div>

                {cancelStatus === 'error' && (
                  <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 mb-4">
                    <div className="flex items-center space-x-2">
                      <XCircle className="w-4 h-4 text-red-400" />
                      <p className="text-sm text-red-300">{cancelMessage}</p>
                    </div>
                  </div>
                )}

                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowCancelModal(false);
                      setCancelStatus('idle');
                      setCancelMessage('');
                    }}
                    disabled={isCancelling}
                    className="flex-1 px-4 py-3 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
                  >
                    Keep Subscription
                  </button>
                  <button
                    onClick={handleCancelSubscription}
                    disabled={isCancelling}
                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    {isCancelling ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Cancelling...
                      </>
                    ) : (
                      'Cancel Subscription'
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-700">
            {passwordStatus === 'success' ? (
              <div className="text-center">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Password Changed</h3>
                <p className="text-slate-400">{passwordMessage}</p>
              </div>
            ) : (
              <>
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-blue-900/50 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">Change Password</h3>
                </div>

                {passwordStatus === 'error' && (
                  <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 mb-4">
                    <div className="flex items-center space-x-2">
                      <XCircle className="w-4 h-4 text-red-400" />
                      <p className="text-sm text-red-300">{passwordMessage}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter new password"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowPasswordModal(false);
                      setPasswordStatus('idle');
                      setPasswordMessage('');
                      setPasswordData({ newPassword: '', confirmPassword: '' });
                    }}
                    disabled={isChangingPassword}
                    className="flex-1 px-4 py-3 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleChangePassword}
                    disabled={isChangingPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    {isChangingPassword ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Changing...
                      </>
                    ) : (
                      'Change Password'
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-700">
            {deleteStatus === 'success' ? (
              <div className="text-center">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Account Deleted</h3>
                <p className="text-slate-400">{deleteMessage}</p>
              </div>
            ) : (
              <>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-red-900/50 flex items-center justify-center">
                    <AlertOctagon className="w-5 h-5 text-red-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">Delete Account</h3>
                </div>

                <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-4">
                  <p className="text-sm text-red-200">
                    <strong>Warning:</strong> This action is permanent and cannot be undone. All your data will be permanently deleted, including:
                  </p>
                  <ul className="text-sm text-red-200 mt-2 ml-4 list-disc space-y-1">
                    <li>Your profile and account information</li>
                    <li>All analyses and reports</li>
                    <li>All projects and history</li>
                    <li>API keys and usage data</li>
                  </ul>
                </div>

                <p className="text-slate-400 mb-4">
                  To confirm deletion, type <span className="font-mono font-bold text-white">DELETE</span> below:
                </p>

                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                  placeholder="Type DELETE to confirm"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4"
                />

                {deleteStatus === 'error' && (
                  <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 mb-4">
                    <div className="flex items-center space-x-2">
                      <XCircle className="w-4 h-4 text-red-400" />
                      <p className="text-sm text-red-300">{deleteMessage}</p>
                    </div>
                  </div>
                )}

                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeleteStatus('idle');
                      setDeleteMessage('');
                      setDeleteConfirmText('');
                    }}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-3 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isDeleting || deleteConfirmText !== 'DELETE'}
                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    {isDeleting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Deleting...
                      </>
                    ) : (
                      'Delete My Account'
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
    </div>
  );
}