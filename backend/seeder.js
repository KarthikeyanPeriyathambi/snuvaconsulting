import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/userModel.js';
import Job from './models/jobModel.js';
import connectDB from './config/db.js';

dotenv.config();

connectDB();

const seedData = async () => {
    try {
        // Clear existing data
        await Job.deleteMany();
        await User.deleteMany();

        // Create Admin User
        const adminUser = await User.create({
            name: 'Admin User',
            email: 'admin@example.com',
            password: 'password123',
            isAdmin: true,
            companyName: 'Tech Innovators',
            companyLogo: 'https://via.placeholder.com/150',
            companyDescription: 'Leading tech solutions provider.',
            phoneNumber: '1234567890',
        });

        // Create Jobs
        const jobs = [
            {
                admin: adminUser._id,
                title: 'Full Stack Developer',
                description: 'We are looking for a skilled Full Stack Developer to join our team. You will be responsible for developing and maintaining web applications.',
                requiredSkills: ['React', 'Node.js', 'MongoDB', 'Express', 'JavaScript'],
                location: 'Bangalore, India',
                salary: '12 - 18 LPA',
                jobType: 'Full-time',
                experienceLevel: 'Mid-level',
                numberOfOpenings: 2,
                numberOfCandidatesToShortlist: 10,
                jobRequirements: [
                    '3+ years of experience in MERN stack',
                    'Strong understanding of RESTful APIs',
                    'Proficient in version control tools like Git',
                ],
                status: 'Open',
                chatbotQuestions: [
                    { question: 'Have you worked with React and Node.js before?', isRequired: true },
                    { question: 'What is your notice period?', isRequired: true },
                ],
            },
            {
                admin: adminUser._id,
                title: 'Frontend Engineer',
                description: 'Join our frontend team to build beautiful and responsive user interfaces using the latest web technologies.',
                requiredSkills: ['React', 'Tailwind CSS', 'Redux', 'TypeScript'],
                location: 'Remote',
                salary: '8 - 14 LPA',
                jobType: 'Full-time',
                experienceLevel: 'Entry-level',
                numberOfOpenings: 3,
                numberOfCandidatesToShortlist: 15,
                jobRequirements: [
                    'Strong knowledge of HTML, CSS, and JavaScript',
                    'Experience with modern frontend frameworks like React',
                    'Excellent problem-solving skills',
                ],
                status: 'Open',
                chatbotQuestions: [
                    { question: 'Can you show some of your portfolio projects?', isRequired: true },
                    { question: 'Are you comfortable working in a remote environment?', isRequired: true },
                ],
            },
            {
                admin: adminUser._id,
                title: 'Backend Developer Intern',
                description: 'Excellent opportunity for students or fresh graduates to learn and grow as a Backend Developer.',
                requiredSkills: ['Node.js', 'PostgreSQL', 'Python', 'Basic Cloud Knowledge'],
                location: 'Hyderabad, India',
                salary: '25k - 40k per month',
                jobType: 'Internship',
                experienceLevel: 'Entry-level',
                numberOfOpenings: 5,
                numberOfCandidatesToShortlist: 20,
                jobRequirements: [
                    'Currently pursuing or recently completed a degree in Computer Science',
                    'Basic understanding of backend development',
                    'Willingness to learn new technologies',
                ],
                status: 'Open',
                chatbotQuestions: [
                    { question: 'When can you start the internship?', isRequired: true },
                    { question: 'Are you available for at least 6 months?', isRequired: true },
                ],
            },
        ];

        await Job.insertMany(jobs);

        console.log('Data Seeded Successfully!');
        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

seedData();
