import asyncHandler from 'express-async-handler';
import Job from '../models/jobModel.js';
import User from '../models/userModel.js';
import Resume from '../models/resumeModel.js';

// @desc    Get admin dashboard stats  (GLOBAL — all admins' jobs + all resumes)
// @route   GET /api/admin/dashboard
// @access  Private/Admin
const getAdminDashboardStats = asyncHandler(async (req, res) => {
  // ── Jobs: ALL jobs in the system ─────────────────────────────────────────
  const jobs = await Job.find({});

  const totalJobs = jobs.length;
  const openJobs = jobs.filter(j => j.status === 'Open').length;
  const closedJobs = jobs.filter(j => j.status === 'Closed').length;

  // Applications embedded in Job documents
  const totalApplications = jobs.reduce((acc, job) => acc + job.applications.length, 0);

  const applicationsByStatus = { Applied: 0, Shortlisted: 0, Rejected: 0, Interviewing: 0, Hired: 0 };
  let totalMatchScore = 0;
  let matchScoreCount = 0;

  jobs.forEach(job => {
    job.applications.forEach(app => {
      if (applicationsByStatus[app.status] !== undefined) {
        applicationsByStatus[app.status]++;
      }
      if (app.matchScore) {
        totalMatchScore += app.matchScore;
        matchScoreCount++;
      }
    });
  });

  const averageMatchScore =
    matchScoreCount > 0 ? (totalMatchScore / matchScoreCount).toFixed(2) : 0;

  // ── Resumes: ALL uploads from the Resume collection ──────────────────────
  const resumes = await Resume.find({})
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('user', 'name email');

  const totalResumes = await Resume.countDocuments({});

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
  const jobs = await Job.find({})
    .sort({ createdAt: -1 })
    .populate('admin', 'name companyName');

  const jobsWithCounts = jobs.map(job => {
    const applicationCount = job.applications.length;
    const shortlistedCount = job.applications.filter(a => a.status === 'Shortlisted').length;

    return {
      _id: job._id,
      title: job.title,
      location: job.location,
      jobType: job.jobType,
      status: job.status,
      createdAt: job.createdAt,
      applicationCount,
      shortlistedCount,
      // owner info so dashboard can display it
      adminName: job.admin?.name,
      companyName: job.admin?.companyName,
    };
  });

  res.json(jobsWithCounts);
});

// @desc    Get all resume uploads (for admin — global view)
// @route   GET /api/admin/resumes
// @access  Private/Admin
const getAdminResumes = asyncHandler(async (req, res) => {
  const resumes = await Resume.find({})
    .sort({ createdAt: -1 })
    .populate('user', 'name email');

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

