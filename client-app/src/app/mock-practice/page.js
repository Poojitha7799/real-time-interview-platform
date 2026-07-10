'use client';
import React, { useState, useEffect, useRef } from 'react';

export default function MockPracticeView() {
  const [problemRepository, setProblemRepository] = useState([]);
  const [activeProblem, setActiveProblem] = useState(null);
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState('');
  const [customInput, setCustomInput] = useState('');
  const [consoleOutput, setConsoleOutput] = useState('System: Environment initialized. Ready for script compilation.');
  const [consoleHeight, setConsoleHeight] = useState(220);
  const [isLoading, setIsLoading] = useState(true);
  
  const [hasCompiled, setHasCompiled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [chatInputValue, setChatInputValue] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  const chatEndRef = useRef(null);
  const containerRef = useRef(null);
  
  const [chatMessages, setChatMessages] = useState([
    { sender: 'Interviewer', text: 'Welcome to your technical assessment. Please select a question from the active database index on the left, review the parameters, and begin formulation inside the code compilation terminal.' }
  ]);

  useEffect(() => {
    async function loadProblems() {
      try {
        const res = await fetch('/api/problems');
        const data = await res.json();
        
        if (Array.isArray(data) && data.length > 0) {
          setProblemRepository(data);
          setActiveProblem(data[0]);
          updateEditorTemplateCode(data[0], language);
        } else if (data.success && data.problems && data.problems.length > 0) {
          setProblemRepository(data.problems);
          setActiveProblem(data.problems[0]);
          updateEditorTemplateCode(data.problems[0], language);
        } else {
          setConsoleOutput('System Error: No valid questions resolved from the internal database engine.');
        }
      } catch (err) {
        console.error("🔴 Connection Exception to Core API:", err);
        setConsoleOutput('System Critical Error: Database fetch failed. Verify local db connection state.');
      } finally {
        setIsLoading(false);
      }
    }
    loadProblems();
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  // Unified code template assignment block to handle any backend object variants securely
  const updateEditorTemplateCode = (prob, lang) => {
    if (!prob) return;
    
    // Check if templates are grouped inside a nested object or exist directly flat on the row item
    const templateSource = prob.templates || prob;
    const dynamicCodeKey = templateSource[lang] || templateSource[`template_${lang}`] || templateSource[`${lang}_template`];

    if (dynamicCodeKey) {
      setCode(dynamicCodeKey);
    } else {
      // Clean fallback definitions
      if (lang === 'python') setCode("def solution():\n    pass");
      else if (lang === 'java') setCode("class Solution {\n    public void solution() {\n        \n    }\n}");
      else if (lang === 'cpp') setCode("class Solution {\npublic:\n    void solution() {\n        \n    }\n};");
      else if (lang === 'c') setCode("void solution() {\n    \n}");
      else setCode("// Write your code solution here...\n");
    }
  };

  const selectActiveProblemIndex = (prob) => {
    setActiveProblem(prob);
    setCustomInput('');
    setHasCompiled(false); 
    updateEditorTemplateCode(prob, language);
    setConsoleOutput(`System: Transferred focus configuration parameters to database problem "${prob.title}".`);
    setChatMessages([
      { sender: 'Interviewer', text: `Switched target matrix context to: "${prob.title}". Let me know if you have any structural questions before jumping into formulation.` }
    ]);
  };

  const handleLanguageChangeAction = (e) => {
    const targetLang = e.target.value;
    setLanguage(targetLang);
    if (activeProblem) {
      updateEditorTemplateCode(activeProblem, targetLang);
    }
  };

  const executeCodeSimulation = async () => {
    if (!activeProblem) return;
    setConsoleOutput((prev) => prev + `\n[COMPILING]: Routing script to local compiler service running on port 5001...`);
    setHasCompiled(true);

    try {
      const response = await fetch("http://localhost:5001/api/compiler/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          languageId: language,
          code,
          input: customInput || (activeProblem.testCases?.[0]?.input) || ""
        })
      });

      const data = await response.json();
      let logResult = `\n--- LIVE SANDBOX EXECUTION REPORT (${activeProblem.title}) ---`;

      if (!data.success) {
        logResult += `\n❌ SERVICE ERROR\n\n${data.error}`;
      } else {
        const result = data.result;
        if (result.run.code === 0) {
          logResult += `\n✔ EXECUTION STATUS: SUCCESS\n\n[STANDARD OUTPUT]:\n` + (result.run.stdout || "Program executed successfully.");
        } else {
          logResult += `\n❌ EXECUTION STATUS: RUNTIME ERROR\n\n[ERROR LOGS]:\n` + (result.run.stderr || result.run.output || "Unknown runtime error.");
        }
      }
      logResult += `\n-----------------------------------`;
      setConsoleOutput(prev => prev + logResult);
    } catch (err) {
      setConsoleOutput((prev) => prev + `\nSystem Error: Local compiler runtime server at port 5001 could not be reached.`);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const userPrompt = chatInputValue.trim();
    if (!userPrompt || isChatLoading) return;

    const updatedHistory = [...chatMessages, { sender: 'Candidate', text: userPrompt }];
    setChatMessages(updatedHistory);
    setChatInputValue('');
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userPrompt,
          history: chatMessages,
          problemDescription: activeProblem ? activeProblem.description : 'General practice sandbox'
        })
      });

      const data = await response.json();
      if (data.reply) {
        setChatMessages((prev) => [...prev, { sender: 'Interviewer', text: data.reply }]);
      } else {
        setChatMessages((prev) => [...prev, { sender: 'Interviewer', text: 'Error establishing connection context matrix.' }]);
      }
    } catch (err) {
      console.error("Chat failure context:", err);
      setChatMessages((prev) => [...prev, { sender: 'Interviewer', text: 'Communication offline. Check backend gateway properties.' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleManualExitAction = async () => {
    if (!window.confirm('Are you completely finished with the current technical assessment? This will invoke the AI Interviewer grading pipeline.')) return;

    setIsSubmitting(true);
    setConsoleOutput((prev) => prev + `\n[PROCESSING]: Running Gemini multi-variant interview metric assessments...`);

    let finalScore = 0;
    let finalStatus = 'Not Attempted';

    if (!hasCompiled) {
      finalScore = 0;
      finalStatus = 'Unattempted Code Base';
    } else {
      try {
        const aiEvalResponse = await fetch('/api/evaluate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId: `mock-${Math.random().toString(36).substring(2, 7)}`,
            code: code,
            problemDescription: activeProblem ? activeProblem.description : 'Database Sandbox Run',
            language: language,
            messages: chatMessages
          })
        });

        const aiData = await aiEvalResponse.json();

        if (aiData.evaluation) {
          const scoreMatch = aiData.evaluation.match(/Score:\s*(\d+)/i);
          if (scoreMatch) {
            finalScore = parseInt(scoreMatch[1], 10);
          } else {
            const generalMatch = aiData.evaluation.match(/\d+/);
            if (generalMatch) finalScore = parseInt(generalMatch[0], 10);
          }
          finalStatus = finalScore >= 60 ? 'Success' : 'Needs Review';
        }
      } catch (err) {
        console.error("AI Evaluation handler error:", err);
        finalScore = consoleOutput.includes('✔ EXECUTION STATUS: SUCCESS') ? 80 : 0;
        finalStatus = 'Evaluator Sync Error';
      }
    }

    try {
      await fetch('/api/sessions/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: activeProblem ? activeProblem.title : 'Database Practice Run',
          score: finalScore,
          status: finalStatus
        }),
      });
    } catch (e) {
      console.error("Session sync failed:", e);
    }

    window.location.href = '/analytics';
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-neutral-950 flex items-center justify-center font-mono text-xs text-purple-400 tracking-wider">
        <span>FETCHING QUESTIONS EXCLUSIVELY FROM LIVE DATABASE REPOSITORY...</span>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-neutral-950 text-neutral-200 font-sans p-2 md:p-3 select-none overflow-hidden flex flex-col relative">
      <style dangerouslySetInnerHTML={{__html: `* { scrollbar-width: none !important; } *::-webkit-scrollbar { display: none !important; }`}} />
      
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0 items-stretch">
        
        {/* Left Sidebar Problem Index Navigation Container */}
        <div className="lg:col-span-3 flex flex-col gap-3 h-full min-h-0">
          <div className="bg-neutral-900/20 border border-neutral-900 rounded-2xl p-3 flex flex-col flex-1 backdrop-blur-sm min-h-0">
            <h2 className="text-[10px] font-bold uppercase tracking-wider text-purple-400 mb-2">Database Problem Index</h2>
            <div className="overflow-y-auto flex-1 flex flex-col gap-1.5 pr-0.5">
              {problemRepository.map((prob, idx) => (
                <button
                  key={prob.id || idx}
                  disabled={isSubmitting}
                  onClick={() => selectActiveProblemIndex(prob)}
                  className={`w-full text-left p-2 rounded-xl text-[11px] font-mono transition border shrink-0 truncate ${
                    activeProblem?.id === prob.id 
                      ? 'bg-purple-950/30 border-purple-800 text-purple-300 font-bold' 
                      : 'bg-neutral-950/40 border-neutral-900 text-neutral-400 hover:border-neutral-800'
                  }`}
                >
                  {idx + 1}. {prob.title} ({prob.difficulty || 'Medium'})
                </button>
              ))}
            </div>
          </div>

          {activeProblem && (
            <div className="flex-1 bg-neutral-900/20 border border-neutral-900 rounded-2xl p-4 flex flex-col min-h-0 backdrop-blur-sm">
              <h2 className="text-[10px] font-bold uppercase tracking-wider text-purple-400 mb-2">Assessment Target Matrix</h2>
              <div className="overflow-y-auto flex-1 pr-1 font-mono text-xs overflow-x-hidden">
                <h3 className="text-sm font-bold text-neutral-100 mb-1.5">{activeProblem.title}</h3>
                <p className="text-neutral-400 leading-relaxed text-justify mb-2.5 whitespace-pre-wrap">{activeProblem.description}</p>
              </div>
            </div>
          )}
        </div>

        {/* Center Panel Code Execution Area */}
        <div ref={containerRef} className="lg:col-span-6 flex flex-col min-h-0 relative h-full">
          <div className="flex-1 bg-neutral-900/20 border border-neutral-900 rounded-2xl p-4 flex flex-col min-h-0 backdrop-blur-sm relative">
            <header className="flex items-center justify-between border-b border-neutral-900 pb-2 mb-2 shrink-0">
              <span className="text-[10px] font-bold uppercase text-purple-400 font-mono">Terminal Script Compilation</span>
              <div className="flex items-center space-x-3">
                <select value={language} disabled={isSubmitting} onChange={handleLanguageChangeAction} className="h-7 bg-neutral-950 border border-neutral-800 rounded-lg px-2 text-[11px] font-mono text-purple-400 focus:outline-none select-text">
                  <option value="python">Python 3.10</option>
                  <option value="java">Java LTS</option>
                  <option value="cpp">C++17</option>
                  <option value="c">C11</option>
                </select>
                <button onClick={executeCodeSimulation} disabled={isSubmitting} className="h-7 px-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-[10px] font-mono uppercase tracking-wide transition">
                  Run Code
                </button>
              </div>
            </header>

            <div className="flex-1 w-full min-h-0 relative rounded-xl border border-neutral-900 overflow-hidden bg-neutral-950">
              <textarea value={code} disabled={isSubmitting} onChange={(e) => setCode(e.target.value)} className="absolute inset-0 w-full h-full bg-neutral-950 p-4 text-xs font-mono text-neutral-300 focus:outline-none resize-none leading-relaxed select-text" style={{ tabSize: 4 }} spellCheck="false" />
            </div>
          </div>

          <div style={{ height: `${consoleHeight}px` }} className="bg-neutral-900/20 border border-neutral-900 rounded-2xl p-4 flex flex-col min-h-0 gap-2 backdrop-blur-sm shrink-0 mt-2">
            <h2 className="text-[10px] font-bold uppercase tracking-wider text-purple-400 font-mono">Console Diagnostics</h2>
            <div className="flex-1 bg-neutral-950/60 border border-neutral-900 rounded-xl p-3 font-mono text-[10px] text-neutral-400 overflow-y-auto whitespace-pre-wrap select-text">
              {consoleOutput}
            </div>
          </div>
        </div>

        {/* Right Side Control Interface & Fixed Chat Box */}
        <div className="lg:col-span-3 flex flex-col gap-3 h-full min-h-0">
          <div className="bg-neutral-900/20 border border-neutral-900 rounded-2xl p-4 flex flex-col gap-3 shrink-0 backdrop-blur-sm">
            <h2 className="text-[10px] font-bold uppercase tracking-wider text-purple-400 font-mono border-b border-neutral-900 pb-1.5">Session Action Center</h2>
            <button 
              onClick={handleManualExitAction} 
              disabled={isSubmitting}
              className="w-full h-11 bg-rose-950/20 hover:bg-rose-900/30 border border-rose-900/40 text-rose-400 font-bold uppercase rounded-xl font-mono text-[10px] tracking-wide transition mt-1"
            >
              {isSubmitting ? 'Evaluating Data Matrix...' : '⏹️ End Session & Push to Analytics'}
            </button>
          </div>

          {/* Dynamic AI Interviewer Live Response Chat Panel */}
          <div className="flex-1 bg-neutral-900/20 border border-neutral-900 rounded-2xl p-4 flex flex-col min-h-0 backdrop-blur-sm relative">
            <h2 className="text-[10px] font-bold uppercase tracking-wider text-purple-400 mb-2 select-none shrink-0">AI Live Interviewer Feed</h2>
            
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 text-xs font-mono mb-3 overflow-x-hidden select-text">
              {chatMessages.map((m, idx) => (
                <div key={idx} className="leading-relaxed bg-black/20 p-2 border border-neutral-900/40 rounded-xl">
                  <span className={`font-bold text-[9px] ${m.sender === 'Candidate' ? 'text-purple-400' : 'text-emerald-400'}`}>
                    [{m.sender.toUpperCase()}]:
                  </span>
                  <span className="text-neutral-300 ml-1.5">{m.text}</span>
                </div>
              ))}
              {isChatLoading && (
                <div className="animate-pulse text-[9px] text-purple-500 font-bold font-mono">
                  [INTERVIEWER IS WRITING LOGS...]
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="mt-auto flex items-center gap-1.5 shrink-0">
              <input
                type="text"
                placeholder={isChatLoading ? "Awaiting interviewer response..." : "Type message to live AI interviewer..."}
                value={chatInputValue}
                disabled={isSubmitting || isChatLoading}
                onChange={(e) => setChatInputValue(e.target.value)}
                className="flex-1 h-9 px-3 bg-neutral-950 border border-neutral-900 focus:border-purple-900/60 text-[11px] font-mono text-neutral-300 placeholder-neutral-700 rounded-xl outline-none transition disabled:opacity-50 select-text"
              />
              <button 
                type="submit" 
                disabled={isSubmitting || isChatLoading || !chatInputValue.trim()}
                className="h-9 px-4 bg-neutral-900 hover:bg-purple-950/40 border border-neutral-800 hover:border-purple-900/50 text-neutral-400 hover:text-purple-400 font-bold font-mono text-[10px] uppercase rounded-xl transition disabled:opacity-40"
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