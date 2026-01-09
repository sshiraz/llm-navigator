import React, { useState } from 'react';
import { Search, ArrowRight, Mail, Lock, User as UserIcon, Building, Globe, CheckCircle, RefreshCw } from 'lucide-react';
import { FraudPrevention } from '../../utils/fraudPrevention';
import { AuthService } from '../../services/authService';
import { FraudPreventionCheck, User } from '../../types';
import { sanitizeText, sanitizeEmail, sanitizePassword, sanitizeUrl } from '../../utils/sanitize';

interface AuthPageProps {
  onLogin: (user: User) => void;
  emailJustConfirmed?: boolean;
  onConfirmationAcknowledged?: () => void;
}

// Convert Supabase profile (snake_case) to User type (camelCase)
function profileToUser(profile: any): User {
  return {
    id: profile.id,
    email: profile.email,
    name: profile.name || 'User',
    avatar: profile.avatar || 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
    subscription: profile.subscription || 'trial',
    trialEndsAt: profile.trial_ends_at,
    createdAt: profile.created_at,
    isAdmin: profile.is_admin || false,
    deviceFingerprint: profile.device_fingerprint,
    ipAddress: profile.ip_address,
    paymentMethodAdded: profile.payment_method_added || false,
    stripeCustomerId: profile.stripe_customer_id,
    stripeSubscriptionId: profile.stripe_subscription_id,
    cancelAtPeriodEnd: profile.cancel_at_period_end,
    subscriptionEndsAt: profile.subscription_ends_at
  };
}

export default function AuthPage({ onLogin, emailJustConfirmed, onConfirmationAcknowledged }: AuthPageProps) {
  // Check URL for signup parameter (e.g., #auth?signup=true)
  const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
  const startWithSignup = urlParams.get('signup') === 'true';

  const [isLogin, setIsLogin] = useState(!startWithSignup);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    company: '',
    website: ''
  });
  const [fraudCheck, setFraudCheck] = useState<FraudPreventionCheck | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Email confirmation states
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleResendEmail = async () => {
    setIsResending(true);
    setResendSuccess(false);
    try {
      const result = await AuthService.resendConfirmationEmail(confirmationEmail);
      if (result.success) {
        setResendSuccess(true);
        setTimeout(() => setResendSuccess(false), 5000);
      } else {
        setError(result.error || 'Failed to resend email');
      }
    } catch (err) {
      setError('Failed to resend confirmation email');
    } finally {
      setIsResending(false);
    }
  };

  const handleEmailBlur = async () => {
    if (!formData.email || isLogin) return;

    // Sanitize email before fraud check
    const sanitizedEmail = sanitizeEmail(formData.email);
    if (!sanitizedEmail) return;

    setIsChecking(true);
    try {
      const check = await FraudPrevention.checkTrialEligibility(sanitizedEmail);
      setFraudCheck(check);
    } catch (error) {
      console.error('Fraud check failed:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Sanitize all form inputs before processing
    const sanitizedEmail = sanitizeEmail(formData.email);
    const sanitizedPassword = sanitizePassword(formData.password);
    const sanitizedName = sanitizeText(formData.name);
    const sanitizedCompany = sanitizeText(formData.company);
    const sanitizedWebsite = formData.website ? sanitizeUrl(formData.website) : '';

    // Validate sanitized email
    if (!sanitizedEmail) {
      setError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    try {
      if (isLogin) {
        // Login via Supabase Auth
        const result = await AuthService.signIn(sanitizedEmail, sanitizedPassword);

        if (!result.success) {
          setError(result.error || 'Invalid email or password');
          setIsLoading(false);
          return;
        }

        const user = profileToUser(result.data.profile);

        // Store current user in localStorage for app state
        localStorage.setItem('currentUser', JSON.stringify(user));

        onLogin(user);
      } else {
        // Check fraud prevention for trials
        if (fraudCheck && !fraudCheck.isAllowed) {
          setError(fraudCheck.reason || 'Trial not allowed');
          setIsLoading(false);
          return;
        }

        // Sign up via Supabase Auth with sanitized inputs
        const result = await AuthService.signUp({
          email: sanitizedEmail,
          password: sanitizedPassword,
          name: sanitizedName || 'New User',
          company: sanitizedCompany,
          website: sanitizedWebsite
        });

        if (!result.success) {
          setError(result.error || 'Failed to create account');
          setIsLoading(false);
          return;
        }

        // Check if email confirmation is required
        if (result.data.requiresEmailConfirmation) {
          setConfirmationEmail(sanitizedEmail);
          setShowEmailConfirmation(true);
          setIsLoading(false);
          return;
        }

        const user = profileToUser(result.data.profile);

        // Store current user in localStorage for app state
        localStorage.setItem('currentUser', JSON.stringify(user));

        onLogin(user);
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show email confirmation screen
  if (showEmailConfirmation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>

        <div className="relative w-full max-w-md bg-transparent">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Search className="w-7 h-7 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-2xl font-bold text-white">LLM Navigator</h1>
                <p className="text-sm text-blue-200">Answer Engine Optimization</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h2>
            <p className="text-gray-600 mb-6">
              We sent a confirmation link to<br />
              <strong className="text-gray-900">{confirmationEmail}</strong>
            </p>

            <p className="text-sm text-gray-500 mb-6">
              Click the link in the email to activate your account and start your free trial.
            </p>

            {resendSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-center space-x-2 text-green-800">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Confirmation email sent!</span>
                </div>
              </div>
            )}

            <button
              onClick={handleResendEmail}
              disabled={isResending}
              className="w-full py-3 px-4 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-all flex items-center justify-center space-x-2 mb-4"
            >
              {isResending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Resend Confirmation Email</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                setShowEmailConfirmation(false);
                setIsLogin(true);
                setFormData({ name: '', email: '', password: '', company: '', website: '' });
              }}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>

      <div className="relative w-full max-w-md bg-transparent">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Search className="w-7 h-7 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-white">LLM Navigator</h1>
              <p className="text-sm text-blue-200">Answer Engine Optimization</p>
            </div>
          </div>
        </div>

        {/* Email Confirmed Success Banner */}
        {emailJustConfirmed && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 text-green-800">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Email confirmed! You can now sign in.</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-2 text-red-800">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Demo Credentials */}

        {/* Auth Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {isLogin ? 'Welcome Back' : 'Start Your Free Trial'}
            </h2>
            <p className="text-gray-600">
              {isLogin 
                ? 'Sign in to your LLM Navigator account' 
                : 'Join thousands optimizing for AI search'
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  onBlur={handleEmailBlur}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="john@company.com"
                />
              </div>
              
              {isChecking && (
                <div className="mt-2 flex items-center space-x-2 text-sm text-gray-600">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Checking eligibility...</span>
                </div>
              )}
              
              {fraudCheck && !isLogin && (
                <div className="mt-2">
                  {fraudCheck.isAllowed ? (
                    <div className="text-sm text-emerald-600">
                      ✓ Trial approved
                    </div>
                  ) : (
                    <div className="text-sm text-red-600">
                      ⚠ {fraudCheck.reason}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={isLogin ? "Enter your password" : "Create a password"}
                />
              </div>
            </div>

            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company (Optional)
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
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
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://acme.com"
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isLoading || (!isLogin && fraudCheck && !fraudCheck.isAllowed)}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{isLogin ? 'Signing In...' : 'Creating Account...'}</span>
                </>
              ) : (
                <>
                  <span>{isLogin ? 'Sign In' : 'Start Free Trial'}</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Toggle between login/signup */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setFraudCheck(null);
                setFormData({ name: '', email: '', password: '', company: '', website: '' });
              }}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              {isLogin 
                ? "Don't have an account? Start your free trial" 
                : "Already have an account? Sign in"
              }
            </button>
          </div>

          {!isLogin && (
            <div className="mt-4 text-xs text-gray-500 text-center space-y-1">
              <p>
                By creating an account, you agree to our <a href="#terms" onClick={(e) => {e.preventDefault(); window.location.hash = '#terms';}} className="text-blue-600 hover:text-blue-700">Terms of Service</a> and <a href="#privacy" onClick={(e) => {e.preventDefault(); window.location.hash = '#privacy';}} className="text-blue-600 hover:text-blue-700">Privacy Policy</a>.
              </p>
              <br />
              14-day free trial • No credit card required
            </div>
          )}

          {isLogin && (
            <div className="mt-4 text-center">
              <button className="text-sm text-blue-600 hover:text-blue-700">
                Forgot your password?
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}