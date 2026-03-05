import asyncHandler from 'express-async-handler';
import Resume from '../models/resumeModel.js';
import resumeParser from '../utils/resumeParser.js';
import llmService from '../utils/llmService.js';
import { cloudinary } from '../config/cloudinaryConfig.js';
import Job from '../models/jobModel.js';

// Helper: compute a basic resume completeness score (0-100)
function computeResumeScore(parsedResume) {
  let score = 0;

  // Name & contact info (up to 20 pts)
  if (parsedResume.name && parsedResume.name !== 'Unknown') score += 10;
  if (parsedResume.email && parsedResume.email !== 'unknown@example.com') score += 5;
  if (parsedResume.phone) score += 5;

  // Skills (up to 25 pts)
  const skillCount = parsedResume.skills?.length || 0;
  if (skillCount >= 10) score += 25;
  else if (skillCount >= 5) score += 15;
  else if (skillCount >= 1) score += 8;

  // Education (up to 20 pts)
  const eduCount = parsedResume.education?.length || 0;
  if (eduCount >= 2) score += 20;
  else if (eduCount === 1) score += 12;

  // Experience (up to 25 pts)
  const expCount = parsedResume.experience?.length || 0;
  if (expCount >= 3) score += 25;
  else if (expCount === 2) score += 18;
  else if (expCount === 1) score += 10;

  // Projects (up to 10 pts)
  const projCount = parsedResume.projects?.length || 0;
  if (projCount >= 2) score += 10;
  else if (projCount === 1) score += 5;

  return Math.min(score, 100);
}

// @desc    Upload and parse resume
// @route   POST /api/resumes
// @access  Public (with optional auth)
const uploadResume = asyncHandler(async (req, res) => {
  console.log('[Resume Controller] === STARTING RESUME UPLOAD PROCESS ===');
  console.log('[Resume Controller] Authenticated user:', req.user ? req.user._id : 'Anonymous');

  if (!req.file) {
    console.log('[Resume Controller] ❌ No file uploaded');
    res.status(400);
    throw new Error('Please upload a resume file');
  }

  try {
    console.log('[Resume Controller] ✅ File received:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });

    // Read appliedJobId and appliedJobTitle from request body (sent by frontend)
    const appliedJobId = req.body.appliedJobId || null;
    const appliedJobTitle = req.body.appliedJobTitle || '';

    console.log('[Resume Controller] Applied Job ID:', appliedJobId);
    console.log('[Resume Controller] Applied Job Title:', appliedJobTitle);

    const fileBuffer = req.file.buffer;
    if (!fileBuffer) throw new Error('File buffer is undefined');

    // ─── 1. Upload to Cloudinary ──────────────────────────────────────────────
    console.log('[Resume Controller] ☁️  Uploading to Cloudinary...');
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw',
          folder: 'resumes',
          public_id: `${Date.now()}_${req.file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_')}`,
        },
        (error, result) => {
          if (error) {
            console.log('[Resume Controller] ❌ Cloudinary upload failed:', error.message);
            reject(error);
          } else {
            console.log('[Resume Controller] ✅ Cloudinary upload successful:', result.secure_url);
            resolve(result);
          }
        }
      );
      stream.end(fileBuffer);
    });

    const resumeUrl = uploadResult.secure_url;

    // ─── 2. Parse the Resume with LLM ─────────────────────────────────────────
    console.log('[Resume Controller] 📤 Parsing resume with LLM...');
    let parsedResume;
    try {
      parsedResume = await resumeParser.process(fileBuffer, resumeUrl, req.file.mimetype);
      console.log('[Resume Controller] ✅ Parse result:', {
        name: parsedResume.name,
        email: parsedResume.email,
        phone: parsedResume.phone,
        skills: parsedResume.skills?.length,
        education: parsedResume.education?.length,
        experience: parsedResume.experience?.length,
        projects: parsedResume.projects?.length,
      });
    } catch (parseError) {
      console.warn('[Resume Controller] ⚠️ LLM parsing failed, using fallback:', parseError.message);
      parsedResume = {
        name: '',
        email: '',
        phone: '',
        skills: [],
        education: [],
        experience: [],
        projects: [],
      };
    }

    // ─── 3. Fallback: use logged-in user data if LLM didn't extract info ──────
    if (req.user) {
      if (!parsedResume.name || parsedResume.name === 'Unknown') {
        parsedResume.name = req.user.name || 'Unknown';
      }
      if (!parsedResume.email || parsedResume.email === 'unknown@example.com') {
        parsedResume.email = req.user.email || 'unknown@example.com';
      }
    }

    // ─── 4. Compute Resume Score ───────────────────────────────────────────────
    const resumeScore = computeResumeScore(parsedResume);
    console.log('[Resume Controller] 📊 Resume score:', resumeScore);

    // ─── 5. Save to Database ──────────────────────────────────────────────────
    console.log('[Resume Controller] 🗄️  Saving to database...');
    const resumeData = {
      user: req.user ? req.user._id : null,
      name: parsedResume.name || 'Unknown',
      email: parsedResume.email || 'unknown@example.com',
      phone: parsedResume.phone || '',
      resumeUrl,
      skills: parsedResume.skills || [],
      education: parsedResume.education || [],
      experience: parsedResume.experience || [],
      projects: parsedResume.projects || [],
      resumeScore,
      appliedJobId: appliedJobId || null,
      appliedJobTitle: appliedJobTitle || '',
    };

    const resume = await Resume.create(resumeData);
    console.log('[Resume Controller] ✅ Resume saved with ID:', resume._id);

    // ─── 6. Respond to Client ─────────────────────────────────────────────────
    res.status(201).json({
      _id: resume._id,
      user: resume.user,
      name: resume.name,
      email: resume.email,
      phone: resume.phone,
      skills: resume.skills,
      education: resume.education,
      experience: resume.experience,
      projects: resume.projects,
      resumeUrl: resume.resumeUrl,
      resumeScore: resume.resumeScore,
      appliedJobId: resume.appliedJobId,
      appliedJobTitle: resume.appliedJobTitle,
    });

    console.log('[Resume Controller] === RESUME UPLOAD PROCESS COMPLETED ===');
  } catch (error) {
    console.error('[Resume Controller] ❌ Resume upload error:', error.message);
    res.status(500);
    throw new Error(`Resume processing failed: ${error.message}`);
  }
});

// @desc    Add chatbot response to resume
// @route   POST /api/resumes/:id/chatbot-response
// @access  Public
const addChatbotResponse = asyncHandler(async (req, res) => {
  const { question, answer, language } = req.body;

  if (!question || !answer) {
    res.status(400);
    throw new Error('Please provide both question and answer');
  }

  const resume = await Resume.findById(req.params.id);

  if (!resume) {
    res.status(404);
    throw new Error('Resume not found');
  }

  try {
    resume.chatbotResponses.push({
      question,
      answer,
      language: language || 'en',
    });

    if (language) {
      resume.preferredLanguage = language;
    }

    await resume.save();

    res.status(200).json({
      message: 'Response added successfully',
      resumeId: resume._id,
    });
  } catch (error) {
    console.error('Error adding chatbot response:', error);
    res.status(500);
    throw new Error('Failed to process response');
  }
});

// @desc    Get resume by ID
// @route   GET /api/resumes/:id
// @access  Private
const getResumeById = asyncHandler(async (req, res) => {
  const resume = await Resume.findById(req.params.id);

  if (resume) {
    res.json(resume);
  } else {
    res.status(404);
    throw new Error('Resume not found');
  }
});

// @desc    Get all resumes for a user
// @route   GET /api/resumes/user
// @access  Private
const getUserResumes = asyncHandler(async (req, res) => {
  const resumes = await Resume.find({ user: req.user._id });
  res.json(resumes);
});

// @desc    Serve resume file
// @route   GET /api/resumes/:id/file
// @access  Private
const serveResumeFile = asyncHandler(async (req, res) => {
  const resume = await Resume.findById(req.params.id);

  if (!resume) {
    res.status(404);
    throw new Error('Resume not found');
  }

  // Redirect to the Cloudinary URL so the browser can view/download it
  res.redirect(resume.resumeUrl);
});

export { uploadResume, addChatbotResponse, getResumeById, getUserResumes, serveResumeFile };