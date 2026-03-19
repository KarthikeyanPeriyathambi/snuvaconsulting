import User from './userModel.js';
import Job from './jobModel.js';
import Resume from './resumeModel.js';
import Message from './messageModel.js';
import Application from './applicationModel.js';

import JobSelection from './JobSelection.js';
import RequisitionDetails from './RequisitionDetails.js';
import Skill from './Skill.js';
import SkillQuestion from './SkillQuestion.js';
import Compliance from './Compliance.js';
// Define associations after all models are imported
Job.belongsTo(User, { as: 'admin', foreignKey: 'adminId' });
User.hasMany(Job, { foreignKey: 'adminId' });

Resume.belongsTo(User, { as: 'user', foreignKey: 'userId' });
User.hasMany(Resume, { foreignKey: 'userId' });

Resume.belongsTo(Job, { as: 'appliedJob', foreignKey: 'appliedJobId' });
Job.hasMany(Resume, { foreignKey: 'appliedJobId' });

Application.belongsTo(Job, { as: 'job', foreignKey: 'jobId' });
Application.belongsTo(Resume, { as: 'resume', foreignKey: 'resumeId' });
Job.hasMany(Application, { as: 'applications', foreignKey: 'jobId' });
Resume.hasMany(Application, { as: 'applications', foreignKey: 'resumeId' });

Message.belongsTo(User, { as: 'sender', foreignKey: 'senderId' });
Message.belongsTo(Job, { as: 'job', foreignKey: 'jobId' });

// Associations for new Job tables
JobSelection.hasOne(RequisitionDetails, { foreignKey: 'job_selection_id', as: 'details' });
RequisitionDetails.belongsTo(JobSelection, { foreignKey: 'job_selection_id', as: 'job_selection' });

JobSelection.hasMany(Skill, { foreignKey: 'job_selection_id', as: 'skills' });
Skill.belongsTo(JobSelection, { foreignKey: 'job_selection_id' });

JobSelection.hasMany(SkillQuestion, { foreignKey: 'job_selection_id', as: 'questions' });
SkillQuestion.belongsTo(JobSelection, { foreignKey: 'job_selection_id' });

JobSelection.hasMany(Compliance, { foreignKey: 'job_selection_id', as: 'compliance' });
Compliance.belongsTo(JobSelection, { foreignKey: 'job_selection_id' });

export { 
  User, Job, Resume, Message, Application,
  JobSelection, RequisitionDetails, Skill, SkillQuestion, Compliance
};
