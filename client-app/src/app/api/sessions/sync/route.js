import { NextResponse } from 'next/server';

global.roomStates = global.roomStates || {};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get('roomId');
  
  if (!roomId) return NextResponse.json({ error: 'Room ID required' }, { status: 400 });
  
  if (!global.roomStates[roomId]) {
    global.roomStates[roomId] = {
      questionPaper: [],
      activePaperIndex: 0,
      editorCode: '',
      selectedLanguage: 'java',
      consoleOutput: 'System: Environment initialized. Ready for script compilation.',
      interviewerOffer: null,
      candidateAnswer: null,
      interviewerCandidates: [],
      candidateCandidates: [],
      securityAlerts: [],
      replayEvents: []
    };
  }
  
  return NextResponse.json(global.roomStates[roomId]);
}

export async function POST(request) {
  const body = await request.json();
  const { roomId, iceCandidate, securityAlert, replayEvent, ...updates } = body;
  
  if (!roomId) return NextResponse.json({ error: 'Room ID required' }, { status: 400 });
  
  if (!global.roomStates[roomId]) {
    global.roomStates[roomId] = {
      questionPaper: [],
      activePaperIndex: 0,
      editorCode: '',
      selectedLanguage: 'java',
      consoleOutput: 'System: Environment initialized. Ready for script compilation.',
      interviewerOffer: null,
      candidateAnswer: null,
      interviewerCandidates: [],
      candidateCandidates: [],
      securityAlerts: [],
      replayEvents: []
    };
  }

  if (iceCandidate) {
    if (iceCandidate.sender === 'interviewer') {
      global.roomStates[roomId].interviewerCandidates.push(iceCandidate.candidate);
    } else if (iceCandidate.sender === 'candidate') {
      global.roomStates[roomId].candidateCandidates.push(iceCandidate.candidate);
    }
  }

  if (securityAlert) {
    global.roomStates[roomId].securityAlerts.unshift(securityAlert);
  }

  if (replayEvent) {
    global.roomStates[roomId].replayEvents.push(replayEvent);
  }

  global.roomStates[roomId] = {
    ...global.roomStates[roomId],
    ...updates
  };
  
  return NextResponse.json({ success: true });
}