'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();
  const [candidateEmail, setCandidateEmail] = useState('');
  const [interviewerEmail, setInterviewerEmail] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [sessions, setSessions] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [allocatedRoom, setAllocatedRoom] = useState('');
  const [userRole, setUserRole] = useState('RECRUITER');

  useEffect(() => {
    fetchActiveSessions();
  }, []);

  const fetchActiveSessions = async () => {
    try {
      const res = await fetch('/api/sessions/my-scheduled');
      if (res.ok) {
        const data = await res.json();
        setSessions(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to read system registry maps:", err);
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage('');
    setAllocatedRoom('');

    if (!candidateEmail || !scheduledDate || !scheduledTime) {
      setStatusMessage('Error: Missing required validation keys.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(candidateEmail)) {
      setStatusMessage('Error: Invalid candidate email formatting structure.');
      return;
    }

    if (interviewerEmail && !emailRegex.test(interviewerEmail)) {
      setStatusMessage('Error: Invalid interviewer email formatting structure.');
      return;
    }

    try {
      const res = await fetch('/api/sessions/my-scheduled', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateEmail: candidateEmail.toLowerCase().trim(),
          interviewerEmail: interviewerEmail.toLowerCase().trim(),
          scheduledDate,
          scheduledTime
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatusMessage('Success! Session database allocated and invitation codes staged.');
        setAllocatedRoom(data.roomId);
        setCandidateEmail('');
        setInterviewerEmail('');
        setScheduledDate('');
        setScheduledTime('');
        fetchActiveSessions();
      } else {
        setStatusMessage(data.error || 'System Fault: Failed to initialize network matrix.');
      }
    } catch (err) {
      setStatusMessage(`System Fault: ${err.message}`);
    }
  };
const handleLogout = async () => {
  try {
    await fetch('http://localhost:5001/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });

    localStorage.clear();
    router.push('/login');
  } catch (err) {
    console.error('Logout tracking error:', err);
  }
};
  const filteredSessions = sessions.filter(session => {
    const candidate = session.candidate_email || session.email || '';
    const interviewer = session.interviewer_email || session.interviewer || '';

    if (!interviewer || interviewer === 'Unassigned') return false;
    if (!candidate || candidate.trim() === '@' || candidate.trim() === '') return false;
    
    return true;
  });

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 antialiased font-sans selection:bg-purple-500/30 selection:text-purple-300">
      <header className="h-16 border-b border-neutral-900 bg-neutral-950 px-8 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <span className="text-purple-500 font-bold text-sm">⚡</span>
            <span className="font-black text-sm tracking-tight text-neutral-100">InterviewFlow</span>
          </div>
          <div className="h-4 w-[1px] bg-neutral-800"></div>
          <div className="flex items-center space-x-3">
            <h1 className="font-bold text-xs text-neutral-400 tracking-wider uppercase">
              Ops Dashboard
            </h1>
            <span className="text-[9px] bg-purple-950/60 border border-purple-800/40 text-purple-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider font-mono">
              Auth Token: {userRole}
            </span>
          </div>
        </div>
        <button 
          onClick={handleLogout} 
          className="text-xs font-medium text-neutral-500 hover:text-neutral-300 transition underline decoration-neutral-800 underline-offset-4"
        >
          Terminate Terminal Session
        </button>
      </header>

      <main className="max-w-7xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <section className="lg:col-span-5 bg-neutral-900/30 border border-neutral-900 rounded-2xl p-6 backdrop-blur-md space-y-6">
          <div>
            <h2 className="text-base font-bold text-neutral-100 tracking-tight">Staging Dispatch Engine</h2>
            <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">Initialize a dynamic workspace identifier container and forward secure communication payloads.</p>
          </div>

          <form onSubmit={handleScheduleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 font-mono">
                Candidate Email Target
              </label>
              <input
                type="email"
                placeholder="candidate@email.com"
                value={candidateEmail}
                onChange={(e) => setCandidateEmail(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-950/60 border border-neutral-900 rounded-xl text-sm text-neutral-200 placeholder-neutral-700 outline-none focus:border-purple-900/60 transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 font-mono">
                Assigned Panel Lead Email
              </label>
              <input
                type="email"
                placeholder="interviewer@company.com"
                value={interviewerEmail}
                onChange={(e) => setInterviewerEmail(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-950/60 border border-neutral-900 rounded-xl text-sm text-neutral-200 placeholder-neutral-700 outline-none focus:border-purple-900/60 transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 font-mono">
                  Assessment Date
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full px-4 py-3 bg-neutral-950/60 border border-neutral-900 rounded-xl text-sm text-neutral-200 font-mono outline-none focus:border-purple-900/60 transition color-scheme-dark"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 font-mono">
                  Start Time Window
                </label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full px-4 py-3 bg-neutral-950/60 border border-neutral-900 rounded-xl text-sm text-neutral-200 font-mono outline-none focus:border-purple-900/60 transition color-scheme-dark"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white font-bold text-xs tracking-wide rounded-xl shadow-lg shadow-purple-950/20 active:scale-[0.99] transition duration-150 flex items-center justify-center space-x-2"
            >
              <span>🚀 Initialize Container & Mail Coordinates</span>
            </button>
          </form>

          {statusMessage && (
            <div className={`p-4 border rounded-xl text-center font-mono text-[11px] backdrop-blur-sm ${
              statusMessage.toLowerCase().includes('success') 
                ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-400' 
                : 'bg-rose-950/30 border-rose-900/40 text-rose-400'
            }`}>
              <span>{statusMessage}</span>
              {allocatedRoom && (
                <div className="mt-3 p-2.5 bg-purple-950/40 border border-purple-900/30 rounded-lg text-purple-300 font-bold text-xs font-mono select-all tracking-wider uppercase">
                  Staged Secure Room ID: {allocatedRoom}
                </div>
              )}
            </div>
          )}
        </section>

        <section className="lg:col-span-7 bg-neutral-900/10 border border-neutral-900 rounded-2xl p-6">
          <div>
            <h2 className="text-base font-bold text-neutral-100 tracking-tight">Active Operation Audit Monitor</h2>
            <p className="text-xs text-neutral-500 mt-1">
              Live view of real database records inside the registry network cluster.
            </p>
          </div>

          <div className="mt-6 border border-neutral-900/80 rounded-xl overflow-hidden bg-neutral-950/40">
            <div className="grid grid-cols-12 bg-neutral-900/40 px-4 py-3 border-b border-neutral-900 text-[10px] uppercase font-bold tracking-wider text-neutral-400 font-mono">
              <div className="col-span-4">Room ID</div>
              <div className="col-span-5">Candidate Node</div>
              <div className="col-span-3">Panel Operator</div>
            </div>

            <div className="divide-y divide-neutral-900/40 max-h-[460px] overflow-y-auto custom-scrollbar">
              {filteredSessions.length === 0 ? (
                <div className="p-8 text-center text-xs text-neutral-600 italic">
                  No active operational runtime blocks allocated in current database registry view.
                </div>
              ) : (
                filteredSessions.map((session) => (
                  <div key={session.id || session.room_id} className="grid grid-cols-12 px-4 py-3.5 items-center text-xs hover:bg-neutral-900/10 transition">
                    <div className="col-span-4 font-mono text-purple-400 font-bold uppercase tracking-wide">
                      {session.id || session.room_id}
                    </div>
                    <div className="col-span-5 space-y-0.5">
                      <div className="text-neutral-200 truncate pr-2">
                        {session.candidate_email || session.email}
                      </div>
                      <div className="text-[10px] text-neutral-600 font-mono">
                        {session.scheduled_date || session.date} @ {session.scheduled_time || session.time}
                      </div>
                    </div>
                    <div className="col-span-3 text-neutral-500 truncate pr-2 font-mono">
                      {session.interviewer_email || session.interviewer || 'Assigned'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}