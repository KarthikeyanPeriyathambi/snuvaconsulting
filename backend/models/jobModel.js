import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const Job = sequelize.define('Job', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  adminId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  requiredSkills: {
    type: DataTypes.JSON,
    allowNull: false,
    get() {
      const rawValue = this.getDataValue('requiredSkills');
      if (!rawValue) return [];
      return typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue;
    },
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  salary: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  jobType: {
    type: DataTypes.ENUM('Full-time', 'Part-time', 'Contract', 'Internship', 'Remote'),
    allowNull: false,
  },
  experienceLevel: {
    type: DataTypes.ENUM('Entry-level', 'Mid-level', 'Senior', 'Executive'),
    allowNull: false,
  },
  numberOfOpenings: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  numberOfCandidatesToShortlist: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 5,
  },
  jobRequirements: {
    type: DataTypes.JSON,
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('jobRequirements');
      if (!rawValue) return [];
      return typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue;
    },
  },
  status: {
    type: DataTypes.ENUM('Open', 'Closed', 'Draft'),
    defaultValue: 'Open',
  },
  chatbotQuestions: {
    type: DataTypes.JSON,
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('chatbotQuestions');
      if (!rawValue) return [];
      return typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue;
    },
  },
}, {
  timestamps: true,
});

export default Job;