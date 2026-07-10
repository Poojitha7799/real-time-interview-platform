'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function InterviewerDashboard() {
  const router = useRouter();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchActiveSessions() {
      try {
        const res = await fetch('/api/assignments/active');
        const data = await res.json();
        
        if (res.ok && data.success) {
          setSessions(data.assignments || []);
        } else {
          setError(data.error || 'Failed to load active sessions.');
        }
      } catch (err) {
        setError('Pipeline disconnect: Check server connection.');
      } finally {
        setLoading(false);
      }
    }

    fetchActiveSessions();
    const interval = setInterval(fetchActiveSessions, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleJoinRoom = (sessionId) => {
    router.push(`/interview/${sessionId}?role=interviewer`);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#d4d4d4] font-sans antialiased p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="border-b border-neutral-900 pb-4">
          <h1 className="text-2xl font-black uppercase tracking-wider text-neutral-100">Interviewer Dashboard</h1>
          <p className="text-xs text-neutral-500">Live upcoming scheduled assessments.</p>
        </div>

        {loading && <p className="text-sm font-mono animate-pulse">Loading sessions from database...</p>}
        {error && <p className="text-sm font-mono text-rose-500">⚠️ {error.toUpperCase()}</p>}

        {!loading && !error && (
          <div className="grid gap-4 md:grid-cols-2">
            {sessions.map((session) => (
              <div key={session.id} className="bg-[#141414] border border-neutral-900 rounded-xl p-5 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-bold text-neutral-200">{session.title}</h3>
                      <p className="text-[10px] font-mono text-neutral-600 mt-0.5">ID: {session.id}</p>
                    </div>
                    <span className="text-[9px] font-mono bg-purple-950/40 text-purple-400 border border-purple-900/50 px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                      {session.difficulty}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs border-t border-neutral-900 pt-2.5 font-mono text-neutral-400">
                    <p><span className="text-neutral-600">CANDIDATE:</span> {session.candidate_email}</p>
                    <p><span className="text-neutral-600">INTERVIEWER:</span> {session.interviewer_email}</p>
                  </div>

                  <div className="pt-2 border-t border-neutral-900/60 flex justify-between items-center text-[11px] font-mono text-neutral-500">
                    <span>📅 {new Date(session.scheduled_date).toLocaleDateString()}</span>
                    <span>⏰ {session.scheduled_time}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleJoinRoom(session.id)}
                  className="w-full mt-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs uppercase tracking-wider py-2.5 px-4 rounded-lg transition-colors font-mono"
                >
                  ⚡ Join Interview Room
                </button>
              </div>
            ))}

            {sessions.length === 0 && (
              <p className="text-xs font-mono text-neutral-500 col-span-2">No upcoming interviews scheduled by the admin.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}