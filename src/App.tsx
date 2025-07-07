import React, { useState, useEffect } from 'react';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import Dashboard from './components/Dashboard/Dashboard';
import NewAnalysis from './components/Analysis/NewAnalysis';
import AnalysisResults from './components/Analysis/AnalysisResults';
import ProjectDetail from './components/Projects/ProjectDetail';
import PricingTiers from './components/Subscription/PricingTiers';
import UserDashboard from './components/Admin/UserDashboard';
import AccountPage from './components/Account/AccountPage';
import ContactPage from './components/Contact/ContactPage';
import PrivacyPolicy from './components/Legal/PrivacyPolicy';
import TermsOfService from './components/Legal/TermsOfService';
import CompetitorStrategy from './components/Reports/CompetitorStrategy';
import LandingPage from './components/Landing/LandingPage';
import AuthPage from './components/Auth/AuthPage';
import { mockAnalyses } from './utils/mockData';
import { Project, Analysis, User } from './types';
import PaymentDebugger from './components/Debug/PaymentDebugger';
import WebhookManager from './components/Debug/WebhookManager';
import WebhookDeployer from './components/Debug/WebhookDeployer';
import { isLiveMode } from './utils/liveMode';
import { clearUserData } from './utils/authUtils';
import WebhookHelper from './components/Debug/WebhookHelper';
import LogoutHandler from './components/Auth/LogoutHandler';
import { isAdminUser } from './utils/authUtils';

function App() {
  // Clear user data on initial load
  useEffect(() => {
    // Don't clear user data on initial load - this was causing the blank screen
    // clearUserData();
  }, []);

  const [user, setUser] = useState<User | null>(null);
  const [activeSection, setActiveSection] = useState(() => {
    // Check URL hash for initial section
    const hash = window.location.hash.slice(1);
    return hash || 'landing'; 
  });
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<Analysis | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);

  // Check if user is admin
  useEffect(() => {
    setIsAdmin(isAdminUser());
  }, [user]);

  // Load current analysis from localStorage if available
  useEffect(() => {
    try {
      const storedAnalysis = localStorage.getItem('currentAnalysis');
      if (storedAnalysis && activeSection === 'analysis-results') {
        setCurrentAnalysis(JSON.parse(storedAnalysis));
        // Clear it after loading to prevent stale data
        localStorage.removeItem('currentAnalysis');
      }
    } catch (error) {
      console.error('Error loading current analysis from localStorage:', error);
    }
  }, [activeSection]);

  // Listen for hash changes to handle browser back/forward buttons
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash) {
        setActiveSection(hash);
      } else {
        setActiveSection('landing');
      }
      
      // If we're on the analysis-results page, try to load the analysis from localStorage
      if (hash === 'analysis-results') {
        try {
          const storedAnalysis = localStorage.getItem('currentAnalysis');
          if (storedAnalysis) {
            setCurrentAnalysis(JSON.parse(storedAnalysis));
          }
        } catch (error) {
          console.error('Error loading analysis from localStorage:', error);
        }
      }
    };

    // Add event listener for hash changes
    window.addEventListener('hashchange', handleHashChange);

    // Run once on initial load to handle direct URL access
    handleHashChange();
    
    // Clean up event listener
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Load projects from localStorage when user changes
  useEffect(() => {
    if (user) {
      try {
        // Get projects from localStorage
        const storedProjects = JSON.parse(localStorage.getItem('projects') || '[]');
        
        // Filter projects to only show those belonging to the current user
        const userProjects = storedProjects.filter((project: Project) => 
          project.userId === user.id
        );
        
        setProjects(userProjects);
      } catch (error) {
        console.error('Error loading projects from localStorage:', error);
      }
    } else {
      setProjects([]);
    }
  }, [user]);

  // Check URL parameters for checkout success
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    const plan = params.get('plan');
    const userId = params.get('user_id');
    
    if (sessionId && plan && userId) {
      // Handle successful checkout
      console.log('Checkout successful!', { sessionId, plan });
      // You would typically verify the session and update the user's subscription here
      
      // For demo purposes, update the user's subscription in localStorage
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          const updatedUser = {
            ...parsedUser,
            subscription: plan,
            paymentMethodAdded: true
          };
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));
          setUser(updatedUser);
        } catch (e) {
          console.error('Failed to update stored user', e);
        }
      }
    }
  }, []);

  // Load user from localStorage on initial load
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          // If we're on the auth page but already logged in, redirect to dashboard
          if (activeSection === 'auth') {
            setActiveSection('dashboard');
            window.location.hash = 'dashboard';
          }
        } catch (e) {
          console.error('Failed to parse stored user', e);
          localStorage.removeItem('currentUser'); // Clear invalid data
        }
      }
    } catch (error) {
      console.error('Error accessing localStorage:', error);
    }
  }, []);

  // Check if basic configuration is present
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  const isBasicConfigured = supabaseUrl && supabaseKey;
  
  const handleLogin = (userData: User) => {
    setUser(userData);
    setActiveSection('dashboard');
    
    // Ensure hash is set to dashboard
    if (window.location.hash !== '#dashboard') {
      window.location.hash = 'dashboard';
    }
    
    // Store user data in localStorage for persistence
    localStorage.setItem('currentUser', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    
    // Clear user data from localStorage
    localStorage.removeItem('currentUser');
    
    // Redirect to landing page
    setActiveSection('landing');
    window.location.hash = '';
  };

  // Handle back button functionality
  const handleBack = () => {
    // Default back behavior goes to dashboard
    setActiveSection('dashboard');
    window.location.hash = 'dashboard';
  };

  const handleProjectSelect = (project: Project) => {
    // Find the project in our state to ensure we have the latest version
    const selectedProject = projects.find(p => p.id === project.id) || project;
    setSelectedProject(selectedProject);
    window.location.hash = 'project-detail';
  };

  const handleNewAnalysisClick = () => {
    setActiveSection('new-analysis');
    window.location.hash = '#new-analysis';
  };

  const handleNewAnalysis = (website: string, keywords: string[]) => {
    // This will be handled by the AnalysisEngine now
    // The analysis creation logic is moved to AnalysisProgress component
    const newAnalysis: Analysis = {
      id: Date.now().toString(),
      projectId: selectedProject?.id || 'default',
      userId: user?.id || 'anonymous',
      website,
      keywords,
      score: Math.floor(Math.random() * 40) + 60, // 60-100
      metrics: {
        contentClarity: Math.floor(Math.random() * 40) + 60,
        semanticRichness: Math.floor(Math.random() * 40) + 60,
        structuredData: Math.floor(Math.random() * 40) + 60,
        naturalLanguage: Math.floor(Math.random() * 40) + 60,
        keywordRelevance: Math.floor(Math.random() * 40) + 60,
      },
      insights: 'Your content shows strong potential for AI-powered search optimization. Focus on improving structured data and semantic relationships to boost your LLM discoverability score.',
      predictedRank: Math.floor(Math.random() * 5) + 1,
      category: 'Top Result',
      recommendations: [
        {
          id: '1',
          title: 'Implement FAQ Schema',
          description: 'Add FAQ structured data to help AI assistants better understand your content.',
          priority: 'high',
          difficulty: 'medium',
          estimatedTime: '1-2 weeks',
          expectedImpact: 12
        },
        {
          id: '2',
          title: 'Enhance Content Clarity',
          description: 'Restructure content with clear headings and concise answers to common questions.',
          priority: 'medium',
          difficulty: 'easy',
          estimatedTime: '3-5 days',
          expectedImpact: 8
        }
      ],
      createdAt: new Date().toISOString(),
      isSimulated: user ? !['starter', 'professional', 'enterprise'].includes(user.subscription) : true
    };
    
    setCurrentAnalysis(newAnalysis);
    
    // Store analyses in localStorage
    try {
      if (user) {
        const existingAnalyses = JSON.parse(localStorage.getItem('analyses') || '[]');
        localStorage.setItem('analyses', JSON.stringify(existingAnalyses));
      switch (activeSection) {
        case 'landing':
          return <LandingPage onGetStarted={handleGetStarted} />;
        case 'auth':
          return <AuthPage onLogin={handleLogin} />;
        case 'logout':
          return <LogoutHandler onLogout={handleLogout} />;
        case 'logout':
          return <LogoutHandler onLogout={handleLogout} />;
        case 'account':
          return user ? (
            <AccountPage 
              user={user} 
              onBack={() => {
                setActiveSection('dashboard');
                window.location.hash = 'dashboard';
              }}
              onUpdateProfile={(updates) => {
                const updatedUser = { ...user, ...updates };
                setUser(updatedUser);
                localStorage.setItem('currentUser', JSON.stringify(updatedUser));
              }}
            />
          ) : <AuthPage onLogin={handleLogin} />;
        case 'contact':
          return <ContactPage onBack={() => {
            setActiveSection('landing');
            window.location.hash = '';
          }} />;
        case 'privacy':
          return <PrivacyPolicy onBack={() => {
            setActiveSection('landing');
            window.location.hash = '';
          }} />;
        case 'terms':
          return <TermsOfService onBack={() => {
            setActiveSection('landing');
            window.location.hash = '';
          }} />;
        case 'admin-users':
          // Check if user is admin
          if (!user || !user.isAdmin) {
            // Redirect to dashboard if not admin
            setTimeout(() => {
              window.location.hash = 'dashboard';
            }, 100);
            return <div className="flex items-center justify-center h-screen">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-red-600 mb-2">Access Denied</h2>
                <p className="text-gray-600">You don't have permission to access this page.</p>
              </div>
            </div>;
          }
          // Check if user is admin
          if (!user || !user.isAdmin) {
            // Redirect to dashboard if not admin
            setTimeout(() => {
              window.location.hash = '#dashboard';
            }, 100);
            return <div className="flex items-center justify-center h-screen">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-red-600 mb-2">Access Denied</h2>
                <p className="text-gray-600">You don't have permission to access this page.</p>
              </div>
            </div>;
          }
          return <UserDashboard />;
        default:
          return <LandingPage onGetStarted={handleGetStarted} />;
      }
    }
    
    // Protected routes that require login
    if (!user && ['dashboard', 'new-analysis', 'analysis-results', 'project-detail', 'pricing', 'competitor-strategy'].includes(activeSection)) {
      return <AuthPage onLogin={handleLogin} />;
    }

    switch (activeSection) {
      case 'dashboard':
        return <Dashboard onProjectSelect={handleProjectSelect} onNewAnalysis={handleNewAnalysisClick} />;
      
      case 'new-analysis':
        return <NewAnalysis onAnalyze={handleNewAnalysis} user={user} />;
      
      case 'analysis-results':
        return currentAnalysis ? (
          <AnalysisResults 
            analysis={currentAnalysis} 
            onBack={() => setActiveSection('new-analysis')} 
          />
        ) : null;
      
      case 'project-detail':
        return selectedProject ? (
          <ProjectDetail 
            project={selectedProject}
            onBack={() => setActiveSection('dashboard')}
            onDelete={(projectId) => {
              // Get stored projects from localStorage
              try {
                const storedProjects = JSON.parse(localStorage.getItem('projects') || '[]');
                
                // Filter out the project to delete
                const updatedProjects = storedProjects.filter((p: Project) => p.id !== projectId);
                
                // Update state
                setProjects(updatedProjects);
                
                // Save to localStorage
                localStorage.setItem('projects', JSON.stringify(updatedProjects));
                
                // Navigate back to dashboard
                setActiveSection('dashboard');
              } catch (error) {
                console.error('Error deleting project:', error);
                alert('Failed to delete project. Please try again.');
              }
            }}
          />
        ) : null;

      case 'pricing':
        // Only show pricing page to admin users
        return isAdmin ? (
          <PricingTiers currentPlan={user?.subscription || 'free'} onUpgrade={handleUpgrade} />
        ) : (
          <div className="max-w-2xl mx-auto text-center p-8 bg-yellow-50 rounded-xl border-2 border-yellow-300">
            <h2 className="text-2xl font-bold text-yellow-800 mb-4">🚧 Pricing Page Temporarily Unavailable</h2>
            <p className="text-yellow-700 mb-6">
              We're currently updating our payment system. The pricing page will be available again soon.
            </p>
            <button
              onClick={() => setActiveSection('dashboard')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        );

      case 'competitor-strategy':
        return (
          <CompetitorStrategy
            userAnalysis={analyses[0] || mockAnalyses[0]} 
            competitorAnalyses={mockAnalyses.filter(a => a.userId !== user?.id)} 
            onBack={handleBack}
          />
        );
      
      default:
        return <LandingPage onGetStarted={handleGetStarted} />;
    }
  };

  // Show landing page or auth page without sidebar/header
  if (activeSection === 'landing' || activeSection === 'auth' || activeSection === 'contact' || activeSection === 'privacy' || activeSection === 'terms' || activeSection === 'admin-users' || activeSection === 'account') {
    return (
      <>
        {renderContent()}
        {isLiveMode && isAdmin && <PaymentDebugger />}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar 
        activeSection={activeSection} 
        onSectionChange={setActiveSection}
        onLogout={handleLogout}
      />
      
      <div className="flex-1 flex flex-col">
        {user && <Header user={user} />}
        
        <main className="flex-1 p-8">
          {renderContent()}
        </main>
      </div>
      {isLiveMode && isAdmin && <PaymentDebugger />}
      {isAdmin && <WebhookHelper />}
      {isAdmin && <WebhookManager />}
      {isAdmin && <WebhookDeployer />}
    </div>
  );
}

export default App;