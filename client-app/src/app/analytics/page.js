'use client';
import React, { useState, useEffect } from 'react';

export default function AnalyticsHubView() {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    const storedLogs = JSON.parse(localStorage.getItem('interview_sessions') || '[]');
    setSessions(storedLogs);
  }, []);

  const highPerformers = sessions.filter(s => Number(s.score) >= 80);
  const midPerformers = sessions.filter(s => Number(s.score) >= 60 && Number(s.score) < 80);
  const lowPerformers = sessions.filter(s => Number(s.score) < 60);

  return (
    <div className="min-h-screen w-screen bg-neutral-950 text-neutral-200 font-sans p-8 selection:bg-purple-500/30">
      <div className="max-w-4xl mx-auto space-y-10">
        
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-100">Analytics Dashboard</h1>
          <p className="text-xs text-neutral-500 mt-1">Real-time performance distribution graph.</p>
        </header>

        {sessions.length === 0 ? (
          <div className="border border-dashed border-neutral-800 rounded-xl p-12 text-center">
            <p className="text-neutral-500 text-sm">No session telemetry data detected. Initiate a mock practice run to populate the graph.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'High (80+)', data: highPerformers, color: 'bg-emerald-500' },
                { label: 'Mid (60-79)', data: midPerformers, color: 'bg-amber-500' },
                { label: 'Low (<60)', data: lowPerformers, color: 'bg-rose-500' }
              ].map((cat) => (
                <div key={cat.label} className="bg-neutral-900/30 border border-neutral-900 rounded-xl p-5">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-bold uppercase text-neutral-500">{cat.label}</span>
                    <span className="text-lg font-black text-neutral-200">{cat.data.length}</span>
                  </div>
                  <div className="h-2 w-full bg-neutral-950 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${cat.color} transition-all duration-500`} 
                      style={{ width: `${(cat.data.length / sessions.length) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <h2 className="text-[10px] font-bold uppercase text-neutral-600 tracking-wider">Detailed Session Timeline</h2>
              {sessions.map((s) => (
                <div key={s.code} className="flex items-center justify-between bg-neutral-900/20 border border-neutral-900 p-4 rounded-xl font-mono text-xs">
                  <span className="text-neutral-300 font-bold">{s.code}</span>
                  <span className="text-neutral-500">{s.date}</span>
                  <span className={`font-bold ${s.score >= 80 ? 'text-emerald-500' : s.score >= 60 ? 'text-amber-500' : 'text-rose-500'}`}>
                    {s.score}/100
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}