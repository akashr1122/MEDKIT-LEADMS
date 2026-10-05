const { Lead, User, Setting } = require('../models');
const { Op } = require('sequelize');
const axios = require('axios');
const { parse } = require('csv-parse/sync');

/**
 * Get all leads (Admin) - GET /api/leads
 */
const getAll = async (req, res) => {
  try {
    const { stage, callStatus, demoStatus, search, assignedCallingAgentId, assignedDemoAgentId, followUpDate, followUpTime, timeSlot } = req.query;
    const where = {};

    if (stage) where.stage = stage;
    if (callStatus) where.callStatus = callStatus;
    if (demoStatus) where.demoStatus = demoStatus;
    if (assignedCallingAgentId) where.assignedCallingAgentId = assignedCallingAgentId;
    if (assignedDemoAgentId) where.assignedDemoAgentId = assignedDemoAgentId;
    if (followUpDate) where.nextFollowUp = followUpDate;
    if (followUpTime) where.followUpTime = followUpTime;
    if (timeSlot) {
      if (timeSlot === 'morning') {
        where.followUpTime = { [Op.between]: ['06:00', '11:59'] };
      } else if (timeSlot === 'afternoon') {
        where.followUpTime = { [Op.between]: ['12:00', '16:59'] };
      } else if (timeSlot === 'evening') {
        where.followUpTime = { [Op.between]: ['17:00', '23:59'] };
      }
    }

    if (search) {
      where[Op.or] = [
        { doctorName: { [Op.iLike]: `%${search}%` } },
        { clinicName: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } },
        { city: { [Op.iLike]: `%${search}%` } },
        { address: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const leads = await Lead.findAll({
      where,
      include: [
        { model: User, as: 'callingAgent', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'demoAgent', attributes: ['id', 'name', 'email'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({ leads });
  } catch (error) {
    console.error('Get leads error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Create lead (Admin) - POST /api/leads
 */
const create = async (req, res) => {
  try {
    const { doctorName, clinicName, phone, email, city, address, specialization } = req.body;

    if (!doctorName) {
      return res.status(400).json({ message: 'Doctor name is required.' });
    }

    const lead = await Lead.create({
      doctorName,
      clinicName: clinicName || null,
      phone: phone || null,
      email: email || null,
      city: city || null,
      address: address || null,
      specialization: specialization || null,
      source: 'manual',
      stage: 'new',
    });

    res.status(201).json({ message: 'Lead created successfully', lead });
  } catch (error) {
    console.error('Create lead error:', error);
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(e => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Assign calling agent (Admin) - PATCH /api/leads/:id/assign
 */
const assignCallingAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedCallingAgentId } = req.body;

    const lead = await Lead.findByPk(id);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found.' });
    }

    if (assignedCallingAgentId) {
      const agent = await User.findByPk(assignedCallingAgentId);
      if (!agent || agent.role !== 'calling_agent') {
        return res.status(400).json({ message: 'Invalid calling agent.' });
      }
    }

    await lead.update({
      assignedCallingAgentId: assignedCallingAgentId || null,
      stage: assignedCallingAgentId ? 'calling' : lead.stage,
    });

    const updatedLead = await Lead.findByPk(id, {
      include: [
        { model: User, as: 'callingAgent', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'demoAgent', attributes: ['id', 'name', 'email'] },
      ],
    });

    res.json({ message: 'Calling agent assigned successfully', lead: updatedLead });
  } catch (error) {
    console.error('Assign calling agent error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Assign demo agent / move to demo (Admin) - PATCH /api/leads/:id/assign-demo
 */
const assignDemoAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedDemoAgentId, demoDate } = req.body;

    const lead = await Lead.findByPk(id);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found.' });
    }

    if (assignedDemoAgentId) {
      const agent = await User.findByPk(assignedDemoAgentId);
      if (!agent || agent.role !== 'demo_agent') {
        return res.status(400).json({ message: 'Invalid demo agent.' });
      }
    }

    await lead.update({
      assignedDemoAgentId: assignedDemoAgentId || null,
      stage: 'demo',
      demoStatus: 'Demo Scheduled',
      demoDate: demoDate || null,
    });

    const updatedLead = await Lead.findByPk(id, {
      include: [
        { model: User, as: 'callingAgent', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'demoAgent', attributes: ['id', 'name', 'email'] },
      ],
    });

    res.json({ message: 'Demo agent assigned successfully', lead: updatedLead });
  } catch (error) {
    console.error('Assign demo agent error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Bulk assign calling/demo agents to multiple leads (Admin) - POST /api/leads/bulk-assign
 */
const bulkAssign = async (req, res) => {
  try {
    const { leadIds, assignedCallingAgentId, assignedDemoAgentId, demoDate } = req.body;

    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({ message: 'Please provide at least one lead ID to assign.' });
    }

    const updateData = {};

    if (assignedCallingAgentId !== undefined) {
      if (assignedCallingAgentId) {
        const agent = await User.findByPk(assignedCallingAgentId);
        if (!agent || agent.role !== 'calling_agent') {
          return res.status(400).json({ message: 'Invalid calling agent selected.' });
        }
        updateData.assignedCallingAgentId = parseInt(assignedCallingAgentId);
        updateData.stage = 'calling';
      } else {
        updateData.assignedCallingAgentId = null;
      }
    }

    if (assignedDemoAgentId !== undefined) {
      if (assignedDemoAgentId) {
        const agent = await User.findByPk(assignedDemoAgentId);
        if (!agent || agent.role !== 'demo_agent') {
          return res.status(400).json({ message: 'Invalid demo agent selected.' });
        }
        updateData.assignedDemoAgentId = parseInt(assignedDemoAgentId);
        updateData.stage = 'demo';
        updateData.demoStatus = 'Demo Scheduled';
        if (demoDate) {
          updateData.demoDate = demoDate;
        }
      } else {
        updateData.assignedDemoAgentId = null;
      }
    }

    const [updatedCount] = await Lead.update(updateData, {
      where: {
        id: {
          [Op.in]: leadIds,
        },
      },
    });

    res.json({
      message: `Successfully assigned ${updatedCount} lead${updatedCount === 1 ? '' : 's'}.`,
      updatedCount,
    });
  } catch (error) {
    console.error('Bulk assign error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Bulk delete leads (Admin) - POST /api/leads/bulk-delete
 */
const bulkDelete = async (req, res) => {
  try {
    const { leadIds } = req.body;
    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({ message: 'Please provide lead IDs to delete.' });
    }

    const deletedCount = await Lead.destroy({
      where: {
        id: {
          [Op.in]: leadIds,
        },
      },
    });

    res.json({
      message: `Successfully deleted ${deletedCount} lead${deletedCount === 1 ? '' : 's'}.`,
      deletedCount,
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Sync Google Sheet (Admin) - POST /api/leads/sync-sheet
 */
/**
 * Get Google Sheet Configuration (Admin) - GET /api/leads/sheet-config
 */
const getSheetConfig = async (req, res) => {
  try {
    const urlSetting = await Setting.findByPk('google_sheet_url');
    const syncSetting = await Setting.findByPk('google_sheet_last_synced_at');
    const statsSetting = await Setting.findByPk('google_sheet_last_stats');

    let parsedStats = null;
    if (statsSetting && statsSetting.value) {
      try {
        parsedStats = JSON.parse(statsSetting.value);
      } catch (e) {
        parsedStats = null;
      }
    }

    res.json({
      sheetUrl: urlSetting ? urlSetting.value : '',
      lastSyncedAt: syncSetting ? syncSetting.value : null,
      lastStats: parsedStats,
    });
  } catch (error) {
    console.error('Error fetching sheet config:', error);
    res.status(500).json({ message: 'Failed to fetch sheet configuration.' });
  }
};

/**
 * Save Google Sheet URL without syncing immediately - POST /api/leads/save-sheet-url
 */
const saveSheetConfig = async (req, res) => {
  try {
    const { sheetUrl } = req.body;
    if (!sheetUrl) {
      return res.status(400).json({ message: 'Sheet URL is required.' });
    }
    await Setting.upsert({
      key: 'google_sheet_url',
      value: sheetUrl.trim(),
    });
    res.json({ message: 'Google Sheet URL saved successfully', sheetUrl: sheetUrl.trim() });
  } catch (error) {
    console.error('Error saving sheet URL:', error);
    res.status(500).json({ message: 'Failed to save sheet URL.' });
  }
};

/**
 * Sync Google Sheet (Admin) - POST /api/leads/sync-sheet
 */
const syncSheet = async (req, res) => {
  try {
    let sheetUrl = req.body.sheetUrl;

    if (!sheetUrl) {
      const savedSetting = await Setting.findByPk('google_sheet_url');
      if (savedSetting && savedSetting.value) {
        sheetUrl = savedSetting.value;
      } else {
        return res.status(400).json({ message: 'Sheet URL is required.' });
      }
    }

    sheetUrl = sheetUrl.trim();

    // Auto-save the sheet URL in database settings so it is remembered forever
    await Setting.upsert({
      key: 'google_sheet_url',
      value: sheetUrl,
    });

    // Auto-convert standard Google Sheet links to CSV export format
    let fetchUrl = sheetUrl;
    if (fetchUrl.includes('docs.google.com/spreadsheets')) {
      const idMatch = fetchUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (idMatch && !fetchUrl.includes('export?format=csv') && !fetchUrl.includes('output=csv')) {
        const sheetId = idMatch[1];
        const gidMatch = fetchUrl.match(/[#&?]gid=([0-9]+)/);
        const gid = gidMatch ? gidMatch[1] : '0';
        fetchUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
      }
    }

    // Fetch CSV data
    const response = await axios.get(fetchUrl, { responseType: 'text' });
    const csvData = response.data;

    // Parse CSV
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    let created = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const docName = (row['Doctor Name'] || row['doctorName'] || row['Doctor'] || row['Name'] || row['DoctorName'] || 'Unknown').trim();
      const sheetRowId = `sheet_row_${i + 1}_${docName}`;

      try {
        const clinicName = row['Clinic Name'] || row['clinicName'] || row['Clinic'] || row['Hospital'] || row['Hospital Name'] || null;
        const phone = row['Phone'] || row['phone'] || row['Mobile'] || row['Contact'] || row['Phone Number'] || null;
        const email = row['Email'] || row['email'] || row['Email Address'] || null;
        const city = row['City'] || row['city'] || row['Location'] || null;
        const address = row['Address'] || row['address'] || row['Full Address'] || row['Clinic Address'] || row['Street'] || null;
        const specialization = row['Specialization'] || row['specialization'] || row['Specialty'] || row['Department'] || null;

        // Check for duplicate by sheet_row_id or matching phone
        let existing = await Lead.findOne({ where: { sheet_row_id: sheetRowId } });
        if (!existing && phone) {
          existing = await Lead.findOne({ where: { phone: String(phone).trim() } });
        }

        if (existing) {
          let hasChanges = false;
          if (address && !existing.address) {
            existing.address = String(address).trim();
            hasChanges = true;
          }
          if (city && !existing.city) {
            existing.city = String(city).trim();
            hasChanges = true;
          }
          if (clinicName && !existing.clinicName) {
            existing.clinicName = String(clinicName).trim();
            hasChanges = true;
          }
          if (specialization && !existing.specialization) {
            existing.specialization = String(specialization).trim();
            hasChanges = true;
          }
          if (email && !existing.email) {
            existing.email = String(email).trim();
            hasChanges = true;
          }

          if (hasChanges) {
            await existing.save();
            updated++;
          } else {
            skipped++;
          }
          continue;
        }

        await Lead.create({
          doctorName: docName,
          clinicName: clinicName ? String(clinicName).trim() : null,
          phone: phone ? String(phone).trim() : null,
          email: email ? String(email).trim() : null,
          city: city ? String(city).trim() : null,
          address: address ? String(address).trim() : null,
          specialization: specialization ? String(specialization).trim() : null,
          source: 'google_sheet',
          sheet_row_id: sheetRowId,
          stage: 'new',
        });

        created++;
      } catch (rowError) {
        console.error(`Error processing row ${i + 1}:`, rowError.message);
        errors++;
      }
    }

    const results = {
      totalRows: records.length,
      created,
      updated,
      skipped,
      errors,
    };

    const syncedAt = new Date().toISOString();

    // Persist last sync time and stats
    await Setting.upsert({
      key: 'google_sheet_last_synced_at',
      value: syncedAt,
    });

    await Setting.upsert({
      key: 'google_sheet_last_stats',
      value: JSON.stringify(results),
    });

    res.json({
      message: `Sheet sync completed: ${created} new leads created, ${updated} leads updated.`,
      sheetUrl,
      lastSyncedAt: syncedAt,
      results,
    });
  } catch (error) {
    console.error('Sync sheet error:', error);
    if (error.response) {
      return res.status(400).json({ message: 'Failed to fetch the sheet URL. Please check the URL.' });
    }
    res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Get dashboard stats (Admin) - GET /api/leads/stats
 */
const getStats = async (req, res) => {
  try {
    // Auto-sync any leads that have Converted / Won or Sale Completed to completed stage
    await Lead.update(
      { stage: 'completed', demoStatus: 'Sale Completed' },
      { where: { callStatus: 'Converted / Won', stage: { [Op.ne]: 'completed' } } }
    );
    await Lead.update(
      { stage: 'completed', callStatus: 'Converted / Won' },
      { where: { demoStatus: 'Sale Completed', stage: { [Op.ne]: 'completed' } } }
    );

    const totalLeads = await Lead.count();
    const newLeads = await Lead.count({ where: { stage: 'new' } });
    const callingLeads = await Lead.count({ where: { stage: 'calling' } });
    const demoLeads = await Lead.count({ where: { stage: 'demo' } });
    const completedLeads = await Lead.count({
      where: {
        [Op.or]: [
          { stage: 'completed' },
          { callStatus: 'Converted / Won' },
          { demoStatus: 'Sale Completed' },
        ],
      },
    });

    const totalCallingAgents = await User.count({ where: { role: 'calling_agent', isActive: true } });
    const totalDemoAgents = await User.count({ where: { role: 'demo_agent', isActive: true } });

    const interestedLeads = await Lead.count({ where: { callStatus: 'Interested' } });
    const demoScheduled = await Lead.count({ where: { demoStatus: 'Demo Scheduled' } });
    const saleCompleted = completedLeads;

    res.json({
      stats: {
        totalLeads,
        newLeads,
        callingLeads,
        demoLeads,
        completedLeads,
        totalCallingAgents,
        totalDemoAgents,
        interestedLeads,
        demoScheduled,
        saleCompleted,
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Get my leads (Calling Agent) - GET /api/leads/my-leads
 */
const getMyLeads = async (req, res) => {
  try {
    const { callStatus, search, followUpDate, followUpTime, timeSlot } = req.query;
    const where = { assignedCallingAgentId: req.user.id };

    if (callStatus) where.callStatus = callStatus;
    if (followUpDate) where.nextFollowUp = followUpDate;
    if (followUpTime) where.followUpTime = followUpTime;
    if (timeSlot) {
      if (timeSlot === 'morning') {
        where.followUpTime = { [Op.between]: ['06:00', '11:59'] };
      } else if (timeSlot === 'afternoon') {
        where.followUpTime = { [Op.between]: ['12:00', '16:59'] };
      } else if (timeSlot === 'evening') {
        where.followUpTime = { [Op.between]: ['17:00', '23:59'] };
      }
    }

    if (search) {
      where[Op.or] = [
        { doctorName: { [Op.iLike]: `%${search}%` } },
        { clinicName: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const leads = await Lead.findAll({
      where,
      include: [
        { model: User, as: 'demoAgent', attributes: ['id', 'name', 'email'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({ leads });
  } catch (error) {
    console.error('Get my leads error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Update call status (Calling Agent) - PATCH /api/leads/:id/call-status
 */
const updateCallStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { callStatus, notes, nextFollowUp, followUpTime, moveToDemoStage, assignedDemoAgentId } = req.body;

    const lead = await Lead.findByPk(id);

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found.' });
    }

    if (lead.assignedCallingAgentId !== req.user.id) {
      return res.status(403).json({ message: 'This lead is not assigned to you.' });
    }

    const updateData = {};

    if (callStatus) updateData.callStatus = callStatus;
    if (notes !== undefined) updateData.notes = notes;
    if (nextFollowUp !== undefined) updateData.nextFollowUp = nextFollowUp || null;
    if (followUpTime !== undefined) updateData.followUpTime = followUpTime || null;

    // Move to demo stage
    if (moveToDemoStage) {
      updateData.stage = 'demo';
      updateData.callStatus = 'Demo Scheduled';
      updateData.demoStatus = 'Demo Scheduled';

      if (assignedDemoAgentId) {
        const demoAgent = await User.findByPk(assignedDemoAgentId);
        if (demoAgent && demoAgent.role === 'demo_agent') {
          updateData.assignedDemoAgentId = assignedDemoAgentId;
        }
      }
    } else if (callStatus === 'Converted / Won') {
      updateData.stage = 'completed';
      updateData.demoStatus = 'Sale Completed';
    }

    await lead.update(updateData);

    const updatedLead = await Lead.findByPk(id, {
      include: [
        { model: User, as: 'callingAgent', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'demoAgent', attributes: ['id', 'name', 'email'] },
      ],
    });

    res.json({ message: 'Lead updated successfully', lead: updatedLead });
  } catch (error) {
    console.error('Update call status error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Get my demos (Demo Agent) - GET /api/leads/my-demos
 */
const getMyDemos = async (req, res) => {
  try {
    const { demoStatus, search } = req.query;
    const where = { assignedDemoAgentId: req.user.id };

    if (demoStatus) where.demoStatus = demoStatus;

    if (search) {
      where[Op.or] = [
        { doctorName: { [Op.iLike]: `%${search}%` } },
        { clinicName: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const leads = await Lead.findAll({
      where,
      include: [
        { model: User, as: 'callingAgent', attributes: ['id', 'name', 'email'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({ leads });
  } catch (error) {
    console.error('Get my demos error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Update demo status (Demo Agent) - PATCH /api/leads/:id/demo-status
 */
const updateDemoStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { demoStatus, demoNotes, nextFollowUp, demoDate } = req.body;

    const lead = await Lead.findByPk(id);

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found.' });
    }

    if (lead.assignedDemoAgentId !== req.user.id) {
      return res.status(403).json({ message: 'This demo is not assigned to you.' });
    }

    const updateData = {};

    if (demoStatus) {
      updateData.demoStatus = demoStatus;

      // Mark as completed if sale is completed
      if (demoStatus === 'Sale Completed') {
        updateData.stage = 'completed';
      }
    }

    if (demoNotes !== undefined) updateData.demoNotes = demoNotes;
    if (nextFollowUp !== undefined) updateData.nextFollowUp = nextFollowUp || null;
    if (demoDate !== undefined) updateData.demoDate = demoDate || null;

    await lead.update(updateData);

    const updatedLead = await Lead.findByPk(id, {
      include: [
        { model: User, as: 'callingAgent', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'demoAgent', attributes: ['id', 'name', 'email'] },
      ],
    });

    res.json({ message: 'Demo updated successfully', lead: updatedLead });
  } catch (error) {
    console.error('Update demo status error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Update lead details, call status, follow-up, notes (Admin) - PUT/PATCH /api/leads/:id
 */
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const lead = await Lead.findByPk(id);

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found.' });
    }

    const {
      doctorName,
      clinicName,
      phone,
      email,
      city,
      address,
      specialization,
      stage,
      callStatus,
      demoStatus,
      notes,
      demoNotes,
      nextFollowUp,
      followUpTime,
      demoDate,
      assignedCallingAgentId,
      assignedDemoAgentId,
    } = req.body;

    const updateData = {};
    if (doctorName !== undefined) updateData.doctorName = doctorName;
    if (clinicName !== undefined) updateData.clinicName = clinicName;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email || null;
    if (city !== undefined) updateData.city = city;
    if (address !== undefined) updateData.address = address || null;
    if (specialization !== undefined) updateData.specialization = specialization;
    if (stage !== undefined) updateData.stage = stage;
    if (callStatus !== undefined) updateData.callStatus = callStatus;
    if (demoStatus !== undefined) updateData.demoStatus = demoStatus;
    if (notes !== undefined) updateData.notes = notes;
    if (demoNotes !== undefined) updateData.demoNotes = demoNotes;
    if (nextFollowUp !== undefined) updateData.nextFollowUp = nextFollowUp || null;
    if (followUpTime !== undefined) updateData.followUpTime = followUpTime || null;
    if (demoDate !== undefined) updateData.demoDate = demoDate || null;
    if (assignedCallingAgentId !== undefined) {
      updateData.assignedCallingAgentId = assignedCallingAgentId ? parseInt(assignedCallingAgentId) : null;
    }
    if (assignedDemoAgentId !== undefined) {
      updateData.assignedDemoAgentId = assignedDemoAgentId ? parseInt(assignedDemoAgentId) : null;
    }

    // Auto stage adjustment
    if (callStatus === 'Demo Scheduled' || demoDate || assignedDemoAgentId) {
      if (updateData.stage === 'new' || updateData.stage === 'calling') {
        updateData.stage = 'demo';
      }
    }
    if (callStatus === 'Converted / Won' || demoStatus === 'Sale Completed') {
      updateData.stage = 'completed';
      if (callStatus === 'Converted / Won' && !demoStatus) {
        updateData.demoStatus = 'Sale Completed';
      }
      if (demoStatus === 'Sale Completed' && !callStatus) {
        updateData.callStatus = 'Converted / Won';
      }
    }

    await lead.update(updateData);

    const updatedLead = await Lead.findByPk(id, {
      include: [
        { model: User, as: 'callingAgent', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'demoAgent', attributes: ['id', 'name', 'email'] },
      ],
    });

    res.json({ message: 'Lead updated successfully', lead: updatedLead });
  } catch (error) {
    console.error('Update lead error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Delete lead (Admin) - DELETE /api/leads/:id
 */
const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const lead = await Lead.findByPk(id);

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found.' });
    }

    await lead.destroy();
    res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Delete lead error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = {
  getAll,
  create,
  update,
  remove,
  assignCallingAgent,
  assignDemoAgent,
  bulkAssign,
  bulkDelete,
  syncSheet,
  getSheetConfig,
  saveSheetConfig,
  getStats,
  getMyLeads,
  updateCallStatus,
  getMyDemos,
  updateDemoStatus,
};
