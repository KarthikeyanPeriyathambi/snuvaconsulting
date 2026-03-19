import asyncHandler from 'express-async-handler';
import { Job, Resume, JobSelection, RequisitionDetails, Skill, SkillQuestion, Compliance } from '../models/index.js';
import resumeParser from '../utils/resumeParser.js';
import llmService from '../utils/llmService.js';
import { cloudinary } from '../config/cloudinaryConfig.js';

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
  console.log('[Resume Controller] Authenticated user:', req.user ? req.user.id : 'Anonymous');

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

    const appliedJobId = req.body.appliedJobId;
    const appliedJobTitle = req.body.appliedJobTitle || '';

    console.log('[Resume Controller] Received appliedJobId:', appliedJobId, 'Type:', typeof appliedJobId);
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
      
      // Check if we got any real data back
      const hasContent = (parsedResume.skills?.length > 0) || 
                         (parsedResume.experience?.length > 0) || 
                         (parsedResume.name && parsedResume.name !== 'Unknown');
      
      if (!hasContent) {
        console.warn('[Resume Controller] ⚠️ Parsing resulted in empty data');
        // If it's empty, we might want to try harder or at least log it
      } else {
        console.log('[Resume Controller] ✅ Parse result:', {
          name: parsedResume.name,
          skills: parsedResume.skills?.length,
          experience: parsedResume.experience?.length,
        });
      }
    } catch (parseError) {
      console.error('[Resume Controller] ❌ LLM parsing failed:', parseError.message);
      parsedResume = {
        name: '', email: '', phone: '',
        skills: [], education: [], experience: [], projects: [],
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

    // ─── 4. Compute Resume Completeness Score ────────────────────────────────
    const resumeScore = computeResumeScore(parsedResume);
    console.log('[Resume Controller] 📊 Resume completeness score:', resumeScore);

    // ─── 5. Handle AI Job Match Scoring (if applying for a job) ───────────────
    let matchScore = null;
    let matchFeedback = '';
    let matchedSkills = [];
    let missingSkills = [];
    let skillsScore = null;
    let experienceScore = null;
    let educationScore = null;
    let projectsScore = null;
    let eligibility = 'ELIGIBLE';
    let matchCategory = 'MATCH';
    let lowScoreReasons = [];

    if (appliedJobId) {
      console.log('[Resume Controller] 🔍 Matching resume against job:', appliedJobId);
      let targetJob = null;

      if (appliedJobId.startsWith('req_')) {
        const actId = appliedJobId.replace('req_', '');
        const jobSelection = await JobSelection.findByPk(actId, {
          include: [
            { model: RequisitionDetails, as: 'details' },
            { model: Skill, as: 'skills' },
            { model: SkillQuestion, as: 'questions' }
          ]
        });
        if (jobSelection) {
          const details = jobSelection.details || {};
          targetJob = {
            title: details.title_role || jobSelection.requisition_class,
            description: details.complete_description || details.short_description || '',
            requiredSkills: jobSelection.skills ? jobSelection.skills.map(s => s.skill) : [],
            jobRequirements: [],
            experienceLevel: 'Mid-level'
          };
        }
      } else {
        targetJob = await Job.findByPk(appliedJobId);
      }

      if (targetJob) {
        try {
          console.log('[Resume Controller] 🤖 Calling LLM for semantic job matching...');
          const startTime = Date.now();
          const matchResult = await llmService.matchResumeToJob(parsedResume, targetJob);
          const endTime = Date.now();
          
          matchScore = matchResult.overallScore ?? null;
          matchFeedback = matchResult.feedback || matchResult.reasoning || '';
          matchedSkills = matchResult.matchedSkills || [];
          missingSkills = matchResult.missingSkills || [];
          skillsScore = matchResult.skillsScore ?? null;
          experienceScore = matchResult.experienceScore ?? null;
          educationScore = matchResult.educationScore ?? null;
          projectsScore = matchResult.projectsScore ?? null;
          eligibility = matchResult.eligibility || 'ELIGIBLE';
          matchCategory = matchResult.matchCategory || 'MATCH';
          lowScoreReasons = matchResult.lowScoreReasons || [];
          
          console.log(`[Resume Controller] ✅ Match score calculated in ${endTime - startTime}ms:`, matchScore);
          console.log('[Resume Controller] Match Category:', matchCategory);
        } catch (matchError) {
          console.error('[Resume Controller] ⚠️ AI matching failed:', matchError.message);
        }
      } else {
        console.warn('[Resume Controller] ⚠️ Target job not found for ID:', appliedJobId);
      }

      // SAFETY GATE: If AI says empty/no-match but we have lots of raw text, there's a parsing glitch
      const hasNoContent = (parsedResume.skills?.length === 0 && parsedResume.experience?.length === 0);
      const hasRawText = (parsedResume.resumeText && parsedResume.resumeText.length > 500);

      if (hasNoContent && hasRawText && matchCategory === 'NO_MATCH') {
        console.error('[Resume Controller] 🚨 CRITICAL: AI returned empty parse, but raw text was present (Length: ' + parsedResume.resumeText.length + ')');
      }
    }

    // ─── 5. Strict Rejection Logic per User Workflow ──────────────────────────
    const isNoMatch = matchCategory === 'NO_MATCH';
    const isNotEligible = eligibility === 'NOT_ELIGIBLE';
    const isOverQualified = eligibility === 'OVER_QUALIFIED';
    const isVeryUnderQualified = eligibility === 'UNDER_QUALIFIED' && matchScore < 40;

    const shouldRejectAndNotStore = appliedJobId && (isNoMatch || isNotEligible || isOverQualified || isVeryUnderQualified);

    if (shouldRejectAndNotStore) {
      console.log(`[Resume Controller] 🚫 Rejecting candidate (${matchCategory}/${eligibility}). Match score: ${matchScore}. NOT SAVING.`);
      
      let rejectionMessage = 'Resume does not match this job.';
      if (isOverQualified) rejectionMessage = 'You are over-qualified for this specific role.';
      else if (isVeryUnderQualified) rejectionMessage = 'Your experience level does not yet meet the requirements for this role.';

      return res.status(200).json({
        message: rejectionMessage,
        matchCategory,
        eligibility,
        matchScore,
        matchFeedback,
        lowScoreReasons,
        parsedData: parsedResume,
        rejected: true
      });
    }

    console.log('[Resume Controller] ✅ Criteria met. Saving to database...');

    const resumeData = {
      userId: req.user ? req.user.id : null,
      name: parsedResume.name || 'Unknown',
      email: parsedResume.email || 'unknown@example.com',
      phone: parsedResume.phone || '',
      resumeUrl,
      skills: parsedResume.skills || [],
      education: parsedResume.education || [],
      experience: parsedResume.experience || [],
      projects: parsedResume.projects || [],
      resumeScore,
      appliedJobId: (appliedJobId && !appliedJobId.toString().startsWith('req_') && !isNaN(parseInt(appliedJobId))) ? parseInt(appliedJobId) : null,
      appliedJobTitle: appliedJobTitle || '',
      matchScore,
      matchFeedback,
      matchedSkills: matchedSkills.length ? matchedSkills : [],
      missingSkills: missingSkills.length ? missingSkills : [],
      skillsScore,
      experienceScore,
      educationScore,
      projectsScore,
      eligibility,
      matchCategory,
      lowScoreReasons
    };

    const resume = await Resume.create(resumeData);


    // ─── 6. Respond to Client ─────────────────────────────────────────────────
    res.status(201).json({
      id: resume.id,
      userId: resume.userId,
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
      matchScore: resume.matchScore,
      matchFeedback: resume.matchFeedback,
      // Detailed match breakdown for the frontend score card
      matchedSkills: matchedSkills,
      missingSkills: missingSkills,
      skillsScore: skillsScore,
      experienceScore: experienceScore,
      educationScore: educationScore,
      projectsScore: projectsScore,
      eligibility: eligibility,
      matchCategory: matchCategory,
      lowScoreReasons: lowScoreReasons,
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

  const resume = await Resume.findByPk(req.params.id);

  if (!resume) {
    res.status(404);
    throw new Error('Resume not found');
  }

  try {
    // Get existing responses or initialize empty array
    const existingResponses = resume.chatbotResponses || [];
    existingResponses.push({
      question,
      answer,
      language: language || 'en',
    });

    resume.chatbotResponses = existingResponses;

    if (language) {
      resume.preferredLanguage = language;
    }

    await resume.save();

    res.status(200).json({
      message: 'Response added successfully',
      resumeId: resume.id,
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
  const resume = await Resume.findByPk(req.params.id);

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
  const resumes = await Resume.findAll({ where: { userId: req.user.id } });
  res.json(resumes);
});

// @desc    Serve resume file
// @route   GET /api/resumes/:id/file
// @access  Private
const serveResumeFile = asyncHandler(async (req, res) => {
  const resume = await Resume.findByPk(req.params.id);

  if (!resume) {
    res.status(404);
    throw new Error('Resume not found');
  }

  // Redirect to the Cloudinary URL so the browser can view/download it
  res.redirect(resume.resumeUrl);
});

// @desc    Improve resume content based on job
// @route   POST /api/resumes/:id/improve
// @access  Private
const improveResume = asyncHandler(async (req, res) => {
  const { jobId } = req.body;
  const resume = await Resume.findByPk(req.params.id);

  if (!resume) {
    res.status(404);
    throw new Error('Resume not found');
  }

  let targetJob = null;
  if (jobId.startsWith('req_')) {
    const actId = jobId.replace('req_', '');
    const jobSelection = await JobSelection.findByPk(actId, { include: [{ model: RequisitionDetails, as: 'details' }, { model: Skill, as: 'skills' }] });
    if (jobSelection) {
      targetJob = {
        title: jobSelection.details?.title_role || jobSelection.requisition_class,
        description: jobSelection.details?.complete_description || jobSelection.details?.short_description || '',
        requiredSkills: jobSelection.skills ? jobSelection.skills.map(s => s.skill) : []
      };
    }
  } else {
    targetJob = await Job.findByPk(jobId);
  }

  if (!targetJob) {
    res.status(404);
    throw new Error('Target job not found');
  }

  const improvedData = await llmService.improveResume(resume, targetJob);
  res.json(improvedData);
});

// @desc    Save improved resume content
// @route   PUT /api/resumes/:id/improved
// @access  Public
const saveImprovedResume = asyncHandler(async (req, res) => {
  const { skills, experience, projects } = req.body;
  const resume = await Resume.findByPk(req.params.id);

  if (!resume) {
    res.status(404);
    throw new Error('Resume not found');
  }

  // Update with improved content if provided
  if (skills) resume.skills = skills;
  if (experience) resume.experience = experience;
  if (projects) resume.projects = projects;

  // We might want to mark it as "optimized" or "updated"
  await resume.save();

  res.status(200).json({
    message: 'Resume updated with improved content successfully',
    id: resume.id
  });
});

export { uploadResume, addChatbotResponse, getResumeById, getUserResumes, serveResumeFile, improveResume, saveImprovedResume };