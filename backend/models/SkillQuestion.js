import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const SkillQuestion = sequelize.define('SkillQuestion', {
  question_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  job_selection_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  question_text: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'skill_questions',
  timestamps: false,
});

export default SkillQuestion;
