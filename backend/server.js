import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';

// Routes
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import resumeRoutes from './routes/resumeRoutes.js';
import messageRoutes from './routes/messageRoutes.js';

// Load environment variables
dotenv.config();

// Connect to MySQL
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGIN,
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'https://snuvaconsulting.cbeezai.com'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.error(`CORS blocked for origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Define routes
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/messages', messageRoutes);

// Health check route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
// const PORT = process.env.PORT || 5000;
// if (process.env.NODE_ENV !== 'production') {
//   app.listen(PORT, () => {
//     console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
//   });
// }

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

export default app;

// touch to reload env
