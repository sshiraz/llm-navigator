import React, { useState } from 'react';
import { ArrowLeft, User, Mail, Building, Globe, Save, X, CheckCircle, AlertTriangle, CreditCard, Calendar, XCircle, AlertOctagon, Lock, Image, Upload, Trash2 } from 'lucide-react';
import { User as UserType } from '../../types';
import { getTrialStatus } from '../../utils/mockData';
import { supabase } from '../../lib/supabase';
import { AuthService } from '../../services/authService';

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
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">Starter</span>;
      case 'professional':
        return <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">Professional</span>;
      case 'enterprise':
        return <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">Enterprise</span>;
      case 'trial':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">Trial</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">Free</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
            <p className="text-gray-600 mt-1">Manage your profile and subscription</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Profile Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-semibold mb-4">
                {user.name.charAt(0)}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-1">{user.name}</h3>
              <p className="text-gray-600 mb-3">{user.email}</p>
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
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription Details</h3>
            
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-500 mb-1">Current Plan</div>
                <div className="font-medium text-gray-900 flex items-center">
                  {user.subscription === 'trial' ? 'Trial (Professional)' : 
                   user.subscription.charAt(0).toUpperCase() + user.subscription.slice(1)}
                </div>
              </div>
              
              {trialStatus && trialStatus.isActive && (
                <div>
                  <div className="text-sm text-gray-500 mb-1">Trial Status</div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium text-gray-900">
                      {trialStatus.daysRemaining === 0 ? 'Expires today' : 
                       `${trialStatus.daysRemaining} days remaining`}
                    </span>
                  </div>
                </div>
              )}
              
              <div>
                <div className="text-sm text-gray-500 mb-1">Payment Method</div>
                <div className="flex items-center space-x-2">
                  {user.paymentMethodAdded ? (
                    <>
                      <CreditCard className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-gray-900">
                        •••• 4242 (Visa)
                      </span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-500">
                        No payment method
                      </span>
                    </>
                  )}
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-500 mb-1">Billing Cycle</div>
                <div className="text-sm font-medium text-gray-900">
                  {user.subscription === 'trial' ? 'N/A (Trial)' : 'Monthly'}
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-500 mb-1">Member Since</div>
                <div className="text-sm font-medium text-gray-900">
                  {new Date(user.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
            
            {user.subscription !== 'enterprise' && (
              <div className="mt-6">
                <button
                  onClick={() => window.location.hash = '#pricing'}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Upgrade Plan
                </button>
              </div>
            )}
            
            {isPaidPlan && !user.cancelAtPeriodEnd && (
              <div className="mt-3">
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="w-full px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Cancel Subscription
                </button>
              </div>
            )}

            {user.cancelAtPeriodEnd && user.subscriptionEndsAt && (
              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-900">Subscription Ending</p>
                    <p className="text-xs text-yellow-800 mt-1">
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
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Profile Information</h3>
            
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Status Message */}
                {saveStatus === 'success' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-green-800">Profile updated successfully!</span>
                    </div>
                  </div>
                )}
                
                {saveStatus === 'error' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <span className="text-red-800">{errorMessage}</span>
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-100"
                      disabled
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company (Optional)
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Acme Corp"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website (Optional)
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://example.com"
                    />
                  </div>
                </div>

                {/* Company Logo - Professional/Enterprise only */}
                {['professional', 'enterprise'].includes(user.subscription) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Logo
                      <span className="ml-2 text-xs text-indigo-600 font-normal">(for branded PDF reports)</span>
                    </label>

                    {logoPreview ? (
                      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <img
                              src={logoPreview}
                              alt="Company logo preview"
                              className="max-h-12 max-w-[150px] object-contain"
                              onError={() => setLogoPreview(null)}
                            />
                            <span className="text-sm text-gray-600">Logo uploaded</span>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveLogo}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove logo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
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
                              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                              <span className="text-sm text-gray-600">Uploading...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-8 h-8 text-gray-400 mb-2" />
                              <span className="text-sm font-medium text-blue-600">Click to upload logo</span>
                              <span className="text-xs text-gray-500 mt-1">PNG, JPG up to 2MB</span>
                            </>
                          )}
                        </label>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Recommended size: 200x50px. Your logo will appear on PDF reports.
                    </p>
                  </div>
                )}

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
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
                    <div className="text-sm text-gray-500 mb-1">Full Name</div>
                    <div className="font-medium text-gray-900">{user.name}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Email Address</div>
                    <div className="font-medium text-gray-900">{user.email}</div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Subscription Features */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Your Plan Features</h3>
            
            <div className="space-y-4">
              {user.subscription === 'trial' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <Calendar className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-900 mb-1">Trial Status</h4>
                      <p className="text-sm text-yellow-800">
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
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <span className="text-gray-700">10 AI analyses per month</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <span className="text-gray-700">Basic competitor insights</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <span className="text-gray-700">Standard optimization recommendations</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <span className="text-gray-700">Email support</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <span className="text-gray-700">Standard reporting</span>
                  </div>
                </div>
              )}
              
              {user.subscription === 'professional' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <span className="text-gray-700">50 AI analyses per month</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <span className="text-gray-700">Advanced competitor strategy</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <span className="text-gray-700">Advanced optimization recommendations</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <span className="text-gray-700">Email support</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <span className="text-gray-700">Advanced reporting & analytics</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <span className="text-gray-700">Detailed performance metrics</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <span className="text-gray-700">Limited historical data retention (3 months)</span>
                  </div>
                </div>
              )}
              
              {user.subscription === 'enterprise' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <span className="text-gray-700">400 AI analyses per month</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <span className="text-gray-700">Advanced competitor strategy</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <span className="text-gray-700">White-label reporting & custom branding</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <span className="text-gray-700">Priority email support</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <span className="text-gray-700">Premium performance metrics</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <span className="text-gray-700">Unlimited projects</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <span className="text-gray-700">Unlimited users</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <span className="text-gray-700">Unlimited historical data retention</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <span className="text-gray-700">Access to all AI models including Claude 3 Opus</span>
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
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Account Security</h3>
            
            <div className="space-y-4">
              <div>
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Change Password
                </button>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-500 mb-2">Account Created</div>
                <div className="font-medium text-gray-900">
                  {new Date(user.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Subscription Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            {cancelStatus === 'success' ? (
              <div className="text-center">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Subscription Cancelled</h3>
                <p className="text-gray-600">{cancelMessage}</p>
              </div>
            ) : (
              <>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertOctagon className="w-5 h-5 text-red-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Cancel Subscription</h3>
                </div>

                <p className="text-gray-600 mb-4">
                  Are you sure you want to cancel your <span className="font-medium">{user.subscription}</span> subscription?
                </p>

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">What happens when you cancel:</h4>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li className="flex items-start space-x-2">
                      <span className="text-gray-400">•</span>
                      <span>You'll keep access until the end of your billing period</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-gray-400">•</span>
                      <span>Your account will revert to trial mode (simulated data only)</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-gray-400">•</span>
                      <span>Your projects and data will be preserved</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-gray-400">•</span>
                      <span>You can resubscribe anytime</span>
                    </li>
                  </ul>
                </div>

                {cancelStatus === 'error' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center space-x-2">
                      <XCircle className="w-4 h-4 text-red-600" />
                      <p className="text-sm text-red-800">{cancelMessage}</p>
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
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            {passwordStatus === 'success' ? (
              <div className="text-center">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Password Changed</h3>
                <p className="text-gray-600">{passwordMessage}</p>
              </div>
            ) : (
              <>
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Change Password</h3>
                </div>

                {passwordStatus === 'error' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center space-x-2">
                      <XCircle className="w-4 h-4 text-red-600" />
                      <p className="text-sm text-red-800">{passwordMessage}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter new password"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
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
    </div>
  );
}