import React, { useState, useEffect } from 'react';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import Dashboard from './components/Dashboard/Dashboard';
import NewAnalysis from './components/Analysis/NewAnalysis';
import AnalysisResults from './components/Analysis/AnalysisResults';
import ProjectDetail from './components/Projects/ProjectDetail';
import PricingTiers from './components/Subscription/PricingTiers';
import UserDashboard from './components/Admin/UserDashboard';
import ContactPage from './components/Contact/ContactPage';
import PrivacyPolicy from './components/Legal/PrivacyPolicy';
import TermsOfService from './components/Legal/TermsOfService';
import CompetitorStrategy from './components/Reports/CompetitorStrategy';
import LandingPage from './components/Landing/LandingPage';
import AuthPage from './components/Auth/AuthPage';
import { mockProjects, mockAnalyses } from './utils/mockData';
import { Project, Analysis, User } from './types';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeSection, setActiveSection] = useState(() => {
    // Check URL hash for initial section
    const hash = window.location.hash.slice(1);
    return hash || 'landing'; 
  });
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<Analysis | null>(null);

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
      let hash = window.location.hash.slice(1);
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

    // Clean up event listener
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
    
    // Run once on initial load to handle direct URL access
    handleHashChange();
  }, []);

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
    // Store user data in localStorage for persistence
    localStorage.setItem('currentUser', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    window.location.hash = '';
    // Clear user data from localStorage
    localStorage.removeItem('currentUser');
  };

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
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
      projectId: selectedProject?.id || '1',
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
        existingAnalyses.unshift(newAnalysis); // Add to beginning of array
        localStorage.setItem('analyses', JSON.stringify(existingAnalyses));
      }
    } catch (error) {
      console.error('Error storing analysis in localStorage:', error);
    }
    
    window.location.hash = 'analysis-results';
  };

  const handleUpgrade = (plan: string) => {
    console.log('Upgrading to plan:', plan);
    // Handle upgrade logic here
  };

  const handleGetStarted = () => {
    window.location.hash = 'auth';
  };

  const renderContent = () => {
    // Public pages that don't require login
    if (activeSection === 'landing' || activeSection === 'auth' || activeSection === 'contact' || activeSection === 'privacy' || activeSection === 'terms' || activeSection === 'admin-users') {
      switch (activeSection) {
        case 'landing':
          return <LandingPage onGetStarted={handleGetStarted} />;
        case 'auth':
          return <AuthPage onLogin={handleLogin} />;
        case 'contact':
          return <ContactPage />;
        case 'privacy':
          return <PrivacyPolicy />;
        case 'terms':
          return <TermsOfService />;
        case 'admin-users':
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
          />
        ) : null;

      case 'pricing':
        return <PricingTiers currentPlan={user?.subscription || 'free'} onUpgrade={handleUpgrade} />;

      case 'competitor-strategy':
        return (
          <CompetitorStrategy 
            userAnalysis={mockAnalyses.find(a => a.userId === user?.id) || mockAnalyses[0]} 
            competitorAnalyses={mockAnalyses.filter(a => a.userId !== user?.id)} 
          />
        );
      
      default:
        return <LandingPage onGetStarted={handleGetStarted} />;
    }
  };

  // Show landing page or auth page without sidebar/header
  if (activeSection === 'landing' || activeSection === 'auth' || activeSection === 'contact' || activeSection === 'privacy' || activeSection === 'terms' || activeSection === 'admin-users') {
    return (
      <>
        {renderContent()}
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
    </div>
  );
}

export default App;