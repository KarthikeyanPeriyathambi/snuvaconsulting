import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const RequisitionDetails = sequelize.define('RequisitionDetails', {
  details_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  job_selection_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  requisition_class: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  title_role: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  req_status: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  no_of_openings: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  no_new_submittals_after: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  max_submittals_vendor: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  screening_status: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  directed_award: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  selected_vendor_resource: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  region_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  region_description: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  total_no_filled: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  end_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  currently_engaged: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  rate_structure_used: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  bill_rate_low: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  bill_rate_high: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  allow_submission_above_max: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  hours_per_day: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  days_per_week: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  engagement_type: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  short_description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  complete_description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  work_location: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  cost_center: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  gl_code: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  project: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
}, {
  tableName: 'requisition_details',
  timestamps: false,
});

export default RequisitionDetails;
