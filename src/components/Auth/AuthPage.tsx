import React, { useState } from 'react';
import { Search, ArrowRight, Mail, Lock, User as UserIcon, Building, Globe } from 'lucide-react';
import { FraudPrevention } from '../../utils/fraudPrevention';
import { FraudPreventionCheck, User } from '../../types';
import { clearUserData } from '../../utils/authUtils';

interface AuthPageProps {
  onLogin: (user: User) => void;
}

export default function AuthPage({ onLogin }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    company: '',
    website: ''
  });
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [fraudCheck, setFraudCheck] = useState<FraudPreventionCheck | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailBlur = async () => {
    if (!formData.email || isLogin) return;
    
    setIsChecking(true);
    try {
      const check = await FraudPrevention.checkTrialEligibility(formData.email);
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
    
    // Clear debug info
    setDebugInfo(null);
    
    // Trim email to prevent whitespace issues
    const trimmedEmail = formData.email.trim();

    // Special handling for admin account
    if (isLogin && trimmedEmail.toLowerCase() === 'info@convologix.com' && formData.password === '4C0nv0@LLMNav') {
      console.log('Admin login detected');
      // Create admin user with unlimited access
      // Don't log sensitive information
      const adminUser: User = {
        id: 'admin-user',
        email: trimmedEmail, // Use the exact case the user entered
        name: 'Admin User',
        avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
        subscription: 'enterprise',
        isAdmin: true,
        createdAt: new Date().toISOString(),
        paymentMethodAdded: true
      };
      
      // Store admin user in localStorage
      localStorage.setItem('currentUser', JSON.stringify(adminUser));
      console.log('Admin login successful', { id: adminUser.id });
      
      // Call onLogin first, then set hash
      onLogin(adminUser);
      
      // Set hash to dashboard after login to ensure proper redirection
      setTimeout(() => {
        window.location.hash = 'dashboard';
      }, 100);
      
      setIsLoading(false);
      return;
    }
    
    // Simulate API call
    setTimeout(() => {
      if (isLogin) {
        // Don't log credentials
        console.log('Login attempt with email:', trimmedEmail);
        // Check if user exists in localStorage
        setDebugInfo('Checking localStorage for users...');
        try {
          const existingUsersList = JSON.parse(localStorage.getItem('users') || '[]');
          setDebugInfo(`Found ${existingUsersList.length} users in localStorage. Looking for: ${trimmedEmail}`);
          console.log('Found users in localStorage:', existingUsersList.length);
          
          const user = existingUsersList.find((u: any) => 
            u.email && u.email.toLowerCase() === trimmedEmail.toLowerCase()
          );
        
          if (!user) {
            console.error('No account found with email:', trimmedEmail);
            setDebugInfo(`No account found with email: ${trimmedEmail}`);
            setError('No account found with this email address');
            setIsLoading(false);
            return;
          }
        
          // Validate password (in a real app, this would be done securely on the server)
          if (user.password !== formData.password) {
            console.error('Invalid password');
            setDebugInfo('Invalid password');
            setError('Invalid password');
            setIsLoading(false);
            return;
          }
        
          // Login successful - remove password before storing in state
          const { password, ...userWithoutPassword } = user;
          const userData = {
            ...userWithoutPassword, 
            email: user.email, // Preserve original email case 
            avatar: userWithoutPassword.avatar || 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2'
          };
        
          // Store current user in localStorage
          localStorage.setItem('currentUser', JSON.stringify(userData));
          console.log('Login successful', { id: userData.id });
          setDebugInfo('Login successful, redirecting to dashboard...');
          
          // Call onLogin first, then set hash
          onLogin(userData as User);
          
          // Set hash to dashboard after login
          setTimeout(() => {
            window.location.hash = 'dashboard';
          }, 100);
        } catch (error) {
          console.error('Error parsing users from localStorage:', error);
          setDebugInfo(`Error parsing users: ${error.message}`);
          setError('An error occurred during login. Please try again.');
          setIsLoading(false);
        }
      } else {
        // Check if email already exists
        try {
          const existingUsersList = JSON.parse(localStorage.getItem('users') || '[]');
          console.log('Checking if email exists');
          
          const existingUser = existingUsersList.find((u: any) => 
            u.email && u.email.toLowerCase() === trimmedEmail.toLowerCase()
          );
          
          if (existingUser) {
            setError('An account with this email already exists');
            setIsLoading(false);
            return;
          }
          
          // Generate a unique user ID for demo purposes
          const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
          
          // Signup logic - check fraud prevention for trials
          if (fraudCheck && !fraudCheck.isAllowed) {
            setError(fraudCheck.reason || 'Trial not allowed');
            setIsLoading(false);
            return;
          }

          const user = {
            id: userId,
            email: trimmedEmail,
            name: formData.name || 'New User',
            avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
            subscription: 'trial',
            // Set trial to end 14 days from now at 23:59:59
            trialEndsAt: (() => {
              const date = new Date();
              date.setDate(date.getDate() + 14); // Add exactly 14 days
              date.setHours(23, 59, 59, 999); // Set to end of day
              return date.toISOString();
            })(),
            createdAt: new Date().toISOString()
          };
          
          // Store user in localStorage
          const usersList = JSON.parse(localStorage.getItem('users') || '[]');
          const newUser = {
            ...user,
            password: formData.password // In a real app, this would be hashed
          };
          usersList.push(newUser);
          localStorage.setItem('users', JSON.stringify(usersList)); 
          
          // Store current user in localStorage
          localStorage.setItem('currentUser', JSON.stringify(user)); 
          console.log('Signup successful', { id: user.id });
          setDebugInfo('Signup successful, redirecting to dashboard...');
          
          // Call onLogin first, then set hash
          onLogin(user);
          
          // Set hash to dashboard after login
          setTimeout(() => {
            window.location.hash = 'dashboard';
          }, 100);
        } catch (error) {
          console.error('Error during signup:', error);
          setDebugInfo(`Error during signup: ${error.message}`);
          setError('An error occurred during signup. Please try again.');
          setIsLoading(false);
        }
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      {/* Background Pattern */}
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

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Debug Info - Only in development */}
        {import.meta.env.DEV && debugInfo && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 text-xs">
            <div className="font-mono text-gray-600">
              {debugInfo}
            </div>
          </div>
        )}

        {/* Auth Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Search className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-xl font-bold text-gray-900">LLM Navigator</h1>
              <p className="text-xs text-gray-500">Answer Engine Optimization</p>
            </div>
          </div>
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
            {isLogin && (
              <div className="mt-2 text-sm text-blue-600">
                <strong>Demo credentials:</strong> demo@example.com / demo123
              </div>
            )}
            {import.meta.env.DEV && (
              <div className="mt-2 text-sm text-blue-600">
                <strong>Demo credentials:</strong> demo@example.com / demo123
              </div>
            )}
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