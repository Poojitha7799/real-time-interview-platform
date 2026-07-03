'use client';
import React, { useState, useEffect, useRef } from 'react';

export default function MockPracticeView() {
  const [problemRepository, setProblemRepository] = useState([]);
  const [activeProblem, setActiveProblem] = useState(null);
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState('');
  const [customInput, setCustomInput] = useState('');
  const [consoleOutput, setConsoleOutput] = useState('System: Environment initialized. Ready for script compilation.');
  const [showWarningAlert, setShowWarningAlert] = useState(false);
  const [consoleHeight, setConsoleHeight] = useState(220);
  const [isLoading, setIsLoading] = useState(true);

  const chatInputRef = useRef(null);
  const chatEndRef = useRef(null);
  const logEndRef = useRef(null);
  const isDraggingRef = useRef(false);
  const containerRef = useRef(null);
  const warningTimerRef = useRef(null);
  
  const [chatMessages, setChatMessages] = useState([
    { sender: 'Interviewer', text: 'Welcome to your technical assessment. Please select a question from the active index list, review the parameters, and begin formulation inside the code compilation terminal.' }
  ]);

  const fallbackBackupQuestions = [
    {
      id: 'lis',
      title: 'Longest Increasing Subsequence',
      matrixTitle: 'Optimal Substructure Resolution Matrix',
      description: 'Given a sequence of integers, determine the length of the longest strictly increasing subsequence inside the dataset array cluster. Your solution should maximize runtime efficiency configurations.',
      constraints: '• Time Complexity Goal: O(n log n)\n• Space Complexity Bound: O(n)\n• Input Datasets: 1 <= nums.length <= 2500',
      testCases: [
        { id: 1, input: '[10, 9, 2, 5, 3, 7, 101, 18]', expected: '4', description: 'Standard unsorted array cluster' }
      ],
      templates: {
        python: 'def solution(nums):\n    print("Running Python array logic...")\n    return 4\n\nimport json\nprint(solution(json.loads(input())))',
        java: 'import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println(4);\n    }\n}',
        cpp: '#include <iostream>\nusing namespace std;\nint main() {\n    cout << 4 << endl;\n    return 0;\n}',
        c: '#include <stdio.h>\nint main() {\n    printf("4\\n");\n    return 0;\n}'
      }
    },
    {
      id: 'twosum',
      title: 'Two Sum Target Vector',
      matrixTitle: 'Hash-Map Index Intersection Matrix',
      description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution.',
      constraints: '• Time Complexity Goal: O(n)\n• Space Complexity Bound: O(n)\n• Input Datasets: 2 <= nums.length <= 10^4',
      testCases: [
        { id: 1, input: 'nums = [2,7,11,15], target = 9', expected: '[0,1]', description: 'Basic sequential pair' }
      ],
      templates: {
        python: 'def twoSum(nums, target):\n    return [0, 1]\n\nprint(twoSum([2,7,11,15], 9))',
        java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("[0, 1]");\n    }\n}',
        cpp: '#include <iostream>\nusing namespace std;\nint main() {\n    cout << "[0, 1]" << endl;\n    return 0;\n}',
        c: '#include <stdio.h>\nint main() {\n    printf("[0, 1]\\n");\n    return 0;\n}'
      }
    }
  ];

  useEffect(() => {
    async function fetchQuestions() {
      try {
        const res = await fetch('/api/questions');
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setProblemRepository(data);
          setActiveProblem(data[0]);
          setCode(data[0].templates.python || '');
        } else {
          throw new Error();
        }
      } catch (err) {
        setProblemRepository(fallbackBackupQuestions);
        setActiveProblem(fallbackBackupQuestions[0]);
        setCode(fallbackBackupQuestions[0].templates.python);
        setConsoleOutput('System Sync Fallback: Live connection offline. Loaded complete dynamic question array library clusters.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchQuestions();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [consoleOutput]);

  useEffect(() => {
    if (containerRef.current) {
      const fullHeight = containerRef.current.clientHeight;
      if (fullHeight > 200) {
        setConsoleHeight(Math.floor(fullHeight * 0.42));
      }
    }
  }, [isLoading]);

  useEffect(() => {
    const handleVisibilitySwitch = () => {
      if (document.hidden) {
        setShowWarningAlert(true);
        setConsoleOutput((out) => out + `\n[SECURITY ALERT]: Structural integrity bypass detected. Window switch logged.`);
        
        if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
        
        warningTimerRef.current = setTimeout(() => {
          setShowWarningAlert(false);
        }, 5000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilitySwitch);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilitySwitch);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDraggingRef.current || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const desiredHeight = containerRect.bottom - e.clientY - 12;
      const maxAllowed = containerRect.height - 140;
      
      if (desiredHeight > 80 && desiredHeight < maxAllowed) {
        setConsoleHeight(desiredHeight);
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      document.body.style.cursor = 'unset';
      document.body.style.userSelect = 'unset';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const selectActiveProblemIndex = (prob) => {
    setActiveProblem(prob);
    setCode(prob.templates[language] || prob.templates.python || '');
    setCustomInput('');
    setConsoleOutput(`System: Transferred focus configuration parameters to "${prob.title}".`);
    setChatMessages([
      { sender: 'Interviewer', text: `You have activated the workspace core for "${prob.title}". Review the criteria configurations and provide your evaluation script.` }
    ]);
  };

  const startResizeDrag = (e) => {
    e.preventDefault();
    isDraggingRef.current = true;
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
  };

  const handleLanguageChangeAction = (e) => {
    const targetLang = e.target.value;
    setLanguage(targetLang);
    if (activeProblem) {
      setCode(activeProblem.templates[targetLang] || '');
    }
  };

  const executeCodeSimulation = async () => {
    if (!activeProblem) return;
    setConsoleOutput((prev) => prev + `\n[COMPILING]: Connecting to Judge0 secure sandbox engine backend...`);

    let languageId = 71; 
    if (language === 'java') languageId = 62;
    else if (language === 'cpp') languageId = 54;
    else if (language === 'c') languageId = 50;

    try {
      const response = await fetch('https://judge0-ce.p.sulu.sh/submissions?base64_encoded=false&wait=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_code: code,
          language_id: languageId,
          stdin: customInput || (activeProblem.testCases?.[0]?.input || '')
        })
      });

      const data = await response.json();
      let logResult = `\n--- LIVE SANDBOX EXECUTION REPORT (${activeProblem.title}) ---`;
      
      if (data.status?.id === 3) {
        logResult += `\n✔ EXECUTION STATUS: SUCCESS (Exit Code 0)`;
        logResult += `\n\n[STANDARD OUTPUT]:\n${data.stdout || 'No explicit stdout stream variables captured.'}`;
      } else if (data.compile_output) {
        logResult += `\n❌ EXECUTION STATUS: COMPILATION ERROR`;
        logResult += `\n\n[COMPILER LOGS]:\n${data.compile_output}`;
      } else {
        logResult += `\n❌ EXECUTION STATUS: RUNTIME ERROR (${data.status?.description || 'Exception Triggered'})`;
        logResult += `\n\n[ERROR LOGS]:\n${data.stderr || 'No explicit stderr parameters traced.'}`;
      }

      logResult += `\n-----------------------------------\nEvaluation Pass Finished.\n`;
      setConsoleOutput((prev) => prev + logResult);

    } catch (err) {
      setConsoleOutput((prev) => prev + `\nSystem Error: Sandbox endpoint timeout or connection block detected.`);
    }
  };

  const dispatchChatPayload = async (e) => {
    e.preventDefault();
    const txt = chatInputRef.current.value.trim();
    if (!txt || !activeProblem) return;

    const updatedMessages = [...chatMessages, { sender: 'Candidate', text: txt }];
    setChatMessages(updatedMessages);
    chatInputRef.current.value = '';

    try {
      const response = await fetch('/api/ai/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemDescription: activeProblem.description,
          messages: updatedMessages
        })
      });

      const data = await response.json();
      if (response.ok && data.reply) {
        setChatMessages((prev) => [...prev, { sender: 'Interviewer', text: data.reply }]);
      } else {
        throw new Error();
      }
    } catch (err) {
      setChatMessages((prev) => [...prev, { 
        sender: 'Interviewer', 
        text: 'Communication uplink interrupted. Please check your local environment configurations and ensure GEMINI_API_KEY is present.' 
      }]);
    }
  };

  const handleManualExitAction = () => {
    if (window.confirm('Are you completely finished with the current technical assessment? Concluding now will seal session files.')) {
      window.location.href = '/analytics';
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-neutral-950 flex items-center justify-center font-mono text-xs text-purple-400 tracking-wider">
        <div className="flex flex-col items-center gap-2">
          <span className="h-4 w-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></span>
          <span>SYNCHRONIZING TARGET QUESTION REPOSITORIES...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-neutral-950 text-neutral-200 font-sans p-2 md:p-3 select-none overflow-hidden selection:bg-purple-500/30 flex flex-col relative">
      <style dangerouslySetInnerHTML={{__html: `* { scrollbar-width: none !important; } *::-webkit-scrollbar { display: none !important; }`}} />
      
      {showWarningAlert && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-xl bg-rose-950/95 border border-rose-800 text-rose-200 px-4 py-2.5 rounded-xl flex items-center justify-between shadow-2xl backdrop-blur-md transition-all duration-300">
          <div className="flex items-center space-x-2">
            <span className="text-sm">⚠️</span>
            <span className="text-xs font-mono uppercase tracking-wide font-bold">Security Alert: Workspace focus switch captured.</span>
          </div>
        </div>
      )}

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0 items-stretch">
        
        <div className="lg:col-span-3 flex flex-col gap-3 h-full min-h-0">
          <div className="bg-neutral-900/20 border border-neutral-900 rounded-2xl p-3 flex flex-col min-h-[140px] max-h-[220px] backdrop-blur-sm shrink-0">
            <h2 className="text-[10px] font-bold uppercase tracking-wider text-purple-400 mb-2 select-none">Active Problem Workspace Index</h2>
            <div className="overflow-y-auto flex-1 flex flex-col gap-1.5 pr-0.5">
              {problemRepository.map((prob) => (
                <button
                  key={prob.id}
                  onClick={() => selectActiveProblemIndex(prob)}
                  className={`w-full text-left p-2 rounded-xl text-[11px] font-mono transition border shrink-0 truncate ${
                    activeProblem?.id === prob.id 
                      ? 'bg-purple-950/30 border-purple-800 text-purple-300 font-bold' 
                      : 'bg-neutral-950/40 border-neutral-900 text-neutral-400 hover:border-neutral-800 hover:text-neutral-200'
                  }`}
                >
                  {prob.title}
                </button>
              ))}
            </div>
          </div>

          {activeProblem && (
            <>
              <div className="flex-1 bg-neutral-900/20 border border-neutral-900 rounded-2xl p-4 flex flex-col min-h-0 backdrop-blur-sm">
                <h2 className="text-[10px] font-bold uppercase tracking-wider text-purple-400 mb-2 select-none shrink-0">Assessment Target Matrix</h2>
                <div className="overflow-y-auto flex-1 pr-1 font-mono text-xs overflow-x-hidden">
                  <h3 className="text-sm font-bold text-neutral-100 tracking-tight mb-1.5">{activeProblem.matrixTitle}</h3>
                  <p className="text-neutral-400 leading-relaxed text-justify mb-2.5">{activeProblem.description}</p>
                  <div className="bg-neutral-950/50 border border-neutral-900 rounded-xl p-3 space-y-1">
                    <span className="block text-[9px] font-bold uppercase text-purple-400 tracking-wide">Constraints Parameters</span>
                    <p className="text-neutral-500 whitespace-pre-line leading-relaxed">{activeProblem.constraints}</p>
                  </div>
                </div>
              </div>

              <div className="flex-[0.8] bg-neutral-900/20 border border-neutral-900 rounded-2xl p-4 flex flex-col min-h-0 backdrop-blur-sm">
                <h2 className="text-[10px] font-bold uppercase tracking-wider text-purple-400 mb-2 font-mono select-none shrink-0">Target Test Case Index</h2>
                <div className="overflow-y-auto space-y-2 pr-1 flex-1 overflow-x-hidden">
                  {activeProblem.testCases.map((tc) => (
                    <div key={tc.id} className="bg-neutral-950/40 border border-neutral-900 rounded-xl p-2.5 font-mono text-[10px] space-y-1">
                      <div className="flex justify-between font-bold text-neutral-400">
                        <span>Case {tc.id}: {tc.description}</span>
                        <span className="text-purple-400">Expected: {tc.expected}</span>
                      </div>
                      <div className="text-neutral-500 truncate">Input: {tc.input}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div ref={containerRef} className="lg:col-span-6 flex flex-col min-h-0 relative h-full">
          <div className="flex-1 bg-neutral-900/20 border border-neutral-900 rounded-2xl p-4 flex flex-col min-h-0 backdrop-blur-sm relative">
            <header className="flex items-center justify-between border-b border-neutral-900 pb-2 mb-2 shrink-0">
              <div className="flex items-center space-x-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 font-mono">Terminal Script Compilation</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <select 
                  value={language}
                  onChange={handleLanguageChangeAction}
                  className="h-7 bg-neutral-950 border border-neutral-800 rounded-lg px-2 text-[11px] font-mono text-purple-400 focus:outline-none focus:border-neutral-700 cursor-pointer"
                >
                  <option value="python">Python 3.10</option>
                  <option value="java">Java LTS (JDK 17)</option>
                  <option value="cpp">C++17 (GCC)</option>
                  <option value="c">C11 (GCC)</option>
                </select>
                
                <button 
                  onClick={executeCodeSimulation}
                  className="h-7 px-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 rounded-lg text-[10px] font-bold font-mono uppercase tracking-wide transition"
                >
                  Run Code
                </button>
              </div>
            </header>

            <div className="flex-1 w-full min-h-0 relative rounded-xl border border-neutral-900 overflow-hidden bg-neutral-950">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="absolute inset-0 w-full h-full bg-neutral-950 p-4 text-xs font-mono text-neutral-300 focus:outline-none resize-none leading-relaxed tab-size-4 select-text"
                spellCheck="false"
              />
            </div>
          </div>

          <div 
            onMouseDown={startResizeDrag}
            className="h-2 w-full cursor-ns-resize hover:bg-purple-600/40 transition active:bg-purple-600 my-0.5 rounded shrink-0 z-10"
          />

          <div 
            style={{ height: `${consoleHeight}px` }}
            className="bg-neutral-900/20 border border-neutral-900 rounded-2xl p-4 flex flex-col min-h-0 gap-2 backdrop-blur-sm shrink-0"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
              <h2 className="text-[10px] font-bold uppercase tracking-wider text-purple-400 font-mono select-none">Console Diagnostics & Custom Parameters</h2>
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="Provide custom execution input cluster arguments (e.g. [1, 2, 3])..."
                className="w-full sm:w-80 h-6 bg-neutral-950 border border-neutral-800 rounded-lg px-2 text-[10px] text-neutral-300 focus:outline-none focus:border-neutral-700 placeholder:text-neutral-700 font-mono"
              />
            </div>
            <div className="flex-1 bg-neutral-950/60 border border-neutral-900 rounded-xl p-3 font-mono text-[10px] text-neutral-400 overflow-y-auto whitespace-pre-wrap leading-relaxed pb-6 select-text">
              {consoleOutput}
              <div ref={logEndRef} className="h-2 flex-shrink-0" />
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 flex flex-col gap-3 h-full min-h-0">
          <div className="bg-neutral-900/20 border border-neutral-900 rounded-2xl p-4 flex items-center justify-center shrink-0 backdrop-blur-sm">
            <button
              onClick={handleManualExitAction}
              className="w-full h-10 bg-rose-950/20 border border-rose-900/40 text-rose-400 hover:bg-rose-900/30 font-bold uppercase rounded-xl font-mono text-xs tracking-wide transition"
            >
              ⏹️ End Interview Session
            </button>
          </div>

          <div className="flex-1 bg-neutral-900/20 border border-neutral-900 rounded-2xl p-4 flex flex-col min-h-0 backdrop-blur-sm">
            <h2 className="text-[10px] font-bold uppercase tracking-wider text-purple-400 mb-2 select-none shrink-0">AI Live Interviewer Feed</h2>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs font-mono mb-2 overflow-x-hidden">
              {chatMessages.map((m, idx) => (
                <div key={idx} className="leading-relaxed">
                  <span className={`font-bold uppercase tracking-wide text-[9px] ${m.sender === 'Interviewer' ? 'text-purple-400' : 'text-emerald-400'}`}>
                    [{m.sender}]:
                  </span>
                  <span className="text-neutral-300 ml-1.5">{m.text}</span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={dispatchChatPayload} className="flex gap-2 shrink-0">
              <input 
                type="text" 
                ref={chatInputRef}
                placeholder="Query AI Interviewer panel..."
                className="flex-1 h-8 bg-neutral-950 border border-neutral-800 rounded-xl px-3 text-xs text-neutral-300 focus:outline-none focus:border-neutral-700 placeholder:text-neutral-700 font-mono"
              />
              <button 
                type="submit" 
                className="h-8 px-4 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-[10px] font-bold uppercase font-mono tracking-wide text-neutral-300 transition shrink-0"
              >
                Send
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}