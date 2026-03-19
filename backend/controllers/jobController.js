import asyncHandler from 'express-async-handler';
import { Op } from 'sequelize';
import { User, Job, Resume, Application, JobSelection, RequisitionDetails, Skill, SkillQuestion, Compliance } from '../models/index.js';
import matchingAlgorithm from '../utils/matchingAlgorithm.js';

// @desc    Create a new job posting
// @route   POST /api/jobs
// @access  Private/Admin
const createJob = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    requiredSkills,
    location,
    salary,
    jobType,
    experienceLevel,
    numberOfOpenings,
    numberOfCandidatesToShortlist,
    jobRequirements,
    chatbotQuestions,
  } = req.body;

  // Validate required fields
  if (!title || !description || !requiredSkills || !location || !jobType || !experienceLevel) {
    res.status(400);
    throw new Error('Please fill all required fields');
  }

  // Create job
  const job = await Job.create({
    adminId: req.user.id,
    title,
    description,
    requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : requiredSkills.split(',').map(skill => skill.trim()),
    location,
    salary: salary || 'Not specified',
    jobType,
    experienceLevel,
    numberOfOpenings: numberOfOpenings || 1,
    numberOfCandidatesToShortlist: numberOfCandidatesToShortlist || 5,
    jobRequirements: Array.isArray(jobRequirements) ? jobRequirements : (jobRequirements ? jobRequirements.split(',').map(req => req.trim()) : []),
    chatbotQuestions: chatbotQuestions || [],
    status: 'Open',
  });

  if (job) {
    res.status(201).json(job);
  } else {
    res.status(400);
    throw new Error('Invalid job data');
  }
});

// @desc    Get all jobs
// @route   GET /api/jobs
// @access  Public
const getJobs = asyncHandler(async (req, res) => {
  const { search, location, jobType, experienceLevel } = req.query;

  const whereClause = { status: 'Open' };

  if (search) {
    whereClause[Op.or] = [
      { title: { [Op.like]: `%${search}%` } },
      { description: { [Op.like]: `%${search}%` } },
    ];
  }
  if (location) {
    whereClause.location = { [Op.like]: `%${location}%` };
  }
  if (jobType) {
    whereClause.jobType = jobType;
  }
  if (experienceLevel) {
    whereClause.experienceLevel = experienceLevel;
  }

  // Fetch local jobs
  const localJobs = await Job.findAll({
    where: whereClause,
    include: [{ model: User, as: 'admin', attributes: ['name', 'companyName', 'companyLogo'] }]
  });

  // Fetch imported jobs
  let importedJobs = await JobSelection.findAll({
    include: [{ model: RequisitionDetails, as: 'details' }]
  });

  const today = new Date();
  const formatDate = (date) => {
    if (!date) return null;
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const todayStr = formatDate(today);

  let formattedImported = importedJobs.map(j => {
    const details = j.details || {};
    return {
      id: `req_${j.job_selection_id}`,
      title: details.title_role || j.requisition_class,
      description: details.complete_description || details.short_description || '',
      location: details.work_location || 'Remote',
      salary: details.bill_rate_low ? `$${details.bill_rate_low} - $${details.bill_rate_high}` : 'Not specified',
      jobType: details.engagement_type || 'Contract',
      experienceLevel: 'Mid-level',
      numberOfOpenings: details.no_of_openings || 1,
      createdAt: details.start_date || new Date(),
      endDate: details.end_date,
      status: details.req_status === 'Open' ? 'Open' : 'Closed',
      admin: {
        companyName: details.region_name || 'Organization',
        companyLogo: null
      }
    };
  }).filter(j => {
    const isActive = j.status === 'Open';

    // Convert dates to YYYY-MM-DD (local time) for accurate comparison
    const startDateStr = formatDate(j.createdAt);
    const endDateStr = formatDate(j.endDate);

    const started = !startDateStr || startDateStr <= todayStr;
    const notExpired = !endDateStr || endDateStr >= todayStr;

    return isActive && started && notExpired;
  });

  // Apply filters to imported jobs manually
  if (search) {
    const searchLower = search.toLowerCase();
    formattedImported = formattedImported.filter(j =>
      j.title.toLowerCase().includes(searchLower) || j.description.toLowerCase().includes(searchLower)
    );
  }
  if (location) {
    const locationLower = location.toLowerCase();
    formattedImported = formattedImported.filter(j => j.location.toLowerCase().includes(locationLower));
  }
  if (jobType) {
    // Basic mapping or exact match
    formattedImported = formattedImported.filter(j => j.jobType.toLowerCase() === jobType.toLowerCase() || j.jobType.includes(jobType));
  }

  // Combine all jobs
  let allJobs = [...localJobs, ...formattedImported];

  // Sort by createdAt DESC
  allJobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Pagination
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const paginatedJobs = allJobs.slice(skip, skip + limit);

  res.json({
    jobs: paginatedJobs,
    page,
    pages: Math.ceil(allJobs.length / limit),
    total: allJobs.length,
  });
});

// @desc    Get job by ID
// @route   GET /api/jobs/:id
// @access  Public
const getJobById = asyncHandler(async (req, res) => {
  const jobId = req.params.id;

  if (jobId.startsWith('req_')) {
    const actId = jobId.replace('req_', '');
    const jobSelection = await JobSelection.findByPk(actId, {
      include: [
        { model: RequisitionDetails, as: 'details' },
        { model: Skill, as: 'skills' },
        { model: SkillQuestion, as: 'questions' },
        { model: Compliance, as: 'compliance' }
      ]
    });

    if (jobSelection) {
      const details = jobSelection.details || {};
      const jobObj = {
        id: jobId,
        title: details.title_role || jobSelection.requisition_class,
        description: details.complete_description || details.short_description || '',
        location: details.work_location || 'Remote',
        salary: details.bill_rate_low ? `$${details.bill_rate_low} - $${details.bill_rate_high}` : 'Not specified',
        jobType: details.engagement_type || 'Contract',
        experienceLevel: 'Mid-level',
        numberOfOpenings: details.no_of_openings || 1,
        createdAt: details.start_date || new Date(),
        status: details.req_status,
        requiredSkills: jobSelection.skills ? jobSelection.skills.map(s => s.skill) : [],
        jobRequirements: [],
        chatbotQuestions: jobSelection.questions ? jobSelection.questions.map(q => q.question_text) : [],
        extraDetails: {
          compliance: jobSelection.compliance
        },
        admin: {
          name: 'Admin',
          companyName: details.region_name || 'Organization',
          companyLogo: null,
          companyDescription: details.region_description || ''
        }
      };
      return res.json(jobObj);
    }
  }

  const job = await Job.findByPk(jobId, {
    include: [{
      model: User,
      as: 'admin',
      attributes: ['name', 'companyName', 'companyLogo', 'companyDescription'],
    }],
  });

  if (job) {
    res.json(job);
  } else {
    res.status(404);
    throw new Error('Job not found');
  }
});

// @desc    Update a job
// @route   PUT /api/jobs/:id
// @access  Private/Admin
const updateJob = asyncHandler(async (req, res) => {
  const job = await Job.findByPk(req.params.id);

  if (!job) {
    res.status(404);
    throw new Error('Job not found');
  }

  // Check if the user is the admin who created the job
  if (job.adminId !== req.user.id) {
    res.status(401);
    throw new Error('Not authorized to update this job');
  }

  // Update job fields
  job.title = req.body.title || job.title;
  job.description = req.body.description || job.description;
  job.requiredSkills = req.body.requiredSkills || job.requiredSkills;
  job.location = req.body.location || job.location;
  job.salary = req.body.salary || job.salary;
  job.jobType = req.body.jobType || job.jobType;
  job.experienceLevel = req.body.experienceLevel || job.experienceLevel;
  job.numberOfOpenings = req.body.numberOfOpenings || job.numberOfOpenings;
  job.numberOfCandidatesToShortlist = req.body.numberOfCandidatesToShortlist || job.numberOfCandidatesToShortlist;
  job.jobRequirements = req.body.jobRequirements || job.jobRequirements;
  job.status = req.body.status || job.status;
  job.chatbotQuestions = req.body.chatbotQuestions || job.chatbotQuestions;

  const updatedJob = await job.save();

  res.json(updatedJob);
});

// @desc    Delete a job
// @route   DELETE /api/jobs/:id
// @access  Private/Admin
const deleteJob = asyncHandler(async (req, res) => {
  const job = await Job.findByPk(req.params.id);

  if (!job) {
    res.status(404);
    throw new Error('Job not found');
  }

  // Check if the user is the admin who created the job
  if (job.adminId !== req.user.id) {
    res.status(401);
    throw new Error('Not authorized to delete this job');
  }

  await job.destroy();

  res.json({ message: 'Job removed' });
});

// @desc    Apply for a job with resume
// @route   POST /api/jobs/:id/apply
// @access  Public
const applyForJob = asyncHandler(async (req, res) => {
  const { resumeId } = req.body;

  if (!resumeId) {
    res.status(400);
    throw new Error('Please provide a resume ID');
  }

  const job = await Job.findByPk(req.params.id);
  const resume = await Resume.findByPk(resumeId);

  if (!job) {
    res.status(404);
    throw new Error('Job not found');
  }

  if (!resume) {
    res.status(404);
    throw new Error('Resume not found');
  }

  // Check if already applied
  const alreadyApplied = await Application.findOne({
    where: {
      jobId: job.id,
      resumeId: resumeId,
    },
  });

  if (alreadyApplied) {
    res.status(400);
    throw new Error('Already applied to this job');
  }

  // Calculate match score
  const matchResult = await matchingAlgorithm.calculateMatchScore(resume, job);

  // Create application
  const application = await Application.create({
    jobId: job.id,
    resumeId: resumeId,
    matchScore: matchResult.matchScore,
    skillMatchScore: matchResult.skillMatchScore,
    experienceMatchScore: matchResult.experienceMatchScore,
    educationMatchScore: matchResult.educationMatchScore,
    llmReasoning: matchResult.llmReasoning,
    projectsMatchScore: matchResult.projectsMatchScore,
    matchedSkills: matchResult.matchedSkills,
    missingSkills: matchResult.missingSkills,
    status: 'Applied',
  });

  res.status(201).json({
    message: 'Application submitted successfully',
    matchScore: matchResult.matchScore,
  });
});

// @desc    Get all applications for a job
// @route   GET /api/jobs/:id/applications
// @access  Private/Admin
const getJobApplications = asyncHandler(async (req, res) => {
  const job = await Job.findByPk(req.params.id, {
    include: [{
      model: User,
      as: 'admin',
      attributes: ['id', 'name'],
    }],
  });

  if (!job) {
    res.status(404);
    throw new Error('Job not found');
  }

  // Check if the user is the admin who created the job
  if (job.adminId !== req.user.id) {
    res.status(401);
    throw new Error('Not authorized to view these applications');
  }

  // Get all applications with resume data
  const applications = await Application.findAll({
    where: { jobId: job.id },
    include: [{
      model: Resume,
      as: 'resume',
      attributes: ['id', 'name', 'email', 'phone', 'skills', 'education', 'experience', 'projects', 'chatbotResponses', 'preferredLanguage', 'resumeScore', 'resumeUrl', 'appliedJobId', 'appliedJobTitle'],
    }],
  });

  res.json(applications);
});

// @desc    Update application status
// @route   PUT /api/jobs/:id/applications/:applicationId
// @access  Private/Admin
const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!status) {
    res.status(400);
    throw new Error('Please provide a status');
  }

  const job = await Job.findByPk(req.params.id, {
    include: [{
      model: User,
      as: 'admin',
      attributes: ['id', 'name'],
    }],
  });

  if (!job) {
    res.status(404);
    throw new Error('Job not found');
  }

  // Check if the user is the admin who created the job
  if (job.adminId !== req.user.id) {
    res.status(401);
    throw new Error('Not authorized to update this application');
  }

  // Find the application
  const application = await Application.findByPk(req.params.applicationId);

  if (!application) {
    res.status(404);
    throw new Error('Application not found');
  }

  // Update status
  application.status = status;
  await application.save();

  res.json({
    message: 'Application status updated',
    application,
  });
});

export {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
  applyForJob,
  getJobApplications,
  updateApplicationStatus,
};