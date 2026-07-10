module.exports = {
  MODEL_NAME: 'gemini-2.5-flash',
  PROMPT_VERSION: 'v2.1.0-contextual-code-eval',
  
  buildEvaluationPrompt({ problemDescription, language, code, interviewTranscript }) {
    return `
      You are an elite principal software engineer conducting a formal technical interview assessment.
      Analyze the candidate's performance using the complete problem, code, and communication context below.

      [CRITICAL TASK CONTEXT]
      - Problem Statement: ${problemDescription}
      - Target Language: ${language}

      [CANDIDATE WORKSPACE DELIVERABLE]
      \`\`\`${language}
      ${code}
      \`\`\`

      [LIVE COMMUNICATION TRANSCRIPT]
      ${interviewTranscript}

      [ASSESSMENT CRITERIA]
      1. Structural & Functional Correctness: Does the code solve the problem statement? Are there edge-case failures, off-by-one errors, or memory leaks?
      2. Algorithmic Efficiency: Analyze the exact Big-O Time and Space complexity of the submitted code block.
      3. Communication & Approach: How well did the candidate articulate their thought process before writing the implementation?

      You MUST respond ONLY with a valid JSON object matching this exact schema:
      {
        "overallScore": 85, // Integer between 0 and 100 based strictly on correctness and efficiency
        "codeEfficiency": "A precise Big-O analysis of the code provided (e.g., O(N) time, O(1) space).",
        "communicationRating": "A concise summary of how well they verified assumptions over chat.",
        "constructiveFeedback": "Direct, actionable code refactoring suggestions addressing bugs or style flaws.",
        "scorecardText": "A professional Markdown text layout summarizing the final report for user display rendering."
      }
    `;
  }
};