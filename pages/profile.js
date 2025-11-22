// pages/profile.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import ProtectedRoute from '../components/ProtectedRoute'; // Placeholder for route protection

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (user) {
      // In a real app, fetch the full profile data here
      setFirstName(user.firstName || 'Default'); 
      setLastName(user.lastName || 'User');
    }
  }, [user]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setStatus('Updating...');

    const res = await fetch('/api/data?resource=profile', {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ firstName, lastName }),
    });

    if (res.ok) {
      setStatus('Profile updated successfully!');
    } else {
      setStatus('Failed to update profile.');
    }
  };

  if (!user) return null; // Should be blocked by ProtectedRoute anyway

  // --- UI: Common to All Users (Profile Page) ---
  return (
    <ProtectedRoute>
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-semibold mb-6">My Profile</h1>
        <div className="bg-white shadow rounded-lg p-6">
          <p className="mb-4">
            **Role:** <span className="font-medium text-indigo-600">{user.role}</span>
          </p>
          <p className="mb-6">
            **Email:** <span className="text-gray-600">{user.email}</span>
          </p>

          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First Name</label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last Name</label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Update Profile
            </button>
            <p className="mt-2 text-sm text-green-600">{status}</p>
          </form>
          
          <hr className="my-6" />

          {/* Logout functionality */}
          <button
            onClick={logout}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default ProfilePage;