// components/layout.js
import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../lib/auth';

const getMenuItems = (role) => {
  const common = [
    { name: 'Dashboard', href: '/dashboard', icon: '🏠' },
    { name: 'Profile', href: '/profile', icon: '👤' },
  ];

  if (role === 'Admin') {
    return [
      ...common,
      { name: 'User Management', href: '/dashboard?view=users', icon: '👥' }, // Admin-Only
      { name: 'Reports', href: '/dashboard?view=reports', icon: '📊' }, // Admin-Only
    ];
  } else if (role === 'Manager') {
    return [
      ...common,
      { name: 'Project Management', href: '/dashboard?view=projects', icon: '🗂️' }, // Manager-Only
      { name: 'Team View', href: '/dashboard?view=team', icon: '🧑‍🤝‍🧑' }, // Manager-Only
    ];
  } else if (role === 'User') {
    return [
      ...common,
      { name: 'My Tasks', href: '/dashboard?view=tasks', icon: '✔️' }, // User-Only
    ];
  }
  return []; // For unauthenticated users
};

const Layout = ({ children }) => {
  const { user, logout, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // If on the login page, don't show the layout
  if (typeof window !== 'undefined' && window.location.pathname === '/') {
    return <>{children}</>;
  }

  // Show a blank screen while loading/redirecting
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading application...</div>;
  }
  
  const menuItems = getMenuItems(user?.role);

  return (
    <div className="flex h-screen bg-gray-100">
      
      {/* Sidebar (Shared Layout) */}
      {user && (
        <aside className={`bg-gray-800 text-white w-64 space-y-6 py-7 px-2 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition duration-200 ease-in-out`}>
          <div className="text-xl font-bold p-3">RBAC Dashboard</div>
          <p className="text-sm text-gray-400 p-3">Role: {user.role}</p>
          <nav>
            {/* Dynamic UI/menu rendering by role */}
            {menuItems.map((item) => (
              <Link key={item.name} href={item.href} className="flex items-center space-x-2 py-2 px-3 hover:bg-gray-700 transition duration-150">
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
              </Link>
            ))}
          </nav>
        </aside>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Navbar (Shared Layout) */}
        <header className="flex items-center justify-between bg-white shadow p-4">
          <button 
            className="text-gray-500 md:hidden" 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            ☰
          </button>
          <h1 className="text-xl font-semibold">Welcome, {user?.email || 'Guest'}</h1>
          
          {user && (
            <button 
              onClick={logout} 
              className="px-4 py-1 text-sm rounded text-white bg-red-500 hover:bg-red-600"
            >
              Logout
            </button>
          )}
        </header>
        
        {/* Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;