'use client';

import { useState } from 'react';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.email || !formData.password) {
      setError('Email and password are required.');
      setLoading(false);
      return;
    }

    try {
      // FIXED: Changed from http://localhost:5000/api/login to relative Next.js API route
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        // FIXED: Dynamically bubbles the real error message sent from the server route
        setError(data.error || 'Authentication challenge failed.');
        setLoading(false);
        return;
      }

      if (data.user) {
        document.cookie = `user_role=${data.user.role}; path=/; max-age=86400; SameSite=Lax`;
        document.cookie = `user_email=${data.user.email}; path=/; max-age=86400; SameSite=Lax`;
        
        const role = data.user.role.toLowerCase().trim();

        if (role === 'admin') {
          window.location.href = '/admin/dashboard';
        } else if (role === 'interviewer') {
          window.location.href = '/interviewer/dashboard';
        } else {
          window.location.href = '/';
        }
      }
    } catch (err) {
      // FIXED: Fallback to capturing actual runtime communication problems
      setError(err.message || 'Connection lost with backend pipeline.');
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-[#0a0a0a] flex items-center justify-center text-[#d4d4d4] font-sans antialiased p-4">
      <div className="w-full max-w-md bg-[#141414] border border-neutral-900 rounded-2xl p-8 space-y-6">
        <div className="text-center space-y-2 select-none">
          <h1 className="text-2xl font-black uppercase tracking-wider text-neutral-100">SIGN IN</h1>
          <p className="text-xs text-neutral-500">Access your operational profile on InterviewFlow.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider font-mono block">EMAIL ADDRESS</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full block h-12 bg-black border border-neutral-800 rounded-xl px-4 text-sm font-mono outline-none text-neutral-200 focus:border-purple-600 transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider font-mono block">PASSWORD</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full block h-12 bg-black border border-neutral-800 rounded-xl px-4 text-sm font-mono outline-none text-neutral-200 focus:border-purple-600 transition"
            />
          </div>

          {error && (
            <div className="text-center pt-1 text-xs font-mono font-bold text-rose-500 flex items-center justify-center space-x-1.5 animate-pulse select-text">
              <span>⚠️</span>
              <span>{error.toUpperCase()}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white font-mono font-black text-sm uppercase rounded-2xl tracking-wider transition-all shadow-lg shadow-purple-950/20 flex items-center justify-center mt-6 disabled:opacity-50"
          >
            {loading ? 'SIGNING IN...' : 'AUTHENTICATE PROFILE'}
          </button>
        </form>

        <div className="text-center text-xs text-neutral-500 font-mono select-none">
          Don't have an operational account?{' '}
          <span onClick={() => window.location.href = '/register'} className="text-purple-400 hover:underline cursor-pointer">
            Create an account
          </span>
        </div>
      </div>
    </div>
  );
}
