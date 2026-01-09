import React, { useState, useEffect } from 'react';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import Dashboard from './components/Dashboard/Dashboard';
import NewAnalysis from './components/Analysis/NewAnalysis';
import AnalysisResults from './components/Analysis/AnalysisResults';
import PricingTiers from './components/Subscription/PricingTiers';
import UserDashboard from './components/Admin/UserDashboard';
import AccountPage from './components/Account/AccountPage';
import ContactPage from './components/Contact/ContactPage';
import PrivacyPolicy from './components/Legal/PrivacyPolicy';
import TermsOfService from './components/Legal/TermsOfService';
import CompetitorStrategy from './components/Reports/CompetitorStrategy';
import AnalysisHistory from './components/History/AnalysisHistory';
import LandingPage from './components/Landing/LandingPage';
import AuthPage from './components/Auth/AuthPage';
import PricingPage from './components/Pricing/PricingPage';
import { Analysis, User } from './types';
import EnvironmentStatus from './components/UI/EnvironmentStatus';
import { mockAnalyses } from './utils/mockData';
import { isUserAdmin } from './utils/userUtils';
import { AuthService } from './services/authService';
import { StorageManager } from './utils/storageManager';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeSection, setActiveSection] = useState(() => {
    // Check URL hash for initial section (strip query params)
    const hash = window.location.hash.slice(1).split('?')[0];
    return hash || 'landing';
  });
  const [currentAnalysis, setCurrentAnalysis] = useState<Analysis | null>(null);
  const [emailJustConfirmed, setEmailJustConfirmed] = useState(false);

  // Check if user is admin
  const isAdmin = user && isUserAdmin(user);

  // Load current analysis from storage if available
  useEffect(() => {
    if (activeSection === 'analysis-results') {
      const storedAnalysis = StorageManager.getCurrentAnalysis();
      if (storedAnalysis) {
        setCurrentAnalysis(storedAnalysis);
        // Don't clear - keep it for "View Last Analysis" button
      }
    }
  }, [activeSection]);

  // Listen for hash changes to handle browser back/forward buttons
  useEffect(() => {
    // Clear stale 'users' localStorage key - Supabase is the source of truth
    localStorage.removeItem('users');

    const handleHashChange = () => {
      const fullHash = window.location.hash.slice(1);
      const section = fullHash.split('?')[0]; // Strip query params for section matching

      // Check for email confirmation callback
      // Supabase returns: #access_token=xxx&type=signup or we redirect to #email-confirmed
      if (fullHash.includes('email-confirmed') ||
          (fullHash.includes('access_token') && fullHash.includes('type=signup'))) {
        setEmailJustConfirmed(true);
        // Redirect to auth page so user can sign in
        window.location.hash = '#auth';
        return;
      }

      if (section) {
        setActiveSection(section);
      } else {
        setActiveSection('landing');
      }

      // If we're on the analysis-results page, try to load the analysis from storage
      if (section === 'analysis-results') {
        const storedAnalysis = StorageManager.getCurrentAnalysis();
        if (storedAnalysis) {
          setCurrentAnalysis(storedAnalysis);
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

  // Check URL parameters for checkout success
  useEffect(() => {
    const handleCheckoutSuccess = async () => {
      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get('session_id');
      const plan = params.get('plan');
      const userId = params.get('user_id');

      if (sessionId && plan && userId) {
        // Handle successful checkout
        console.log('Checkout successful!', { sessionId, plan, userId });

        // Update subscription in Supabase database
        try {
          const { PaymentService } = await import('./services/paymentService');
          const result = await PaymentService.handlePaymentSuccess(userId, plan, sessionId);
          if (result.success) {
            console.log('Database updated successfully');
          } else {
            console.error('Failed to update database:', result.error);
          }
        } catch (error) {
          console.error('Error updating database:', error);
        }

        // Also update storage for immediate UI update
        const currentUser = StorageManager.getCurrentUser();
        if (currentUser) {
          const updatedUser = {
            ...currentUser,
            subscription: plan,
            paymentMethodAdded: true
          };
          StorageManager.setCurrentUser(updatedUser);
          setUser(updatedUser);
        }

        // Clear URL parameters after processing
        window.history.replaceState({}, '', window.location.pathname + window.location.hash);
      }
    };

    handleCheckoutSuccess();
  }, []);

  // Load user from Supabase session on initial load (with localStorage fallback)
  useEffect(() => {
    const loadUser = async () => {
      try {
        // First, check for valid Supabase session and get fresh profile
        const result = await AuthService.getCurrentSession();

        if (result.success && result.data) {
          // Valid session - use fresh data from Supabase
          const profile = result.data.profile;
          const userData: User = {
            id: profile.id,
            email: profile.email,
            name: profile.name || 'User',
            avatar: profile.avatar || 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
            subscription: profile.subscription || 'trial',
            trialEndsAt: profile.trial_ends_at,
            createdAt: profile.created_at,
            isAdmin: profile.is_admin || false,
            paymentMethodAdded: profile.payment_method_added || false,
            stripeCustomerId: profile.stripe_customer_id,
            stripeSubscriptionId: profile.stripe_subscription_id,
            cancelAtPeriodEnd: profile.cancel_at_period_end,
            subscriptionEndsAt: profile.subscription_ends_at
          };

          // Update storage cache with fresh data
          StorageManager.setCurrentUser(userData);
          setUser(userData);

          if (activeSection === 'auth') {
            setActiveSection('dashboard');
          }
        } else {
          // No valid session - clear any stale storage data
          StorageManager.clearCurrentUser();
          setUser(null);
        }
      } catch (error) {
        console.error('Error loading user session:', error);
        // On error, clear potentially corrupted state
        StorageManager.clearCurrentUser();
        setUser(null);
      }
    };

    loadUser();
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    setActiveSection('dashboard');
    StorageManager.setCurrentUser(userData);
  };

  const handleLogout = async () => {
    // Clear Supabase session
    await AuthService.signOut();

    // Clear local state
    setUser(null);
    window.location.hash = '';
    StorageManager.clearSession();
  };

  const handleNewAnalysisClick = () => {
    setActiveSection('new-analysis');
    window.location.hash = '#new-analysis';
  };

  const handleNewAnalysis = (analysis: Analysis) => {
    // Analysis is already saved to Supabase by AnalysisProgress component
    // Save to storage for "View Last Analysis" button and navigation
    StorageManager.setCurrentAnalysis(analysis);
    setCurrentAnalysis(analysis);
    window.location.hash = 'analysis-results';
  };

  const handleUpgrade = (plan: string) => {
    console.log('Upgrading to plan:', plan);

    if (!user) return;

    // Update user subscription
    const updatedUser = {
      ...user,
      subscription: plan as User['subscription'],
      paymentMethodAdded: true
    };

    // Update state
    setUser(updatedUser);

    // Update storage
    StorageManager.setCurrentUser(updatedUser);
    StorageManager.updateUserInList(user.id, { subscription: plan as User['subscription'], paymentMethodAdded: true });

    // Navigate to dashboard
    window.location.hash = 'dashboard';
  };

  const handleGetStarted = () => {
    window.location.hash = 'auth?signup=true';
  };

  const renderContent = () => {
    // Public pages that don't require login
    if (activeSection === 'landing' || activeSection === 'auth' || activeSection === 'contact' || activeSection === 'privacy' || activeSection === 'terms' || activeSection === 'admin-users' || activeSection === 'account') {
      // Special handling for admin-users - only allow access if user is admin
      if (activeSection === 'admin-users') {
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
      }

      switch (activeSection) {
        case 'landing':
          return <LandingPage onGetStarted={handleGetStarted} />;
        case 'auth':
          return (
            <AuthPage
              onLogin={handleLogin}
              emailJustConfirmed={emailJustConfirmed}
              onConfirmationAcknowledged={() => setEmailJustConfirmed(false)}
            />
          );
        case 'account':
          return user ? (
            <AccountPage
              user={user ?? undefined}
              onBack={() => setActiveSection('dashboard')}
              onUpdateProfile={(updates) => {
                const updatedUser = { ...user, ...updates };
                setUser(updatedUser);
                StorageManager.setCurrentUser(updatedUser);
              }}
            />
          ) : (
            <AuthPage
              onLogin={handleLogin}
              emailJustConfirmed={emailJustConfirmed}
              onConfirmationAcknowledged={() => setEmailJustConfirmed(false)}
            />
          );
        case 'contact':
          return <ContactPage />;
        case 'privacy':
          return <PrivacyPolicy />;
        case 'terms':
          return <TermsOfService />;
        case 'admin-users':
          return <UserDashboard />;
        case 'pricing':
          return <PricingPage currentPlan={user?.subscription || 'free'} onUpgrade={handleUpgrade} />;
        default:
          return <LandingPage onGetStarted={handleGetStarted} />;
      }
    }

    // Protected routes that require login
    if (!user && ['dashboard', 'new-analysis', 'analysis-results', 'pricing', 'competitor-strategy', 'history'].includes(activeSection)) {
      return (
        <AuthPage
          onLogin={handleLogin}
          emailJustConfirmed={emailJustConfirmed}
          onConfirmationAcknowledged={() => setEmailJustConfirmed(false)}
        />
      );
    }

    switch (activeSection) {
      case 'dashboard':
        return <Dashboard onNewAnalysis={handleNewAnalysisClick} />;

      case 'new-analysis':
        return <NewAnalysis onAnalyze={handleNewAnalysis} user={user} />;

      case 'history':
        return user ? (
          <AnalysisHistory
            user={user}
            onViewAnalysis={(analysis) => {
              setCurrentAnalysis(analysis);
              window.location.hash = 'analysis-results';
            }}
          />
        ) : null;

      case 'analysis-results':
        return currentAnalysis ? (
          <AnalysisResults
            analysis={currentAnalysis}
            onBack={() => setActiveSection('new-analysis')}
            logoUrl={user?.companyLogoUrl}
          />
        ) : null;

      case 'pricing':
        return user ? (
          <PricingPage currentPlan={user.subscription} onUpgrade={handleUpgrade} />
        ) : (
          <PricingPage onUpgrade={handleUpgrade} />
        );

      case 'competitor-strategy':
        // Only show real analysis data - no mock data
        if (!currentAnalysis) {
          return (
            <CompetitorStrategy
              analysis={{ id: '', projectId: '', userId: '', website: '', keywords: [], score: 0, metrics: { contentClarity: 0, semanticRichness: 0, structuredData: 0, naturalLanguage: 0, keywordRelevance: 0 }, insights: '', predictedRank: 0, category: '', recommendations: [], createdAt: '' }}
            />
          );
        }
        return (
          <CompetitorStrategy analysis={currentAnalysis} />
        );

      default:
        return <LandingPage onGetStarted={handleGetStarted} />;
    }
  };

  // Show landing page or auth page without sidebar/header
  if (activeSection === 'landing' || activeSection === 'auth' || activeSection === 'contact' || activeSection === 'privacy' || activeSection === 'terms' || activeSection === 'admin-users' || activeSection === 'account' || activeSection === 'pricing') {
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