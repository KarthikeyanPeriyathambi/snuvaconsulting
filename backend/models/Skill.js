import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const Skill = sequelize.define('Skill', {
  skill_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  job_selection_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  skill: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  required_or_desired: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  experience_years: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'skills',
  timestamps: false,
});

export default Skill;
