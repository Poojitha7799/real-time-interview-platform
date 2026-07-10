import React from 'react';

export default function ProblemStaging({
  activeInterviewerTab,
  setActiveInterviewerTab,
  problemBank,
  selectedProblemIds,
  handleToggleQuestionSelection,
  handleDeployQuestionPaper,
  questionPaper,
  activePaperIndex,
  handleSelectActivePaperQuestion,
  replayEvents,
  currentEventIndex,
  handleTimelineSliderJump,
  isReplaying,
  pauseTimelinePlayback,
  startTimelinePlayback,
  replaySpeed,
  setReplaySpeed,
  isScreenRecording,
  securityAlerts
}) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden h-full">
      <div className="flex border-b border-neutral-900 bg-neutral-900/20 text-[10px] font-mono font-bold uppercase shrink-0">
        <button 
          onClick={() => setActiveInterviewerTab('questions')}
          className={`flex-1 py-3 border-b text-center tracking-tight transition ${activeInterviewerTab === 'questions' ? 'border-purple-500 text-purple-400 bg-neutral-950' : 'border-transparent text-neutral-500 hover:text-neutral-300'}`}
        >
          💼 Paper
        </button>
        <button 
          onClick={() => setActiveInterviewerTab('replay')}
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
                    prob.difficulty === 'Medium' ? 'bg-amber-950/60 text-amber-400' : 'bg-rose-950/60 text-rose-400'
                  }`}>
                    {prob.difficulty}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={handleDeployQuestionPaper}
              disabled={selectedProblemIds.length === 0}
              className="w-full py-2.5 bg-purple-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-purple-500 text-white font-bold text-[10px] font-mono uppercase tracking-wider rounded transition"
            >
              🚀 Deploy Exam Set ({selectedProblemIds.length})
            </button>

            {questionPaper.length > 0 && (
              <div className="pt-3 border-t border-neutral-900 space-y-2">
                <div className="text-[9px] uppercase font-black text-neutral-500 tracking-widest font-mono">Paper Live Selector</div>
                <div className="grid grid-cols-4 gap-1.5">
                  {questionPaper.map((q, idx) => (
                    <button
                      key={q.id}
                      onClick={() => handleSelectActivePaperQuestion(idx)}
                      className={`py-1.5 text-xs rounded-lg font-mono font-black transition border text-center ${
                        activePaperIndex === idx ? 'bg-purple-950/40 border-purple-700 text-purple-400' : 'bg-neutral-950 border-neutral-900 text-neutral-500 hover:text-neutral-300'
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
              <input 
                type="range" 
                min="0" 
                max={replayEvents.length > 0 ? replayEvents.length - 1 : 0} 
                value={currentEventIndex} 
                onChange={handleTimelineSliderJump}
                disabled={replayEvents.length === 0}
                className="w-full accent-purple-500 bg-neutral-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex gap-2">
                {isReplaying ? (
                  <button onClick={pauseTimelinePlayback} className="flex-1 py-2 bg-neutral-800 text-amber-400 font-bold text-xs rounded-lg font-mono uppercase border border-neutral-700">⏸ Pause</button>
                ) : (
                  <button onClick={() => startTimelinePlayback(currentEventIndex)} disabled={replayEvents.length === 0} className="flex-1 py-2 bg-purple-600 text-white font-bold text-[10px] font-mono uppercase tracking-wider rounded transition">▶ Play Timeline</button>
                )}
              </div>
            </div>

            <div className="bg-neutral-900/30 border border-neutral-900 rounded-xl p-4 flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-200">Auto Recording Engine</span>
              <span className="text-[10px] font-mono text-neutral-400 uppercase font-bold">{isScreenRecording ? 'Recording Active' : 'Initializing...'}</span>
            </div>

            <div className="space-y-2">
              <span className="text-[9px] uppercase tracking-wider font-mono font-black text-neutral-500 block">Security Proctoring Log Feed</span>
              <div className="bg-neutral-950 border border-neutral-900 rounded-xl max-h-[160px] overflow-y-auto p-2 font-mono text-[10px] divide-y divide-neutral-900">
                {securityAlerts.length === 0 ? (
                  <div className="p-4 text-center text-neutral-600 italic">No proctoring violations logged.</div>
                ) : (
                  securityAlerts.map((alert, i) => (
                    <div key={i} className="py-2 px-1 flex items-start justify-between text-rose-400 bg-rose-950/10 rounded my-1">
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
    </div>
  );
}