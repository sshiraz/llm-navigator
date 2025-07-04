import { Project, Analysis, User, KeywordSuggestion } from '../types';

export const mockUser: User = {
  id: '1',
  email: 'user@example.com',
  name: 'Alex Johnson',
  avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
  subscription: 'trial',
  trialEndsAt: '2024-02-05T10:00:00Z', // 14 days from now
  createdAt: '2024-01-15T10:00:00Z'
};

export const mockProjects: Project[] = [
  {
    id: '1',
    name: 'TechStart Marketing',
    website: 'techstart.com',
    description: 'B2B SaaS marketing platform',
    keywords: ['marketing automation', 'lead generation', 'email marketing'],
    competitors: [
      { id: '1', name: 'HubSpot', website: 'hubspot.com', addedAt: '2024-01-20T10:00:00Z' },
      { id: '2', name: 'Mailchimp', website: 'mailchimp.com', addedAt: '2024-01-20T10:00:00Z' },
      { id: '3', name: 'ActiveCampaign', website: 'activecampaign.com', addedAt: '2024-01-20T10:00:00Z' }
    ],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T10:00:00Z'
  },
  {
    id: '2',
    name: 'EcoStore',
    website: 'ecostore.com',
    description: 'Sustainable products marketplace',
    keywords: ['sustainable products', 'eco-friendly', 'green living'],
    competitors: [
      { id: '4', name: 'Grove Collaborative', website: 'grove.co', addedAt: '2024-01-18T10:00:00Z' },
      { id: '5', name: 'Thrive Market', website: 'thrivemarket.com', addedAt: '2024-01-18T10:00:00Z' }
    ],
    createdAt: '2024-01-16T10:00:00Z',
    updatedAt: '2024-01-18T10:00:00Z'
  }
];

export const mockAnalyses: Analysis[] = [
  // HubSpot - industry leader scores (should be #1)
  {
    id: '2',
    projectId: '1',
    website: 'hubspot.com',
    keywords: ['marketing automation', 'lead generation'],
    score: 94,
    metrics: {
      contentClarity: 96,
      semanticRichness: 92,
      structuredData: 95,
      naturalLanguage: 93,
      keywordRelevance: 94
    },
    insights: 'Exceptional performance across all metrics. HubSpot sets the industry standard with comprehensive structured data, extensive semantic coverage, and perfectly optimized content for AI consumption.',
    predictedRank: 1,
    category: 'Featured Answer',
    recommendations: [
      {
        id: '3',
        title: 'Maintain Content Freshness',
        description: 'Continue updating content regularly to maintain AI model preference and stay ahead of competitors.',
        priority: 'low',
        difficulty: 'easy',
        estimatedTime: 'Ongoing',
        expectedImpact: 2
      }
    ],
    createdAt: '2024-01-20T14:30:00Z'
  },
  // Mailchimp - strong competitor (#2)
  {
    id: '3',
    projectId: '1',
    website: 'mailchimp.com',
    keywords: ['email marketing', 'marketing automation'],
    score: 87,
    metrics: {
      contentClarity: 89,
      semanticRichness: 84,
      structuredData: 82,
      naturalLanguage: 88,
      keywordRelevance: 92
    },
    insights: 'Strong performance with excellent keyword relevance and content clarity. Well-positioned for AI-powered search results with room for improvement in structured data implementation.',
    predictedRank: 2,
    category: 'Top Result',
    recommendations: [
      {
        id: '4',
        title: 'Enhance Structured Data Coverage',
        description: 'Expand schema markup to include more detailed product and service information.',
        priority: 'medium',
        difficulty: 'medium',
        estimatedTime: '3 weeks',
        expectedImpact: 5
      }
    ],
    createdAt: '2024-01-19T14:30:00Z'
  },
  // Pardot/Salesforce - enterprise competitor (#3)
  {
    id: '5',
    projectId: '1',
    website: 'pardot.com',
    keywords: ['B2B marketing', 'lead generation'],
    score: 83,
    metrics: {
      contentClarity: 85,
      semanticRichness: 80,
      structuredData: 78,
      naturalLanguage: 84,
      keywordRelevance: 88
    },
    insights: 'Strong enterprise-focused content with excellent keyword relevance. Benefits from Salesforce ecosystem integration but could improve technical SEO implementation.',
    predictedRank: 3,
    category: 'Top Result',
    recommendations: [
      {
        id: '6',
        title: 'Technical SEO Enhancement',
        description: 'Improve structured data implementation and page speed optimization for better AI crawling.',
        priority: 'medium',
        difficulty: 'medium',
        estimatedTime: '3 weeks',
        expectedImpact: 6
      }
    ],
    createdAt: '2024-01-17T14:30:00Z'
  },
  // ActiveCampaign - mid-tier competitor (#4)
  {
    id: '4',
    projectId: '1',
    website: 'activecampaign.com',
    keywords: ['marketing automation', 'email marketing'],
    score: 79,
    metrics: {
      contentClarity: 82,
      semanticRichness: 76,
      structuredData: 74,
      naturalLanguage: 81,
      keywordRelevance: 83
    },
    insights: 'Solid performance with good content clarity and keyword relevance. Opportunities exist to improve semantic richness and structured data to compete with top-tier platforms.',
    predictedRank: 4,
    category: 'Visible',
    recommendations: [
      {
        id: '5',
        title: 'Improve Semantic Content Clusters',
        description: 'Create more comprehensive topic clusters to improve semantic understanding.',
        priority: 'high',
        difficulty: 'medium',
        estimatedTime: '4 weeks',
        expectedImpact: 8
      }
    ],
    createdAt: '2024-01-18T14:30:00Z'
  },
  // ConvertKit - smaller competitor (#5)
  {
    id: '6',
    projectId: '1',
    website: 'convertkit.com',
    keywords: ['email marketing', 'creator economy'],
    score: 71,
    metrics: {
      contentClarity: 78,
      semanticRichness: 65,
      structuredData: 58,
      naturalLanguage: 82,
      keywordRelevance: 75
    },
    insights: 'Good natural language optimization with clear content structure. As a smaller player, there are significant opportunities to improve structured data and semantic coverage.',
    predictedRank: 5,
    category: 'Visible',
    recommendations: [
      {
        id: '7',
        title: 'Niche Authority Building',
        description: 'Focus on creator economy keywords where you can compete more effectively against larger platforms.',
        priority: 'high',
        difficulty: 'easy',
        estimatedTime: '2 weeks',
        expectedImpact: 10
      }
    ],
    createdAt: '2024-01-16T14:30:00Z'
  },
  // User's site - realistic small business scores (#6)
  {
    id: '1',
    projectId: '1',
    website: 'convologix.com',
    keywords: ['marketing automation', 'chatbots', 'customer service automation'],
    score: 58,
    metrics: {
      contentClarity: 62,
      semanticRichness: 45,
      structuredData: 35,
      naturalLanguage: 70,
      keywordRelevance: 68
    },
    insights: 'Your site shows potential in natural language optimization and keyword relevance, but significantly lags behind major competitors in structured data implementation and semantic richness. Focus on technical SEO improvements and content depth to compete effectively.',
    predictedRank: 6,
    category: 'Buried',
    recommendations: [
      {
        id: '1',
        title: 'Implement Basic Schema Markup',
        description: 'Add Organization, Product, and FAQ schema to improve AI understanding of your content structure.',
        priority: 'high',
        difficulty: 'medium',
        estimatedTime: '2-3 weeks',
        expectedImpact: 12
      },
      {
        id: '2',
        title: 'Expand Content Depth',
        description: 'Create comprehensive guides and resources to match the semantic richness of larger competitors.',
        priority: 'high',
        difficulty: 'medium',
        estimatedTime: '4-6 weeks',
        expectedImpact: 15
      },
      {
        id: '3',
        title: 'Optimize for Conversational Queries',
        description: 'Restructure content to better answer specific questions users ask AI assistants.',
        priority: 'medium',
        difficulty: 'easy',
        estimatedTime: '2 weeks',
        expectedImpact: 8
      }
    ],
    createdAt: '2024-01-20T14:30:00Z'
  }
];

export const mockKeywordSuggestions: KeywordSuggestion[] = [
  { keyword: 'email marketing automation', intent: 'commercial', difficulty: 75, opportunity: 85 },
  { keyword: 'lead nurturing strategies', intent: 'informational', difficulty: 60, opportunity: 78 },
  { keyword: 'marketing funnel optimization', intent: 'commercial', difficulty: 70, opportunity: 82 },
  { keyword: 'customer journey mapping', intent: 'informational', difficulty: 55, opportunity: 75 },
  { keyword: 'marketing analytics dashboard', intent: 'commercial', difficulty: 80, opportunity: 88 }
];

// Helper function to calculate trial status
export const getTrialStatus = (user: User) => {
  if (user.subscription !== 'trial' || !user.trialEndsAt) {
    return null;
  }

  const now = new Date();
  const trialEnd = new Date(user.trialEndsAt);
  const daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return {
    isActive: daysRemaining > 0,
    daysRemaining: Math.max(0, daysRemaining),
    plan: 'Professional', // Assuming trial is for Professional plan
    features: [
      '50 analyses per month',
      'Unlimited projects',
      'Competitor strategy reports',
      'Branded PDF reports'
    ],
    limitations: [
      'Up to 3 PDF exports during trial',
      'Data saved for trial period only'
    ]
  };
};