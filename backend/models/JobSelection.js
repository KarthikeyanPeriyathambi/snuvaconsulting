import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const JobSelection = sequelize.define('JobSelection', {
  job_selection_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  region_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  requisition_class: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
}, {
  tableName: 'job_selection',
  timestamps: false,
});

export default JobSelection;
