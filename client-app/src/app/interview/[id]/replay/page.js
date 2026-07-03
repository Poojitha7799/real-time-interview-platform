'use client';
import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';

export default function SessionReplayPlayer({ params }) {
  const unwrappedParams = React.use(params);
  const roomId = unwrappedParams?.id;
  
  const [events, setEvents] = useState([]);
  const [timelineIndex, setTimelineIndex] = useState(0);
  const [currentSeconds, setCurrentSeconds] = useState(0); // Tracks real match clock time
  const [currentCode, setCurrentCode] = useState('');
  const [chatLog, setChatLog] = useState([]);
  const [securityViolations, setSecurityViolations] = useState([]);
  const [currentProblem, setCurrentProblem] = useState({
    title: 'Initial Assignment',
    description: 'Awaiting interviewer deployment parameter streams...'
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchReplayData() {
      if (!roomId) return;
      try {
        const res = await fetch(`http://localhost:5001/api/replay/${roomId}`);
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          setIsLoading(false);
          return;
        }
        const data = await res.json();
        setEvents(data);
        if (data.length > 0) {
          reconstructStateUntilSeconds(data, data[0].elapsed_time_seconds);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchReplayData();
  }, [roomId]);

  // High Fidelity Playback Engine Loop
  useEffect(() => {
    let timer;
    if (isPlaying) {
      const maxSeconds = events[events.length - 1]?.elapsed_time_seconds || 0;
      
      if (currentSeconds < maxSeconds) {
        timer = setTimeout(() => {
          const nextSecond = currentSeconds + 1;
          setCurrentSeconds(nextSecond);
          reconstructStateUntilSeconds(events, nextSecond);
        }, 1000);
      } else {
        setIsPlaying(false);
      }
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentSeconds, events]);

  const reconstructStateUntilSeconds = (allEvents, targetSeconds) => {
    let codeSnapshot = '';
    const historicalMessages = [];
    const alertsFound = [];
    let initialProblem = {
      title: 'Initial Assignment',
      description: 'Awaiting interviewer deployment parameter streams...'
    };
    let lastProcessedIndex = 0;

    for (let i = 0; i < allEvents.length; i++) {
      const ev = allEvents[i];
      if (ev.elapsed_time_seconds > targetSeconds) break;

      lastProcessedIndex = i;

      if (ev.event_type === 'code_change') {
        codeSnapshot = ev.event_data;
      } else if (ev.event_type === 'chat_msg') {
        try {
          const parsed = JSON.parse(ev.event_data);
          historicalMessages.push({ sender: parsed.sender, text: parsed.message });
        } catch (e) {
          historicalMessages.push({ sender: 'User', text: ev.event_data });
        }
      } else if (ev.event_type === 'security_alert') {
        alertsFound.push({ time: ev.elapsed_time_seconds, details: ev.event_data });
      } else if (ev.event_type === 'problem_change') {
        try {
          initialProblem = JSON.parse(ev.event_data);
        } catch (e) {}
      }
    }

    setTimelineIndex(lastProcessedIndex);
    setCurrentCode(codeSnapshot);
    setChatLog(historicalMessages);
    setSecurityViolations(alertsFound);
    setCurrentProblem(initialProblem);
  };

  const handleSliderChange = (e) => {
    const targetIdx = parseInt(e.target.value, 10);
    const targetSecs = events[targetIdx]?.elapsed_time_seconds || 0;
    setCurrentSeconds(targetSecs);
    reconstructStateUntilSeconds(events, targetSecs);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-neutral-950 flex items-center justify-center text-neutral-400 font-mono text-xs tracking-wide">
        Fetching recording segments for room...
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="h-screen w-screen bg-neutral-950 flex items-center justify-center text-neutral-400 font-sans text-sm flex-col space-y-2">
        <span>No recorded timeline sessions found for Room ID: <strong className="text-purple-400 font-mono">{roomId}</strong></span>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] w-screen bg-neutral-950 flex flex-col font-sans text-neutral-200">
      <div className="h-12 border-b border-neutral-800 bg-neutral-900/50 flex items-center justify-between px-6">
        <div className="flex items-center space-x-3">
          <span className="text-xs bg-purple-900/40 text-purple-400 px-2.5 py-1 rounded border border-purple-800/50 font-bold">REPLAY MATRIX PLAYBACK</span>
          <h2 className="text-xs font-semibold text-neutral-400">Target Session: {roomId}</h2>
        </div>
        <div className="text-xs font-mono text-purple-400 font-bold">
          Stopwatch Index: {formatTime(currentSeconds)}
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        <div className="w-64 border-r border-neutral-800 p-4 overflow-y-auto bg-neutral-900/10">
          <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2">Active Challenge History</h3>
          <h4 className="text-xs font-bold text-neutral-200">{currentProblem.title}</h4>
          <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed whitespace-pre-line">{currentProblem.description}</p>
        </div>

        <div className="flex-1 min-w-0 border-r border-neutral-800">
          <Editor
            height="100%"
            width="100%"
            theme="vs-dark"
            language="javascript"
            value={currentCode}
            options={{ fontSize: 13, minimap: { enabled: false }, readOnly: true, automaticLayout: true }}
          />
        </div>

        <div className="w-80 flex flex-col bg-neutral-900/20">
          <div className="h-1/3 border-b border-neutral-800 flex flex-col min-h-0">
            <div className="p-2.5 bg-neutral-900/60 border-b border-neutral-800">
              <h3 className="text-[9px] font-bold text-red-400 uppercase tracking-wider">Proctoring Violations ({securityViolations.length})</h3>
            </div>
            <div className="flex-1 p-3 overflow-y-auto font-mono text-[10px] space-y-1.5 bg-red-950/5">
              {securityViolations.map((v, idx) => (
                <div key={idx} className="bg-neutral-950 p-1.5 rounded border border-red-900/30 text-red-300">
                  <span className="text-neutral-500 font-bold block">Elapsed Time: {formatTime(v.time)}</span>
                  {v.details}
                </div>
              ))}
              {securityViolations.length === 0 && (
                <span className="text-neutral-600 italic block">No structural violations flagged.</span>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            <div className="p-2.5 bg-neutral-900/40 border-b border-neutral-800">
              <h3 className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider">Historical Chat Log</h3>
            </div>
            <div className="flex-1 p-3 overflow-y-auto space-y-2 font-mono text-[11px]">
              {chatLog.map((msg, i) => (
                <div key={i} className="bg-neutral-900/60 p-2 rounded border border-neutral-800/40">
                  <span className="text-purple-400 font-bold block mb-0.5">{msg.sender}:</span>
                  <span className="text-neutral-300">{msg.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="h-16 border-t border-neutral-800 bg-neutral-900/40 flex items-center px-6 space-x-4">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs px-4 py-2 rounded transition flex-shrink-0"
        >
          {isPlaying ? '⏸ Pause' : '▶ Play Timeline'}
        </button>

        <input
          type="range"
          min="0"
          max={events.length - 1}
          value={timelineIndex}
          onChange={handleSliderChange}
          className="flex-1 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
        />

        <div className="text-xs font-mono text-neutral-500 flex-shrink-0">
          Timestamp: {formatTime(currentSeconds)} ({events.length} logs)
        </div>
      </div>
    </div>
  );
}