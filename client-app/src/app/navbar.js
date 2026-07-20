'use client';
import React, { useState, useEffect } from 'react';

export default function GlobalWorkspaceNavbar() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

const handleLogout = async () => {
  try {
    await fetch('http://localhost:5001/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });

    localStorage.clear();
    router.push('/login');
  } catch (err) {
    console.error('Logout tracking error:', err);
  }
};

  return (
    <nav className="h-14 w-screen bg-neutral-900 border-b border-neutral-800 px-6 flex items-center justify-between font-sans fixed top-0 left-0 z-50">
      <div className="flex items-center space-x-6">
        <a href="/" className="text-sm font-extrabold tracking-tight bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
          InterviewFlow ⚡
        </a>
        <div className="flex items-center space-x-4 text-xs font-medium text-neutral-400">
          <a href="/analytics" className="hover:text-neutral-200 transition">Analytics Hub</a>
          <button 
            onClick={() => {
              const randomRoom = Math.random().toString(36).substring(2, 8);
              window.location.href = `/interview/${randomRoom}`;
            }}
            className="hover:text-neutral-200 transition text-left"
          >
            Create Practice Room
          </button>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {user ? (
          <div className="flex items-center space-x-3.5">
            <span className="text-[11px] font-mono bg-neutral-950 px-2.5 py-1 rounded-md border border-neutral-800 text-neutral-400">
              👤 {user.username}
            </span>
            <button 
              onClick={handleClearSessionLogout}
              className="text-[11px] text-neutral-500 hover:text-rose-400 font-medium transition"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <a href="/login" className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg transition">
            Sign In
          </a>
        )}
      </div>
    </nav>
  );
}