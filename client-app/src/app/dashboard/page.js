'use client';
import React, { useState, useEffect } from 'react';

export default function InterviewerDashboard() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadActiveSessions() {
      try {
        const res = await fetch('/api/sessions');
        const data = await res.json();
        if (data.sessions) {
          setSessions(data.sessions);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadActiveSessions();
  }, []);

  const handleLaunchSession = (roomId, role) => {
    if (role === 'replay') {
      window.location.href = `/interview/${roomId}/replay`;
    } else {
      window.location.href = `/interview/${roomId}?role=${role}`;
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen bg-neutral-950 flex items-center justify-center text-neutral-400 font-mono text-xs">
        Loading scheduled panels...
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen bg-neutral-950 text-neutral-200 p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-neutral-100">Interviewer Hub</h1>
          <p className="text-xs text-neutral-500">Manage, launch, and review your active candidate technical panels.</p>
        </div>

        <div className="border border-neutral-800 bg-neutral-900/20 rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-900/50 text-neutral-400 font-semibold">
                <th className="p-4">Room ID</th>
                <th className="p-4">Target Challenge</th>
                <th className="p-4">Created At</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900">
              {sessions.map((session) => (
                <tr key={session.id} className="hover:bg-neutral-900/30 transition">
                  <td className="p-4 font-mono text-purple-400 font-bold">{session.id}</td>
                  <td className="p-4 text-neutral-300 font-medium">{session.problem_id || 'two-sum'}</td>
                  <td className="p-4 text-neutral-500">{new Date(session.created_at).toLocaleString()}</td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => handleLaunchSession(session.id, 'interviewer')}
                      className="bg-purple-600 hover:bg-purple-500 text-white font-medium px-3 py-1.5 rounded transition"
                    >
                      💼 Join Live
                    </button>
                    <button
                      onClick={() => handleLaunchSession(session.id, 'replay')}
                      className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 font-medium px-3 py-1.5 rounded transition"
                    >
                      ⏪ Review Replay
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}