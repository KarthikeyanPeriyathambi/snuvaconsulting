import llmService from './llmService.js';
import mammoth from 'mammoth';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper for persistent logging
const debugLog = (msg) => {
  const logPath = path.join(process.cwd(), 'parser_debug.log');
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logPath, `[${timestamp}] ${msg}\n`);
};

/**
 * Resume Parser - handles PDF, DOCX, and TXT resume parsing with fallbacks
 * 
 * Installation: 
 *   npm install pdf-parse pdf-lib mammoth
 * 
 * The pdf-parse library requires CommonJS require() syntax due to lack of ES module exports.
 * Multiple fallback methods ensure robust text extraction from various file types.
 */

// We'll dynamically import both libraries when needed
let pdfParseModule = null;
let pdfLibModule = null;

// Load pdf-parse if available
async function loadPdfParse() {
  if (pdfParseModule !== null) {
    return pdfParseModule;
  }

  try {
    // Try different ways to load pdf-parse in ES modules
    try {
      // First try dynamic import of the main module
      pdfParseModule = await import('pdf-parse');
    } catch (e) {
      // If that fails, try with require (in case we're in a mixed environment)
      const { createRequire } = await import('module');
      const require = createRequire(import.meta.url);
      pdfParseModule = require('pdf-parse');
    }
    return pdfParseModule;
  } catch (e) {
    console.error('Failed to load pdf-parse:', e.message);
    throw e;
  }
}

// Load pdf-lib if available
async function loadPdfLib() {
  if (pdfLibModule !== null) {
    return pdfLibModule;
  }

  try {
    const module = await import('pdf-lib');
    pdfLibModule = module;
    return module;
  } catch (e) {
    console.warn('pdf-lib not available, falling back to pdf-parse only');
    return null;
  }
}

// Fallback text extraction using built-in buffer methods
function extractTextFromBuffer(buffer) {
  try {
    // Try UTF-8 encoding first
    let text = buffer.toString('utf8');

    // If the text looks like binary data, try other encodings
    if (text.includes('%PDF-') || text.length < 50) {
      text = buffer.toString('binary');
    }

    // Clean up the text
    return text
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  } catch (error) {
    console.error('[Parser] Buffer conversion error:', error.message);
    return '';
  }
}

/**
 * Resume Parser - uses proper PDF parsing library for better text extraction
 */
class ResumeParser {

  /**
   * Extract readable text from a PDF buffer
   * @param {Buffer} buffer - Raw file buffer
   * @param {string} mimeType - The MIME type of the file
   */
  async extractReadableText(buffer, mimeType) {
    try {
      console.log('[Parser] MIME type received:', mimeType);

      // Handle different file types
      if (mimeType === 'application/pdf') {
        console.log('[Parser] Processing PDF file with pdf-parse');

        try {
          // Load and use pdf-parse for PDF files
          const pdfParseLib = await loadPdfParse();
          // Handle both default export and direct function export
          const parseFunction = pdfParseLib.default || pdfParseLib;
          const pdfData = await parseFunction(buffer);
          const extractedText = pdfData.text
            .replace(/\s+/g, ' ')
            .trim();

          debugLog(`[PDF] Character Count: ${extractedText.length}`);
          debugLog(`[PDF] Text Sample: ${extractedText.substring(0, 100)}`);

          if (extractedText.length < 100) {
            debugLog('[PDF] ⚠️ Warning: Very little text extracted.');
          }

          return { text: extractedText, source: 'pdf-parse' };
        } catch (pdfError) {
          console.error('[Parser] pdf-parse error:', pdfError.message);

          // First fallback: log that pdf-lib isn't actually a text extractor
          console.warn('[Parser] pdf-lib is not a native text extractor, skipping fallback.');


          // Second fallback: try to extract text using buffer methods
          console.log('[Parser] Attempting buffer-based text extraction...');
          const text = extractTextFromBuffer(buffer);

          if (text.length > 50) {
            console.log('[Parser] Buffer-based extraction successful, extracted text length:', text.length);
            return { text, source: 'buffer-extraction' };
          }

          // Final fallback: return empty string but log the error
          console.error('[Parser] All PDF parsing methods failed, returning empty string');
          return { text: '', source: 'failed' };
        }
      }
      else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        console.log('[Parser] Processing DOCX file with mammoth');

        try {
          const result = await mammoth.extractRawText({
            buffer: buffer
          });

          const extractedText = result.value
            .replace(/\s+/g, ' ')
            .trim();

          console.log('[Parser] DOCX parsed successfully, extracted text length:', extractedText.length);
          return { text: extractedText, source: 'mammoth' };
        } catch (docxError) {
          console.error('[Parser] DOCX parsing error:', docxError.message);

          // Fallback for DOCX: try buffer method
          const text = extractTextFromBuffer(buffer);
          if (text.length > 50) {
            console.log('[Parser] DOCX buffer fallback successful, extracted text length:', text.length);
            return { text, source: 'docx-buffer-fallback' };
          }

          return { text: '', source: 'failed' };
        }
      }
      else if (mimeType === 'text/plain') {
        console.log('[Parser] Processing text file');
        return { 
          text: buffer.toString('utf-8').replace(/\s+/g, ' ').trim(),
          source: 'text-plain'
        };
      }
      else {
        console.log('[Parser] Unsupported file type:', mimeType);

        // Try to extract text regardless of MIME type as a last resort
        const text = extractTextFromBuffer(buffer);
        if (text.length > 0) {
          console.log('[Parser] Extracted text from unsupported type, length:', text.length);
          return { text, source: 'unsupported-type-fallback' };
        }

        return { text: '', source: 'none' };
      }
    } catch (err) {
      console.error('[Parser] Text extraction failed:', err.message);
      console.error('[Parser] Error details:', err);
      return '';
    }
  }

  /**
   * Clean and preprocess extracted text
   */
  cleanText(text) {
    if (!text) return '';

    return text
      // Remove extreme repetition (common in bad extractions)
      .replace(/(\W)\1{2,}/g, '$1$1')
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove null characters and control characters
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .trim();

  }

  /**
   * Normalize the parsed data from LLM to match our DB schema keys
   */
  normalizeFields(raw) {
    const normalized = {
      name: raw.name || raw.full_name || raw.fullName || raw['Full Name'] || '',
      email: raw.email || raw.email_address || raw.emailAddress || raw['Email'] || '',
      phone: raw.phone || raw.phone_number || raw.phoneNumber || raw['Phone Number'] || '',
      skills: [],
      education: [],
      experience: [],
      projects: []
    };

    // Normalize skills (handle arrays and strings)
    if (raw.skills || raw.Skills || raw.skill) {
      const skillsInput = raw.skills || raw.Skills || raw.skill || [];
      if (Array.isArray(skillsInput)) {
        normalized.skills = skillsInput;
      } else if (typeof skillsInput === 'string') {
        normalized.skills = skillsInput.split(/[,;|]/).map(s => s.trim()).filter(Boolean);
      }
    }

    // Normalize education
    if (raw.education || raw.Education) {
      const eduList = raw.education || raw.Education || [];
      normalized.education = eduList.map(e => ({
        institution: e.institution || e.university || e.school || e.college || '',
        degree: e.degree || '',
        field: e.field || e.fieldOfStudy || e.major || '',
        startDate: e.startDate || e.start_date || e.start || null,
        endDate: e.endDate || e.end_date || e.end || null,
        gpa: String(e.gpa || e.GPA || ''),
      }));
    }

    // Normalize experience
    if (raw.experience || raw.Experience) {
      const expList = raw.experience || raw.Experience || [];
      normalized.experience = expList.map(e => ({
        company: e.company || e.employer || e.organization || '',
        position: e.position || e.title || e.role || '',
        startDate: e.startDate || e.start_date || e.start || null,
        endDate: e.endDate || e.end_date || e.end || null,
        description: Array.isArray(e.description) ? e.description.join(' ') : (e.description || ''),
      }));
    }

    // Normalize projects
    if (raw.projects || raw.Projects) {
      const projList = raw.projects || raw.Projects || [];
      normalized.projects = projList.map(p => ({
        title: p.title || p.name || p.projectName || '',
        description: Array.isArray(p.description) ? p.description.join(' ') : (p.description || ''),
        technologies: p.technologies || p.techStack || p.tech || p.skills || [],
        link: p.link || p.url || p.github || '',
      }));
    }

    return normalized;
  }

  /**
   * Validate that we have meaningful extracted text
   */
  validateExtractedText(text) {
    if (!text || text.trim().length < 20) {
      return {
        valid: false,
        reason: 'Text too short or empty'
      };
    }

    // Check if it looks like PDF binary (contains PDF header)
    if (text.includes('%PDF-') || text.includes('endobj') || text.includes('/Length')) {
      return {
        valid: false,
        reason: 'Text appears to be PDF binary, not extracted content'
      };
    }

    // Check if it has reasonable amount of readable text
    const wordCount = text.split(/\s+/).length;
    if (wordCount < 10) {
      return {
        valid: false,
        reason: 'Insufficient words extracted'
      };
    }

    return { valid: true };
  }

  /**
   * Process a resume buffer and extract structured data
   * @param {Buffer} fileBuffer - The file buffer from multer
   * @param {string} resumeUrl - The Cloudinary URL after upload
   * @param {string} mimeType - The MIME type of the file
   */
  async process(fileBuffer, resumeUrl, mimeType) {
    console.log('[Parser] === STARTING RESUME PARSING PROCESS ===');

    try {
      console.log('[Parser] Step 1: Extracting text from buffer');
      console.log('[Parser] Buffer size:', fileBuffer.length, 'bytes');
      console.log('[Parser] MIME type:', mimeType);

      if (!mimeType) {
        console.error('[Parser] ❌ MIME type is undefined');
        throw new Error('MIME type is required for parsing');
      }

      const { text: rawText, source } = await this.extractReadableText(fileBuffer, mimeType);
      debugLog(`[Process] Extracted from ${source}. Length: ${rawText?.length || 0}`);
      if (rawText) debugLog(`[Process] Sample: ${rawText.substring(0, 100)}`);

      // Validate the extracted text
      const validation = this.validateExtractedText(rawText);
      if (!validation.valid) {
        console.warn('[Resume Parser] ⚠️ Validation failed:', validation.reason);
        // If validation fails but we have some text, use it anyway
        if (rawText && rawText.length > 50) {
          console.log('[Parser] Using extracted text despite validation warning');
        } else {
          // Return empty parsed data if no valid text
          console.log('[Parser] No valid text extracted, returning empty data');
          return {
            name: '',
            email: '',
            phone: '',
            skills: [],
            education: [],
            experience: [],
            projects: [],
            resumeUrl,
          };
        }
      }

      const resumeText = this.cleanText(rawText);

      console.log('[Parser] Step 1 ✅ Text extracted successfully');
      console.log('[Parser] Extracted text length:', resumeText.length, 'characters');
      console.log('[Parser] Text preview (first 500 chars):', resumeText.substring(0, 500));

      console.log('[Parser] Step 2: Sending to LLM for parsing');
      const rawParsed = await llmService.parseResume(resumeText);
      console.log('[Parser] Step 2 ✅ LLM parsing completed');
      console.log('[Parser] Raw parsed result:', JSON.stringify(rawParsed, null, 2));

      console.log('[Parser] Step 3: Normalizing fields');
      const parsedResume = this.normalizeFields(rawParsed);
      console.log('[Parser] Step 3 ✅ Fields normalized');
      console.log('[Parser] Final parsed data:', {
        name: parsedResume.name,
        email: parsedResume.email,
        phone: parsedResume.phone,
        skills: parsedResume.skills?.length || 0,
        education: parsedResume.education?.length || 0,
        experience: parsedResume.experience?.length || 0,
        projects: parsedResume.projects?.length || 0
      });

      console.log('[Parser] === RESUME PARSING PROCESS COMPLETED ===');

      return {
        ...parsedResume,
        resumeUrl,
      };

    } catch (error) {
      console.error('[Parser] ❌ Error processing resume:', error.message);
      console.error('[Parser] Error stack:', error.stack);

      // Return a minimal valid response instead of throwing
      return {
        name: '',
        email: '',
        phone: '',
        skills: [],
        education: [],
        experience: [],
        projects: [],
        resumeUrl,
        error: error.message
      };
    }
  }
}

export default new ResumeParser();