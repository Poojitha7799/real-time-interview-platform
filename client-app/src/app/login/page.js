'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
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
      const res = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
          password: formData.password
        }),
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Authentication challenge failed.');
        setLoading(false);
        return;
      }

      if (data.user) {
        const role = data.user.role.toLowerCase().trim();

        if (role === 'admin') {
          router.replace('/admin/dashboard');
        } else if (role === 'interviewer') {
          router.replace('/interviewer/dashboard');
        } else if (role === 'candidate') {
          router.replace('/');
        } else {
          setError('Unknown user role configuration.');
          setLoading(false);
        }
      }
    } catch (err) {
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
              suppressHydrationWarning={true}
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
              suppressHydrationWarning={true}
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
            suppressHydrationWarning={true}
            className="w-full h-14 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white font-mono font-black text-sm uppercase rounded-2xl tracking-wider transition-all shadow-lg shadow-purple-950/20 flex items-center justify-center mt-6 disabled:opacity-50"
          >
            {loading ? 'SIGNING IN...' : 'AUTHENTICATE PROFILE'}
          </button>
        </form>

        <div className="text-center text-xs text-neutral-500 font-mono select-none">
          Don't have an operational account?{' '}
          <span onClick={() => router.push('/register')} className="text-purple-400 hover:underline cursor-pointer">
            Create an account
          </span>
        </div>
      </div>
    </div>
  );
}