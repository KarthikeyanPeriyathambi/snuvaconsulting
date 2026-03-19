import asyncHandler from 'express-async-handler';
import { User, Job, Application, Message, Resume } from '../models/index.js';

// @desc    Get admin dashboard stats  (GLOBAL — all admins' jobs + all resumes)
// @route   GET /api/admin/dashboard
// @access  Private/Admin
const getAdminDashboardStats = asyncHandler(async (req, res) => {
  // ── Jobs: ALL jobs in the system ─────────────────────────────────────────
  const jobs = await Job.findAll({
    include: [{
      model: Application,
      as: 'applications',
      attributes: ['status', 'matchScore'],
    }],
  });

  const totalJobs = jobs.length;
  const openJobs = jobs.filter(j => j.status === 'Open').length;
  const closedJobs = jobs.filter(j => j.status === 'Closed').length;

  // Applications from separate table
  const totalApplications = jobs.reduce((acc, job) => acc + (job.applications ? job.applications.length : 0), 0);

  const applicationsByStatus = { Applied: 0, Shortlisted: 0, Rejected: 0, Interviewing: 0, Hired: 0 };
  let totalMatchScore = 0;
  let matchScoreCount = 0;

  jobs.forEach(job => {
    if (job.applications) {
      job.applications.forEach(app => {
        if (applicationsByStatus[app.status] !== undefined) {
          applicationsByStatus[app.status]++;
        }
        if (app.matchScore) {
          totalMatchScore += app.matchScore;
          matchScoreCount++;
        }
      });
    }
  });

  const averageMatchScore =
    matchScoreCount > 0 ? (totalMatchScore / matchScoreCount).toFixed(2) : 0;

  // ── Resumes: ALL uploads from the Resume collection ──────────────────────
  const resumes = await Resume.findAll({
    limit: 10,
    order: [['createdAt', 'DESC']],
  });

  const totalResumes = await Resume.count();

  // ── Return ────────────────────────────────────────────────────────────────
  res.json({
    totalJobs,
    openJobs,
    closedJobs,
    totalApplications,
    applicationsByStatus,
    averageMatchScore,
    totalResumes,
    recentResumes: resumes,
  });
});

// @desc    Get all jobs (GLOBAL — any admin sees all jobs)
// @route   GET /api/admin/jobs
// @access  Private/Admin
const getAdminJobs = asyncHandler(async (req, res) => {
  const jobs = await Job.findAll({
    include: [{
      model: User,
      as: 'admin',
      attributes: ['name', 'companyName'],
    }],
    order: [['createdAt', 'DESC']],
  });

  const jobsWithCounts = await Promise.all(jobs.map(async job => {
    const applicationCount = await Application.count({ where: { jobId: job.id } });
    const shortlistedCount = await Application.count({ where: { jobId: job.id, status: 'Shortlisted' } });

    return {
      id: job.id,
      title: job.title,
      location: job.location,
      jobType: job.jobType,
      status: job.status,
      createdAt: job.createdAt,
      applicationCount,
      shortlistedCount,
      adminName: job.admin?.name,
      companyName: job.admin?.companyName,
    };
  }));

  res.json(jobsWithCounts);
});

// @desc    Get all resume uploads (for admin — global view)
// @route   GET /api/admin/resumes
// @access  Private/Admin
const getAdminResumes = asyncHandler(async (req, res) => {
  const resumes = await Resume.findAll({
    order: [['createdAt', 'DESC']],
  });

  res.json(resumes);
});

// @desc    Update company profile
// @route   PUT /api/admin/company-profile
// @access  Private/Admin
const updateCompanyProfile = asyncHandler(async (req, res) => {
  const { companyName, companyLogo, companyDescription } = req.body;

  if (!companyName) {
    res.status(400);
    throw new Error('Company name is required');
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.companyName = companyName;
  user.companyLogo = companyLogo || user.companyLogo;
  user.companyDescription = companyDescription || user.companyDescription;

  const updatedUser = await user.save();

  res.json({
    message: 'Company profile updated',
    companyName: updatedUser.companyName,
    companyLogo: updatedUser.companyLogo,
    companyDescription: updatedUser.companyDescription,
  });
});

export { getAdminDashboardStats, getAdminJobs, getAdminResumes, updateCompanyProfile };

