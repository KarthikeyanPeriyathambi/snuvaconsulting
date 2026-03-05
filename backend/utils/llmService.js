import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

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
      Parse the following resume and extract the structured information:
      - Full Name
      - Email
      - Phone Number (if available)
      - Skills (as a list)
      - Education (institution, degree, field, dates)
      - Experience (company, position, dates, description)
      - Projects (title, description, technologies used)
      
      Format the output as a JSON object.
      
      Resume Text:
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
      throw new Error(`Failed to parse resume data with ${this.provider}: ${error.message}`);
    }
  }

  /**
   * Match resume against job description using LLM
   * @param {Object} resume - The structured resume data
   * @param {Object} job - The job posting data
   */
  async matchResumeToJob(resume, job) {
    const prompt = `
      Evaluate how well the candidate's resume matches the job requirements.
      
      Job Title: ${job.title}
      Job Description: ${job.description}
      Required Skills: ${job.requiredSkills.join(', ')}
      Job Requirements: ${job.jobRequirements.join(', ')}
      Experience Level: ${job.experienceLevel}
      
      Candidate's Resume:
      Name: ${resume.name}
      Skills: ${resume.skills.join(', ')}
      Experience: ${JSON.stringify(resume.experience)}
      Education: ${JSON.stringify(resume.education)}
      Projects: ${JSON.stringify(resume.projects)}
      
      Provide a detailed evaluation with the following:
      1. Overall match score (0-100)
      2. Skills match score (0-100)
      3. Experience match score (0-100) 
      4. Education match score (0-100)
      5. Detailed reasoning for your evaluation
      
      Format the output as a JSON object with fields: overallScore, skillsScore, experienceScore, educationScore, reasoning.
    `;

    try {
      console.log(`[${this.provider.toUpperCase()}] Sending resume-job matching request...`);
      const response = await this.sendRequest(prompt);
      console.log(`[${this.provider.toUpperCase()}] Received matching response, extracting JSON...`);
      return this.extractJsonFromResponse(response);
    } catch (error) {
      console.error(`[${this.provider.toUpperCase()}] Error matching resume to job:`, error);
      throw new Error(`Failed to evaluate resume match with ${this.provider}`);
    }
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
    const requestBody = {
      model: this.ollamaModel,
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.2,
        top_p: 0.8,
        top_k: 40
      }
    };

    try {
      const response = await fetch(this.ollamaUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        let errorBody = 'Unknown Error';
        try { errorBody = await response.text(); } catch (e) { }
        throw new Error(`Local Ollama request failed with status ${response.status}: ${errorBody}`);
      }

      const result = await response.json();

      // Format Ollama response to match Gemini format for compatibility
      return {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: result.response
                }
              ]
            }
          }
        ]
      };
    } catch (error) {
      console.error('Error calling local Ollama:', error);
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

      // Format API response to match Gemini format for compatibility
      let responseText = '';
      if (result.choices && result.choices[0] && result.choices[0].message) {
        responseText = result.choices[0].message.content;
      } else if (result.response) {
        responseText = result.response;
      } else {
        responseText = JSON.stringify(result);
      }

      return {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: responseText
                }
              ]
            }
          }
        ]
      };
    } catch (error) {
      console.error('Error calling API-based Ollama:', error);
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