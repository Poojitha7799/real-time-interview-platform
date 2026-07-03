import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('https://alfa-leetcode-api.onrender.com/problems?limit=50');
    const data = await res.json();
    
    const reshapedProblems = data.problemsetQuestions.map((prob) => {
      const id = prob.questionFrontendId;
      return {
        id: `prob-${id}`,
        title: prob.questionTitle,
        matrixTitle: `${prob.difficulty} Technical Target Matrix`,
        description: `Implement a structural resolution matrix to solve: ${prob.questionTitle}. Review the standard logic configurations to ensure performance limits map perfectly.`,
        constraints: `• Difficulty Vector: ${prob.difficulty}\n• System ID: ${id}\n• Operational Bounds: Maximize runtime efficiency.`,
        testCases: [
          { id: 1, input: 'Sample dataset clusters', expected: 'Auto-computed parameters', description: 'Standard input array config' }
        ],
        templates: {
          python: 'def solution():\n    pass',
          java: 'public class Solution {\n    public void solve() {\n    }\n}',
          cpp: '#include <iostream>\nusing namespace std;\nclass Solution {\n};',
          c: '#include <stdio.h>\nvoid solve() {\n}'
        }
      };
    });

    return NextResponse.json(reshapedProblems);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to synchronize public question records.' }, { status: 500 });
  }
}