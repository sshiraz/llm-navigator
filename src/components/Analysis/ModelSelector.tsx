import React from 'react';
import { Cpu, Sparkles, Zap, Gauge, Info } from 'lucide-react';

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  subscription: string;
  isAdmin?: boolean;
}

export default function ModelSelector({ selectedModel, onModelChange, subscription, isAdmin = false }: ModelSelectorProps) {
  // Define available models based on subscription level
  const getAvailableModels = () => {
    if (isAdmin) {
      // Admins get access to all models
      return [
        { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI', tier: 'starter' },
        { id: 'claude-3-haiku', name: 'Claude 3 Haiku', provider: 'Anthropic', tier: 'starter' },
        { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'Anthropic', tier: 'professional' },
        { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic', tier: 'enterprise' },
        { id: 'perplexity-online', name: 'Perplexity Online', provider: 'Perplexity', tier: 'professional' },
        { id: 'perplexity-offline', name: 'Perplexity Offline', provider: 'Perplexity', tier: 'starter' }
      ];
    }
    
    switch (subscription) {
      case 'enterprise':
        return [
          { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI', tier: 'starter' },
          { id: 'claude-3-haiku', name: 'Claude 3 Haiku', provider: 'Anthropic', tier: 'starter' },
          { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'Anthropic', tier: 'professional' },
          { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic', tier: 'enterprise' },
          { id: 'perplexity-online', name: 'Perplexity Online', provider: 'Perplexity', tier: 'professional' },
          { id: 'perplexity-offline', name: 'Perplexity Offline', provider: 'Perplexity', tier: 'starter' }
        ];
      case 'professional':
        return [
          { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI', tier: 'starter' },
          { id: 'claude-3-haiku', name: 'Claude 3 Haiku', provider: 'Anthropic', tier: 'starter' },
          { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'Anthropic', tier: 'professional' },
          { id: 'perplexity-online', name: 'Perplexity Online', provider: 'Perplexity', tier: 'professional' },
          { id: 'perplexity-offline', name: 'Perplexity Offline', provider: 'Perplexity', tier: 'starter' }
        ];
      case 'starter':
        return [
          { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI', tier: 'starter' },
          { id: 'claude-3-haiku', name: 'Claude 3 Haiku', provider: 'Anthropic', tier: 'starter' },
          { id: 'perplexity-offline', name: 'Perplexity Offline', provider: 'Perplexity', tier: 'starter' }
        ];
      default:
        // Trial/Free users get simulated analysis, but we'll show them what's available
        return [
          { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI', tier: 'starter' }
        ];
    }
  };

  const models = getAvailableModels();
  
  // Get model details for tooltips
  const getModelDetails = (modelId: string) => {
    switch (modelId) {
      case 'gpt-4':
        return {
          description: 'OpenAI\'s powerful model with strong reasoning and pattern recognition.',
          strengths: ['Excellent at understanding context', 'Strong technical analysis', 'Detailed recommendations'],
          cost: '$0.03/1K input tokens, $0.06/1K output tokens'
        };
      case 'claude-3-opus':
        return {
          description: 'Anthropic\'s most powerful model with exceptional reasoning capabilities.',
          strengths: ['Superior reasoning', 'Nuanced content understanding', 'Comprehensive analysis'],
          cost: '$0.015/1K input tokens, $0.075/1K output tokens'
        };
      case 'claude-3-sonnet':
        return {
          description: 'Balanced model with good reasoning at a more affordable price point.',
          strengths: ['Strong reasoning', 'Good content understanding', 'Cost-effective'],
          cost: '$0.003/1K input tokens, $0.015/1K output tokens'
        };
      case 'claude-3-haiku':
        return {
          description: 'Fast, efficient model for simpler analysis tasks.',
          strengths: ['Very fast', 'Cost-efficient', 'Good for basic analysis'],
          cost: '$0.00025/1K input tokens, $0.00125/1K output tokens'
        };
      case 'perplexity-online':
        return {
          description: 'Real-time web search with up-to-date information.',
          strengths: ['Access to recent information', 'Web search capabilities', 'Current trends analysis'],
          cost: '$0.002/1K input tokens, $0.01/1K output tokens'
        };
      case 'perplexity-offline':
        return {
          description: 'Perplexity\'s base model without real-time web search.',
          strengths: ['Fast analysis', 'Good general knowledge', 'Cost-effective'],
          cost: '$0.001/1K input tokens, $0.005/1K output tokens'
        };
      default:
        return {
          description: 'Model information not available',
          strengths: [],
          cost: 'Pricing information not available'
        };
    }
  };

  // Get provider icon
  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'OpenAI':
        return <Sparkles className="w-4 h-4" />;
      case 'Anthropic':
        return <Cpu className="w-4 h-4" />;
      case 'Perplexity':
        return <Gauge className="w-4 h-4" />;
      default:
        return <Zap className="w-4 h-4" />;
    }
  };

  // Get tier badge color
  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'starter':
        return 'bg-blue-100 text-blue-800';
      case 'professional':
        return 'bg-purple-100 text-purple-800';
      case 'enterprise':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const [showTooltip, setShowTooltip] = React.useState<string | null>(null);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Select AI Model</h3>
        <div className="text-sm text-gray-500">
          {subscription === 'trial' || subscription === 'free' ? 
            'Upgrade to access more models' : 
            `${subscription.charAt(0).toUpperCase() + subscription.slice(1)} plan`}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {models.map((model) => {
          const isSelected = selectedModel === model.id;
          const details = getModelDetails(model.id);
          
          return (
            <div 
              key={model.id}
              className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
                isSelected 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-blue-300'
              }`}
              onClick={() => onModelChange(model.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {getProviderIcon(model.provider)}
                  <span className="font-medium text-gray-900">{model.name}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${getTierBadgeColor(model.tier)}`}>
                  {model.tier}
                </span>
              </div>
              
              <div className="text-xs text-gray-500 mb-3">
                Provider: {model.provider}
              </div>
              
              <div className="relative">
                <button
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                  onMouseEnter={() => setShowTooltip(model.id)}
                  onMouseLeave={() => setShowTooltip(null)}
                >
                  <Info className="w-3 h-3 mr-1" />
                  <span>Model details</span>
                </button>
                
                {showTooltip === model.id && (
                  <div className="absolute z-10 bottom-full left-0 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg">
                    <p className="mb-2">{details.description}</p>
                    <p className="font-medium mb-1">Strengths:</p>
                    <ul className="mb-2 pl-4 space-y-1">
                      {details.strengths.map((strength, index) => (
                        <li key={index} className="list-disc list-inside">{strength}</li>
                      ))}
                    </ul>
                    <p className="text-gray-300 text-xs">{details.cost}</p>
                    <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                  </div>
                )}
              </div>
              
              {isSelected && (
                <div className="absolute top-2 right-2 w-3 h-3 bg-blue-500 rounded-full"></div>
              )}
            </div>
          );
        })}
      </div>
      
      {(subscription === 'trial' || subscription === 'free') && !isAdmin && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> Upgrade to a paid plan to access Claude and Perplexity models. 
            Free/trial users receive simulated analysis.
          </p>
        </div>
      )}
    </div>
  );
}