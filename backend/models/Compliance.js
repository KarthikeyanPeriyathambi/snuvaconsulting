import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const Compliance = sequelize.define('Compliance', {
  compliance_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  job_selection_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  group_name: {
    type: DataTypes.STRING(150),
    allowNull: true,
  },
  item_name: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  owner: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  due_type: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  item_system_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  attachment_flag: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
}, {
  tableName: 'compliance',
  timestamps: false,
});

export default Compliance;
