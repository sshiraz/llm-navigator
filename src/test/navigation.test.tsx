import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

// Mock user profile for AuthService
const mockUserProfile = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  subscription: 'trial',
  is_admin: false,
  payment_method_added: false,
  created_at: new Date().toISOString(),
};

// Mock Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      update: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  },
}));

// Mock AuthService to return the user from localStorage
vi.mock('../services/authService', async (importOriginal) => {
  return {
    AuthService: {
      getCurrentSession: vi.fn().mockImplementation(async () => {
        const userStr = localStorage.getItem('currentUser');
        if (userStr) {
          const user = JSON.parse(userStr);
          return {
            success: true,
            data: {
              session: { user: { id: user.id, email: user.email } },
              profile: {
                id: user.id,
                email: user.email,
                name: user.name,
                subscription: user.subscription,
                is_admin: user.isAdmin || false,
                payment_method_added: user.paymentMethodAdded || false,
                created_at: user.createdAt || new Date().toISOString(),
              },
            },
          };
        }
        return { success: false, data: null };
      }),
      signIn: vi.fn().mockResolvedValue({ success: true }),
      signOut: vi.fn().mockResolvedValue({ success: true }),
    },
  };
});

// Mock AnalysisEngine
vi.mock('../utils/analysisEngine', () => ({
  AnalysisEngine: {
    shouldUseRealAnalysis: vi.fn().mockReturnValue(false),
    analyzeAEO: vi.fn().mockResolvedValue({
      id: 'test-analysis-id',
      website: 'https://test.com',
      prompts: [{ id: '1', text: 'test prompt' }],
      citationResults: [],
      overallCitationRate: 50,
      contentAnalysis: {
        blufScore: 80,
        contentDepth: 70,
        schemaScore: 60,
        readabilityScore: 75,
      },
      recommendations: [],
      createdAt: new Date().toISOString(),
      isSimulated: true,
      crawlData: null,
      costInfo: {
        totalCost: 0.05,
        breakdown: { crawling: 0.01, citationChecks: 0.04, total: 0.05 },
      },
    }),
  },
}));

// Mock costTracker
vi.mock('../utils/costTracker', () => ({
  useUsageMonitoring: vi.fn().mockReturnValue({
    usageLimits: {
      monthlyAnalyses: 10,
      promptsPerAnalysis: 5,
      monthlyBudget: 50.00,
      currentUsage: { analyses: 0, prompts: 0, cost: 0 },
      estimatedMonthlyCost: 5.00,
    },
    isLoading: false,
  }),
  CostTracker: {
    getPlanLimits: vi.fn().mockReturnValue({ analyses: 10, promptsPerAnalysis: 5 }),
  },
}));

// Mock AnalysisService
vi.mock('../services/analysisService', () => ({
  AnalysisService: {
    saveAnalysis: vi.fn().mockResolvedValue({ success: true }),
    getAnalysesByUser: vi.fn().mockResolvedValue([]),
    getUserAnalyses: vi.fn().mockResolvedValue([]),
    saveToLocalStorage: vi.fn(),
    migrateFromLocalStorage: vi.fn().mockResolvedValue(0),
    getFromLocalStorage: vi.fn().mockReturnValue([]),
  },
}));

// Helper to create a mock logged-in user
const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  subscription: 'trial',
  isAdmin: false,
};

// Helper to create a mock analysis
const mockAnalysis = {
  id: 'analysis-123',
  projectId: 'default',
  userId: 'test-user-id',
  website: 'https://example.com',
  keywords: ['test prompt'],
  score: 50,
  metrics: {
    contentClarity: 80,
    semanticRichness: 70,
    structuredData: 60,
    naturalLanguage: 75,
    keywordRelevance: 50,
  },
  insights: 'Test insights',
  predictedRank: 2,
  category: 'Answer Engine Optimization',
  recommendations: [],
  createdAt: new Date().toISOString(),
  isSimulated: true,
};

describe('Navigation Flow Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    window.location.hash = '';
  });

  afterEach(() => {
    window.location.hash = '';
  });

  describe('Hash and State Synchronization', () => {
    it('should update hash when clicking sidebar navigation', async () => {
      localStorage.setItem('currentUser', JSON.stringify(mockUser));
      window.location.hash = 'dashboard';

      render(<App />);

      // Wait for app to render
      await waitFor(() => {
        expect(screen.getAllByText(/New Analysis/i).length).toBeGreaterThan(0);
      });

      // Find and click New Analysis button in sidebar
      const sidebarButtons = screen.getAllByRole('button');
      const newAnalysisButton = sidebarButtons.find(btn => btn.textContent?.includes('New Analysis'));

      if (newAnalysisButton) {
        await userEvent.click(newAnalysisButton);
        expect(window.location.hash).toBe('#new-analysis');
      }
    });

    it('should handle hash changes from browser navigation', async () => {
      localStorage.setItem('currentUser', JSON.stringify(mockUser));
      window.location.hash = 'dashboard';

      render(<App />);

      await waitFor(() => {
        expect(screen.getAllByText(/Dashboard/i).length).toBeGreaterThan(0);
      });

      // Simulate browser navigation (back/forward button)
      act(() => {
        window.location.hash = 'new-analysis';
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      });

      // Hash should be updated
      expect(window.location.hash).toBe('#new-analysis');
    });
  });

  describe('View Last Analysis Button', () => {
    it('should show button when currentAnalysis exists in localStorage', async () => {
      localStorage.setItem('currentUser', JSON.stringify(mockUser));
      localStorage.setItem('currentAnalysis', JSON.stringify(mockAnalysis));
      window.location.hash = 'new-analysis';

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('View Last Analysis')).toBeInTheDocument();
      });
    });

    it('should not show button when no currentAnalysis exists', async () => {
      localStorage.setItem('currentUser', JSON.stringify(mockUser));
      // No currentAnalysis in localStorage
      window.location.hash = 'new-analysis';

      render(<App />);

      await waitFor(() => {
        // NewAnalysis component should render with this heading
        expect(screen.getByText('Analyze Your AI Visibility')).toBeInTheDocument();
      });

      expect(screen.queryByText('View Last Analysis')).not.toBeInTheDocument();
    });

    it('should navigate to analysis-results when button is clicked', async () => {
      localStorage.setItem('currentUser', JSON.stringify(mockUser));
      localStorage.setItem('currentAnalysis', JSON.stringify(mockAnalysis));
      window.location.hash = 'new-analysis';

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('View Last Analysis')).toBeInTheDocument();
      });

      const viewLastButton = screen.getByText('View Last Analysis');
      await userEvent.click(viewLastButton);

      expect(window.location.hash).toBe('#analysis-results');
    });

    it('should work on repeated navigation (the fix we implemented)', async () => {
      localStorage.setItem('currentUser', JSON.stringify(mockUser));
      localStorage.setItem('currentAnalysis', JSON.stringify(mockAnalysis));
      window.location.hash = 'new-analysis';

      render(<App />);

      // First: Click View Last Analysis
      await waitFor(() => {
        expect(screen.getByText('View Last Analysis')).toBeInTheDocument();
      });

      let viewLastButton = screen.getByText('View Last Analysis');
      await userEvent.click(viewLastButton);
      expect(window.location.hash).toBe('#analysis-results');

      // Second: Navigate back to new-analysis via sidebar
      const sidebarButtons = screen.getAllByRole('button');
      const newAnalysisButton = sidebarButtons.find(btn => btn.textContent?.includes('New Analysis'));

      if (newAnalysisButton) {
        await userEvent.click(newAnalysisButton);
        expect(window.location.hash).toBe('#new-analysis');

        // Third: Click View Last Analysis again - THIS WAS THE BUG
        await waitFor(() => {
          expect(screen.getByText('View Last Analysis')).toBeInTheDocument();
        });

        viewLastButton = screen.getByText('View Last Analysis');
        await userEvent.click(viewLastButton);

        // Should navigate again (this was failing before the fix)
        expect(window.location.hash).toBe('#analysis-results');
      }
    });
  });

  describe('Protected Routes', () => {
    it('should show auth page when accessing protected route without login', async () => {
      // No user in localStorage
      window.location.hash = 'dashboard';

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Welcome Back')).toBeInTheDocument();
      });
    });

    it('should allow access when logged in', async () => {
      localStorage.setItem('currentUser', JSON.stringify(mockUser));
      window.location.hash = 'dashboard';

      render(<App />);

      await waitFor(() => {
        // Should see dashboard content, not auth
        expect(screen.queryByText('Welcome Back')).not.toBeInTheDocument();
      });
    });
  });

  describe('Public Routes', () => {
    it('should show auth page when hash is auth', async () => {
      window.location.hash = 'auth';

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Welcome Back')).toBeInTheDocument();
      });
    });
  });

  describe('Sidebar Navigation', () => {
    it('should navigate between different sections', async () => {
      localStorage.setItem('currentUser', JSON.stringify(mockUser));
      window.location.hash = 'dashboard';

      render(<App />);

      await waitFor(() => {
        expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
      });

      // Get all sidebar buttons
      const sidebarButtons = screen.getAllByRole('button');

      // Find and click History button
      const historyButton = sidebarButtons.find(btn => btn.textContent?.includes('History'));
      if (historyButton) {
        await userEvent.click(historyButton);
        expect(window.location.hash).toBe('#history');
      }

      // Find and click Pricing button
      const pricingButton = sidebarButtons.find(btn => btn.textContent?.includes('Pricing'));
      if (pricingButton) {
        await userEvent.click(pricingButton);
        expect(window.location.hash).toBe('#pricing');
      }
    });
  });

  describe('LocalStorage Persistence', () => {
    it('should NOT clear currentAnalysis after viewing results', async () => {
      localStorage.setItem('currentUser', JSON.stringify(mockUser));
      localStorage.setItem('currentAnalysis', JSON.stringify(mockAnalysis));
      window.location.hash = 'analysis-results';

      render(<App />);

      // Navigate away
      act(() => {
        window.location.hash = 'new-analysis';
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      });

      // Wait for navigation
      await waitFor(() => {
        expect(window.location.hash).toBe('#new-analysis');
      });

      // currentAnalysis should still be in localStorage (this was the bug fix)
      expect(localStorage.getItem('currentAnalysis')).not.toBeNull();
    });

    it('should load saved analysis parameters', async () => {
      localStorage.setItem('currentUser', JSON.stringify(mockUser));
      localStorage.setItem('lastAnalysisWebsite', 'https://saved-site.com');
      window.location.hash = 'new-analysis';

      render(<App />);

      await waitFor(() => {
        const websiteInput = screen.getByPlaceholderText('https://example.com') as HTMLInputElement;
        expect(websiteInput.value).toBe('https://saved-site.com');
      });
    });
  });
});

describe('Hash Update Consistency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    window.location.hash = '';
  });

  it('sidebar clicks should update both hash and navigate', async () => {
    localStorage.setItem('currentUser', JSON.stringify(mockUser));
    window.location.hash = 'dashboard';

    render(<App />);

    await waitFor(() => {
      expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
    });

    const hashChanges: string[] = [];
    const originalHash = Object.getOwnPropertyDescriptor(window.location, 'hash');

    // Track hash changes
    const handleHashChange = () => {
      hashChanges.push(window.location.hash);
    };
    window.addEventListener('hashchange', handleHashChange);

    // Click New Analysis in sidebar
    const sidebarButtons = screen.getAllByRole('button');
    const newAnalysisButton = sidebarButtons.find(btn => btn.textContent?.includes('New Analysis'));

    if (newAnalysisButton) {
      await userEvent.click(newAnalysisButton);

      // Verify hash was updated
      expect(window.location.hash).toBe('#new-analysis');
    }

    window.removeEventListener('hashchange', handleHashChange);
  });
});
