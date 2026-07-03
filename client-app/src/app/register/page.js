'use client';
import React, { useState } from 'react';

export default function RegisterAccountView() {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getPasswordStrength = (pass) => {
    if (!pass) return { text: '', color: 'text-neutral-500' };
    
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    switch (score) {
      case 0:
      case 1:
        return { text: 'Weak (Must be 8+ chars with upper/number/special)', color: 'text-rose-500' };
      case 2:
      case 3:
        return { text: 'Medium (Add upper, numbers, or special chars)', color: 'text-amber-500' };
      case 4:
        return { text: 'Strong Secure Matrix Signature', color: 'text-emerald-500' };
      default:
        return { text: '', color: 'text-neutral-500' };
    }
  };

  const isPasswordValid = (pass) => {
    return pass.length >= 8 && /[A-Z]/.test(pass) && /[0-9]/.test(pass) && /[^A-Za-z0-9]/.test(pass);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    const emailLower = formData.email.toLowerCase().trim();

    if (localStorage.getItem(`pass_${emailLower}`)) {
      setError('Registration Rejected: An account already exists with this email address.');
      setSubmitting(false);
      return;
    }

    if (!isPasswordValid(formData.password)) {
      setError('Registration Rejected: Password allocation does not meet the complexity safety matrix parameters.');
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Server rejected registration.');
        }
      } else {
        throw new Error('FallbackToLocal');
      }

      localStorage.setItem(`pass_${emailLower}`, formData.password);
      setSuccess('Profile saved to backend! Routing to login...');
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);

    } catch (err) {
      const designatedRole = emailLower.includes('recruiter') || emailLower.includes('hr') || emailLower.includes('interviewer') ? (emailLower.includes('interviewer') ? 'INTERVIEWER' : 'RECRUITER') : 'CANDIDATE';
      
      localStorage.setItem('userRole', designatedRole);
      localStorage.setItem('userEmail', emailLower);
      localStorage.setItem(`pass_${emailLower}`, formData.password);
      
      setSuccess('Registration handled locally! Routing to login portal...');
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    } finally {
      setSubmitting(false);
    }
  };

  const strength = getPasswordStrength(formData.password);

  return (
    <div className="h-screen w-screen bg-neutral-950 text-neutral-100 flex items-center justify-center font-sans p-4 selection:bg-purple-500/30">
      <div className="w-full max-w-md bg-neutral-900/40 border border-neutral-900 rounded-2xl p-8 backdrop-blur-sm shadow-[0_0_50px_rgba(0,0,0,0.3)]">
        <header className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Create an Account</h1>
          <p className="text-xs text-neutral-500 mt-1.5">Join InterviewFlow to start practicing mock technical interviews.</p>
        </header>

        {error && (
          <div className="mb-4 text-xs font-mono bg-rose-950/30 border border-rose-900/40 text-rose-400 p-3 rounded-lg leading-relaxed">
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div className="mb-4 text-xs font-mono bg-emerald-950/30 border border-emerald-900/40 text-emerald-400 p-3 rounded-lg leading-relaxed">
            ✅ {success}
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Username</label>
            <input
              type="text"
              name="username"
              required
              value={formData.username}
              onChange={handleInputChange}
              placeholder="e.g., candidate42"
              className="w-full h-10 bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 text-xs text-neutral-300 focus:outline-none focus:border-neutral-700 transition placeholder:text-neutral-700"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Email Address</label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              placeholder="candidate@nitmanipur.ac.in"
              className="w-full h-10 bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 text-xs text-neutral-300 focus:outline-none focus:border-neutral-700 transition placeholder:text-neutral-700"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Password</label>
              {strength.text && (
                <span className={`text-[9px] font-mono font-bold tracking-wide uppercase ${strength.color}`}>
                  {strength.text}
                </span>
              )}
            </div>
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleInputChange}
              placeholder="••••••••••••"
              className="w-full h-10 bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 text-xs text-neutral-300 focus:outline-none focus:border-neutral-700 transition placeholder:text-neutral-700"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-10 mt-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold tracking-wide transition shadow-[0_0_20px_rgba(147,51,234,0.15)] disabled:opacity-50"
          >
            {submitting ? 'Creating Profile...' : 'Register Profile'}
          </button>
        </form>

        <footer className="mt-6 text-center text-[11px] text-neutral-500">
          Already have an operational account?{' '}
          <a href="/login" className="text-purple-400 hover:underline">
            Log in here
          </a>
        </footer>
      </div>
    </div>
  );
}