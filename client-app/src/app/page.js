'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState('');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const getCookie = (name) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
      return null;
    };

    const role = getCookie('user_role')?.toLowerCase().trim();

    if (!role) {
      window.location.href = '/login';
    } else if (role === 'admin') {
      window.location.href = '/admin/dashboard';
    } else if (role === 'interviewer') {
      window.location.href = '/interviewer/dashboard';
    } else {
      setIsCheckingAuth(false);
    }
  }, [router]);

  const handleJoinInterview = (e) => {
    e.preventDefault();
    if (!roomCode.trim()) return;
    router.push(`/interview/${roomCode.trim()}?role=candidate`);
  };

  const handleLaunchMock = () => {
    router.push('/mock-practice');
  };

  const handleLogout = () => {
    document.cookie = 'user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    document.cookie = 'user_email=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    window.location.href = '/login';
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center font-mono text-xs text-neutral-500">
        <span>Verifying security clearance matrix parameters...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 flex flex-col font-sans antialiased selection:bg-purple-500/30">
      <style dangerouslySetInnerHTML={{ __html: `* { scrollbar-width: none !important; } *::-webkit-scrollbar { display: none !important; }` }} />
      
      {/* Sleek Strategic Top Navbar */}
      <nav className="w-full h-16 bg-[#0e0e0e]/40 border-b border-neutral-900 px-8 flex items-center justify-between select-none fixed top-0 left-0 backdrop-blur-md z-50">
        <div className="flex items-center space-x-3">
          <span className="text-sm font-black tracking-wider text-neutral-100 uppercase">INTERVIEWFLOW</span>
          <span className="bg-purple-950/40 border border-purple-900/50 text-purple-400 font-mono text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">CANDIDATE SUITE</span>
        </div>
        <div className="flex items-center space-x-6">
          <button 
            onClick={() => router.push('/analytics')}
            className="text-xs font-mono font-bold text-neutral-400 hover:text-purple-400 transition uppercase tracking-wider"
          >
            📊 Analytics Hub
          </button>
          <button 
            onClick={handleLogout}
            className="text-xs font-mono font-bold text-neutral-500 hover:text-rose-400 transition uppercase tracking-wider"
          >
            Disconnect
          </button>
        </div>
      </nav>

      {/* Main Centered Content Wrapper */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 mt-16">
        <div className="w-full max-w-md space-y-8 text-center" suppressHydrationWarning={true}>
          
          <div className="space-y-2 select-none">
            <h1 className="text-4xl font-black tracking-tight text-neutral-100">
              InterviewFlow Core
            </h1>
          </div>

          <div className="space-y-6">
            <button
              onClick={handleLaunchMock}
              suppressHydrationWarning={true}
              className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white font-bold text-xs tracking-wide rounded-xl shadow-lg shadow-purple-950/20 active:scale-[0.99] transition duration-150 flex items-center justify-center space-x-2 uppercase font-mono"
            >
              <span>🤖 Launch AI Self-Practice Mock</span>
            </button>

            <div className="relative flex py-2 items-center select-none">
              <div className="flex-grow border-t border-neutral-900"></div>
              <span className="flex-shrink mx-4 text-[10px] text-neutral-600 font-mono uppercase tracking-widest font-black">
                Candidate Assessment Link
              </span>
              <div className="flex-grow border-t border-neutral-900"></div>
            </div>

            <form onSubmit={handleJoinInterview} className="space-y-3">
              <input
                type="text"
                placeholder="ENTER ROOM CODE (PROVIDED BY RECRUITER)"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                suppressHydrationWarning={true}
                className="w-full px-4 py-3.5 bg-neutral-900/40 border border-neutral-900 rounded-xl text-xs font-mono text-center text-neutral-200 placeholder-neutral-600 outline-none focus:border-purple-900/60 uppercase tracking-wider transition"
              />

              <button
                type="submit"
                disabled={!roomCode.trim()}
                suppressHydrationWarning={true}
                className="w-full py-3.5 bg-neutral-900 border border-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-800 text-neutral-300 font-bold text-xs tracking-wide rounded-xl transition duration-150 flex items-center justify-center space-x-2 uppercase font-mono"
              >
                <span>👤 Join Scheduled Interview</span>
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}