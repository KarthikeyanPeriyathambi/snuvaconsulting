import { sequelize } from './config/db.js';
import User from './models/userModel.js';
import Job from './models/jobModel.js';
import Application from './models/applicationModel.js';
import Resume from './models/resumeModel.js';
import Message from './models/messageModel.js';

const seedData = async () => {
    try {
        // Sync database (create tables)
        await sequelize.sync({ force: true });
        console.log('Database tables created successfully!');

        // Clear existing data (already done by force: true, but being explicit)
        console.log('Clearing existing data...');

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

        console.log('Admin user created successfully!');

        // Create Jobs - Career Portal Positions (5 diverse roles)
        const jobs = [
            {
                adminId: adminUser.id,
                title: 'MCD - Technical Specialist 1/T S1',
                description: 'We are looking for a Technical Specialist to manage and support technical infrastructure operations and resolve complex issues.',
                requiredSkills: ['Technical Support', 'Troubleshooting', 'Infrastructure', 'Networking'],
                location: 'Remote',
                salary: 'Negotiable',
                jobType: 'Full-time',
                experienceLevel: 'Mid-level',
                numberOfOpenings: 1,
                numberOfCandidatesToShortlist: 10,
                jobRequirements: [
                    'Proven experience in technical support or specialist roles',
                    'Strong troubleshooting and problem-solving skills',
                    'Good understanding of infrastructure and networking concepts'
                ],
                status: 'Open',
                chatbotQuestions: [
                    { question: 'Describe your experience with technical troubleshooting.', isRequired: true }
                ],
            }
        ];

        const createdJobs = await Job.bulkCreate(jobs);
        console.log(`${createdJobs.length} jobs created successfully!`);

        console.log('Data Seeded Successfully!');
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

seedData();
