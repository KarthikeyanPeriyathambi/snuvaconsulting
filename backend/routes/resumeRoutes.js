import express from 'express';
import {
  uploadResume,
  addChatbotResponse,
  getResumeById,
  getUserResumes,
  serveResumeFile,
  improveResume,
  saveImprovedResume,
} from '../controllers/resumeController.js';
import { protect, optionalProtect } from '../middleware/authMiddleware.js';
import { upload } from '../config/cloudinaryConfig.js';

const router = express.Router();

router.route('/')
  .post(optionalProtect, upload.single('resume'), uploadResume)
  .get(protect, getUserResumes);

router.route('/:id')
  .get(getResumeById);

router.route('/:id/file')
  .get(protect, serveResumeFile);

router.route('/:id/improved')
  .put(protect, saveImprovedResume);

router.route('/:id/chatbot-response')
  .post(addChatbotResponse);

router.route('/:id/improve')
  .post(protect, improveResume);

export default router;