import React, { useState, useEffect, useMemo } from 'react';
import { Users, Search, Filter, Download, RefreshCw, ArrowLeft, Shield, Globe, TrendingUp, Target, BarChart3 } from 'lucide-react';
import { FreeReportLead } from '../../types';
import { supabase } from '../../lib/supabase';
import { sanitizeSearchQuery } from '../../utils/sanitize';
import SignupAnalytics from './SignupAnalytics';

export default function LeadsDashboard() {
  const [leads, setLeads] = useState<FreeReportLead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<FreeReportLead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCited, setFilterCited] = useState('all');
  const [filterIndustry, setFilterIndustry] = useState('all');

  const sortableFields = ['created_at', 'email', 'website', 'ai_score', 'citation_rate', 'industry'] as const;
  type SortableLeadField = typeof sortableFields[number];
  const [sortBy, setSortBy] = useState<{field: SortableLeadField, direction: 'asc' | 'desc'}>({
    field: 'created_at',
    direction: 'desc'
  });

  const [isAdmin, setIsAdmin] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Get unique industries for filter dropdown
  const industries = useMemo(() => {
    const uniqueIndustries = [...new Set(leads.map(l => l.industry).filter(Boolean))];
    return uniqueIndustries.sort();
  }, [leads]);

  useEffect(() => {
    // Check if user is admin
    try {
      const userStr = localStorage.getItem('currentUser');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.isAdmin !== true) {
          setIsRedirecting(true);
          setTimeout(() => {
            window.location.hash = '#dashboard';
          }, 2000);
        } else {
          setIsAdmin(true);
        }
      } else {
        setIsRedirecting(true);
        setTimeout(() => {
          window.location.hash = '#auth';
        }, 2000);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }

    loadLeads();
  }, []);

  const loadLeads = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('free_report_leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading leads from Supabase:', error);
        setLeads([]);
        setFilteredLeads([]);
        return;
      }

      setLeads(data || []);
      setFilteredLeads(data || []);
      console.log(`Loaded ${data?.length || 0} leads from Supabase`);
    } catch (error) {
      console.error('Error loading leads:', error);
      setLeads([]);
      setFilteredLeads([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let result = [...leads];

    // Apply search
    if (searchTerm) {
      const sanitizedTerm = sanitizeSearchQuery(searchTerm).toLowerCase();
      if (sanitizedTerm) {
        result = result.filter(lead =>
          lead.email?.toLowerCase().includes(sanitizedTerm) ||
          lead.website?.toLowerCase().includes(sanitizedTerm)
        );
      }
    }

    // Apply cited filter
    if (filterCited !== 'all') {
      const isCited = filterCited === 'cited';
      result = result.filter(lead => lead.is_cited === isCited);
    }

    // Apply industry filter
    if (filterIndustry !== 'all') {
      result = result.filter(lead => lead.industry === filterIndustry);
    }

    // Apply sorting
    result.sort((a, b) => {
      let valueA: string | number | null = a[sortBy.field];
      let valueB: string | number | null = b[sortBy.field];

      // Handle dates
      if (sortBy.field === 'created_at') {
        valueA = typeof valueA === 'string' ? new Date(valueA).getTime() : 0;
        valueB = typeof valueB === 'string' ? new Date(valueB).getTime() : 0;
      }

      // Handle null/undefined
      if (valueA === null || valueA === undefined) return 1;
      if (valueB === null || valueB === undefined) return -1;

      // Handle string comparison
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return sortBy.direction === 'asc'
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }

      // Handle number comparison
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return sortBy.direction === 'asc' ? valueA - valueB : valueB - valueA;
      }

      return 0;
    });

    setFilteredLeads(result);
  }, [leads, searchTerm, filterCited, filterIndustry, sortBy]);

  const handleSort = (field: SortableLeadField) => {
    setSortBy(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const exportLeads = () => {
    const csvContent = [
      ['ID', 'Email', 'Website', 'Is Cited', 'AI Score', 'Citation Rate', 'Industry', 'Competitor Count', 'Created At'].join(','),
      ...filteredLeads.map(lead => [
        lead.id,
        lead.email,
        `"${lead.website}"`,
        lead.is_cited ? 'Yes' : 'No',
        lead.ai_score || '',
        lead.citation_rate ? `${lead.citation_rate}%` : '',
        `"${lead.industry || ''}"`,
        lead.competitor_count,
        lead.created_at
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `free-report-leads-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate summary stats
  const stats = useMemo(() => {
    const total = leads.length;
    const cited = leads.filter(l => l.is_cited).length;
    const citedPercent = total > 0 ? Math.round((cited / total) * 100) : 0;
    const avgScore = total > 0
      ? Math.round(leads.reduce((sum, l) => sum + (l.ai_score || 0), 0) / total)
      : 0;

    // Find top industry
    const industryCounts: Record<string, number> = {};
    leads.forEach(l => {
      if (l.industry) {
        industryCounts[l.industry] = (industryCounts[l.industry] || 0) + 1;
      }
    });
    const topIndustry = Object.entries(industryCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    return { total, cited, citedPercent, avgScore, topIndustry };
  }, [leads]);

  if (isRedirecting) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-900">
        <div className="bg-red-900/30 border-2 border-red-700 rounded-xl p-8 max-w-md text-center">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-slate-400 mb-6">
            You don't have permission to access this page. Redirecting you to the dashboard...
          </p>
          <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-900 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => window.location.hash = '#dashboard'}
              className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>

            <div>
              <h1 className="text-3xl font-bold text-white">Free Report Leads</h1>
              <p className="text-slate-400 mt-1">Track free report submissions and lead quality</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={loadLeads}
              className="flex items-center space-x-2 px-4 py-2 border border-slate-600 rounded-lg hover:bg-slate-800 text-slate-300 transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-slate-400" />
              <span>Refresh</span>
            </button>

            <button
              onClick={exportLeads}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
            <div className="flex items-center space-x-3">
              <Users className="w-8 h-8 text-blue-400" />
              <div>
                <div className="text-sm text-slate-400">Total Leads</div>
                <div className="text-2xl font-bold text-white">{stats.total}</div>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
            <div className="flex items-center space-x-3">
              <Target className="w-8 h-8 text-green-400" />
              <div>
                <div className="text-sm text-slate-400">Cited</div>
                <div className="text-2xl font-bold text-green-400">{stats.citedPercent}%</div>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-8 h-8 text-purple-400" />
              <div>
                <div className="text-sm text-slate-400">Avg AI Score</div>
                <div className="text-2xl font-bold text-purple-400">{stats.avgScore}</div>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
            <div className="flex items-center space-x-3">
              <Globe className="w-8 h-8 text-amber-400" />
              <div>
                <div className="text-sm text-slate-400">Top Industry</div>
                <div className="text-lg font-bold text-amber-400 truncate">{stats.topIndustry}</div>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
            <div className="flex items-center space-x-3">
              <BarChart3 className="w-8 h-8 text-cyan-400" />
              <div>
                <div className="text-sm text-slate-400">This Week</div>
                <div className="text-2xl font-bold text-cyan-400">
                  {leads.filter(l => {
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return new Date(l.created_at) > weekAgo;
                  }).length}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Chart */}
        <SignupAnalytics leads={leads} users={[]} title="Lead Submissions" />

        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by email or website..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-600 text-white placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="text-slate-500" />
            <select
              value={filterCited}
              onChange={(e) => setFilterCited(e.target.value)}
              className="px-3 py-2 bg-slate-900 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Citation Status</option>
              <option value="cited">Cited</option>
              <option value="not-cited">Not Cited</option>
            </select>

            <select
              value={filterIndustry}
              onChange={(e) => setFilterIndustry(e.target.value)}
              className="px-3 py-2 bg-slate-900 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Industries</option>
              {industries.map(industry => (
                <option key={industry} value={industry}>{industry}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Leads Table */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700 bg-slate-800">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Free Report Submissions</h2>
              <div className="text-sm text-slate-400">
                {filteredLeads.length} {filteredLeads.length === 1 ? 'lead' : 'leads'} found
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-slate-400">Loading leads...</span>
              </div>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <Users className="w-12 h-12 text-slate-600 mb-4" />
              <p className="text-slate-400">No leads found</p>
              {(searchTerm || filterCited !== 'all' || filterIndustry !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterCited('all');
                    setFilterIndustry('all');
                  }}
                  className="mt-2 text-blue-400 hover:text-blue-300"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800">
                  <tr>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-700"
                      onClick={() => handleSort('email')}
                    >
                      Email
                      {sortBy.field === 'email' && (
                        <span className="ml-1">{sortBy.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-700"
                      onClick={() => handleSort('website')}
                    >
                      Website
                      {sortBy.field === 'website' && (
                        <span className="ml-1">{sortBy.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-700"
                      onClick={() => handleSort('ai_score')}
                    >
                      AI Score
                      {sortBy.field === 'ai_score' && (
                        <span className="ml-1">{sortBy.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-700"
                      onClick={() => handleSort('citation_rate')}
                    >
                      Citation Rate
                      {sortBy.field === 'citation_rate' && (
                        <span className="ml-1">{sortBy.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Cited
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-700"
                      onClick={() => handleSort('industry')}
                    >
                      Industry
                      {sortBy.field === 'industry' && (
                        <span className="ml-1">{sortBy.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Competitors
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-700"
                      onClick={() => handleSort('created_at')}
                    >
                      Date
                      {sortBy.field === 'created_at' && (
                        <span className="ml-1">{sortBy.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-slate-800/50 divide-y divide-slate-700">
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-700/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">{lead.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <a
                          href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-400 hover:text-blue-300"
                        >
                          {lead.website}
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${
                          (lead.ai_score || 0) >= 70 ? 'text-green-400' :
                          (lead.ai_score || 0) >= 40 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {lead.ai_score || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${
                          (lead.citation_rate || 0) >= 50 ? 'text-green-400' :
                          (lead.citation_rate || 0) >= 25 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {lead.citation_rate ? `${Math.round(lead.citation_rate)}%` : 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {lead.is_cited ? (
                          <span className="px-2 py-1 bg-green-900/30 text-green-400 rounded-full text-xs font-medium">Yes</span>
                        ) : (
                          <span className="px-2 py-1 bg-red-900/30 text-red-400 rounded-full text-xs font-medium">No</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-300">{lead.industry || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${
                          lead.competitor_count === 0 ? 'text-green-400' :
                          lead.competitor_count <= 3 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {lead.competitor_count}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-400">
                          {new Date(lead.created_at).toLocaleDateString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
