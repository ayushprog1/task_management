// lib/auth.js

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_fallback_secret_key'; 

export function generateToken(user) {
    const payload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName, 
        lastName: user.lastName,
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    // FIX: Initialize loading to TRUE for SSR/Client state alignment (Hydration Fix)
    const [token, setToken] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); 

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      const decodedUser = decodeToken(storedToken);
      if (decodedUser) {
        setToken(storedToken);
        setUser(decodedUser);
      } else {
        localStorage.removeItem('token');
      }
    }
    setLoading(false); 
  }, []);

  const decodeToken = (t) => {
    try {
      return jwt.decode(t);
    } catch (e) {
      console.error("Failed to decode token:", e);
      return null;
    }
  };

  const login = async (email, password) => {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem('token', data.token);
      const decodedUser = decodeToken(data.token);
      setToken(data.token);
      setUser(decodedUser);
      return true;
    } else {
      throw new Error(data.message || 'Login failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    window.location.href = '/'; 
  };

  const value = {
    token,
    user,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

export function withAuth(Component) {
  // eslint-disable-next-line react/display-name
  return (props) => {
    const { token, loading } = useContext(AuthContext);
    const router = useRouter();

    if (loading) {
      return <div className="p-8 text-center">Loading authentication...</div>;
    }

    if (!token) {
      router.push('/'); 
      return null;
    }

    return <Component {...props} />;
  };
}