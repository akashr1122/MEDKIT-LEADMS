const User = require('./User');
const Lead = require('./Lead');
const Setting = require('./Setting');

// Associations
// A Lead belongs to a Calling Agent (User)
Lead.belongsTo(User, {
  as: 'callingAgent',
  foreignKey: 'assignedCallingAgentId',
  constraints: false,
});

// A Lead belongs to a Demo Agent (User)
Lead.belongsTo(User, {
  as: 'demoAgent',
  foreignKey: 'assignedDemoAgentId',
  constraints: false,
});

// A User (Calling Agent) has many Leads
User.hasMany(Lead, {
  as: 'assignedLeads',
  foreignKey: 'assignedCallingAgentId',
});

// A User (Demo Agent) has many Demo Leads
User.hasMany(Lead, {
  as: 'assignedDemos',
  foreignKey: 'assignedDemoAgentId',
});

module.exports = { User, Lead, Setting };
