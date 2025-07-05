import React, { useState } from 'react';
import { Search, ArrowRight, Mail, Lock, User, Building, Globe } from 'lucide-react';
import { FraudPrevention } from '../../utils/fraudPrevention';
import { FraudPreventionCheck } from '../../types';

interface AuthPageProps {
  onLogin: (user: any) => void;
}

export default function AuthPage({ onLogin }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
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
    
    // Generate a unique user ID for demo purposes
    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Simulate API call
    setTimeout(() => {
      if (isLogin) {
        // Login logic
        const user = {
          id: userId,
          email: formData.email,
          name: formData.name || 'User',
          avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
          subscription: 'free',
          createdAt: new Date().toISOString()
        };
        // Store user in localStorage
        localStorage.setItem('currentUser', JSON.stringify(user));
        onLogin(user);
      } else {
        // Signup logic - check fraud prevention for trials
        if (fraudCheck && !fraudCheck.isAllowed) {
          alert(fraudCheck.reason);
          setIsLoading(false);
          return;
        }

        const user = {
          id: userId,
          email: formData.email,
          name: formData.name,
          avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
          subscription: 'trial',
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
          createdAt: new Date().toISOString()
        };
        // Store user in localStorage
        localStorage.setItem('currentUser', JSON.stringify(user));
        onLogin(user);
      }
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
      
      <div className="relative w-full max-w-md">
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
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
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
            <div className="mt-4 text-xs text-gray-500 text-center">
              By creating an account, you agree to our Terms of Service and Privacy Policy.
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

        {/* Demo Credentials */}
        <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
          <p className="text-white text-sm mb-2">Demo Credentials:</p>
          <p className="text-blue-200 text-xs">
            Email: demo@example.com • Password: demo123
          </p>
        </div>
      </div>
    </div>
  );
}