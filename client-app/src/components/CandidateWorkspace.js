import React from 'react';

export default function CandidateWorkspace({ questionPaper, activePaperIndex, handleSelectActivePaperQuestion, activeQuestion }) {
  if (questionPaper.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-neutral-600 italic font-mono h-full flex items-center justify-center bg-neutral-950">
        Waiting for interviewer to deploy exam question sheets...
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden h-full">
      <div className="flex border-b border-neutral-900 bg-neutral-900/10 px-3 py-2 space-x-2 overflow-x-auto shrink-0">
        {questionPaper.map((q, idx) => (
          <button
            key={q.id}
            onClick={() => handleSelectActivePaperQuestion(idx)}
            className={`px-3 py-1 text-xs rounded-md font-mono font-bold border transition ${
              activePaperIndex === idx ? 'bg-purple-950/40 border-purple-800/60 text-purple-400' : 'bg-transparent border-transparent text-neutral-500 hover:text-neutral-300'
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
    </div>
  );
}