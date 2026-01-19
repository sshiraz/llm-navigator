import React, { useState, useEffect } from 'react';
import { Home, Plus, Search, DollarSign, Users, LogOut, Mail, UserCog, History } from 'lucide-react';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onLogout: () => void;
}

export default function Sidebar({ activeSection, onSectionChange, onLogout }: SidebarProps) {
  // Get current user from localStorage to check if admin
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('currentUser');
      if (userStr) {
        const user = JSON.parse(userStr);
        setIsAdmin(user.isAdmin === true);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'new-analysis', label: 'New Analysis', icon: Plus },
    { id: 'history', label: 'History', icon: History },
    { id: 'competitor-strategy', label: 'Competitor Strategy', icon: Users },
    { id: 'pricing', label: 'Pricing', icon: DollarSign },
    { id: 'contact', label: 'Contact Us', icon: Mail }
  ];

  // Add admin menu items if user is admin
  const adminMenuItems = [
    { id: 'admin-users', label: 'User Management', icon: UserCog }
  ];

  // Navigate by updating hash (keeps URL and state in sync)
  const navigateTo = (section: string) => {
    window.location.hash = section;
    onSectionChange(section); // Also update state immediately for responsiveness
  };

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-700 h-screen flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <button
          onClick={() => navigateTo('landing')}
          className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <Search className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">LLM Navigator</h1>
            <p className="text-xs text-slate-400">Answer Engine Optimization</p>
          </div>
        </button>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          return (
            <button
              key={item.id}
              onClick={() => navigateTo(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}

        {/* Admin Menu Items */}
        {isAdmin && (
          <>
            <div className="mt-6 mb-2 px-4">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Admin
              </div>
            </div>

            {adminMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => navigateTo(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </>
        )}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-slate-700">
        <button
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
}
