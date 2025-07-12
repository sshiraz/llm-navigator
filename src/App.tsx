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
import { Project, Analysis, User } from './types';
import EnvironmentStatus from './components/UI/EnvironmentStatus';
import { mockAnalyses } from './utils/mockData';
import { createClient } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeSection, setActiveSection] = useState(() => {
    // Check URL hash for initial section
    const hash = window.location.hash.slice(1);
    return hash || 'landing';
  });
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<Analysis | null>(null);

  // Check if user is admin
  // const [isAdmin, setIsAdmin] = useState(false);
  
  // useEffect(() => {
  //   setIsAdmin(isAdminUser());
  // }, []);

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
      console.log('[NAV DEBUG] Hash changed:', hash); // Debug log
      if (hash) {
        setActiveSection(hash);
        console.log('[NAV DEBUG] Setting activeSection to:', hash); // Debug log
      } else {
        setActiveSection('landing');
        console.log('[NAV DEBUG] Setting activeSection to: landing'); // Debug log
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

      // Instead of updating localStorage, fetch and update user from Supabase
      const updateUserSubscription = async () => {
        const { data: profile, error } = await supabase
          .from('users')
          .update({ subscription: plan, paymentMethodAdded: true })
          .eq('id', userId)
          .select()
          .single();
        if (profile) {
          setUser(profile);
        } else {
          console.error('Failed to update user subscription', error);
        }
      };
      updateUserSubscription();
    }
  }, []);

  // Load user from Supabase Auth and then fetch full profile from users table
  useEffect(() => {
    const loadUser = async () => {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authUser) {
        // Fetch user profile from your users table
        let { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();
        if (!profile) {
          // Create profile if it doesn't exist
          const { data: newProfile } = await supabase.from('users').insert({
            id: authUser.id,
            email: authUser.email,
            name: authUser.user_metadata?.name || '',
            subscription: 'free',
            created_at: new Date().toISOString(),
          }).select().single();
          profile = newProfile;
        }
        if (profile) {
          setUser(profile);
          if (activeSection === 'auth') {
            setActiveSection('dashboard');
          }
        }
      } else {
        setUser(null);
      }
    };
    loadUser();
  }, []);

  const handleLogin = async (userData: User) => {
    // Ensure user profile exists in users table
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', userData.id)
      .single();
    if (!profile) {
      await supabase.from('users').insert({
        id: userData.id,
        email: userData.email,
        name: userData.name || '',
        subscription: 'free',
        created_at: new Date().toISOString(),
      });
    }
    setUser(userData);
    setActiveSection('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    window.location.hash = '';
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
    if (activeSection === 'landing' || activeSection === 'auth' || activeSection === 'contact' || activeSection === 'privacy' || activeSection === 'terms' || activeSection === 'admin-users' || activeSection === 'account') {
      // Special handling for admin-users - only allow access if user is admin
      if (activeSection === 'admin-users') {
        // Check if user is admin
        if (!user || !user.email || user.email.toLowerCase() !== 'info@convologix.com') {
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
      }

      switch (activeSection) {
        case 'landing':
          return <LandingPage onGetStarted={handleGetStarted} />;
        case 'auth':
          return <AuthPage onLogin={handleLogin} />;
        case 'account':
          return user ? (
            <AccountPage
              user={user}
              onBack={() => setActiveSection('dashboard')}
              onUpdateProfile={(updates) => {
                const updatedUser = { ...user, ...updates };
                setUser(updatedUser);
                // localStorage.setItem('currentUserId', updatedUser.id); // Removed
              }}
            />
          ) : <AuthPage onLogin={handleLogin} />;
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
        return <NewAnalysis onAnalyze={handleNewAnalysis} user={user ?? undefined} />;

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
            userAnalysis={mockAnalyses.find((a: Analysis) => a.userId === user?.id) || mockAnalyses[0]}
            competitorAnalyses={mockAnalyses.filter((a: Analysis) => a.userId !== user?.id)}
          />
        );

      default:
        return <LandingPage onGetStarted={handleGetStarted} />;
    }
  };

  const isAdmin = user && user.email && user.email.toLowerCase() === 'info@convologix.com';

  // Show landing page or auth page without sidebar/header
  if (activeSection === 'landing' || activeSection === 'auth' || activeSection === 'contact' || activeSection === 'privacy' || activeSection === 'terms' || activeSection === 'admin-users' || activeSection === 'account') {
    return (
      <>
        {renderContent()}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {user && <Header user={user} />}
      <div className="flex flex-1">
        <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} onLogout={handleLogout} />
        <main className="flex-1 p-6">
          {/* Show EnvironmentStatus only for admin user */}
          {isAdmin && <EnvironmentStatus showDetails className="mb-6" />}
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;