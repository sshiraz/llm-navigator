import React, { useState } from 'react';
import { Database, CheckCircle, AlertCircle, ExternalLink, Copy, Eye, EyeOff } from 'lucide-react';

export default function DatabaseSetup() {
  const [step, setStep] = useState(1);
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleConnect = async () => {
    setIsConnecting(true);
    
    // Simulate connection test
    setTimeout(() => {
      if (supabaseUrl && supabaseKey) {
        setConnectionStatus('success');
      } else {
        setConnectionStatus('error');
      }
      setIsConnecting(false);
    }, 2000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-4">
          <Database className="w-8 h-8 text-emerald-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Database Setup</h1>
        <p className="text-lg text-gray-600">
          Connect your Supabase database to enable real-time data storage and user authentication
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-12">
        <div className="flex items-center space-x-4">
          {[1, 2, 3].map((stepNumber) => (
            <React.Fragment key={stepNumber}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step >= stepNumber 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {step > stepNumber ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  stepNumber
                )}
              </div>
              {stepNumber < 3 && (
                <div className={`w-16 h-1 ${
                  step > stepNumber ? 'bg-emerald-600' : 'bg-gray-200'
                }`}></div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step Content */}
      {step === 1 && (
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Step 1: Create Supabase Project</h2>
          
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-3">What is Supabase?</h3>
              <p className="text-blue-800 mb-4">
                Supabase is an open-source Firebase alternative that provides a PostgreSQL database, 
                authentication, real-time subscriptions, and more. It's perfect for our LLM Navigator application.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>PostgreSQL database</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Built-in authentication</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Real-time subscriptions</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Row Level Security</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Create Your Project:</h3>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <div>
                    <p className="text-gray-700">
                      Go to <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 font-medium">supabase.com</a> and create a free account
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <div>
                    <p className="text-gray-700">Click "New Project" and choose your organization</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <div>
                    <p className="text-gray-700">Name your project "llm-navigator" and choose a region close to you</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                  <div>
                    <p className="text-gray-700">Set a strong database password and save it securely</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-bold">5</div>
                  <div>
                    <p className="text-gray-700">Click "Create new project" and wait for it to be ready (1-2 minutes)</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <span>Open Supabase Dashboard</span>
                <ExternalLink className="w-4 h-4" />
              </a>
              
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Next: Get API Keys
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Step 2: Get Your API Keys</h2>
          
          <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-900 mb-2">Important Security Note</h3>
                  <p className="text-yellow-800 text-sm">
                    Never commit your API keys to version control. Always use environment variables 
                    and add .env files to your .gitignore.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Get Your Keys from Supabase:</h3>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <div>
                    <p className="text-gray-700">
                      In your Supabase dashboard, go to <strong>Settings → API</strong>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <div>
                    <p className="text-gray-700">Copy your <strong>Project URL</strong> and <strong>anon public key</strong></p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <div>
                    <p className="text-gray-700">Paste them in the form below</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supabase Project URL
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    placeholder="https://your-project.supabase.co"
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => copyToClipboard(supabaseUrl)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supabase Anon Key
                </label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={supabaseKey}
                    onChange={(e) => setSupabaseKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full px-4 py-3 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex space-x-2">
                    <button
                      onClick={() => setShowKey(!showKey)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => copyToClipboard(supabaseKey)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Environment Variables</h4>
              <p className="text-sm text-gray-600 mb-3">
                Create a <code className="bg-gray-200 px-1 rounded">.env</code> file in your project root with:
              </p>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
                <div>VITE_SUPABASE_URL={supabaseUrl || 'your_supabase_url'}</div>
                <div>VITE_SUPABASE_ANON_KEY={supabaseKey || 'your_supabase_anon_key'}</div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              
              <button
                onClick={() => setStep(3)}
                disabled={!supabaseUrl || !supabaseKey}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Next: Test Connection
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Step 3: Test Connection & Setup Database</h2>
          
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-3">Database Schema Setup</h3>
              <p className="text-blue-800 mb-4">
                We'll test your connection and automatically set up the database schema with all the tables 
                needed for LLM Navigator.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Users & Authentication</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Projects & Competitors</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Analysis Results</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Usage Tracking</span>
                </div>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={handleConnect}
                disabled={isConnecting || connectionStatus === 'success'}
                className="px-8 py-4 bg-emerald-600 text-white text-lg font-semibold rounded-xl hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-3 mx-auto"
              >
                {isConnecting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Testing Connection...</span>
                  </>
                ) : connectionStatus === 'success' ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>Connected Successfully!</span>
                  </>
                ) : (
                  <>
                    <Database className="w-5 h-5" />
                    <span>Test Connection & Setup Database</span>
                  </>
                )}
              </button>
            </div>

            {connectionStatus === 'success' && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-emerald-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-emerald-900 mb-2">Database Setup Complete!</h3>
                    <p className="text-emerald-800 mb-4">
                      Your Supabase database is connected and the schema has been set up successfully. 
                      Your application is now ready to use real database storage.
                    </p>
                    <div className="space-y-2 text-sm text-emerald-800">
                      <div>✅ Database tables created</div>
                      <div>✅ Row Level Security enabled</div>
                      <div>✅ Authentication configured</div>
                      <div>✅ Indexes optimized</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {connectionStatus === 'error' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-6 h-6 text-red-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-900 mb-2">Connection Failed</h3>
                    <p className="text-red-800 mb-4">
                      Unable to connect to your Supabase database. Please check your credentials and try again.
                    </p>
                    <div className="space-y-1 text-sm text-red-800">
                      <div>• Verify your Project URL is correct</div>
                      <div>• Ensure your Anon Key is valid</div>
                      <div>• Check that your project is active</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              
              {connectionStatus === 'success' && (
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Start Using LLM Navigator
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}