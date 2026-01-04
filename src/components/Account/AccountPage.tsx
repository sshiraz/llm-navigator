import React, { useState } from 'react';
import { ArrowLeft, User, Mail, Building, Globe, Save, X, CheckCircle, AlertTriangle, CreditCard, Calendar } from 'lucide-react';
import { User as UserType } from '../../types';
import { getTrialStatus } from '../../utils/mockData';

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
    website: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  const trialStatus = getTrialStatus(user);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus('idle');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update profile
      onUpdateProfile({
        name: formData.name,
        // Don't update email for demo
      });
      
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
            
            {user.subscription !== 'free' && user.subscription !== 'trial' && (
              <div className="mt-3">
                <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  Manage Subscription
                </button>
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
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
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
    </div>
  );
}