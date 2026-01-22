import React, { useState, useEffect, useMemo } from 'react';
import { Users, Search, Filter, Download, RefreshCw, ArrowLeft, Shield, CreditCard, UserPlus, Clock, TrendingUp } from 'lucide-react';
import { User } from '../../types';
import { supabase } from '../../lib/supabase';
import { sanitizeSearchQuery } from '../../utils/sanitize';
import SignupAnalytics from './SignupAnalytics';

export default function SignupsDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterPayment, setFilterPayment] = useState('all');

  const sortableFields = ['createdAt', 'name', 'email', 'subscription'] as const;
  type SortableUserField = typeof sortableFields[number];
  const [sortBy, setSortBy] = useState<{field: SortableUserField, direction: 'asc' | 'desc'}>({
    field: 'createdAt',
    direction: 'desc'
  });

  const [isAdmin, setIsAdmin] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
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

    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading users from Supabase:', error);
        setUsers([]);
        setFilteredUsers([]);
        return;
      }

      const mappedUsers: User[] = (data || []).map((u: any) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        avatar: u.avatar,
        subscription: u.subscription,
        trialEndsAt: u.trial_ends_at,
        paymentMethodAdded: u.payment_method_added,
        isAdmin: u.is_admin,
        createdAt: u.created_at
      }));

      setUsers(mappedUsers);
      setFilteredUsers(mappedUsers);
      console.log(`Loaded ${mappedUsers.length} users from Supabase`);
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let result = [...users];

    if (searchTerm) {
      const sanitizedTerm = sanitizeSearchQuery(searchTerm).toLowerCase();
      if (sanitizedTerm) {
        result = result.filter(user =>
          user.name?.toLowerCase().includes(sanitizedTerm) ||
          user.email?.toLowerCase().includes(sanitizedTerm)
        );
      }
    }

    if (filterPlan !== 'all') {
      result = result.filter(user => user.subscription === filterPlan);
    }

    if (filterPayment !== 'all') {
      const hasPayment = filterPayment === 'yes';
      result = result.filter(user => user.paymentMethodAdded === hasPayment);
    }

    result.sort((a, b) => {
      let valueA: string | number | undefined = a[sortBy.field];
      let valueB: string | number | undefined = b[sortBy.field];

      if (sortBy.field === 'createdAt') {
        valueA = typeof valueA === 'string' ? new Date(valueA).getTime() : 0;
        valueB = typeof valueB === 'string' ? new Date(valueB).getTime() : 0;
      }

      if (valueA === undefined) return 1;
      if (valueB === undefined) return -1;

      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return sortBy.direction === 'asc'
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }

      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return sortBy.direction === 'asc' ? valueA - valueB : valueB - valueA;
      }

      return 0;
    });

    setFilteredUsers(result);
  }, [users, searchTerm, filterPlan, filterPayment, sortBy]);

  const handleSort = (field: SortableUserField) => {
    setSortBy(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const exportUsers = () => {
    const csvContent = [
      ['ID', 'Name', 'Email', 'Subscription', 'Payment Method', 'Created At', 'Trial Ends At'].join(','),
      ...filteredUsers.map(user => [
        user.id,
        `"${user.name || ''}"`,
        user.email,
        user.subscription,
        user.paymentMethodAdded ? 'Yes' : 'No',
        user.createdAt,
        user.trialEndsAt || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `user-signups-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const stats = useMemo(() => {
    const total = users.length;
    const paid = users.filter(u => ['starter', 'professional', 'enterprise'].includes(u.subscription)).length;
    const trials = users.filter(u => {
      if (u.subscription !== 'trial') return false;
      const trialEnd = u.trialEndsAt ? new Date(u.trialEndsAt) : null;
      return trialEnd && trialEnd > new Date();
    }).length;
    const withPayment = users.filter(u => u.paymentMethodAdded).length;
    const thisWeek = users.filter(u => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return u.createdAt && new Date(u.createdAt) > weekAgo;
    }).length;

    return { total, paid, trials, withPayment, thisWeek };
  }, [users]);

  const getSubscriptionBadge = (subscription: string) => {
    switch (subscription) {
      case 'starter':
        return <span className="px-2 py-1 bg-blue-900/30 text-blue-400 rounded-full text-xs font-medium">Starter</span>;
      case 'professional':
        return <span className="px-2 py-1 bg-purple-900/30 text-purple-400 rounded-full text-xs font-medium">Professional</span>;
      case 'enterprise':
        return <span className="px-2 py-1 bg-indigo-900/30 text-indigo-400 rounded-full text-xs font-medium">Enterprise</span>;
      case 'trial':
        return <span className="px-2 py-1 bg-yellow-900/30 text-yellow-400 rounded-full text-xs font-medium">Trial</span>;
      default:
        return <span className="px-2 py-1 bg-slate-700 text-slate-300 rounded-full text-xs font-medium">Free</span>;
    }
  };

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
              <h1 className="text-3xl font-bold text-white">Account Signups</h1>
              <p className="text-slate-400 mt-1">Track new user registrations and conversions</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={loadUsers}
              className="flex items-center space-x-2 px-4 py-2 border border-slate-600 rounded-lg hover:bg-slate-800 text-slate-300 transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-slate-400" />
              <span>Refresh</span>
            </button>

            <button
              onClick={exportUsers}
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
                <div className="text-sm text-slate-400">Total Users</div>
                <div className="text-2xl font-bold text-white">{stats.total}</div>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
            <div className="flex items-center space-x-3">
              <CreditCard className="w-8 h-8 text-green-400" />
              <div>
                <div className="text-sm text-slate-400">Paid</div>
                <div className="text-2xl font-bold text-green-400">{stats.paid}</div>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
            <div className="flex items-center space-x-3">
              <Clock className="w-8 h-8 text-yellow-400" />
              <div>
                <div className="text-sm text-slate-400">Active Trials</div>
                <div className="text-2xl font-bold text-yellow-400">{stats.trials}</div>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-8 h-8 text-purple-400" />
              <div>
                <div className="text-sm text-slate-400">Payment Added</div>
                <div className="text-2xl font-bold text-purple-400">{stats.withPayment}</div>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
            <div className="flex items-center space-x-3">
              <UserPlus className="w-8 h-8 text-cyan-400" />
              <div>
                <div className="text-sm text-slate-400">This Week</div>
                <div className="text-2xl font-bold text-cyan-400">{stats.thisWeek}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Chart */}
        <SignupAnalytics leads={[]} users={users} title="User Signups" />

        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-600 text-white placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="text-slate-500" />
            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              className="px-3 py-2 bg-slate-900 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Plans</option>
              <option value="free">Free</option>
              <option value="trial">Trial</option>
              <option value="starter">Starter</option>
              <option value="professional">Professional</option>
              <option value="enterprise">Enterprise</option>
            </select>

            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              className="px-3 py-2 bg-slate-900 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Payment Status</option>
              <option value="yes">Has Payment Method</option>
              <option value="no">No Payment Method</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700 bg-slate-800">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">User Registrations</h2>
              <div className="text-sm text-slate-400">
                {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'} found
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-slate-400">Loading users...</span>
              </div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <Users className="w-12 h-12 text-slate-600 mb-4" />
              <p className="text-slate-400">No users found</p>
              {(searchTerm || filterPlan !== 'all' || filterPayment !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterPlan('all');
                    setFilterPayment('all');
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
                      onClick={() => handleSort('name')}
                    >
                      Name
                      {sortBy.field === 'name' && (
                        <span className="ml-1">{sortBy.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
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
                      onClick={() => handleSort('subscription')}
                    >
                      Plan
                      {sortBy.field === 'subscription' && (
                        <span className="ml-1">{sortBy.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Trial Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Payment
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-700"
                      onClick={() => handleSort('createdAt')}
                    >
                      Signed Up
                      {sortBy.field === 'createdAt' && (
                        <span className="ml-1">{sortBy.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-slate-800/50 divide-y divide-slate-700">
                  {filteredUsers.map((user) => {
                    const now = new Date();
                    const trialEnd = user.trialEndsAt ? new Date(user.trialEndsAt) : null;
                    const trialActive = trialEnd && trialEnd > now;
                    let daysRemaining = 0;
                    if (trialEnd) {
                      const diffTime = trialEnd.getTime() - now.getTime();
                      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    }

                    return (
                      <tr key={user.id} className="hover:bg-slate-700/50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-blue-900/30 flex items-center justify-center text-blue-400 font-semibold">
                              {user.name ? user.name.charAt(0) : '?'}
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-white">{user.name || 'N/A'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-300">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getSubscriptionBadge(user.subscription)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.subscription === 'trial' ? (
                            trialActive && daysRemaining > 0 ? (
                              <span className="text-sm text-green-400">{daysRemaining}d left</span>
                            ) : (
                              <span className="text-sm text-red-400">Expired</span>
                            )
                          ) : (
                            <span className="text-sm text-slate-500">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.paymentMethodAdded ? (
                            <span className="px-2 py-1 bg-green-900/30 text-green-400 rounded-full text-xs font-medium">Yes</span>
                          ) : (
                            <span className="px-2 py-1 bg-slate-700 text-slate-400 rounded-full text-xs font-medium">No</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-slate-400">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
