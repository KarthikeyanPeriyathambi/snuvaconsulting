import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Set up storage for Cloudinary uploads
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'resumes',
    resource_type: 'raw',
    public_id: (req, file) => {
      // Remove spaces and special characters to prevent signature errors
      const cleanFileName = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_');
      return `${Date.now()}_${cleanFileName}`;
    },
  },
});

// Set up multer for handling file uploads with memory storage to access buffer
const upload = multer({
  storage: multer.memoryStorage(), // Store file in memory to access buffer
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOCX files are allowed!'), false);
    }
  },
});

export { cloudinary, upload, storage };