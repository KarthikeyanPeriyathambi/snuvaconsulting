import fetch from 'node-fetch';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

// Helper for persistent logging
const debugLog = (msg) => {
  const logPath = path.join(process.cwd(), 'parser_debug.log');
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logPath, `[${timestamp}] ${msg}\n`);
};

/**
 * LLM Service for processing resume data and job matching
 * Supports multiple LLM providers (Gemini, Ollama)
 */
class LLMService {
  constructor() {
    // Provider configuration
    this.provider = process.env.LLM_PROVIDER || 'ollama'; // 'gemini' or 'ollama'

    if (this.provider === 'gemini') {
      this.apiKey = process.env.GEMINI_API_KEY;
      this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
    } else if (this.provider === 'ollama') {
      this.ollamaUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434/api/generate';
      this.ollamaModel = process.env.OLLAMA_MODEL || 'minimax-m2.5:cloud';
      this.ollamaApiKey = process.env.OLLAMA_API_KEY;
      // Determine if this is API-based or local
      this.isApiBased = this.ollamaApiKey && this.ollamaUrl.includes('api') && !this.ollamaUrl.includes('localhost');
    } else {
      throw new Error(`Unsupported LLM provider: ${this.provider}. Use 'gemini' or 'ollama'.`);
    }
  }

  /**
   * Parse resume text and extract structured information
   * @param {string} resumeText - The text content of the resume
   */
  async parseResume(resumeText) {
    const prompt = `
      You are a specialized Resume Data Extractor. 
      Analyze the text below and return a highly accurate JSON representation of the candidate's profile.
      
      RETURN ONLY THIS JSON FORMAT:
      {
        "name": "string",
        "email": "string",
        "phone": "string",
        "skills": ["string", "string"],
        "education": [{ "institution": "string", "degree": "string", "year": "string" }],
        "experience": [{ "company": "string", "position": "string", "duration": "string", "description": "string" }],
        "projects": [{ "title": "string", "description": "string" }]
      }

      RESUME TEXT:
      ${resumeText}
    `;

    try {
      console.log(`[${this.provider.toUpperCase()}] Sending resume parsing request...`);
      console.log(`[${this.provider.toUpperCase()}] Prompt length:`, prompt.length);
      const response = await this.sendRequest(prompt);
      console.log(`[${this.provider.toUpperCase()}] Received response, extracting JSON...`);
      return this.extractJsonFromResponse(response);
    } catch (error) {
      console.error(`[${this.provider.toUpperCase()}] Error parsing resume:`, error);
      // Return a structured empty object instead of throwing to allow fallback logic
      return {
        name: '',
        email: '',
        phone: '',
        skills: [],
        education: [],
        experience: [],
        projects: []
      };
    }
  }

  /**
   * Match resume against job description using LLM (Semantic / Related-Content Matching)
   * @param {Object} resume - The structured resume data
   * @param {Object} job - The job posting data
   */
  async matchResumeToJob(resume, job) {
    const prompt = `
You are a professional HR analyst and resume screener. Your task is to evaluate how well a candidate's resume matches a job posting based on SEMANTIC and CONCEPTUAL relevance.

MATCHING PRINCIPLES:
- DO NOT use exact keyword matching. Look for related concepts, adjacent skills, and industry relevance.
- Give credit for related skills (e.g., "Java" aligns with "Object-Oriented Programming" and "Kotlin").
- Focus on the content of experience, not just titles.
- If a candidate has the core skills needed to perform the role, they should be a "MATCH" or "PARTIAL", never a "NO_MATCH" unless the industry is completely different (e.g., Chef applying for Cloud Architect).

EXPERIENCE CALCULATION:
- Sum up the durations of all relevant work experience entries.
- Map job levels to suggested years:
    - Entry-level: 0-2 years
    - Mid-level: 3-6 years
    - Senior: 7-12 years 
    - Executive: 12+ years
- Be lenient if a candidate is slightly below or above these ranges.

=== JOB DETAILS ===
Job Title: ${job.title}
Experience Level: ${job.experienceLevel || 'Not specified'}
Required Skills: ${(job.requiredSkills || []).join(', ')}
Job Description: ${job.description}
Job Requirements: ${(job.jobRequirements || []).join(', ')}

=== CANDIDATE RESUME ===  
Name: ${resume.name || 'Candidate'}
Skills Listed: ${Array.isArray(resume.skills) ? resume.skills.join(', ') : (resume.skills || 'None')}
Work Experience: ${JSON.stringify(resume.experience || [])}
Education: ${JSON.stringify(resume.education || [])}
Projects: ${JSON.stringify(resume.projects || [])}

=== YOUR EVALUATION TASK ===
Respond ONLY with a valid JSON object:
{
  "overallScore": <number 0-100 reflecting total match quality>,
  "skillsScore": <number 0-100 reflecting skill alignment>,
  "experienceScore": <number 0-100 reflecting years and relevancy of work>,
  "educationScore": <number 0-100>,
  "projectsScore": <number 0-100>,
  "matchedSkills": ["skill1", "skill2"],
  "missingSkills": ["skill3", "skill4"],
  "feedback": "constructive advice",
  "reasoning": "A logical explanation of how you derived the score",
  "lowScoreReasons": ["Only list critical blockers here, otherwise keep empty"],
  "matchCategory": "MATCH" | "PARTIAL" | "NO_MATCH",
  "eligibility": "NOT_ELIGIBLE" | "OVER_QUALIFIED" | "UNDER_QUALIFIED" | "ELIGIBLE"
}

ELIGIBILITY LOGIC (for your internal reference):
- If candidate has NO core skills for role -> NO_MATCH / NOT_ELIGIBLE (REJECT)
- If candidate has significantly more experience than requested (>3 years over) -> OVER_QUALIFIED (REJECT as per user request)
- If candidate has less experience than requested (-1 to -2 years under) -> UNDER_QUALIFIED (DO NOT REJECT, mark for chatbot follow-up)
- Otherwise -> ELIGIBLE
`;

    try {
      console.log(`[${this.provider.toUpperCase()}] Sending resume-job matching request...`);
      const response = await this.sendRequest(prompt);
      return this.extractJsonFromResponse(response);
    } catch (error) {
      console.error(`[${this.provider.toUpperCase()}] Error matching resume to job:`, error);
      throw new Error(`Failed to evaluate resume match with ${this.provider}`);
    }
  }

  /**
   * Automatically improve a resume to better match a job description
   * @param {Object} resume - Current resume data
   * @param {Object} job - Target job data
   */
  async improveResume(resume, job) {
    const prompt = `
You are a professional Resume Optimizer. Your goal is to REWRITE and ENHANCE the candidate's resume to perfectly align with the target job while remaining truthful.

=== JOB DETAILS ===
Title: ${job.title}
Required Skills: ${(job.requiredSkills || []).join(', ')}
Description: ${job.description}

=== ORIGINAL RESUME ===
Skills: ${(resume.skills || []).join(', ')}
Experience: ${JSON.stringify(resume.experience)}
Projects: ${JSON.stringify(resume.projects)}

=== TASK ===
1. Enhance the Skills list: Include related skills from the job description that the candidate likely has based on their experience.
2. Rewrite Work Experience: Adjust descriptions to highlight responsibilities and achievements that match the job requirements. Use action verbs.
3. Optimize Projects: Ensure projects showcase relevant tech stack.

Respond ONLY with a JSON object containing the IMPROVED resume data:
{
  "skills": ["skill1", "skill2", ...],
  "experience": [ { "company": "...", "position": "...", "description": "REWRITTEN DESCRIPTION", "dates": "..." }, ... ],
  "projects": [ { "title": "...", "description": "REWRITTEN DESCRIPTION", "technologies": "..." }, ... ]
}
    `;

    try {
      const response = await this.sendRequest(prompt);
      return JSON.parse(this.cleanJSONResponse(response.candidates[0].content.parts[0].text));
    } catch (error) {
      console.error(`[${this.provider.toUpperCase()}] Error improving resume:`, error);
      throw new Error(`Failed to improve resume with ${this.provider}`);
    }
  }

  /**
   * Cleans a string response to extract only the JSON part
   */
  cleanJSONResponse(text) {
    if (!text) return '{}';
    
    // First, remove markdown code blocks (```json ... ``` or ``` ... ```)
    let cleaned = text.replace(/```(json)?\s*([\s\S]*?)\s*```/g, '$2').trim();

    // If it's still not plain JSON (contains preamble), find the first { and last }
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }

    // Basic syntax cleaning: ensure no trailing non-JSON characters
    cleaned = cleaned.replace(/[\n\r\t]/g, ' ').trim();
    
    return cleaned;
  }

  /**
   * Process candidate's response in their preferred language
   * @param {string} question - The question asked
   * @param {string} answer - The candidate's answer
   * @param {string} language - The preferred language code
   */
  async processCandidateResponse(question, answer, language = 'en') {
    const prompt = `
      The following is a response from a job candidate to a question.
      
      Question: ${question}
      Answer: ${answer}
      
      Analyze this response and provide feedback. The candidate's preferred language is ${language}, so please provide your response in that language.
      
      Your analysis should include:
      1. How well the answer addresses the question
      2. Any notable strengths or weaknesses in the response
      3. Suggestions for improvement (if any)
      
      Respond in the candidate's preferred language (${language}).
    `;

    try {
      console.log(`[${this.provider.toUpperCase()}] Sending candidate response processing request...`);
      const response = await this.sendRequest(prompt);
      console.log(`[${this.provider.toUpperCase()}] Received response for candidate analysis...`);
      return response.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error(`[${this.provider.toUpperCase()}] Error processing candidate response:`, error);
      throw new Error(`Failed to process candidate response with ${this.provider}`);
    }
  }

  /**
   * Send request to configured LLM API
   * @param {string} prompt - The prompt to send to the LLM
   */
  async sendRequest(prompt) {
    if (this.provider === 'gemini') {
      return this.sendGeminiRequest(prompt);
    } else if (this.provider === 'ollama') {
      return this.sendOllamaRequest(prompt);
    }
  }

  /**
   * Send request to Gemini API
   * @param {string} prompt - The prompt to send to Gemini
   */
  async sendGeminiRequest(prompt) {
    const url = `${this.apiUrl}?key=${this.apiKey}`;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048
      }
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        let errorBody = 'Unknown Error';
        try { errorBody = await response.text(); } catch (e) { }
        throw new Error(`Gemini API request failed with status ${response.status}: ${errorBody}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw error;
    }
  }

  /**
   * Send request to Ollama (local or API-based)
   * @param {string} prompt - The prompt to send to Ollama
   */
  async sendOllamaRequest(prompt) {
    console.log(`[OLLAMA] Using ${this.isApiBased ? 'API-based' : 'local'} Ollama with model: ${this.ollamaModel}`);

    if (this.isApiBased) {
      return this.sendOllamaApiRequest(prompt);
    } else {
      return this.sendOllamaLocalRequest(prompt);
    }
  }

  /**
   * Send request to local Ollama instance
   * @param {string} prompt - The prompt to send to local Ollama
   */
  async sendOllamaLocalRequest(prompt) {
    try {
      console.log(`[Ollama] Sending local request to ${this.ollamaUrl}`);
      const response = await fetch(this.ollamaUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.ollamaModel,
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.1,
            num_ctx: 4096, // Ensure context is large enough for resumes
          }
        }),
      });

      if (!response.ok) {
        let errorBody = 'Unknown Error';
        try { errorBody = await response.text(); } catch (e) { }
        throw new Error(`Local Ollama request failed with status ${response.status}: ${errorBody}`);
      }

      const result = await response.json();
      const text = result.response || '';

      debugLog(`[Ollama RAW] First 200 chars: ${text.substring(0, 200)}`);
      console.log(text.substring(0, 500)); 
      if (text.length > 500) console.log('... (truncated)');
      console.log('[Ollama] --- RAW LLM RESPONSE END ---');

      // Return consistent format
      return {
        candidates: [{ content: { parts: [{ text }] } }]
      };
    } catch (error) {
      console.error('[Ollama] ❌ Local Ollama Error:', error.message);
      throw error;
    }
  }

  /**
   * Send request to API-based Ollama service
   * @param {string} prompt - The prompt to send to API-based Ollama
   */
  async sendOllamaApiRequest(prompt) {
    // API-based Ollama typically uses chat completion format
    const requestBody = {
      model: this.ollamaModel,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2,
      top_p: 0.8,
      stream: false
    };

    try {
      console.log(`[Ollama API] Sending request to ${this.ollamaUrl}`);
      const headers = {
        'Content-Type': 'application/json'
      };

      // Add API key if provided
      if (this.ollamaApiKey) {
        headers['Authorization'] = `Bearer ${this.ollamaApiKey}`;
      }

      const response = await fetch(this.ollamaUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        let errorBody = 'Unknown Error';
        try { errorBody = await response.text(); } catch (e) { }
        throw new Error(`API-based Ollama request failed with status ${response.status}: ${errorBody}`);
      }

      const result = await response.json();
      
      let text = '';
      if (result.choices && result.choices[0] && result.choices[0].message) {
        text = result.choices[0].message.content;
      } else if (result.response) {
        text = result.response;
      } else {
        text = JSON.stringify(result);
      }

      debugLog(`[Ollama API RAW] First 200 chars: ${text.substring(0, 200)}`);
      console.log(text.substring(0, 500));
      console.log('[Ollama API] --- RAW LLM RESPONSE END ---');

      return {
        candidates: [{ content: { parts: [{ text }] } }]
      };
    } catch (error) {
      console.error('[Ollama API] ❌ API Request Error:', error.message);
      throw error;
    }
  }

  /**
   * Extract JSON from the LLM response
   * @param {Object} response - The response from the LLM
   */
  extractJsonFromResponse(response) {
    let text = '';
    try {
      text = response.candidates[0].content.parts[0].text;
      console.log(`[${this.provider.toUpperCase()}] Raw response text:`, text.substring(0, 300));

      // Strategy 1: Extract from ```json ... ``` code fence
      const fencedJsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
      if (fencedJsonMatch) {
        return JSON.parse(fencedJsonMatch[1]);
      }

      // Strategy 2: Extract from ``` ... ``` code fence (no language)
      const fencedMatch = text.match(/```\s*([\s\S]*?)\s*```/);
      if (fencedMatch) {
        return JSON.parse(fencedMatch[1]);
      }

      // Strategy 3: Find the outermost { ... } block
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        const jsonString = text.substring(firstBrace, lastBrace + 1);
        return JSON.parse(jsonString);
      }

      // Strategy 4: Try the entire text as JSON
      return JSON.parse(text);
    } catch (error) {
      console.error(`[${this.provider.toUpperCase()}] Error extracting JSON. Raw text was:`, text);
      console.error(`[${this.provider.toUpperCase()}] Parse error:`, error.message);
      throw new Error(`Failed to extract structured data from ${this.provider} response`);
    }
  }
}

export default new LLMService();