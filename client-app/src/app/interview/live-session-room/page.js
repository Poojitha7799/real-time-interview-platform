'use client';
import React, { useState, useEffect } from 'react';

export default function LiveSessionRoom() {
  const [hasMounted, setHasMounted] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setHasMounted(true);
    
    async function fetchAssignments() {
      try {
        const res = await fetch('/api/assignments/active');
        if (res.ok) {
          const data = await res.json();
          setAssignments(data.assignments || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchAssignments();
  }, []);

  if (!hasMounted) {
    return <div className="h-screen w-screen bg-[#0a0a0a]" />;
  }

  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] text-[#d4d4d4] font-sans antialiased p-6 flex flex-col space-y-6">
      <header className="w-full bg-[#141414] border border-neutral-900 rounded-xl p-4 flex justify-between items-center select-none">
        <div>
          <h1 className="text-lg font-black tracking-wider text-neutral-100 uppercase">INTERVIEWER WORKSPACE</h1>
          <p className="text-xs text-neutral-500">Live evaluation session environment active.</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">SYSTEM ONLINE</span>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        <div className="lg:col-span-2 bg-[#141414] border border-neutral-900 rounded-2xl p-6 flex flex-col space-y-4">
          <h2 className="text-xs font-bold font-mono text-neutral-400 uppercase tracking-wider">Active Interview Tasks</h2>
          
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-xs font-mono text-neutral-600">Loading pipeline tasks...</div>
          ) : assignments.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-neutral-800 rounded-xl p-8 text-center space-y-2">
              <span className="text-2xl">📁</span>
              <h3 className="text-xs font-bold font-mono text-neutral-400 uppercase tracking-wide">No Active Assignments</h3>
              <p className="text-xs text-neutral-600 max-w-xs">There are no candidates currently assigned to live review cycles right now.</p>
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto max-h-[500px] pr-2">
              {assignments.map((task) => (
                <div key={task.id} className="bg-black border border-neutral-900 rounded-xl p-4 flex justify-between items-center hover:border-neutral-800 transition">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold font-mono text-neutral-200">{task.title || 'Untitled Assessment'}</span>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-400 border border-purple-900 uppercase font-mono">{task.difficulty || 'Medium'}</span>
                    </div>
                    <p className="text-xs text-neutral-400 font-mono">ROOM ID: {task.id}</p>
                    <p className="text-xs text-neutral-500">Node Email: {task.candidate_email}</p>
                    <p className="text-[10px] text-neutral-600 font-mono">{task.scheduled_date} @ {task.scheduled_time}</p>
                  </div>
                  <a 
                    href={`/interview/${task.id}?role=interviewer&type=live`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-10 px-4 bg-neutral-900 hover:bg-purple-950/40 border border-neutral-800 hover:border-purple-800/40 text-xs font-mono font-bold uppercase rounded-lg tracking-wider text-purple-400 flex items-center justify-center transition"
                  >
                    Launch Room
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-[#141414] border border-neutral-900 rounded-2xl p-6 flex flex-col space-y-4">
          <h2 className="text-xs font-bold font-mono text-neutral-400 uppercase tracking-wider">Candidate Profile Data</h2>
          <div className="border border-neutral-900 bg-black rounded-xl p-4 space-y-3 font-mono text-xs">
            <div className="flex justify-between border-b border-neutral-900 pb-2">
              <span className="text-neutral-500">PIPELINE COUNT:</span>
              <span className="text-purple-400 font-bold">{assignments.length} ACTIVE</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-neutral-500">ROUTING STATUS:</span>
              <span className="text-emerald-400 font-bold">LIVE SYNC</span>
            </div>
          </div>
          <div className="flex-1 border border-dashed border-neutral-800 rounded-xl flex items-center justify-center text-xs text-neutral-600 font-mono select-none p-4 text-center">
            Select an active assignment task on the left grid to pull real-time execution analytics.
          </div>
        </div>
      </main>
    </div>
  );
}