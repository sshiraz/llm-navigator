import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, Download, RefreshCw, CreditCard, Clock, CheckCircle, XCircle, ArrowLeft, Shield, Save, X, Trash2, Loader2 } from 'lucide-react';
import { User } from '../../types';
import { supabase } from '../../lib/supabase';

export default function UserDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  // Define sortable fields
  const sortableFields = ['createdAt', 'trialEndsAt', 'name', 'email', 'subscription'] as const;
  type SortableUserField = typeof sortableFields[number];
  const [sortBy, setSortBy] = useState<{field: SortableUserField, direction: 'asc' | 'desc'}>({
    field: 'createdAt',
    direction: 'desc'
  });

  // State for editing user
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    subscription: '',
    paymentMethodAdded: false
  });
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  // Check if current user is admin
  const [isAdmin, setIsAdmin] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Check if user is admin
    try {
      const userStr = localStorage.getItem('currentUser');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.isAdmin !== true) {
          setIsRedirecting(true);
          // Redirect non-admin users
          setTimeout(() => {
            window.location.hash = '#dashboard';
          }, 2000);
        } else {
          setIsAdmin(true);
        }
      } else {
        setIsRedirecting(true);
        // Redirect if not logged in
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
      // Load users from Supabase
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

      // Map Supabase data to User type
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
      let valueA: string | number | undefined = a[sortBy.field];
      let valueB: string | number | undefined = b[sortBy.field];

      // Handle dates
      if (sortBy.field === 'createdAt' || sortBy.field === 'trialEndsAt') {
        valueA = typeof valueA === 'string' ? new Date(valueA).getTime() : 0;
        valueB = typeof valueB === 'string' ? new Date(valueB).getTime() : 0;
      }

      // Handle undefined
      if (valueA === undefined) return 1;
      if (valueB === undefined) return -1;

      // Handle string comparison
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        if (sortBy.direction === 'asc') {
          return valueA.localeCompare(valueB);
        } else {
          return valueB.localeCompare(valueA);
        }
      }

      // Handle number comparison
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        if (sortBy.direction === 'asc') {
          return valueA - valueB;
        } else {
          return valueB - valueA;
        }
      }

      // Fallback
      return 0;
    });
    
    setFilteredUsers(result);
  }, [users, searchTerm, filterPlan, sortBy]);

  const handleSort = (field: SortableUserField) => {
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

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      subscription: user.subscription || 'free',
      paymentMethodAdded: user.paymentMethodAdded || false
    });
  };

  const handleSaveUser = () => {
    if (!editingUser) return;

    try {
      // Update user in localStorage
      const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
      const updatedUsers = storedUsers.map((user: User) => {
        if (user.id === editingUser.id) {
          return {
            ...user,
            name: editForm.name,
            email: editForm.email,
            subscription: editForm.subscription,
            paymentMethodAdded: editForm.paymentMethodAdded
          };
        }
        return user;
      });
      
      localStorage.setItem('users', JSON.stringify(updatedUsers));
      
      // If this is the current user, update that too
      const currentUserStr = localStorage.getItem('currentUser');
      if (currentUserStr) {
        const currentUser = JSON.parse(currentUserStr);
        if (currentUser.id === editingUser.id) {
          const updatedCurrentUser = {
            ...currentUser,
            name: editForm.name,
            email: editForm.email,
            subscription: editForm.subscription,
            paymentMethodAdded: editForm.paymentMethodAdded
          };
          localStorage.setItem('currentUser', JSON.stringify(updatedCurrentUser));
        }
      }
      
      // Refresh user list
      loadUsers();
      
      // Close edit form
      setEditingUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user. Please try again.');
    }
  };

  const handleDeleteUser = async (userToDelete: User) => {
    // Don't allow deleting admin accounts
    if (userToDelete.isAdmin) {
      alert('Cannot delete admin accounts.');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${userToDelete.name || userToDelete.email}?\n\nThis will permanently delete:\n- User account\n- All their projects\n- All their analyses\n- All their payment records\n\nThis action cannot be undone.`)) {
      return;
    }

    // Get current admin user ID
    const currentUserStr = localStorage.getItem('currentUser');
    if (!currentUserStr) {
      alert('You must be logged in as an admin to delete users.');
      return;
    }

    const currentUser = JSON.parse(currentUserStr);
    if (!currentUser.isAdmin) {
      alert('You must be an admin to delete users.');
      return;
    }

    setDeletingUserId(userToDelete.id);

    try {
      // Call the delete-user Edge Function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            userIdToDelete: userToDelete.id,
            adminUserId: currentUser.id
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete user');
      }

      console.log('User deleted successfully:', result);
      alert(result.message || 'User deleted successfully');

      // Refresh user list
      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(`Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDeletingUserId(null);
    }
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

  // If not admin, show access denied
  if (isRedirecting) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 max-w-md text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            You don't have permission to access this page. Redirecting you to the dashboard...
          </p>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
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
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => window.location.hash = '#dashboard'}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
          
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-1">Monitor user accounts and subscription status</p>
          </div>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Method
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => {
                  // Calculate trial status
                  const now = new Date();
                  const trialEnd = user.trialEndsAt ? new Date(user.trialEndsAt) : null;
                  const trialActive = trialEnd && trialEnd > now;
                  
                  // Calculate days remaining more accurately
                  let daysRemaining = 0;
                  if (trialEnd) {
                    // Set both dates to midnight for accurate day calculation
                    const nowDate = new Date(now.setHours(0, 0, 0, 0));
                    const endDate = new Date(trialEnd.setHours(0, 0, 0, 0));
                    
                    // Calculate difference in days
                    const diffTime = endDate.getTime() - nowDate.getTime();
                    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  }
                  
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
                          <Clock className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.subscription === 'trial' ? (
                          <div className="flex items-center">
                            {trialActive && daysRemaining > 0 ? (
                              <div className="flex items-center">
                                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                <span className="text-sm text-gray-900">
                                  {daysRemaining === 0 ? 'Expires today' : 
                                   `${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} left`}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                                <span className="text-sm text-gray-900">
                                  {trialEnd ? 'Expired' : 'No end date'}
                                </span>
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                          <span className="text-sm text-gray-900">
                            {user.paymentMethodAdded ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end space-x-3">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                            disabled={deletingUserId === user.id}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user)}
                            disabled={deletingUserId === user.id || user.isAdmin}
                            className={`font-medium text-sm flex items-center space-x-1 ${
                              user.isAdmin
                                ? 'text-gray-400 cursor-not-allowed'
                                : 'text-red-600 hover:text-red-800'
                            }`}
                            title={user.isAdmin ? 'Cannot delete admin accounts' : 'Delete user'}
                          >
                            {deletingUserId === user.id ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Deleting...</span>
                              </>
                            ) : (
                              <>
                                <Trash2 className="w-4 h-4" />
                                <span>Delete</span>
                              </>
                            )}
                          </button>
                        </div>
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
      
      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Edit User</h3>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subscription
                </label>
                <select
                  value={editForm.subscription}
                  onChange={(e) => setEditForm({...editForm, subscription: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="free">Free</option>
                  <option value="trial">Trial</option>
                  <option value="starter">Starter</option>
                  <option value="professional">Professional</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="paymentMethodAdded"
                  checked={editForm.paymentMethodAdded}
                  onChange={(e) => setEditForm({...editForm, paymentMethodAdded: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="paymentMethodAdded" className="ml-2 block text-sm text-gray-900">
                  Payment Method Added
                </label>
              </div>
            </div>
            
            <div className="mt-6 flex space-x-3">
              <button
                onClick={() => setEditingUser(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              
              <button
                onClick={handleSaveUser}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}