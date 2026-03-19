import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const Resume = sequelize.define('Resume', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  resumeUrl: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  skills: {
    type: DataTypes.JSON,
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('skills');
      if (!rawValue) return [];
      return typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue;
    },
  },
  education: {
    type: DataTypes.JSON,
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('education');
      if (!rawValue) return [];
      return typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue;
    },
  },
  experience: {
    type: DataTypes.JSON,
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('experience');
      if (!rawValue) return [];
      return typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue;
    },
  },
  projects: {
    type: DataTypes.JSON,
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('projects');
      if (!rawValue) return [];
      return typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue;
    },
  },
  additionalInfo: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  resumeScore: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  appliedJobId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Jobs',
      key: 'id',
    },
  },
  appliedJobTitle: {
    type: DataTypes.STRING,
    defaultValue: '',
  },
  chatbotResponses: {
    type: DataTypes.JSON,
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('chatbotResponses');
      if (!rawValue) return [];
      return typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue;
    },
  },
  preferredLanguage: {
    type: DataTypes.STRING,
    defaultValue: 'en',
  },
  matchScore: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  matchFeedback: {
    type: DataTypes.TEXT,
    allowNull: true,
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
  skillsScore: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  experienceScore: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  educationScore: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  projectsScore: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  eligibility: {
    type: DataTypes.STRING,
    defaultValue: 'ELIGIBLE',
  },
  matchCategory: {
    type: DataTypes.STRING,
    defaultValue: 'MATCH',
  },
  lowScoreReasons: {
    type: DataTypes.JSON,
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('lowScoreReasons');
      if (!rawValue) return [];
      return typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue;
    },
  },
}, {
  timestamps: true,
});

export default Resume;