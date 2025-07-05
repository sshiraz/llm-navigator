import React, { useState, useEffect } from 'react';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import Dashboard from './components/Dashboard/Dashboard';
import NewAnalysis from './components/Analysis/NewAnalysis';
import AnalysisResults from './components/Analysis/AnalysisResults';
import ProjectDetail from './components/Projects/ProjectDetail';
import PricingTiers from './components/Subscription/PricingTiers';
import CompetitorStrategy from './components/Reports/CompetitorStrategy';
import LandingPage from './components/Landing/LandingPage';
import AuthPage from './components/Auth/AuthPage';
import ConfigurationStatus from './components/Setup/ConfigurationStatus';
import { mockProjects, mockAnalyses } from './utils/mockData';
import { Project, Analysis, User } from './types';
import PaymentDebugger from './components/Debug/PaymentDebugger';
import WebhookDebugger from './components/Debug/WebhookDebugger';
import SubscriptionFixTool from './components/Debug/SubscriptionFixTool';
import WebhookSecretUpdater from './components/Debug/WebhookSecretUpdater';
import AutomaticWebhookFixer from './components/Debug/AutomaticWebhookFixer';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeSection, setActiveSection] = useState(() => {
    // Check if we have a stored user
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        return 'dashboard';
      } catch (e) {
        console.error('Failed to parse stored user', e);
      }
    }
    
    // Check URL hash for initial section
    const hash = window.location.hash.slice(1);
    return hash || 'landing';
  });
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<Analysis | null>(null);

  // Check URL parameters for checkout success
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // Only process checkout parameters once by checking and clearing them
    const sessionId = params.get('session_id');
    const plan = params.get('plan');
    const userId = params.get('user_id');
    
    if (sessionId && plan) {
      // Handle successful checkout
      console.log('Checkout successful!', { sessionId, plan, userId });
      
      // Clear URL parameters to prevent infinite loop
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, newUrl);
      
      if (user) {
        const updatedUser = {
          ...user,
          subscription: plan
        };
        setUser(updatedUser);
        // Store updated user in localStorage to persist across page refreshes
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        // Use a non-blocking notification instead of alert to prevent disruption
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50';
        notification.innerHTML = `<strong>Success!</strong> Your subscription has been updated to ${plan}! You're all set.`;
        document.body.appendChild(notification);
        setTimeout(() => {
          notification.remove();
        }, 5000);
      } else if (userId) {
        // Try to restore user from localStorage
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            const updatedUser = {
              ...parsedUser,
              subscription: plan
            };
            setUser(updatedUser);
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            setActiveSection('dashboard');
          } catch (e) {
            console.error('Failed to parse stored user', e);
          }
        }
      }
    }
  }, [user]);

  // Check if basic configuration is present
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  const isBasicConfigured = supabaseUrl && supabaseKey;

  const handleLogin = (userData: User) => {
    setUser(userData);
    // Store user in localStorage to persist across page refreshes
    localStorage.setItem('currentUser', JSON.stringify(userData));
    setActiveSection('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    // Clear stored user
    localStorage.removeItem('currentUser');
    setActiveSection('landing');
  };

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
    setActiveSection('project-detail');
  };

  const handleNewAnalysisClick = () => {
    setActiveSection('new-analysis');
  };

  const handleNewAnalysis = (website: string, keywords: string[]) => {
    // This will be handled by the AnalysisEngine now
    // The analysis creation logic is moved to AnalysisProgress component
    const newAnalysis: Analysis = {
      id: Date.now().toString(),
      projectId: selectedProject?.id || '1',
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
    setActiveSection('analysis-results');
  };

  const handleUpgrade = (plan: string) => {
    console.log('Upgrading to plan:', plan);
    // Update user subscription
    if (user) {
      const updatedUser = {
        ...user,
        subscription: plan
      };
      setUser(updatedUser);
      setActiveSection('dashboard');
    }
  };

  const handleGetStarted = () => {
    setActiveSection('auth');
  };

  const renderContent = () => {
    // Show configuration status if accessing setup
    if (activeSection === 'setup') {
      return <ConfigurationStatus />;
    }

    // Show auth page if no user is logged in and trying to access protected routes
    if (!user && ['dashboard', 'new-analysis', 'analysis-results', 'project-detail', 'pricing', 'competitor-strategy'].includes(activeSection)) {
      return <AuthPage onLogin={handleLogin} />;
    }

    switch (activeSection) {
      case 'landing':
        return <LandingPage onGetStarted={handleGetStarted} />;
      
      case 'auth':
        return <AuthPage onLogin={handleLogin} />;
        
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
          />
        ) : null;

      case 'pricing':
        return <PricingTiers currentPlan={user?.subscription || 'free'} onUpgrade={handleUpgrade} />;

      case 'competitor-strategy':
        return (
          <CompetitorStrategy 
            userAnalysis={mockAnalyses[0]} 
            competitorAnalyses={mockAnalyses.slice(1)} 
          />
        );
      
      default:
        return <LandingPage onGetStarted={handleGetStarted} />;
    }
  };

  // Show landing page or auth page without sidebar/header
  if (activeSection === 'landing' || activeSection === 'auth' || (!user && activeSection !== 'setup')) {
    return (
      <>
        {renderContent()}
        {/* Debug tools */}
        <PaymentDebugger />
        <WebhookDebugger />
        <SubscriptionFixTool />
        <WebhookSecretUpdater />
        <AutomaticWebhookFixer />
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
      
      {/* Debug tools */}
      <PaymentDebugger />
      <WebhookDebugger />
      <SubscriptionFixTool />
      <WebhookSecretUpdater />
      <AutomaticWebhookFixer />
    </div>
  );
}

export default App;