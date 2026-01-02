import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AnalysisForm from './AnalysisForm';

// Mock the mockData
vi.mock('../../utils/mockData', () => ({
  mockKeywordSuggestions: [
    { keyword: 'marketing automation', intent: 'informational', difficulty: 65, opportunity: 80 },
    { keyword: 'email marketing tools', intent: 'commercial', difficulty: 75, opportunity: 70 },
    { keyword: 'lead generation software', intent: 'transactional', difficulty: 80, opportunity: 85 },
  ],
}));

describe('AnalysisForm Component', () => {
  const mockOnAnalyze = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the form with title', () => {
      render(<AnalysisForm onAnalyze={mockOnAnalyze} />);

      expect(screen.getByText('Analyze Your LLM Discoverability')).toBeInTheDocument();
    });

    it('should render website URL section', () => {
      render(<AnalysisForm onAnalyze={mockOnAnalyze} />);

      expect(screen.getByText('Website URL')).toBeInTheDocument();
      expect(screen.getByText('Enter the website you want to analyze')).toBeInTheDocument();
    });

    it('should render keywords section', () => {
      render(<AnalysisForm onAnalyze={mockOnAnalyze} />);

      expect(screen.getByText('Target Keywords')).toBeInTheDocument();
      expect(screen.getByText(/Enter keywords manually or use AI/)).toBeInTheDocument();
    });
  });

  describe('Website URL Input', () => {
    it('should have website URL input field', () => {
      render(<AnalysisForm onAnalyze={mockOnAnalyze} />);

      expect(screen.getByPlaceholderText('https://example.com')).toBeInTheDocument();
    });

    it('should accept website URL input', async () => {
      const user = userEvent.setup();
      render(<AnalysisForm onAnalyze={mockOnAnalyze} />);

      const urlInput = screen.getByPlaceholderText('https://example.com');
      await user.type(urlInput, 'https://mywebsite.com');

      expect(urlInput).toHaveValue('https://mywebsite.com');
    });

    it('should have type="url" attribute', () => {
      render(<AnalysisForm onAnalyze={mockOnAnalyze} />);

      const urlInput = screen.getByPlaceholderText('https://example.com');
      expect(urlInput).toHaveAttribute('type', 'url');
    });

    it('should have required attribute', () => {
      render(<AnalysisForm onAnalyze={mockOnAnalyze} />);

      const urlInput = screen.getByPlaceholderText('https://example.com');
      expect(urlInput).toHaveAttribute('required');
    });

    it('should clear and re-enter URL', async () => {
      const user = userEvent.setup();
      render(<AnalysisForm onAnalyze={mockOnAnalyze} />);

      const urlInput = screen.getByPlaceholderText('https://example.com');
      await user.type(urlInput, 'https://first.com');
      expect(urlInput).toHaveValue('https://first.com');

      await user.clear(urlInput);
      expect(urlInput).toHaveValue('');

      await user.type(urlInput, 'https://second.com');
      expect(urlInput).toHaveValue('https://second.com');
    });
  });

  describe('Keywords Textarea', () => {
    it('should have keywords textarea', () => {
      render(<AnalysisForm onAnalyze={mockOnAnalyze} />);

      expect(screen.getByPlaceholderText('marketing automation, lead generation, email marketing')).toBeInTheDocument();
    });

    it('should accept keywords input', async () => {
      const user = userEvent.setup();
      render(<AnalysisForm onAnalyze={mockOnAnalyze} />);

      const keywordsTextarea = screen.getByPlaceholderText('marketing automation, lead generation, email marketing');
      await user.type(keywordsTextarea, 'seo, content marketing, social media');

      expect(keywordsTextarea).toHaveValue('seo, content marketing, social media');
    });

    it('should allow multiline keyword input', async () => {
      const user = userEvent.setup();
      render(<AnalysisForm onAnalyze={mockOnAnalyze} />);

      const keywordsTextarea = screen.getByPlaceholderText('marketing automation, lead generation, email marketing');
      await user.type(keywordsTextarea, 'keyword1{enter}keyword2{enter}keyword3');

      expect(keywordsTextarea.tagName).toBe('TEXTAREA');
    });

    it('should have label for manual keywords', () => {
      render(<AnalysisForm onAnalyze={mockOnAnalyze} />);

      expect(screen.getByText('Manual Keywords (comma-separated)')).toBeInTheDocument();
    });
  });

  describe('Industry Description Input', () => {
    it('should have industry description input field', () => {
      render(<AnalysisForm onAnalyze={mockOnAnalyze} />);

      expect(screen.getByPlaceholderText('B2B SaaS marketing platform for small businesses')).toBeInTheDocument();
    });

    it('should accept industry description input', async () => {
      const user = userEvent.setup();
      render(<AnalysisForm onAnalyze={mockOnAnalyze} />);

      const industryInput = screen.getByPlaceholderText('B2B SaaS marketing platform for small businesses');
      await user.type(industryInput, 'E-commerce fashion retailer');

      expect(industryInput).toHaveValue('E-commerce fashion retailer');
    });

    it('should have label for industry description', () => {
      render(<AnalysisForm onAnalyze={mockOnAnalyze} />);

      expect(screen.getByText('Describe Your Industry/Topic for AI Suggestions')).toBeInTheDocument();
    });
  });

  describe('Generate Suggestions Button', () => {
    it('should have Generate button', () => {
      render(<AnalysisForm onAnalyze={mockOnAnalyze} />);

      expect(screen.getByRole('button', { name: /generate/i })).toBeInTheDocument();
    });

    it('should be disabled when industry description is empty', () => {
      render(<AnalysisForm onAnalyze={mockOnAnalyze} />);

      const generateButton = screen.getByRole('button', { name: /generate/i });
      expect(generateButton).toBeDisabled();
    });

    it('should be enabled when industry description has text', async () => {
      const user = userEvent.setup();
      render(<AnalysisForm onAnalyze={mockOnAnalyze} />);

      const industryInput = screen.getByPlaceholderText('B2B SaaS marketing platform for small businesses');
      await user.type(industryInput, 'Tech startup');

      const generateButton = screen.getByRole('button', { name: /generate/i });
      expect(generateButton).not.toBeDisabled();
    });

    it('should show "Generating..." when clicked', async () => {
      const user = userEvent.setup();
      render(<AnalysisForm onAnalyze={mockOnAnalyze} />);

      const industryInput = screen.getByPlaceholderText('B2B SaaS marketing platform for small businesses');
      await user.type(industryInput, 'Digital marketing agency');

      const generateButton = screen.getByRole('button', { name: /generate/i });
      await user.click(generateButton);

      expect(screen.getByText('Generating...')).toBeInTheDocument();
    });

    it('should show keyword suggestions after generating', async () => {
      const user = userEvent.setup();
      render(<AnalysisForm onAnalyze={mockOnAnalyze} />);

      const industryInput = screen.getByPlaceholderText('B2B SaaS marketing platform for small businesses');
      await user.type(industryInput, 'Marketing automation');

      const generateButton = screen.getByRole('button', { name: /generate/i });
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('AI-Generated Keyword Suggestions')).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Keyword Suggestions Selection', () => {
    const setupWithSuggestions = async () => {
      const user = userEvent.setup();
      render(<AnalysisForm onAnalyze={mockOnAnalyze} />);

      const industryInput = screen.getByPlaceholderText('B2B SaaS marketing platform for small businesses');
      await user.type(industryInput, 'Marketing tools');

      const generateButton = screen.getByRole('button', { name: /generate/i });
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('AI-Generated Keyword Suggestions')).toBeInTheDocument();
      }, { timeout: 2000 });

      return user;
    };

    it('should display keyword suggestions after generation', async () => {
      await setupWithSuggestions();

      expect(screen.getByText('marketing automation')).toBeInTheDocument();
      expect(screen.getByText('email marketing tools')).toBeInTheDocument();
      expect(screen.getByText('lead generation software')).toBeInTheDocument();
    });

    it('should display keyword intent badges', async () => {
      await setupWithSuggestions();

      expect(screen.getByText('informational')).toBeInTheDocument();
      expect(screen.getByText('commercial')).toBeInTheDocument();
      expect(screen.getByText('transactional')).toBeInTheDocument();
    });

    it('should display difficulty scores', async () => {
      await setupWithSuggestions();

      expect(screen.getByText('Difficulty: 65')).toBeInTheDocument();
      expect(screen.getByText('Difficulty: 75')).toBeInTheDocument();
      expect(screen.getByText('Difficulty: 80')).toBeInTheDocument();
    });

    it('should display opportunity scores', async () => {
      await setupWithSuggestions();

      expect(screen.getByText('Opportunity: 80')).toBeInTheDocument();
      expect(screen.getByText('Opportunity: 70')).toBeInTheDocument();
      expect(screen.getByText('Opportunity: 85')).toBeInTheDocument();
    });

    it('should allow selecting a keyword by clicking', async () => {
      const user = await setupWithSuggestions();

      // Get all elements with 'marketing automation' and find the one in the suggestion list
      const keywordElements = screen.getAllByText('marketing automation');
      const keywordElement = keywordElements[0].closest('div[class*="cursor-pointer"]');
      await user.click(keywordElement!);

      expect(screen.getByText(/Selected keywords:/)).toBeInTheDocument();
    });

    it('should allow selecting multiple keywords', async () => {
      const user = await setupWithSuggestions();

      const keyword1Elements = screen.getAllByText('marketing automation');
      const keyword1 = keyword1Elements[0].closest('div[class*="cursor-pointer"]');
      const keyword2 = screen.getByText('email marketing tools').closest('div[class*="cursor-pointer"]');

      await user.click(keyword1!);
      await user.click(keyword2!);

      const selectedText = screen.getByText(/Selected keywords:/);
      expect(selectedText).toBeInTheDocument();
    });

    it('should allow deselecting a keyword by clicking again', async () => {
      const user = await setupWithSuggestions();

      const keywordElements = screen.getAllByText('marketing automation');
      const keywordElement = keywordElements[0].closest('div[class*="cursor-pointer"]');

      // Select
      await user.click(keywordElement!);
      expect(screen.getByText(/Selected keywords:/)).toBeInTheDocument();

      // Deselect - need to get the element again as DOM may have changed
      const updatedKeywordElements = screen.getAllByText('marketing automation');
      const updatedKeywordElement = updatedKeywordElements[0].closest('div[class*="cursor-pointer"]');
      await user.click(updatedKeywordElement!);
      expect(screen.queryByText(/Selected keywords:/)).not.toBeInTheDocument();
    });

    it('should show instruction text for selecting keywords', async () => {
      await setupWithSuggestions();

      expect(screen.getByText('Select the keywords you want to target in your analysis')).toBeInTheDocument();
    });
  });

  describe('OR Divider', () => {
    it('should show OR divider between manual and AI keywords', () => {
      render(<AnalysisForm onAnalyze={mockOnAnalyze} />);

      expect(screen.getByText('OR')).toBeInTheDocument();
    });
  });

  describe('Form Description', () => {
    it('should show form description text', () => {
      render(<AnalysisForm onAnalyze={mockOnAnalyze} />);

      expect(screen.getByText(/Get comprehensive insights into how well your website performs/)).toBeInTheDocument();
    });
  });

  describe('Input Field Interactions', () => {
    it('should allow typing in all fields sequentially', async () => {
      const user = userEvent.setup();
      render(<AnalysisForm onAnalyze={mockOnAnalyze} />);

      // Type in website URL
      const urlInput = screen.getByPlaceholderText('https://example.com');
      await user.type(urlInput, 'https://test.com');
      expect(urlInput).toHaveValue('https://test.com');

      // Type in keywords
      const keywordsTextarea = screen.getByPlaceholderText('marketing automation, lead generation, email marketing');
      await user.type(keywordsTextarea, 'keyword1, keyword2');
      expect(keywordsTextarea).toHaveValue('keyword1, keyword2');

      // Type in industry description
      const industryInput = screen.getByPlaceholderText('B2B SaaS marketing platform for small businesses');
      await user.type(industryInput, 'My industry');
      expect(industryInput).toHaveValue('My industry');
    });

    it('should maintain focus after typing', async () => {
      const user = userEvent.setup();
      render(<AnalysisForm onAnalyze={mockOnAnalyze} />);

      const urlInput = screen.getByPlaceholderText('https://example.com');
      await user.click(urlInput);
      await user.type(urlInput, 'test');

      expect(document.activeElement).toBe(urlInput);
    });
  });
});
