'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
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

    if (!formData.username || !formData.email || !formData.password) {
      setError('All fields are required.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Internal Server Error');
        setLoading(false);
        return;
      }

      router.push('/login');
    } catch (err) {
      setError('Internal Server Error');
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-[#0a0a0a] flex items-center justify-center text-[#d4d4d4] font-sans antialiased p-4">
      <div className="w-full max-w-md bg-[#141414] border border-neutral-900 rounded-2xl p-8 space-y-6">
        <div className="text-center space-y-2 select-none">
          <h1 className="text-2xl font-black uppercase tracking-wider text-neutral-100">CREATE AN ACCOUNT</h1>
          <p className="text-xs text-neutral-500">Join InterviewFlow to start practicing mock technical interviews.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider font-mono block">USERNAME</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              className="w-full block h-12 bg-black border border-neutral-800 rounded-xl px-4 text-sm font-mono outline-none text-neutral-200 focus:border-purple-600 transition"
            />
          </div>

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
            <div className="text-center pt-1 text-xs font-mono font-bold text-rose-500 flex items-center justify-center space-x-1.5 animate-pulse">
              <span>⚠️</span>
              <span>{error.toUpperCase()}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white font-mono font-black text-sm uppercase rounded-2xl tracking-wider transition-all shadow-lg shadow-purple-950/20 flex items-center justify-center mt-6 disabled:opacity-50"
          >
            {loading ? 'REGISTERING...' : 'REGISTER PROFILE'}
          </button>
        </form>

        <div className="text-center text-xs text-neutral-500 font-mono select-none">
          Already have an operational account?{' '}
          <span onClick={() => router.push('/login')} className="text-purple-400 hover:underline cursor-pointer">
            Log in here
          </span>
        </div>
      </div>
    </div>
  );
}