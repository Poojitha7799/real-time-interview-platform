'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState('');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const activeRole = localStorage.getItem('userRole') || 'CANDIDATE';
    
    if (activeRole === 'RECRUITER' || activeRole === 'INTERVIEWER') {
      router.replace('/admin/dashboard');
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

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center font-mono text-xs text-neutral-500">
        <span>Verifying security clearance matrix parameters...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 flex flex-col items-center justify-center p-6 font-sans antialiased selection:bg-purple-500/30" suppressHydrationWarning={true}>
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
  );
}