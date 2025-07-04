import React, { useState } from 'react';
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
import PaymentDebugPanel from './components/Payment/PaymentDebugPanel';
import { mockProjects, mockAnalyses } from './utils/mockData';
import { Project, Analysis, User } from './types';
import { PaymentDebugger } from './utils/paymentDebugger';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeSection, setActiveSection] = useState(() => {
    // Check URL hash for initial section
    const hash = window.location.hash.slice(1);
    return hash || 'landing';
  });
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<Analysis | null>(null);

  // Check if basic configuration is present
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  const isBasicConfigured = supabaseUrl && supabaseKey;

  // Enable payment debugging in development
  React.useEffect(() => {
    if (import.meta.env.DEV) {
      PaymentDebugger.enableDebug();
      PaymentDebugger.log('App Initialized', {
        hasSupabaseUrl: !!supabaseUrl,
        hasSupabaseKey: !!supabaseKey,
        hasStripeKey: !!stripeKey,
        environment: import.meta.env.MODE
      });
    }
  }, []);

  const handleLogin = (userData: User) => {
    PaymentDebugger.log('User Logged In', { 
      userId: userData.id, 
      subscription: userData.subscription 
    });
    setUser(userData);
    setActiveSection('dashboard');
  };

  const handleLogout = () => {
    PaymentDebugger.log('User Logged Out');
    setUser(null);
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
    PaymentDebugger.log('Upgrade Initiated', { plan, currentUser: user?.id });
    console.log('Upgrading to plan:', plan);
    // Handle upgrade logic here
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
        {import.meta.env.DEV && <PaymentDebugPanel />}
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

      {/* Payment Debug Panel - only in development */}
      {import.meta.env.DEV && <PaymentDebugPanel />}
    </div>
  );
}

export default App;