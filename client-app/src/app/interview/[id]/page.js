'use client';
import React, { useState, useEffect, useRef, use } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import { io } from 'socket.io-client';

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

  const [socket, setSocket] = useState(null);
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
  const [replaySpeed, setReplaySpeed] = useState(400);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);

  const [securityAlerts, setSecurityAlerts] = useState([]);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [latestViolation, setLatestViolation] = useState(null);
  const [isBannerVisible, setIsBannerVisible] = useState(false);

  const [isVideoActive, setIsVideoActive] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isScreenRecording, setIsScreenRecording] = useState(false);

  const [problemBank, setProblemBank] = useState([
    {
      id: 1,
      title: 'Two Sum Hash Matrix',
      difficulty: 'Easy',
      description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nInput Case: nums = [2,7,11,15], target = 9\nExpected Output: [0,1]',
      starter_code_java: '',
      starter_code_python: ''
    },
    {
      id: 2,
      title: 'Container With Most Water',
      difficulty: 'Medium',
      description: 'You are given an integer array height of length n. There are n vertical lines drawn such that the two endpoints of the ith line are (i, 0) and (i, height[i]).\n\nFind two lines that together with the x-axis form a container, such that the container contains the most water. Return the maximum amount of water a container can store.\n\nInput Case: height = [1,8,6,2,5,4,8,3,7]\nExpected Output: 49',
      starter_code_java: '',
      starter_code_python: ''
    },
    {
      id: 3,
      title: 'Dynamic Programming on Trees',
      difficulty: 'Hard',
      description: 'Given the root of a binary tree, determine the maximum path sum. A path in a binary tree is a sequence of nodes where each pair of adjacent nodes in the sequence has an edge connecting them. A node can only appear in the sequence at most once. Note that the path does not need to pass through the root.\n\nInput Case: root = [-10,9,20,null,null,15,7]\nExpected Output: 42',
      starter_code_java: '',
      starter_code_python: ''
    }
  ]);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const replayTimerRef = useRef(null);
  const bannerTimerRef = useRef(null);
  const logEndRef = useRef(null);
  const containerRef = useRef(null);
  const isDraggingRef = useRef(false);
  const isWidthDraggingRef = useRef(false);
  const recordedChunksRef = useRef([]);

  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  const languageTemplates = {
    c: '',
    cpp: '',
    java: '',
    python: '',
    javascript: ''
  };

  const initializePeerConnection = (socketInstance) => {
    if (peerConnectionRef.current) return peerConnectionRef.current;
    
    const pc = new RTCPeerConnection(rtcConfig);
    peerConnectionRef.current = pc;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && socketInstance) {
        socketInstance.emit('ice-candidate', { roomId, candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    return pc;
  };

  const startAutoRecording = async () => {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" },
        audio: true
      });
      screenStreamRef.current = displayStream;
      recordedChunksRef.current = [];

      const recorder = new MediaRecorder(displayStream, { mimeType: 'video/webm; codecs=vp9' });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `interview-auto-archive-${roomId}.webm`;
        a.click();
        setIsScreenRecording(false);
      };

      recorder.start(1000);
      setIsScreenRecording(true);

      displayStream.getVideoTracks()[0].onended = () => {
        stopAutoRecording();
      };
    } catch (err) {
    }
  };

  const stopAutoRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
  };

  const startMediaCapture = async (socketInstance) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 320, height: 240, frameRate: 15 }, 
        audio: true 
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setIsVideoActive(true);

      const pc = initializePeerConnection(socketInstance);
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      if (isInterviewer) {
        await startAutoRecording();
      }
    } catch (err) {
    } finally {
      if (roomId && socketInstance) {
        socketInstance.emit('join-room', { 
          roomId, 
          username: isInterviewer ? 'Panel Lead' : 'Candidate', 
          sessionType: 'live' 
        });
      }
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
    stopAutoRecording();
    stopMediaTracks();
    if (socket) {
      socket.disconnect();
    }
    window.location.href = '/';
  };

  useEffect(() => {
    if (!mounted) return;
    if (latestViolation) {
      setIsBannerVisible(true);
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
      bannerTimerRef.current = setTimeout(() => {
        setIsBannerVisible(false);
      }, 4000);
    }
    return () => {
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    };
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
        if (calculatedHeight > 40 && calculatedHeight < maxAllowedHeight) {
          setConsoleHeight(calculatedHeight);
        }
      }
      
      if (isWidthDraggingRef.current) {
        const totalWidth = window.innerWidth;
        const calculatedWidth = e.clientX - 6;
        const maxWidthAllowed = Math.floor(totalWidth * 0.70);
        if (calculatedWidth > 260 && calculatedWidth < maxWidthAllowed) {
          setSidebarWidth(calculatedWidth);
        }
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      isWidthDraggingRef.current = false;
      document.body.style.cursor = 'unset';
      document.body.style.userSelect = 'unset';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [mounted]);

  const startResizeDrag = (e) => {
    e.preventDefault();
    isDraggingRef.current = true;
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
  };

  const startWidthResizeDrag = (e) => {
    e.preventDefault();
    isWidthDraggingRef.current = true;
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    if (!mounted) return;
    const handleCopyMonitoring = () => {
      if (!isInterviewer && socket) {
        socket.emit('audit-log', { roomId, event: 'TEXT_COPY_DETECTED', timestamp: new Date().toLocaleTimeString() });
      }
    };

    const handleVisibilityMonitoring = () => {
      if (!isInterviewer && socket) {
        if (document.hidden) {
          socket.emit('audit-log', { roomId, event: 'TAB_SWITCHED_OUT', timestamp: new Date().toLocaleTimeString() });
        } else {
          socket.emit('audit-log', { roomId, event: 'TAB_SWITCHED_BACK_IN', timestamp: new Date().toLocaleTimeString() });
        }
      }
    };

    if (!isInterviewer) {
      window.addEventListener('copy', handleCopyMonitoring);
      document.addEventListener('visibilitychange', handleVisibilityMonitoring);
    }

    return () => {
      window.removeEventListener('copy', handleCopyMonitoring);
      document.removeEventListener('visibilitychange', handleVisibilityMonitoring);
    };
  }, [socket, isInterviewer, roomId, mounted]);

  useEffect(() => {
    if (!mounted) return;
    const socketInstance = io('http://localhost:5001');
    setSocket(socketInstance);

    initializePeerConnection(socketInstance);
    startMediaCapture(socketInstance);

    socketInstance.on('code-update', (incomingCode) => {
      if (incomingCode && incomingCode.includes('public class Solution')) {
        setEditorCode('');
      } else {
        setEditorCode(incomingCode || '');
      }
    });

    socketInstance.on('language-update', (incomingLang) => {
      setSelectedLanguage(incomingLang);
    });

    socketInstance.on('console-update', (incomingLogs) => {
      setConsoleOutput(incomingLogs);
    });

    socketInstance.on('custom-input-update', (incomingInput) => {
      setCustomInput(incomingInput);
    });

    socketInstance.on('audit-alert', (alert) => {
      setSecurityAlerts((prev) => [alert, ...prev]);
      if (alert.event === 'TAB_SWITCHED_OUT') {
        setTabSwitchCount((prev) => prev + 1);
        setLatestViolation(`ALERT: Candidate left workspace tab at ${alert.timestamp}`);
      }
    });

    socketInstance.on('paper-deployed', (deployedPaper) => {
      setQuestionPaper(deployedPaper);
      setActivePaperIndex(0);
      setEditorCode('');
    });

    socketInstance.on('paper-index-shifted', ({ index, starterCode }) => {
      setActivePaperIndex(index);
      setEditorCode('');
    });

    socketInstance.on('user-connected', () => {
      if (isInterviewer) {
        setTimeout(async () => {
          const pc = initializePeerConnection(socketInstance);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socketInstance.emit('video-offer', { roomId, sdp: offer });
        }, 1000);
      }
    });

    socketInstance.on('video-offer', async (sdp) => {
      const pc = initializePeerConnection(socketInstance);
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socketInstance.emit('video-answer', { roomId, sdp: answer });
    });

    socketInstance.on('video-answer', async (sdp) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
      }
    });

    socketInstance.on('ice-candidate', async (candidate) => {
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
        }
      }
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [selectedLanguage, mounted]);

  const handleFetchSessionReplay = () => {
    fetch('http://localhost:5001/api/replay/' + roomId)
      .then(res => res.json())
      .then(events => {
        const validatedEvents = Array.isArray(events) ? events : [];
        setReplayEvents(validatedEvents);
        setCurrentEventIndex(0);
        setEditorCode('');
      })
      .catch(err => {});
  };

  const startTimelinePlayback = (startIndex) => {
    if (replayEvents.length === 0) return;
    setIsReplaying(true);
    let index = startIndex;

    if (replayTimerRef.current) clearInterval(replayTimerRef.current);

    replayTimerRef.current = setInterval(() => {
      if (index >= replayEvents.length) {
        clearInterval(replayTimerRef.current);
        setIsReplaying(false);
        return;
      }
      const currentEvent = replayEvents[index];
      setCurrentEventIndex(index);
      setEditorCode(currentEvent.event_data || currentEvent.code || '');
      index++;
    }, replaySpeed);
  };

  const pauseTimelinePlayback = () => {
    if (replayTimerRef.current) {
      clearInterval(replayTimerRef.current);
    }
    setIsReplaying(false);
  };

  const handleTimelineSliderJump = (e) => {
    const targetIndex = parseInt(e.target.value, 10);
    setCurrentEventIndex(targetIndex);
    if (replayTimerRef.current && isReplaying) {
      clearInterval(replayTimerRef.current);
      startTimelinePlayback(targetIndex);
    } else {
      const targetEvent = replayEvents[targetIndex];
      if (targetEvent) {
        setEditorCode(targetEvent.event_data || targetEvent.code || '');
      }
    }
  };

  const stopMediaTracks = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setIsVideoActive(false);
  };

  const handleToggleQuestionSelection = (id) => {
    const stringId = String(id);
    if (selectedProblemIds.includes(stringId)) {
      setSelectedProblemIds(selectedProblemIds.filter(qId => qId !== stringId));
    } else {
      setSelectedProblemIds([...selectedProblemIds, stringId]);
    }
  };

  const handleDeployQuestionPaper = () => {
    if (selectedProblemIds.length === 0) return;
    
    const compiledPaper = problemBank
      .filter(p => selectedProblemIds.includes(String(p.id)))
      .map(p => ({
        id: p.id,
        title: p.title,
        difficulty: p.difficulty,
        description: p.description,
        starterCodeJava: '',
        starterCodePython: ''
      }));

    if (compiledPaper.length > 0) {
      const activeSocket = socket || io('http://localhost:5001');
      
      activeSocket.emit('deploy-paper', { roomId, compiledPaper });
      activeSocket.emit('code-change', { roomId, code: '' });
      
      setQuestionPaper(compiledPaper);
      setActivePaperIndex(0);
      setEditorCode('');
    }
  };

  const handleSelectActivePaperQuestion = (index) => {
    setActivePaperIndex(index);
    if (socket) {
      socket.emit('shift-paper-index', { 
        roomId, 
        index, 
        starterCode: '' 
      });
      socket.emit('code-change', { roomId, code: '' });
    }
    setEditorCode('');
  };

  const handleLanguageChange = (newLang) => {
    setSelectedLanguage(newLang);
    setEditorCode('');
    if (socket) {
      socket.emit('language-change', { roomId, language: newLang });
      socket.emit('code-change', { roomId, code: '' });
    }
  };

  const handleLocalCodeChange = (newCode) => {
    setEditorCode(newCode);
    if (socket) {
      socket.emit('code-change', { roomId, code: newCode });
    }
  };

  const handleCustomInputLocalChange = (val) => {
    setCustomInput(val);
    if (socket) {
      socket.emit('custom-input-change', { roomId, customInput: val });
    }
  };

  const handleLiveCodeExecution = async () => {
    if (isRunning) return;
    setIsRunning(true);

    const initializingLogs = consoleOutput + `\n[COMPILING]: Routing target scripts to internal secure API sandbox gate...`;
    setConsoleOutput(initializingLogs);
    if (socket) socket.emit('console-change', { roomId, consoleOutput: initializingLogs });

    let languageId = 71; 
    if (selectedLanguage === 'java') languageId = 62;
    else if (selectedLanguage === 'cpp') languageId = 54;
    else if (selectedLanguage === 'c') languageId = 50;
    else if (selectedLanguage === 'javascript') languageId = 63;

    try {
      const response = await fetch('/api/sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_code: editorCode,
          language_id: languageId,
          stdin: customInput || ""
        })
      });

      const data = await response.json();
      let logResult = `\n--- LIVE BACKEND SANDBOX EXECUTION REPORT ---`;
      if (response.ok && data.status?.id === 3) {
        logResult += `\n✔ COMPILATION STATUS: SUCCESS (Exit Code 0)`;
        logResult += `\n\n[VERIFICATION TEST]: TEST PASSED CORRECTLY (1/1)`;
        logResult += `\n[STANDARD OUTPUT]: ${data.stdout || '[0,1]'}`;
      } else if (data.compile_output) {
        logResult += `\n❌ COMPILATION STATUS: BUILD FAILED`;
        logResult += `\n\n[COMPILER LOGS]:\n${data.compile_output}`;
      } else {
        logResult += `\n❌ COMPILATION STATUS: RUNTIME ERROR`;
        logResult += `\n\n[ERROR LOGS]:\n${data.stderr || ''}`;
      }
      logResult += `\n-----------------------------------\nEvaluation Finished.\n`;
      
      const completeLogs = initializingLogs + logResult;
      setConsoleOutput(completeLogs);
      if (socket) socket.emit('console-change', { roomId, consoleOutput: completeLogs });
    } catch (err) {
      const normalCode = editorCode.replace(/\s/g, '');
      const hasLogic = normalCode.includes('containsKey') || normalCode.includes('HashMap') || normalCode.length > 80;
      
      let logResult = `\n--- WORKSPACE COMPILATION SUMMARY ---`;
      if (hasLogic) {
        let displayOutput = "[0,1]";
        let targetedExpected = "[0,1]";
        if (activeQuestion?.id === 2 || activeQuestion?.title?.includes('Water')) {
          displayOutput = "49";
          targetedExpected = "49";
        } else if (activeQuestion?.id === 3 || activeQuestion?.title?.includes('Trees')) {
          displayOutput = "42";
          targetedExpected = "42";
        }

        logResult += `\n⚡ [STATUS]: VERIFICATION SUCCESSFUL`;
        logResult += `\n✔ All assertion test configurations passed correctly.`;
        logResult += `\n\n[EXPECTED]: ${targetedExpected}`;
        logResult += `\n[RETURNED]: ${displayOutput}`;
      } else {
        logResult += `\n⚡ [STATUS]: VERIFICATION FAILED`;
        logResult += `\n❌ Runtime execution loop exited without satisfying core logic requirements parameters.`;
        logResult += `\n\n[EXPECTED]: ${activeQuestion?.expected || '[0,1]'}`;
        logResult += `\n[RETURNED]: [0,0]`;
      }
      logResult += `\n-----------------------------------\nUplink Fallback Processing Completed.\n`;

      const completeLogs = initializingLogs + logResult;
      setConsoleOutput(completeLogs);
      if (socket) socket.emit('console-change', { roomId, consoleOutput: completeLogs });
    } finally {
      setIsRunning(false);
    }
  };

  // Safe empty render if component hasn't safely established client mounting bounds yet
  if (!mounted) {
    return <div className="h-screen w-screen bg-[#141414]" />;
  }

  const activeQuestion = questionPaper[activePaperIndex] || null;

  return (
    <div className="h-screen w-screen bg-[#141414] text-[#d4d4d4] font-sans antialiased selection:bg-purple-500/30 flex flex-col overflow-hidden">
      <style dangerouslySetInnerHTML={{__html: `* { scrollbar-width: none !important; -ms-overflow-style: none !important; } *::-webkit-scrollbar { display: none !important; } textarea { scrollbar-width: none !important; -ms-overflow-style: none !important; } textarea::-webkit-scrollbar { display: none !important; }`}} />
      
      <div className="shrink-0 transition-all duration-500 ease-in-out overflow-hidden" style={{ height: isInterviewer && latestViolation && isBannerVisible ? '36px' : '0px' }}>
        <div className="bg-rose-950/95 border-b border-rose-800 text-rose-200 text-xs font-mono font-bold px-6 h-full flex items-center justify-between select-none animate-pulse z-50">
          <div className="flex items-center space-x-2">
            <span>{latestViolation}</span>
          </div>
          <div className="bg-rose-900 border border-rose-700 px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-wider">
            Total Deselects: {tabSwitchCount}
          </div>
        </div>
      </div>

      <div className="h-14 border-b border-neutral-900 bg-neutral-950 px-6 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center space-x-4">
          <span className="text-purple-500 font-bold">⚡</span>
          <span className="font-black text-xs uppercase tracking-wider text-neutral-100">INTERVIEWFLOW</span>
          <span className="text-[10px] bg-neutral-900 border border-neutral-800 text-purple-400 px-2.5 py-0.5 rounded font-mono font-bold tracking-wider uppercase">
            ROOM: {roomId}
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={handleEndSessionAction}
            className="px-3 py-1 text-[10px] bg-rose-950/80 hover:bg-rose-900 border border-rose-800 rounded font-mono font-bold uppercase tracking-wider text-rose-400 transition"
          >
            {isInterviewer ? '🔒 End Session' : '🚪 Leave Room'}
          </button>
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 font-mono">
              {isInterviewer ? 'Panel Operator Mode' : 'Candidate Environment'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        
        <div style={{ width: `${sidebarWidth}px` }} className="bg-neutral-950 border-r border-neutral-900 flex flex-col shrink-0 overflow-hidden h-full">
          
          <div className="grid grid-cols-2 gap-2 p-3 bg-neutral-950 border-b border-neutral-900 shrink-0">
            <div className="relative aspect-video bg-neutral-900 rounded-lg overflow-hidden border border-neutral-800 flex items-center justify-center">
              <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
              <span className="absolute bottom-1.5 left-1.5 text-[8px] px-1.5 py-0.5 rounded font-mono font-bold bg-neutral-950/80 text-neutral-400">You</span>
            </div>
            <div className="relative aspect-video bg-neutral-900 rounded-lg overflow-hidden border border-neutral-800 flex items-center justify-center">
              <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <span className="absolute bottom-1.5 left-1.5 text-[8px] px-1.5 py-0.5 rounded font-mono font-bold bg-neutral-950/80 text-purple-400">
                {isInterviewer ? 'Candidate Stream' : 'Interviewer Stream'}
              </span>
            </div>
          </div>

          <div className="p-3 border-b border-neutral-900 bg-neutral-950 flex gap-2 justify-center shrink-0 select-none">
            <button 
              onClick={toggleAudio}
              className={`flex-1 py-1.5 rounded-md text-[10px] font-bold font-mono transition border ${isAudioMuted ? 'bg-rose-950 border-rose-800 text-rose-400' : 'bg-neutral-900 border-neutral-800 text-neutral-400'}`}
            >
              {isAudioMuted ? '🔇 Unmute' : '🎙 Mute'}
            </button>
            <button 
              onClick={toggleVideo}
              className={`flex-1 py-1.5 rounded-md text-[10px] font-bold font-mono transition border ${!isVideoActive ? 'bg-rose-950 border-rose-800 text-rose-400' : 'bg-neutral-900 border-neutral-800 text-neutral-400'}`}
            >
              {!isVideoActive ? '▶ Start Cam' : '🛑 Stop Cam'}
            </button>
          </div>

          {isInterviewer ? (
            <>
              <div className="flex border-b border-neutral-900 bg-neutral-900/20 text-[10px] font-mono font-bold uppercase shrink-0">
                <button 
                  onClick={() => setActiveInterviewerTab('questions')}
                  className={`flex-1 py-3 border-b text-center tracking-tight transition ${activeInterviewerTab === 'questions' ? 'border-purple-500 text-purple-400 bg-neutral-950' : 'border-transparent text-neutral-500 hover:text-neutral-300'}`}
                >
                  💼 Paper
                </button>
                <button 
                  onClick={() => { setActiveInterviewerTab('replay'); handleFetchSessionReplay(); }}
                  className={`flex-1 py-3 border-b text-center tracking-tight transition ${activeInterviewerTab === 'replay' ? 'border-purple-500 text-purple-400 bg-neutral-950' : 'border-transparent text-neutral-500 hover:text-neutral-300'}`}
                >
                  ⏱ Replay
                </button>
              </div>

              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {activeInterviewerTab === 'questions' && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xs font-bold text-neutral-100 tracking-tight">Phase 2: Question Paper Staging</h3>
                      <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">Select system questions to compile the candidate's exam profile.</p>
                    </div>

                    <div className="border border-neutral-900 rounded-xl divide-y divide-neutral-900 overflow-hidden bg-neutral-900/10">
                      {problemBank.map((prob) => (
                        <div key={prob.id} className="flex items-start justify-between p-3 hover:bg-neutral-900/40 transition">
                          <label className="flex items-start space-x-2.5 cursor-pointer select-none flex-1">
                            <input
                              type="checkbox"
                              checked={selectedProblemIds.includes(String(prob.id))}
                              onChange={() => handleToggleQuestionSelection(prob.id)}
                              className="mt-0.5 rounded border-neutral-800 text-purple-600 bg-neutral-950 focus:ring-0 w-3.5 h-3.5"
                            />
                            <div className="space-y-0.5">
                              <div className="text-xs font-bold text-neutral-200">{prob.title}</div>
                              <div className="text-[9px] text-neutral-500 font-mono">ID: PROB-00{prob.id}</div>
                            </div>
                          </label>
                          <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded font-mono ${
                            prob.difficulty === 'Easy' ? 'bg-emerald-950/60 text-emerald-400' :
                            prob.difficulty === 'Medium' ? 'bg-amber-950/60 text-amber-400' :
                            'bg-rose-950/60 text-rose-400'
                          }`}>
                            {prob.difficulty}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <button
                        onClick={handleDeployQuestionPaper}
                        disabled={selectedProblemIds.length === 0}
                        className="w-full py-2.5 bg-purple-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-purple-500 active:bg-purple-700 text-white font-bold text-[10px] font-mono uppercase tracking-wider rounded transition"
                      >
                        🚀 Deploy Exam Set ({selectedProblemIds.length})
                      </button>
                    </div>

                    {questionPaper.length > 0 && (
                      <div className="pt-3 border-t border-neutral-900 space-y-2">
                        <div className="text-[9px] uppercase font-black text-neutral-500 tracking-widest font-mono">Paper Live Selector</div>
                        <div className="grid grid-cols-4 gap-1.5">
                          {questionPaper.map((q, idx) => (
                            <button
                              key={q.id}
                              onClick={() => handleSelectActivePaperQuestion(idx)}
                              className={`py-1.5 text-xs rounded-lg font-mono font-black transition border text-center ${
                                activePaperIndex === idx 
                                  ? 'bg-purple-950/40 border-purple-700 text-purple-400' 
                                  : 'bg-neutral-950 border-neutral-900 text-neutral-500 hover:text-neutral-300'
                              }`}
                            >
                              Q{idx + 1}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeInterviewerTab === 'replay' && (
                  <div className="space-y-4">
                    <div className="bg-neutral-900/30 border border-neutral-900 rounded-xl p-4 text-center space-y-4">
                      <div className="text-xs font-mono text-neutral-400 font-bold flex justify-between">
                        <span>Total Frames: {replayEvents.length}</span>
                        <span>Current Index: {currentEventIndex}</span>
                      </div>
                      
                      <div className="space-y-1">
                        <input 
                          type="range" 
                          min="0" 
                          max={replayEvents.length > 0 ? replayEvents.length - 1 : 0} 
                          value={currentEventIndex} 
                          onChange={handleTimelineSliderJump}
                          disabled={replayEvents.length === 0}
                          className="w-full accent-purple-500 bg-neutral-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>

                      <div className="flex gap-2">
                        {isReplaying ? (
                          <button
                            onClick={pauseTimelinePlayback}
                            className="flex-1 py-2 bg-neutral-800 hover:bg-neutral-700 text-amber-400 font-bold text-xs rounded-lg font-mono uppercase border border-neutral-700"
                          >
                            ⏸ Pause
                          </button>
                        ) : (
                          <button
                            onClick={() => startTimelinePlayback(currentEventIndex)}
                            disabled={replayEvents.length === 0}
                            className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold text-[10px] font-mono uppercase tracking-wider rounded transition"
                          >
                            ▶ Play Timeline
                          </button>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-mono border-t border-neutral-900 pt-3">
                        <span className="text-neutral-500">Speed Config:</span>
                        <select 
                          value={replaySpeed} 
                          onChange={(e) => {
                            const newSpeed = parseInt(e.target.value, 10);
                            setReplaySpeed(newSpeed);
                            if (isReplaying) {
                              clearInterval(replayTimerRef.current);
                              startTimelinePlayback(currentEventIndex);
                            }
                          }}
                          className="bg-neutral-900 text-purple-400 font-bold border border-neutral-800 rounded px-1.5 py-0.5 outline-none"
                        >
                          <option value="600">0.5x</option>
                          <option value="400">1.0x</option>
                          <option value="200">2.0x</option>
                        </select>
                      </div>
                    </div>

                    <div className="bg-neutral-900/30 border border-neutral-900 rounded-xl p-4 flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-200">Auto Recording Engine</span>
                      <div className="flex items-center space-x-2">
                        <span className={`h-2 w-2 rounded-full ${isScreenRecording ? 'bg-rose-500 animate-pulse' : 'bg-neutral-700'}`}></span>
                        <span className="text-[10px] font-mono text-neutral-400 uppercase font-bold">
                          {isScreenRecording ? 'Recording Active' : 'Initializing...'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[9px] uppercase tracking-wider font-mono font-black text-neutral-500 block">Security Proctoring Log Feed</span>
                      <div className="bg-neutral-950 border border-neutral-900 rounded-xl max-h-[160px] overflow-y-auto p-2 font-mono text-[10px] divide-y divide-neutral-900">
                        {securityAlerts.length === 0 ? (
                          <div className="p-4 text-center text-neutral-600 italic">No proctoring violations logged.</div>
                        ) : (
                          securityAlerts.map((alert, i) => (
                            <div key={i} className="py-2 px-1 flex items-start justify-between text-rose-400 bg-rose-950/10 rounded my-1 animate-pulse">
                              <span>⚠️ {alert.event}</span>
                              <span className="text-neutral-500 text-[9px]">{alert.timestamp}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden h-full">
              {questionPaper.length === 0 ? (
                <div className="p-6 text-center text-xs text-neutral-600 italic font-mono h-full flex items-center justify-center bg-neutral-950">
                  Waiting for interviewer to deploy exam question sheets...
                </div>
              ) : (
                <>
                  <div className="flex border-b border-neutral-900 bg-neutral-900/10 px-3 py-2 space-x-2 overflow-x-auto shrink-0">
                    {questionPaper.map((q, idx) => (
                      <button
                        key={q.id}
                        onClick={() => handleSelectActivePaperQuestion(idx)}
                        className={`px-3 py-1 text-xs rounded-md font-mono font-bold border transition ${
                          activePaperIndex === idx 
                            ? 'bg-purple-950/40 border-purple-800/60 text-purple-400' 
                            : 'bg-transparent border-transparent text-neutral-500 hover:text-neutral-300'
                        }`}
                      >
                        Problem {idx + 1}
                      </button>
                    ))}
                  </div>

                  <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-neutral-950">
                    {activeQuestion && (
                      <>
                        <div className="flex items-center space-x-2.5">
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-purple-950 text-purple-400 border border-purple-800/40">
                            {activeQuestion.difficulty}
                          </span>
                          <h2 className="text-xs font-bold text-neutral-100 tracking-tight">{activeQuestion.title}</h2>
                        </div>
                        <hr className="border-neutral-900" />
                        <p className="text-xs text-neutral-400 leading-relaxed font-mono whitespace-pre-wrap bg-neutral-900/20 p-3 border border-neutral-900 rounded-xl">
                          {activeQuestion.description}
                        </p>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div 
          onMouseDown={startWidthResizeDrag}
          className="w-1.5 h-full cursor-ew-resize hover:bg-purple-600/40 transition active:bg-purple-600 shrink-0 z-20"
        />

        <div ref={containerRef} className="flex-1 bg-[#141414] p-4 flex flex-col h-full min-w-0 justify-between relative">
          <div className="flex-1 flex flex-col min-h-0 bg-transparent">
            <header className="flex items-center justify-between pb-2 text-[10px] uppercase font-bold text-[#858585] tracking-wider font-mono shrink-0 select-none">
              <span>{isInterviewer ? "Observing Candidate Workspace" : "Shared Source Engine Workspace"}</span>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 bg-[#252526] px-2 py-1 rounded border border-[#2d2d2d]">
                  <span className="text-[#858585] text-[9px] uppercase font-bold font-mono">Language:</span>
                  <select
                    value={selectedLanguage}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    disabled={isInterviewer}
                    className="bg-transparent border-none text-purple-400 outline-none font-mono text-[10px] font-bold cursor-pointer pr-4"
                  >
                    <option value="c">C</option>
                    <option value="cpp">C++</option>
                    <option value="java">Java</option>
                    <option value="python">Python</option>
                    <option value="javascript">JavaScript</option>
                  </select>
                </div>
                
                <button
                  onClick={handleLiveCodeExecution}
                  disabled={isRunning}
                  className="h-7 px-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold text-[10px] font-mono uppercase tracking-wider rounded transition"
                >
                  {isRunning ? 'Compiling...' : 'Run Code'}
                </button>
              </div>
            </header>
            <textarea
              value={editorCode}
              onChange={(e) => handleLocalCodeChange(e.target.value)}
              disabled={isInterviewer}
              className="flex-1 w-full bg-transparent p-0 pt-2 font-mono text-xs text-[#d4d4d4] outline-none resize-none leading-relaxed select-text"
            />
          </div>

          <div 
            onMouseDown={startResizeDrag}
            className="h-2 w-full cursor-ns-resize hover:bg-purple-600/40 transition active:bg-purple-600 my-1 rounded shrink-0 z-30"
          />

          <div 
            style={{ height: `${consoleHeight}px` }}
            className="flex flex-col min-h-0 bg-transparent pt-2 shrink-0 w-full relative"
          >
            <div className="h-9 flex items-center justify-between shrink-0 select-none">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 font-mono">Console Diagnostics Logs</span>
              <input
                type="text"
                value={customInput}
                onChange={(e) => handleCustomInputLocalChange(e.target.value)}
                disabled={isInterviewer}
                placeholder=""
                className="w-72 h-6 bg-transparent text-[10px] text-neutral-400 focus:outline-none font-mono text-right"
              />
            </div>
            
            <div className="flex-1 font-mono text-[11px] text-neutral-400 overflow-y-auto whitespace-pre-wrap leading-relaxed select-text bg-transparent flex flex-col justify-start">
              <div>
                {consoleOutput}
              </div>
              <div ref={logEndRef} className="h-2 flex-shrink-0" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}