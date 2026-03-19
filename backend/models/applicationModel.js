import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const Application = sequelize.define('Application', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  jobId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Jobs',
      key: 'id',
    },
  },
  resumeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Resumes',
      key: 'id',
    },
  },
  matchScore: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  skillMatchScore: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  experienceMatchScore: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  educationMatchScore: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  llmReasoning: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  projectsMatchScore: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  matchedSkills: {
    type: DataTypes.JSON,
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('matchedSkills');
      if (!rawValue) return [];
      return typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue;
    },
  },
  missingSkills: {
    type: DataTypes.JSON,
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('missingSkills');
      if (!rawValue) return [];
      return typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue;
    },
  },
  status: {
    type: DataTypes.ENUM('Applied', 'Shortlisted', 'Rejected', 'Interviewing', 'Hired'),
    defaultValue: 'Applied',
  },
  appliedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  timestamps: true,
});

export default Application;
