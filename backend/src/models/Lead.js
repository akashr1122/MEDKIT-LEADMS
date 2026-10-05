const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Lead = sequelize.define('Lead', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  doctorName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Doctor name is required' },
    },
  },
  clinicName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: { msg: 'Please enter a valid email' },
    },
  },
  city: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  specialization: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  source: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'manual',
  },
  needForClinic: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  demoTime: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  stage: {
    type: DataTypes.ENUM('new', 'calling', 'demo', 'completed'),
    defaultValue: 'new',
  },
  callStatus: {
    type: DataTypes.STRING,
    defaultValue: 'Pending',
  },
  demoStatus: {
    type: DataTypes.ENUM(
      'Not Started',
      'Demo Scheduled',
      'Demo Completed',
      'Demo Cancelled',
      'Doctor Interested',
      'Doctor Not Interested',
      'Sale Completed'
    ),
    defaultValue: 'Not Started',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  demoNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  nextFollowUp: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  followUpTime: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  demoDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  assignedCallingAgentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  assignedDemoAgentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  sheet_row_id: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
}, {
  tableName: 'leads',
  timestamps: true,
});

module.exports = Lead;
