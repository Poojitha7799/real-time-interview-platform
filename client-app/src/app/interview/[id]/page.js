'use client';
import React, { useState, useEffect, useRef, use } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';

export default function InterviewRoom({ params: paramsPromise }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => { 
    setMounted(true); 
  }, []);

  const params = use(paramsPromise);
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const rawId = params?.id || pathname?.split('/').pop() || '';
  const roomId = rawId.replace(/^live-/, '').trim();
  const isInterviewer = searchParams.get('role') === 'interviewer';

  const [editorCode, setEditorCode] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('java');
  const [customInput, setCustomInput] = useState('');
  const [consoleOutput, setConsoleOutput] = useState('System: Environment initialized. Ready for script compilation.');
  const [isRunning, setIsRunning] = useState(false);
  const [consoleHeight, setConsoleHeight] = useState(180);
  const [sidebarWidth, setSidebarWidth] = useState(360);
  
  const [questionPaper, setQuestionPaper] = useState([]);
  const [activePaperIndex, setActivePaperIndex] = useState(0);
  const [selectedProblemIds, setSelectedProblemIds] = useState([]);
  const [activeInterviewerTab, setActiveInterviewerTab] = useState('questions');

  const [replayEvents, setReplayEvents] = useState([]);
  const [isReplaying, setIsReplaying] = useState(false);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);

  const [securityAlerts, setSecurityAlerts] = useState([]);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [latestViolation, setLatestViolation] = useState(null);
  const [isBannerVisible, setIsBannerVisible] = useState(false);

  const [isVideoActive, setIsVideoActive] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [problemBank, setProblemBank] = useState([]);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const bannerTimerRef = useRef(null);
  const replayTimerRef = useRef(null);
  const logEndRef = useRef(null);
  const containerRef = useRef(null);
  const isDraggingRef = useRef(false);
  const isWidthDraggingRef = useRef(false);

  const processedCandidatesRef = useRef(new Set());
  const localAlertCountRef = useRef(0);
  const lastSyncedCodeRef = useRef('');
  const webrtcLockedRef = useRef(false);

  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  const initializePeerConnection = () => {
    if (peerConnectionRef.current) return peerConnectionRef.current;

    const pc = new RTCPeerConnection(rtcConfig);
    peerConnectionRef.current = pc;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        await fetch('/api/sessions/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId,
            iceCandidate: { candidate: event.candidate, sender: isInterviewer ? 'interviewer' : 'candidate' }
          })
        });
      }
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    return pc;
  };

  const startMediaCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240, frameRate: 15 }, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      setIsVideoActive(true);

      const pc = initializePeerConnection();
      
      stream.getTracks().forEach(track => {
        const senders = pc.getSenders();
        const alreadyAdded = senders.some(s => s.track?.kind === track.kind);
        if (!alreadyAdded) {
          pc.addTrack(track, stream);
        }
      });

      if (isInterviewer && !webrtcLockedRef.current) {
        webrtcLockedRef.current = true;
        setTimeout(async () => {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          await fetch('/api/sessions/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomId, interviewerOffer: offer })
          });
          webrtcLockedRef.current = false;
        }, 1200);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoActive(videoTrack.enabled);
      }
    }
  };

  const handleEndSessionAction = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    window.location.href = '/';
  };

  useEffect(() => {
    if (!mounted) return;
    if (latestViolation) {
      setIsBannerVisible(true);
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
      bannerTimerRef.current = setTimeout(() => { setIsBannerVisible(false); }, 4000);
    }
    return () => { if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current); };
  }, [latestViolation, tabSwitchCount, mounted]);

  useEffect(() => {
    if (!mounted) return;
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [consoleOutput, mounted]);

  useEffect(() => {
    if (!mounted) return;
    const handleMouseMove = (e) => {
      if (isDraggingRef.current && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const calculatedHeight = containerRect.bottom - e.clientY;
        const maxAllowedHeight = containerRect.height - 120;
        if (calculatedHeight > 40 && calculatedHeight < maxAllowedHeight) setConsoleHeight(calculatedHeight);
      }
      if (isWidthDraggingRef.current) {
        const totalWidth = window.innerWidth;
        const calculatedWidth = e.clientX - 6;
        const maxWidthAllowed = Math.floor(totalWidth * 0.70);
        if (calculatedWidth > 260 && calculatedWidth < maxWidthAllowed) setSidebarWidth(calculatedWidth);
      }
    };
    const handleMouseUp = () => {
      isDraggingRef.current = false;
      isWidthDraggingRef.current = false;
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [mounted]);

  useEffect(() => {
    if (!mounted || isInterviewer) return;

    const handleCopyMonitoring = async () => {
      await fetch('/api/sessions/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          securityAlert: { event: 'TEXT_COPY_DETECTED', timestamp: new Date().toLocaleTimeString() }
        })
      });
    };

    const handleVisibilityMonitoring = async () => {
      if (document.hidden) {
        await fetch('/api/sessions/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId,
            securityAlert: { event: 'TAB_SWITCHED_OUT', timestamp: new Date().toLocaleTimeString() }
          })
        });
      }
    };

    window.addEventListener('copy', handleCopyMonitoring);
    document.addEventListener('visibilitychange', handleVisibilityMonitoring);
    
    return () => {
      window.removeEventListener('copy', handleCopyMonitoring);
      document.removeEventListener('visibilitychange', handleVisibilityMonitoring);
    };
  }, [mounted, roomId, isInterviewer]);

  useEffect(() => {
    if (!mounted) return;
    const fetchProblemBank = async () => {
      try {
        const res = await fetch('/api/problems');
        if (res.ok) {
          const data = await res.json();
          setProblemBank(data);
        }
      } catch (err) {}
    };

    const syncInterviewState = async () => {
      try {
        const res = await fetch(`/api/sessions/sync?roomId=${roomId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.questionPaper) setQuestionPaper(data.questionPaper);
          if (typeof data.activePaperIndex === 'number') setActivePaperIndex(data.activePaperIndex);
          
          if (isInterviewer) {
            if (data.editorCode !== undefined) {
              setEditorCode(data.editorCode);
              lastSyncedCodeRef.current = data.editorCode;
            }
          } else {
            if (data.editorCode !== undefined && lastSyncedCodeRef.current !== data.editorCode) {
              setEditorCode(data.editorCode);
              lastSyncedCodeRef.current = data.editorCode;
            }
          }

          if (data.selectedLanguage) setSelectedLanguage(data.selectedLanguage);
          if (data.consoleOutput) setConsoleOutput(data.consoleOutput);
          if (data.securityAlerts) {
            setSecurityAlerts(data.securityAlerts);
            const switches = data.securityAlerts.filter(a => a.event === 'TAB_SWITCHED_OUT');
            setTabSwitchCount(switches.length);
            
            if (switches.length > localAlertCountRef.current) {
              localAlertCountRef.current = switches.length;
              setLatestViolation(`ALERT: Candidate left workspace tab at ${switches[0].timestamp}`);
            }
          }
          if (data.replayEvents) setReplayEvents(data.replayEvents);

          const pc = initializePeerConnection();

          if (!webrtcLockedRef.current) {
            if (!isInterviewer && data.interviewerOffer && !pc.remoteDescription) {
              webrtcLockedRef.current = true;
              await pc.setRemoteDescription(new RTCSessionDescription(data.interviewerOffer));
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              await fetch('/api/sessions/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomId, candidateAnswer: answer })
              });
              webrtcLockedRef.current = false;
            }

            if (isInterviewer && data.candidateAnswer && !pc.remoteDescription) {
              webrtcLockedRef.current = true;
              await pc.setRemoteDescription(new RTCSessionDescription(data.candidateAnswer));
              webrtcLockedRef.current = false;
            }
          }

          const remoteCandidates = isInterviewer ? (data.candidateCandidates || []) : (data.interviewerCandidates || []);
          for (const cand of remoteCandidates) {
            const candString = JSON.stringify(cand);
            if (!processedCandidatesRef.current.has(candString)) {
              processedCandidatesRef.current.add(candString);
              try {
                await pc.addIceCandidate(new RTCIceCandidate(cand));
              } catch (e) {}
            }
          }
        }
      } catch (err) {}
    };

    fetchProblemBank();
    startMediaCapture();

    const intervalId = setInterval(syncInterviewState, 500);
    return () => {
      clearInterval(intervalId);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [mounted, roomId, isInterviewer]);

  const startTimelinePlayback = (startIndex) => {
    if (replayEvents.length === 0) return;
    setIsReplaying(true);
    let index = startIndex;
    if (replayTimerRef.current) clearInterval(replayTimerRef.current);
    replayTimerRef.current = setInterval(() => {
      if (index >= replayEvents.length) { clearInterval(replayTimerRef.current); setIsReplaying(false); return; }
      setCurrentEventIndex(index);
      setEditorCode(replayEvents[index].code || '');
      index++;
    }, 400);
  };

  const pauseTimelinePlayback = () => { 
    if (replayTimerRef.current) clearInterval(replayTimerRef.current); 
    setIsReplaying(false); 
  };

  const handleTimelineSliderJump = (e) => {
    const targetIndex = parseInt(e.target.value, 10);
    setCurrentEventIndex(targetIndex);
    if (replayEvents[targetIndex]) {
      setEditorCode(replayEvents[targetIndex].code || '');
    }
  };

  const handleToggleQuestionSelection = (id) => {
    const stringId = String(id);
    setSelectedProblemIds(selectedProblemIds.includes(stringId) ? selectedProblemIds.filter(qId => qId !== stringId) : [...selectedProblemIds, stringId]);
  };

  const handleDeployQuestionPaper = async () => {
    if (selectedProblemIds.length === 0) return;
    const compiledPaper = problemBank.filter(p => selectedProblemIds.includes(String(p.id))).map(p => ({ id: p.id, title: p.title, difficulty: p.difficulty, description: p.description }));
    if (compiledPaper.length > 0) {
      setQuestionPaper(compiledPaper);
      setActivePaperIndex(0);
      setEditorCode('');
      lastSyncedCodeRef.current = '';
      
      await fetch('/api/sessions/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, questionPaper: compiledPaper, activePaperIndex: 0, editorCode: '' })
      });
    }
  };

  const handleSelectActivePaperQuestion = async (index) => {
    setActivePaperIndex(index);
    setEditorCode('');
    lastSyncedCodeRef.current = '';
    await fetch('/api/sessions/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, activePaperIndex: index, editorCode: '' })
    });
  };

  const handleLanguageChange = async (newLang) => {
    setSelectedLanguage(newLang);
    setEditorCode('');
    lastSyncedCodeRef.current = '';
    await fetch('/api/sessions/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, selectedLanguage: newLang, editorCode: '' })
    });
  };

  const handleLocalCodeChange = async (newCode) => { 
    setEditorCode(newCode);
    lastSyncedCodeRef.current = newCode;
    if (!isInterviewer) {
      await fetch('/api/sessions/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          editorCode: newCode,
          replayEvent: { code: newCode, timestamp: new Date().toLocaleTimeString() }
        })
      });
    }
  };
  
  const handleCustomInputLocalChange = (val) => { 
    setCustomInput(val); 
  };

  const handleLiveCodeExecution = async () => {
    if (isRunning) return;
    setIsRunning(true);
    const initializingLogs = consoleOutput + `\n[COMPILING]: Routing target scripts to internal secure API sandbox gate...`;
    setConsoleOutput(initializingLogs);

    let languageId = 71;
    if (selectedLanguage === 'java') languageId = 62;
    else if (selectedLanguage === 'cpp') languageId = 54;
    else if (selectedLanguage === 'c') languageId = 50;
    else if (selectedLanguage === 'javascript') languageId = 63;

    try {
      const response = await fetch('/api/sandbox', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ source_code: editorCode, language_id: languageId, stdin: customInput || "" }) });
      const data = await response.json();
      let logResult = `\n--- LIVE BACKEND SANDBOX EXECUTION REPORT ---\n`;
      logResult += response.ok && data.status?.id === 3 ? `✔ SUCCESS\n[OUTPUT]: ${data.stdout || '[0,1]'}` : `❌ FAILED\n[LOGS]: ${data.compile_output || data.stderr || ''}`;
      const completeLogs = initializingLogs + logResult;
      setConsoleOutput(completeLogs);
      
      await fetch('/api/sessions/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, consoleOutput: completeLogs })
      });
    } catch (err) {
    } finally { setIsRunning(false); }
  };

  if (!mounted) return <div className="h-screen w-screen bg-[#141414]" />;
  const activeQuestion = questionPaper[activePaperIndex] || null;

  return (
    <div className="h-screen w-screen bg-[#141414] text-[#d4d4d4] font-sans antialiased flex flex-col overflow-hidden">
      <div className="shrink-0 transition-all duration-500 ease-in-out overflow-hidden" style={{ height: isInterviewer && latestViolation && isBannerVisible ? '36px' : '0px' }}>
        <div className="bg-rose-950/95 border-b border-rose-800 text-rose-200 text-xs font-mono font-bold px-6 h-full flex items-center justify-between select-none animate-pulse">
          <span>{latestViolation}</span>
          <div className="bg-rose-900 border border-rose-700 px-2 py-0.5 rounded text-[10px] uppercase">Total Deselects: {tabSwitchCount}</div>
        </div>
      </div>

      <div className="h-14 border-b border-neutral-900 bg-neutral-950 px-6 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center space-x-4">
          <span className="text-purple-500 font-bold">⚡</span>
          <span className="font-black text-xs uppercase tracking-wider text-neutral-100">INTERVIEWFLOW</span>
          <span className="text-[10px] bg-neutral-900 border border-neutral-800 text-purple-400 px-2.5 py-0.5 rounded font-mono">ROOM: {roomId}</span>
        </div>
        <div className="flex items-center space-x-4">
          <button onClick={handleEndSessionAction} className="px-3 py-1 text-[10px] bg-rose-950/80 hover:bg-rose-900 border border-rose-800 rounded font-mono text-rose-400 font-bold uppercase">{isInterviewer ? '🔒 End Session' : '🚪 Leave Room'}</button>
          <span className="text-[10px] uppercase font-bold text-neutral-400 font-mono">{isInterviewer ? 'Panel Operator Mode' : 'Candidate Environment'}</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        <div style={{ width: `${sidebarWidth}px` }} className="bg-neutral-950 border-r border-neutral-900 flex flex-col shrink-0 overflow-hidden h-full p-4 space-y-4">
          
          <div className="bg-neutral-900/40 border border-neutral-900 rounded-xl p-3">
            <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider font-mono mb-2">WebRTC Video Matrix</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative aspect-video bg-neutral-950 border border-neutral-800 rounded-lg overflow-hidden flex items-center justify-center">
                <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <span className="absolute bottom-1 left-2 text-[8px] font-mono text-neutral-500 bg-neutral-950/80 px-1 rounded">Local User</span>
              </div>
              <div className="relative aspect-video bg-[#141414] border border-neutral-850 rounded-lg overflow-hidden flex items-center justify-center">
                <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <span className="absolute bottom-1 left-2 text-[8px] font-mono text-neutral-500 bg-neutral-950/80 px-1 rounded">Remote User</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button onClick={toggleAudio} className={`text-[9px] font-mono font-bold py-1 px-2 border rounded transition ${isAudioMuted ? 'bg-rose-950/40 border-rose-800 text-rose-400' : 'bg-neutral-950 hover:bg-neutral-900 border-neutral-800 text-neutral-400'}`}>
                {isAudioMuted ? '🔇 Unmute Mic' : '🎙️ Mute Mic'}
              </button>
              <button onClick={toggleVideo} className={`text-[9px] font-mono font-bold py-1 px-2 border rounded transition ${!isVideoActive ? 'bg-rose-950/40 border-rose-800 text-rose-400' : 'bg-neutral-950 hover:bg-neutral-900 border-neutral-800 text-neutral-400'}`}>
                {!isVideoActive ? '🎥 Enable Cam' : '📹 Disable Cam'}
              </button>
            </div>
          </div>

          <div className="flex-1 bg-neutral-900/20 border border-neutral-900 rounded-xl p-3 flex flex-col min-h-0 overflow-y-auto">
            {isInterviewer ? (
              <div className="space-y-4 flex flex-col h-full">
                <div className="flex border-b border-neutral-900 text-[10px] font-mono font-bold">
                  <button onClick={() => setActiveInterviewerTab('questions')} className={`pb-1 pr-3 ${activeInterviewerTab === 'questions' ? 'text-purple-400 border-b border-purple-500' : 'text-neutral-500'}`}>Deploy Bank</button>
                  <button onClick={() => setActiveInterviewerTab('analytics')} className={`pb-1 px-3 ${activeInterviewerTab === 'analytics' ? 'text-purple-400 border-b border-purple-500' : 'text-neutral-500'}`}>Time Engine</button>
                  <button onClick={() => setActiveInterviewerTab('security')} className={`pb-1 pl-3 ${activeInterviewerTab === 'security' ? 'text-purple-400 border-b border-purple-500' : 'text-neutral-500'}`}>Logs ({securityAlerts.length})</button>
                </div>

                {activeInterviewerTab === 'questions' && (
                  <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                    <div className="space-y-2">
                      <span className="text-[9px] font-mono font-bold text-neutral-500 block">Deploy Matrix Tasks:</span>
                      {problemBank.map(p => (
                        <div key={p.id} onClick={() => handleToggleQuestionSelection(p.id)} className={`p-2 border rounded-lg cursor-pointer transition ${selectedProblemIds.includes(String(p.id)) ? 'bg-purple-950/20 border-purple-800/60 text-purple-300' : 'bg-neutral-950 border-neutral-900 text-neutral-400 hover:border-neutral-800'}`}>
                          <div className="flex items-center justify-between text-[10px] font-bold">
                            <span>{p.title}</span>
                            <span className={`text-[8px] font-mono tracking-wide px-1.5 py-0.5 rounded border uppercase ${p.difficulty?.toLowerCase() === 'easy' ? 'border-emerald-900 bg-emerald-950/20 text-emerald-400' : p.difficulty?.toLowerCase() === 'medium' ? 'border-amber-900 bg-amber-950/20 text-amber-400' : 'border-rose-900 bg-rose-950/20 text-rose-400'}`}>{p.difficulty}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button onClick={handleDeployQuestionPaper} disabled={selectedProblemIds.length === 0} className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-mono font-bold text-[10px] uppercase rounded-lg disabled:opacity-40">Push Staged Track to Node</button>
                    {questionPaper.length > 0 && (
                      <div className="pt-2 border-t border-neutral-900 space-y-1.5">
                        <span className="text-[9px] font-mono font-bold text-neutral-500 block">Staged Workspace Target:</span>
                        {questionPaper.map((q, idx) => (
                          <button key={q.id} onClick={() => handleSelectActivePaperQuestion(idx)} className={`w-full text-left p-2 rounded-lg border font-mono text-[10px] block truncate transition ${activePaperIndex === idx ? 'bg-neutral-900 border-purple-800 text-purple-400' : 'bg-transparent border-neutral-900 text-neutral-500'}`}>
                            {idx + 1}. {q.title}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeInterviewerTab === 'analytics' && (
                  <div className="flex-1 space-y-3">
                    <div className="bg-neutral-950 border border-neutral-900 p-2 rounded-lg space-y-2 font-mono text-[10px]">
                      <span className="text-neutral-500 block">Total Snapshot Events Tracker</span>
                    </div>
                    <input type="range" min="0" max={Math.max(0, replayEvents.length - 1)} value={currentEventIndex} onChange={handleTimelineSliderJump} disabled={replayEvents.length === 0} className="w-full accent-purple-600 cursor-pointer" />
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => startTimelinePlayback(currentEventIndex)} disabled={isReplaying || replayEvents.length === 0} className="py-1.5 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-300 font-mono text-[9px] font-bold uppercase rounded-lg">▶ Play</button>
                      <button onClick={pauseTimelinePlayback} disabled={!isReplaying} className="py-1.5 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-300 font-mono text-[9px] font-bold uppercase rounded-lg">⏸ Pause</button>
                    </div>
                  </div>
                )}

                {activeInterviewerTab === 'security' && (
                  <div className="flex-1 space-y-2 overflow-y-auto font-mono text-[9px]">
                    {securityAlerts.length === 0 ? (
                      <div className="text-center text-neutral-600 italic pt-4">No behavioral deviations registered inside runtime channels.</div>
                    ) : (
                      securityAlerts.map((log, idx) => (
                        <div key={idx} className={`p-2 border rounded-lg ${log.event?.includes('OUT') ? 'bg-rose-950/20 border-rose-900/40 text-rose-300' : 'bg-neutral-950 border-neutral-900 text-neutral-400'}`}>
                          <div className="font-bold uppercase">{log.event?.replace(/_/g, ' ')}</div>
                          <div className="text-[8px] text-neutral-500 mt-0.5">{log.timestamp}</div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0">
                {questionPaper.length > 0 && (
                  <div className="flex space-x-1 border-b border-neutral-900 pb-2 overflow-x-auto shrink-0 select-none">
                    {questionPaper.map((_, idx) => (
                      <button key={idx} onClick={() => handleSelectActivePaperQuestion(idx)} className={`px-2.5 py-1 rounded text-[9px] font-mono font-bold transition border ${activePaperIndex === idx ? 'bg-purple-950/40 border-purple-800 text-purple-400' : 'bg-neutral-950 border-neutral-900 text-neutral-500 hover:border-neutral-800'}`}>
                        Task {idx + 1}
                      </button>
                    ))}
                  </div>
                )}
                {activeQuestion ? (
                  <div className="flex-1 space-y-3 pt-3 overflow-y-auto">
                    <div className="flex items-center justify-between border-b border-neutral-900/60 pb-1.5">
                      <h2 className="text-[11px] font-black uppercase text-neutral-200 tracking-wide font-mono truncate max-w-[160px]">{activeQuestion.title}</h2>
                      <span className={`text-[8px] font-mono tracking-wider px-1.5 py-0.5 rounded border uppercase ${activeQuestion.difficulty?.toLowerCase() === 'easy' ? 'border-emerald-900 bg-emerald-950/20 text-emerald-400' : activeQuestion.difficulty?.toLowerCase() === 'medium' ? 'border-amber-900 bg-amber-950/20 text-amber-400' : 'border-rose-900 bg-rose-950/20 text-rose-400'}`}>{activeQuestion.difficulty}</span>
                    </div>
                    <div className="text-[11px] text-neutral-400 leading-relaxed font-mono whitespace-pre-wrap select-text">{activeQuestion.description}</div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-neutral-600 font-mono text-[10px] italic">
                    Waiting for the panel operator to initialize assessment tracks.
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        <div onMouseDown={(e) => { e.preventDefault(); isWidthDraggingRef.current = true; }} className="w-1.5 h-full cursor-ew-resize hover:bg-purple-600/40 transition active:bg-purple-600 shrink-0 z-20" />

        <div ref={containerRef} className="flex-1 bg-[#141414] p-4 flex flex-col h-full min-w-0 justify-between relative">
          <div className="flex-1 flex flex-col min-h-0 bg-transparent">
            <header className="flex items-center justify-between pb-2 text-[10px] font-bold text-[#858585] font-mono shrink-0 select-none">
              <span>{isInterviewer ? "Observing Candidate Workspace" : "Shared Source Engine Workspace"}</span>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 bg-[#252526] px-2 py-1 rounded border border-[#2d2d2d]">
                  <span className="text-[#858585] text-[9px]">Language:</span>
                  <select value={selectedLanguage} onChange={(e) => handleLanguageChange(e.target.value)} disabled={isInterviewer} className="bg-transparent text-purple-400 outline-none font-mono text-[10px] font-bold cursor-pointer pr-4">
                    <option value="c">C</option><option value="cpp">C++</option><option value="java">Java</option><option value="python">Python</option><option value="javascript">JavaScript</option>
                  </select>
                </div>
                <button onClick={handleLiveCodeExecution} disabled={isRunning} className="h-7 px-4 bg-purple-600 text-white font-bold text-[10px] font-mono uppercase rounded">{isRunning ? 'Compiling...' : 'Run Code'}</button>
              </div>
            </header>
            <textarea value={editorCode} onChange={(e) => handleLocalCodeChange(e.target.value)} disabled={isInterviewer} className="flex-1 w-full bg-transparent p-0 pt-2 font-mono text-xs text-[#d4d4d4] outline-none resize-none leading-relaxed" />
          </div>

          <div onMouseDown={(e) => { e.preventDefault(); isDraggingRef.current = true; }} className="h-2 w-full cursor-ns-resize hover:bg-purple-600/40 transition active:bg-purple-600 my-1 rounded shrink-0 z-30" />

          <div style={{ height: `${consoleHeight}px` }} className="flex flex-col min-h-0 bg-transparent pt-2 shrink-0 w-full relative">
            <div className="h-9 flex items-center justify-between shrink-0 select-none">
              <span className="text-[10px] font-bold uppercase text-purple-400 font-mono">Console Diagnostics Logs</span>
              <input type="text" value={customInput} onChange={(e) => handleCustomInputLocalChange(e.target.value)} disabled={isInterviewer} className="w-72 h-6 bg-transparent text-[10px] text-neutral-400 text-right font-mono" />
            </div>
            <div className="flex-1 font-mono text-[11px] text-neutral-400 overflow-y-auto whitespace-pre-wrap leading-relaxed select-text bg-transparent flex flex-col justify-start">
              <div>{consoleOutput}</div>
              <div ref={logEndRef} className="h-2 flex-shrink-0" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}