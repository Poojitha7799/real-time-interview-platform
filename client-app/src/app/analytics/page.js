'use client';
import React, { useState, useEffect } from 'react';

export default function AnalyticsHubView() {
  const [sessions, setSessions] = useState([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState(null);

  useEffect(() => {
    async function fetchDatabaseMetrics() {
      try {
        // Fetching directly from your native internal Next.js API route
        const res = await fetch('/api/sessions/save', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        
        const data = await res.json();
        
        if (data.success && data.sessions) {
          setSessions(data.sessions);
        } else {
          setErrorStatus('Failed to read session datasets.');
        }
      } catch (err) {
        console.error("Failed to stream analytical database entities:", err);
        setErrorStatus('Network connectivity lost with database endpoint.');
      } finally {
        setIsDataLoading(false);
      }
    }
    fetchDatabaseMetrics();
  }, []);

  return (
    <div className="min-h-screen w-screen bg-neutral-950 text-neutral-200 font-sans p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header Block */}
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-100">Performance Assessment History</h1>
          <p className="text-xs text-purple-400 font-mono uppercase mt-0.5 tracking-wider">AI Interview Diagnostics & Analytics Ledger</p>
        </div>

        <hr className="border-neutral-900" />

        {/* Dynamic Table/Content Rendering */}
        {isDataLoading ? (
          <div className="font-mono text-xs text-neutral-500 animate-pulse">[STREAMING ANALYTICS TIME-SERIES LEDGER...]</div>
        ) : errorStatus ? (
          <div className="bg-rose-950/20 border border-rose-900/50 p-4 rounded-xl font-mono text-xs text-rose-400">{errorStatus}</div>
        ) : sessions.length === 0 ? (
          <div className="bg-neutral-900/20 border border-neutral-900 p-8 rounded-2xl text-center font-mono text-xs text-neutral-500">
            No completed performance metrics found. Complete a practice session to stream analytics data.
          </div>
        ) : (
          <div className="bg-neutral-900/20 border border-neutral-900 rounded-2xl overflow-hidden backdrop-blur-sm">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-950/60 border-b border-neutral-900 text-purple-400 font-bold uppercase text-[10px] tracking-wider">
                  <th className="p-4">Session Topic</th>
                  <th className="p-4">Execution Date</th>
                  <th className="p-4">Evaluation Status</th>
                  <th className="p-4 text-right">Score Matrix</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900/60">
                {sessions.map((session) => (
                  <tr key={session.id} className="hover:bg-neutral-900/40 transition">
                    <td className="p-4 text-neutral-200 font-bold">{session.topic}</td>
                    <td className="p-4 text-neutral-400">{session.execution_date}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        session.status === 'Success' 
                          ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/50' 
                          : 'bg-amber-950/40 text-amber-400 border border-amber-900/50'
                      }`}>
                        {session.status}
                      </span>
                    </td>
                    <td className="p-4 text-right font-bold text-purple-300 text-sm">{session.score} / 100</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}