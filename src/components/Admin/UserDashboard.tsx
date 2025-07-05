import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, Download, RefreshCw, CreditCard, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function UserDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [sortBy, setSortBy] = useState<{field: string, direction: 'asc' | 'desc'}>({
    field: 'createdAt',
    direction: 'desc'
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    setIsLoading(true);
    try {
      // Load users from localStorage
      const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
      
      // Get current user data which includes subscription info
      const currentUserStr = localStorage.getItem('currentUser');
      let currentUser = null;
      if (currentUserStr) {
        currentUser = JSON.parse(currentUserStr);
      }
      
      // Combine data from both sources
      const allUsers = storedUsers.map((user: any) => {
        // If this is the current user, use that data as it's more up-to-date
        if (currentUser && user.email === currentUser.email) {
          return {
            ...user,
            subscription: currentUser.subscription,
            paymentMethodAdded: currentUser.paymentMethodAdded
          };
        }
        return user;
      });
      
      setUsers(allUsers);
      setFilteredUsers(allUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Apply filters and search
    let result = [...users];
    
    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(user => 
        user.name?.toLowerCase().includes(term) || 
        user.email?.toLowerCase().includes(term)
      );
    }
    
    // Apply plan filter
    if (filterPlan !== 'all') {
      result = result.filter(user => user.subscription === filterPlan);
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let valueA = a[sortBy.field];
      let valueB = b[sortBy.field];
      
      // Handle dates
      if (sortBy.field === 'createdAt' || sortBy.field === 'trialEndsAt') {
        valueA = valueA ? new Date(valueA).getTime() : 0;
        valueB = valueB ? new Date(valueB).getTime() : 0;
      }
      
      if (sortBy.direction === 'asc') {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });
    
    setFilteredUsers(result);
  }, [users, searchTerm, filterPlan, sortBy]);

  const handleSort = (field: string) => {
    setSortBy(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const exportUsers = () => {
    const csvContent = [
      // Header row
      ['ID', 'Name', 'Email', 'Subscription', 'Payment Method', 'Created At', 'Trial Ends At'].join(','),
      // Data rows
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
    link.setAttribute('download', `users-export-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getSubscriptionBadge = (subscription: string) => {
    switch (subscription) {
      case 'starter':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">Starter</span>;
      case 'professional':
        return <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">Professional</span>;
      case 'enterprise':
        return <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">Enterprise</span>;
      case 'trial':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">Trial</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">Free</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Monitor user accounts and subscription status</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={loadUsers}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-gray-600" />
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

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter className="text-gray-400" />
          <select
            value={filterPlan}
            onChange={(e) => setFilterPlan(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Plans</option>
            <option value="free">Free</option>
            <option value="trial">Trial</option>
            <option value="starter">Starter</option>
            <option value="professional">Professional</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Registered Users</h2>
            <div className="text-sm text-gray-500">
              {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'} found
            </div>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-600">Loading users...</span>
            </div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Users className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-500">No users found</p>
            {searchTerm || filterPlan !== 'all' ? (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterPlan('all');
                }}
                className="mt-2 text-blue-600 hover:text-blue-800"
              >
                Clear filters
              </button>
            ) : null}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('name')}
                  >
                    Name
                    {sortBy.field === 'name' && (
                      <span className="ml-1">{sortBy.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('email')}
                  >
                    Email
                    {sortBy.field === 'email' && (
                      <span className="ml-1">{sortBy.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('subscription')}
                  >
                    Subscription
                    {sortBy.field === 'subscription' && (
                      <span className="ml-1">{sortBy.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('paymentMethodAdded')}
                  >
                    Payment Method
                    {sortBy.field === 'paymentMethodAdded' && (
                      <span className="ml-1">{sortBy.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('createdAt')}
                  >
                    Created
                    {sortBy.field === 'createdAt' && (
                      <span className="ml-1">{sortBy.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('trialEndsAt')}
                  >
                    Trial Status
                    {sortBy.field === 'trialEndsAt' && (
                      <span className="ml-1">{sortBy.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => {
                  // Calculate trial status
                  const now = new Date();
                  const trialEnd = user.trialEndsAt ? new Date(user.trialEndsAt) : null;
                  const trialActive = trialEnd && trialEnd > now;
                  const daysRemaining = trialEnd 
                    ? Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                    : 0;
                  
                  return (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                            {user.name ? user.name.charAt(0) : '?'}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{user.name || 'N/A'}</div>
                            <div className="text-xs text-gray-500">ID: {user.id.substring(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getSubscriptionBadge(user.subscription)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {user.paymentMethodAdded ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                              <span className="text-sm text-gray-900">Added</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 text-red-500 mr-2" />
                              <span className="text-sm text-gray-900">None</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.subscription === 'trial' ? (
                          <div className="flex items-center">
                            {trialActive ? (
                              <div className="flex items-center">
                                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                <span className="text-sm text-gray-900">
                                  {daysRemaining} days left
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                                <span className="text-sm text-gray-900">Expired</span>
                              </div>
                            )}
                          </div>
                        ) : user.subscription === 'free' ? (
                          <span className="text-sm text-gray-500">N/A</span>
                        ) : (
                          <div className="flex items-center">
                            <CreditCard className="w-4 h-4 text-green-500 mr-2" />
                            <span className="text-sm text-gray-900">Paid Plan</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="text-sm text-gray-500 mb-1">Total Users</div>
          <div className="text-3xl font-bold text-gray-900">{users.length}</div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="text-sm text-gray-500 mb-1">Paid Subscriptions</div>
          <div className="text-3xl font-bold text-blue-600">
            {users.filter(u => ['starter', 'professional', 'enterprise'].includes(u.subscription)).length}
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="text-sm text-gray-500 mb-1">Active Trials</div>
          <div className="text-3xl font-bold text-yellow-600">
            {users.filter(u => {
              if (u.subscription !== 'trial') return false;
              const trialEnd = u.trialEndsAt ? new Date(u.trialEndsAt) : null;
              return trialEnd && trialEnd > new Date();
            }).length}
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="text-sm text-gray-500 mb-1">Payment Methods Added</div>
          <div className="text-3xl font-bold text-green-600">
            {users.filter(u => u.paymentMethodAdded).length}
          </div>
        </div>
      </div>
    </div>
  );
}