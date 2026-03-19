import asyncHandler from 'express-async-handler';
import { User, Job, Application, Message } from '../models/index.js';

// @desc    Send a message to all applicants of a job
// @route   POST /api/messages/job/:jobId
// @access  Private/Admin
const sendMessageToApplicants = asyncHandler(async (req, res) => {
  const { subject, content, type } = req.body;

  if (!subject || !content) {
    res.status(400);
    throw new Error('Please provide subject and content');
  }

  const job = await Job.findByPk(req.params.jobId, {
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
    throw new Error('Not authorized to send messages for this job');
  }

  // Get all applications for this job
  const applications = await Application.findAll({ where: { jobId: job.id } });

  if (applications.length === 0) {
    res.status(400);
    throw new Error('No applicants for this job yet');
  }

  // Create recipients array from job applications
  const recipients = applications.map((app) => ({
    resumeId: app.resumeId,
    read: false,
  }));

  // Create message
  const message = await Message.create({
    senderId: req.user.id,
    jobId: job.id,
    recipients,
    subject,
    content,
    type: type || 'Other',
  });

  res.status(201).json({
    message: 'Message sent successfully',
    messageId: message.id,
    recipientsCount: recipients.length,
  });
});

// @desc    Get all messages for a specific job
// @route   GET /api/messages/job/:jobId
// @access  Private/Admin
const getJobMessages = asyncHandler(async (req, res) => {
  const job = await Job.findByPk(req.params.jobId, {
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
    throw new Error('Not authorized to view messages for this job');
  }

  const messages = await Message.findAll({
    where: { jobId: req.params.jobId },
    order: [['createdAt', 'DESC']],
  });

  res.json(messages);
});

// @desc    Get all messages for a specific resume
// @route   GET /api/messages/resume/:resumeId
// @access  Public
const getResumeMessages = asyncHandler(async (req, res) => {
  const messages = await Message.findAll({
    order: [['createdAt', 'DESC']],
  });

  // Filter messages that contain this resume in recipients
  const filteredMessages = messages.filter(message => {
    const recipients = message.recipients || [];
    return recipients.some(r => r.resumeId === parseInt(req.params.resumeId));
  });

  // Mark messages as read
  for (const message of filteredMessages) {
    const recipients = message.recipients || [];
    const recipient = recipients.find(r => r.resumeId === parseInt(req.params.resumeId));

    if (recipient && !recipient.read) {
      recipient.read = true;
      await message.save();
    }
  }

  res.json(filteredMessages);
});

export { sendMessageToApplicants, getJobMessages, getResumeMessages };