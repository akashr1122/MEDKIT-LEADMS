import React, { useState, useEffect, useCallback } from 'react';
import { leadService, userService } from '../../services/authService';
import Pagination from '../../components/Pagination';
import { toast } from 'react-toastify';
import {
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlineUserAdd,
  HiOutlineX,
  HiOutlinePhone,
  HiOutlineLocationMarker,
  HiOutlineDesktopComputer,
  HiOutlineCalendar,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineChatAlt2,
  HiOutlineRefresh,
  HiOutlineViewGrid,
  HiOutlineMenuAlt2,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineUser,
  HiOutlineOfficeBuilding,
  HiOutlineMail,
  HiOutlineBadgeCheck,
  HiOutlineBookmark,
} from 'react-icons/hi';

export const CALL_STATUS_GROUPS = [
  {
    group: 'Uncontacted & Queue',
    statuses: [
      'Pending',
      'No Response',
      'Busy / Line Engaged',
      'Switch Off / Unreachable',
      'Invalid / Wrong Number',
    ],
  },
  {
    group: 'Clinic & Doctor Availability',
    statuses: [
      'Spoke with Receptionist',
      'Doctor in OPD / Surgery',
    ],
  },
  {
    group: 'Active Follow-up',
    statuses: [
      'Call Done',
      'Callback Requested',
      'Follow-up Required',
    ],
  },
  {
    group: 'Qualified & Progressing',
    statuses: [
      'Interested',
      'Demo Scheduled',
      'Demo Completed',
      'Proposal Sent',
      'Converted / Won',
    ],
  },
  {
    group: 'Disqualified / Closed',
    statuses: [
      'Not Interested',
      'Using Competitor',
      'Clinic Closed / Retired',
    ],
  },
];

export const CALL_STATUSES = CALL_STATUS_GROUPS.flatMap(g => g.statuses);

const STAGES = [
  { value: 'new', label: 'New Ingestion' },
  { value: 'calling', label: 'Calling Pipeline' },
  { value: 'demo', label: 'Demo Pipeline' },
  { value: 'completed', label: 'Completed / Won' },
];

const ManageLeads = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [callingAgents, setCallingAgents] = useState([]);
  const [demoAgents, setDemoAgents] = useState([]);
  const [filterStage, setFilterStage] = useState('');
  const [filterCallStatus, setFilterCallStatus] = useState('');
  const [filterFollowUpDate, setFilterFollowUpDate] = useState('');
  const [filterFollowUpTime, setFilterFollowUpTime] = useState('');
  const [filterTimeSlot, setFilterTimeSlot] = useState('');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('auto'); // 'auto' | 'table' | 'cards'
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

  // Forms
  const [addForm, setAddForm] = useState({
    doctorName: '', clinicName: '', phone: '', email: '', city: '', address: '', specialization: '',
    source: '', needForClinic: '', demoTime: '',
  });

  const [statusForm, setStatusForm] = useState({
    callStatus: 'Follow-up Required',
    nextFollowUp: '',
    followUpTime: '',
    notes: '',
    moveToDemoStage: false,
    assignedDemoAgentId: '',
    demoDate: '',
  });

  const [editForm, setEditForm] = useState({
    doctorName: '',
    clinicName: '',
    phone: '',
    email: '',
    city: '',
    address: '',
    specialization: '',
    source: '',
    needForClinic: '',
    demoTime: '',
    stage: 'new',
    callStatus: 'Pending',
    nextFollowUp: '',
    followUpTime: '',
    notes: '',
    assignedCallingAgentId: '',
    assignedDemoAgentId: '',
  });

  const [assignAgentId, setAssignAgentId] = useState('');
  const [demoAssign, setDemoAssign] = useState({ assignedDemoAgentId: '', demoDate: '' });
  const [syncSheetUrl, setSyncSheetUrl] = useState(() => localStorage.getItem('saved_sheet_url') || '');
  const [savedSheetUrl, setSavedSheetUrl] = useState(() => localStorage.getItem('saved_sheet_url') || '');
  const [savingUrl, setSavingUrl] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchLeads = useCallback(async () => {
    try {
      const params = {};
      if (filterStage) params.stage = filterStage;
      if (filterCallStatus) params.callStatus = filterCallStatus;
      if (filterFollowUpDate) params.followUpDate = filterFollowUpDate;
      if (filterFollowUpTime) params.followUpTime = filterFollowUpTime;
      if (filterTimeSlot) params.timeSlot = filterTimeSlot;
      if (search) params.search = search;
      const response = await leadService.getAll(params);
      setLeads(response.data.leads);
    } catch (error) {
      toast.error('Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  }, [filterStage, filterCallStatus, filterFollowUpDate, filterFollowUpTime, filterTimeSlot, search]);

  const fetchAgents = useCallback(async () => {
    try {
      const [callingRes, demoRes] = await Promise.all([
        userService.getAll({ role: 'calling_agent', isActive: 'true' }),
        userService.getAll({ role: 'demo_agent', isActive: 'true' }),
      ]);
      setCallingAgents(callingRes.data.users);
      setDemoAgents(demoRes.data.users);
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
    fetchAgents();

    // Auto-load saved sheet configuration from database
    const loadSheetConfig = async () => {
      try {
        const res = await leadService.getSheetConfig();
        if (res.data?.sheetUrl) {
          setSyncSheetUrl(res.data.sheetUrl);
          setSavedSheetUrl(res.data.sheetUrl);
          localStorage.setItem('saved_sheet_url', res.data.sheetUrl);
        }
      } catch (err) {
        console.log('Notice: Could not load sheet config:', err.message);
      }
    };
    loadSheetConfig();
  }, [fetchLeads, fetchAgents]);

  const getTodayStr = () => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  };

  const getTomorrowStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const hasActiveFilters = filterStage || filterCallStatus || filterFollowUpDate || filterFollowUpTime || filterTimeSlot || search;

  const resetAllFilters = () => {
    setFilterStage('');
    setFilterCallStatus('');
    setFilterFollowUpDate('');
    setFilterFollowUpTime('');
    setFilterTimeSlot('');
    setSearch('');
    setCurrentPage(1);
  };

  // Reset pagination when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStage, filterCallStatus, filterFollowUpDate, filterFollowUpTime, filterTimeSlot, search]);

  const totalLeadsCount = leads.length;
  const paginatedLeads = leads.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Multi-selection state
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkAssignType, setBulkAssignType] = useState('calling'); // 'calling' | 'demo'
  const [bulkCallingAgentId, setBulkCallingAgentId] = useState('');
  const [bulkDemoAgentId, setBulkDemoAgentId] = useState('');
  const [bulkDemoDate, setBulkDemoDate] = useState('');
  const [bulkSaving, setBulkSaving] = useState(false);

  // Selection helpers
  const toggleSelectLead = (id) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const isAllPageSelected =
    paginatedLeads.length > 0 && paginatedLeads.every((l) => selectedLeadIds.includes(l.id));

  const toggleSelectPage = () => {
    if (isAllPageSelected) {
      const pageIds = paginatedLeads.map((l) => l.id);
      setSelectedLeadIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      const pageIds = paginatedLeads.map((l) => l.id);
      setSelectedLeadIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const selectAllFiltered = () => {
    setSelectedLeadIds(leads.map((l) => l.id));
  };

  const clearSelection = () => {
    setSelectedLeadIds([]);
  };

  const openBulkAssign = (type) => {
    setBulkAssignType(type);
    if (type === 'calling' && callingAgents.length > 0) {
      setBulkCallingAgentId(callingAgents[0].id.toString());
    } else {
      setBulkCallingAgentId('');
    }
    if (type === 'demo' && demoAgents.length > 0) {
      setBulkDemoAgentId(demoAgents[0].id.toString());
    } else {
      setBulkDemoAgentId('');
    }
    setBulkDemoDate('');
    setShowBulkModal(true);
  };

  const handleBulkAssignSubmit = async (e) => {
    e.preventDefault();
    if (selectedLeadIds.length === 0) {
      toast.error('No leads selected');
      return;
    }

    setBulkSaving(true);
    try {
      const payload = {
        leadIds: selectedLeadIds,
      };

      if (bulkAssignType === 'calling') {
        if (!bulkCallingAgentId) {
          toast.error('Please select a calling agent');
          setBulkSaving(false);
          return;
        }
        payload.assignedCallingAgentId = parseInt(bulkCallingAgentId);
      } else {
        if (!bulkDemoAgentId) {
          toast.error('Please select a demo specialist');
          setBulkSaving(false);
          return;
        }
        payload.assignedDemoAgentId = parseInt(bulkDemoAgentId);
        if (bulkDemoDate) {
          payload.demoDate = bulkDemoDate;
        }
      }

      const res = await leadService.bulkAssign(payload);
      toast.success(res.data.message || `Successfully assigned ${selectedLeadIds.length} leads`);
      setShowBulkModal(false);
      setSelectedLeadIds([]);
      fetchLeads();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to bulk assign leads');
    } finally {
      setBulkSaving(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedLeadIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to permanently delete ${selectedLeadIds.length} selected leads?`)) return;

    try {
      const res = await leadService.bulkDelete({ leadIds: selectedLeadIds });
      toast.success(res.data.message || `Deleted ${selectedLeadIds.length} leads`);
      setSelectedLeadIds([]);
      fetchLeads();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete leads');
    }
  };

  const handleAddLead = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await leadService.create(addForm);
      toast.success('Lead created successfully');
      setShowAddModal(false);
      setAddForm({
        doctorName: '', clinicName: '', phone: '', email: '', city: '', address: '', specialization: '',
        source: '', needForClinic: '', demoTime: '',
      });
      fetchLeads();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create lead');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSheetUrlOnly = async () => {
    if (!syncSheetUrl.trim()) {
      toast.error('Please enter a Google Sheet URL to save');
      return;
    }
    setSavingUrl(true);
    try {
      await leadService.saveSheetUrl(syncSheetUrl.trim());
      setSavedSheetUrl(syncSheetUrl.trim());
      localStorage.setItem('saved_sheet_url', syncSheetUrl.trim());
      toast.success('Google Sheet link saved! It will load automatically every time.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save sheet URL');
    } finally {
      setSavingUrl(false);
    }
  };

  const handleSyncSheet = async (e) => {
    e.preventDefault();
    if (!syncSheetUrl.trim()) {
      toast.error('Please enter Google Sheet CSV URL');
      return;
    }
    setSyncing(true);
    setSyncResults(null);
    try {
      const res = await leadService.syncSheet(syncSheetUrl.trim());
      setSyncResults(res.data.results);
      setSavedSheetUrl(syncSheetUrl.trim());
      localStorage.setItem('saved_sheet_url', syncSheetUrl.trim());
      toast.success(res.data.message || 'Sheet synced and link saved successfully');
      fetchLeads();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to sync Google Sheet');
    } finally {
      setSyncing(false);
    }
  };

  // Open Status & Follow-up Modal
  const openStatusModal = (lead) => {
    setSelectedLead(lead);
    setStatusForm({
      callStatus: lead.callStatus || 'Follow-up Required',
      nextFollowUp: lead.nextFollowUp || '',
      followUpTime: lead.followUpTime || '',
      notes: lead.notes || '',
      moveToDemoStage: lead.stage === 'demo',
      assignedDemoAgentId: lead.assignedDemoAgentId || '',
      demoDate: lead.demoDate || '',
    });
    setShowStatusModal(true);
  };

  const handleSaveStatus = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        callStatus: statusForm.callStatus,
        nextFollowUp: statusForm.nextFollowUp || null,
        followUpTime: statusForm.followUpTime || null,
        notes: statusForm.notes,
      };

      if (statusForm.moveToDemoStage) {
        payload.stage = 'demo';
        if (statusForm.assignedDemoAgentId) {
          payload.assignedDemoAgentId = parseInt(statusForm.assignedDemoAgentId);
        }
        if (statusForm.demoDate) {
          payload.demoDate = statusForm.demoDate;
        }
      } else if (statusForm.callStatus === 'Converted / Won') {
        payload.stage = 'completed';
        payload.demoStatus = 'Sale Completed';
      }

      await leadService.update(selectedLead.id, payload);
      toast.success('Lead status and follow-up saved');
      setShowStatusModal(false);
      fetchLeads();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update lead status');
    } finally {
      setSaving(false);
    }
  };

  // Open Full Edit Modal
  const openEditModal = (lead) => {
    setSelectedLead(lead);
    setEditForm({
      doctorName: lead.doctorName || '',
      clinicName: lead.clinicName || '',
      phone: lead.phone || '',
      email: lead.email || '',
      city: lead.city || '',
      address: lead.address || '',
      specialization: lead.specialization || '',
      source: lead.source || '',
      needForClinic: lead.needForClinic || '',
      demoTime: lead.demoTime || '',
      stage: lead.stage || 'new',
      callStatus: lead.callStatus || 'Pending',
      nextFollowUp: lead.nextFollowUp || '',
      followUpTime: lead.followUpTime || '',
      notes: lead.notes || '',
      assignedCallingAgentId: lead.assignedCallingAgentId || '',
      assignedDemoAgentId: lead.assignedDemoAgentId || '',
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        doctorName: editForm.doctorName,
        clinicName: editForm.clinicName || null,
        phone: editForm.phone || null,
        email: editForm.email || null,
        city: editForm.city || null,
        address: editForm.address || null,
        specialization: editForm.specialization || null,
        source: editForm.source || 'manual',
        needForClinic: editForm.needForClinic || null,
        demoTime: editForm.demoTime || null,
        stage: editForm.stage,
        callStatus: editForm.callStatus,
        nextFollowUp: editForm.nextFollowUp || null,
        followUpTime: editForm.followUpTime || null,
        notes: editForm.notes || null,
        assignedCallingAgentId: editForm.assignedCallingAgentId ? parseInt(editForm.assignedCallingAgentId) : null,
        assignedDemoAgentId: editForm.assignedDemoAgentId ? parseInt(editForm.assignedDemoAgentId) : null,
      };

      if (editForm.callStatus === 'Converted / Won') {
        payload.stage = 'completed';
        payload.demoStatus = 'Sale Completed';
      }

      await leadService.update(selectedLead.id, payload);
      toast.success('Lead details updated');
      setShowEditModal(false);
      fetchLeads();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update lead');
    } finally {
      setSaving(false);
    }
  };

  // Delete lead
  const handleDeleteLead = async (lead) => {
    if (!window.confirm(`Are you sure you want to delete lead: ${lead.doctorName}?`)) return;
    try {
      await leadService.delete(lead.id);
      toast.success('Lead deleted');
      fetchLeads();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete lead');
    }
  };

  // Assign calling agent
  const handleAssign = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await leadService.assignCallingAgent(selectedLead.id, {
        assignedCallingAgentId: parseInt(assignAgentId),
      });
      toast.success('Calling agent assigned');
      setShowAssignModal(false);
      fetchLeads();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign');
    } finally {
      setSaving(false);
    }
  };

  // Move to demo
  const handleAssignDemo = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await leadService.assignDemoAgent(selectedLead.id, {
        assignedDemoAgentId: demoAssign.assignedDemoAgentId ? parseInt(demoAssign.assignedDemoAgentId) : null,
        demoDate: demoAssign.demoDate || null,
      });
      toast.success('Moved to demo stage');
      setShowDemoModal(false);
      fetchLeads();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign demo');
    } finally {
      setSaving(false);
    }
  };

  const getStageBadge = (stage) => {
    const map = {
      new: { class: 'badge-accent', label: 'New Lead' },
      calling: { class: 'badge-info', label: 'Calling' },
      demo: { class: 'badge-warning', label: 'Demo' },
      completed: { class: 'badge-success', label: 'Completed' },
    };
    const item = map[stage] || { class: 'badge-neutral', label: stage };
    return (
      <span className={`badge ${item.class}`}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }}></span>
        {item.label}
      </span>
    );
  };

  const getCallStatusBadge = (status) => {
    const map = {
      'Pending': 'badge-neutral',
      'No Response': 'badge-warning',
      'Busy / Line Engaged': 'badge-warning',
      'Switch Off / Unreachable': 'badge-neutral',
      'Invalid / Wrong Number': 'badge-danger',
      'Spoke with Receptionist': 'badge-info',
      'Doctor in OPD / Surgery': 'badge-info',
      'Call Done': 'badge-info',
      'Callback Requested': 'badge-accent',
      'Follow-up Required': 'badge-warning',
      'Interested': 'badge-success',
      'Demo Scheduled': 'badge-accent',
      'Demo Completed': 'badge-success',
      'Proposal Sent': 'badge-accent',
      'Converted / Won': 'badge-success',
      'Not Interested': 'badge-danger',
      'Using Competitor': 'badge-neutral',
      'Clinic Closed / Retired': 'badge-danger',
    };
    return (
      <span className={`badge ${map[status] || 'badge-neutral'}`}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }}></span>
        {status}
      </span>
    );
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    if (hours === undefined || minutes === undefined) return timeStr;
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const formattedH = h % 12 || 12;
    return `${formattedH}:${minutes} ${ampm}`;
  };

  const formatFollowUpInfo = (dateStr, timeStr) => {
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    if (parts.length !== 3) return { formatted: dateStr, badge: 'badge-neutral', label: dateStr, time: formatTime(timeStr) };

    const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dateObj.setHours(0, 0, 0, 0);

    const diffDays = Math.round((dateObj - today) / (1000 * 60 * 60 * 24));

    let badge = 'badge-info';
    let label = 'Upcoming';

    if (diffDays === 0) {
      badge = 'badge-warning';
      label = 'Today';
    } else if (diffDays === 1) {
      badge = 'badge-accent';
      label = 'Tomorrow';
    } else if (diffDays < 0) {
      badge = 'badge-danger';
      label = 'Overdue';
    }

    const formatted = dateObj.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    return { formatted, badge, label, isToday: diffDays === 0, time: formatTime(timeStr) };
  };

  const getDoctorInitials = (name) => {
    if (!name) return 'DR';
    return name.replace(/^(dr\.?\s*)/i, '').slice(0, 2).toUpperCase();
  };

  const isCardsForced = viewMode === 'cards';

  return (
    <div>
      <div className="page-header">
        <h1>Lead Management & Follow-ups</h1>
        <p>Manage doctor outreach, update call outcomes, schedule follow-ups, and filter by callback dates</p>
      </div>

      <div className="table-wrapper">
        {/* Row 1: Header with Title, Count, Search & Add Lead */}
        <div className="table-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
              Doctor Leads ({leads.length})
            </h2>
            {filterFollowUpDate && (
              <span className="badge badge-warning" style={{ fontSize: '0.75rem', gap: 6 }}>
                <HiOutlineCalendar />
                Follow-up: {filterFollowUpDate}
                <button
                  type="button"
                  onClick={() => setFilterFollowUpDate('')}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'inherit' }}
                  title="Clear date filter"
                >
                  <HiOutlineX />
                </button>
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {/* View Mode Switcher for Desktop / Tablet */}
            <div style={{ display: 'flex', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', padding: 2, border: '1px solid var(--border-color)' }}>
              <button
                type="button"
                className={`btn btn-sm ${viewMode === 'table' || viewMode === 'auto' ? 'btn-ghost' : ''}`}
                style={{ padding: '4px 8px', fontSize: '0.8rem', background: (viewMode === 'table' || viewMode === 'auto') ? '#ffffff' : 'transparent', border: 'none', boxShadow: (viewMode === 'table' || viewMode === 'auto') ? 'var(--shadow-xs)' : 'none' }}
                onClick={() => setViewMode('table')}
                title="Table View"
              >
                <HiOutlineMenuAlt2 />
              </button>
              <button
                type="button"
                className={`btn btn-sm ${viewMode === 'cards' ? 'btn-ghost' : ''}`}
                style={{ padding: '4px 8px', fontSize: '0.8rem', background: viewMode === 'cards' ? '#ffffff' : 'transparent', border: 'none', boxShadow: viewMode === 'cards' ? 'var(--shadow-xs)' : 'none' }}
                onClick={() => setViewMode('cards')}
                title="Cards View"
              >
                <HiOutlineViewGrid />
              </button>
            </div>

            {/* Search Input */}
            <div className="search-input-wrapper">
              <HiOutlineSearch className="search-icon" />
              <input
                type="text"
                className="form-input"
                placeholder="Search doctor, clinic..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Sync Google Sheet CTA */}
            <button
              className="btn btn-ghost"
              onClick={() => { setShowSyncModal(true); setSyncResults(null); }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontWeight: 700,
                border: '1px solid var(--border-color)',
                background: '#ffffff',
                color: 'var(--text-primary)'
              }}
              title="Sync leads from Google Sheet"
            >
              <HiOutlineRefresh />
              <span>Sync Sheet</span>
            </button>

            {/* Add Lead Primary CTA */}
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
              <HiOutlinePlus />
              <span>Add Lead</span>
            </button>
          </div>
        </div>

        {/* Row 2: Secondary Filter Toolbar */}
        <div className="table-toolbar">
          <div className="table-toolbar-left">
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Filter:
            </span>

            {/* Stage Filter */}
            <select
              className="form-select"
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value)}
              style={{ width: 140, padding: '6px 28px 6px 12px', fontSize: '0.8rem' }}
            >
              <option value="">All Stages</option>
              {STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>

            {/* Status Filter */}
            <select
              className="form-select"
              value={filterCallStatus}
              onChange={(e) => setFilterCallStatus(e.target.value)}
              style={{ width: 175, padding: '6px 28px 6px 12px', fontSize: '0.8rem' }}
            >
              <option value="">All Call Statuses</option>
              {CALL_STATUS_GROUPS.map((grp) => (
                <optgroup key={grp.group} label={`── ${grp.group} ──`}>
                  {grp.statuses.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </optgroup>
              ))}
            </select>

            {/* Follow-up Date Picker with Calendar Icon */}
            <div className="date-filter-box" style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '4px 8px'
            }}>
              <HiOutlineCalendar style={{ color: 'var(--color-primary)', fontSize: '1rem', flexShrink: 0 }} />
              <input
                type="date"
                value={filterFollowUpDate}
                onChange={(e) => setFilterFollowUpDate(e.target.value)}
                title="Filter by exact Follow-up Date"
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '0.8rem',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              />
              {filterFollowUpDate && (
                <button
                  type="button"
                  onClick={() => setFilterFollowUpDate('')}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
                  title="Clear date"
                >
                  <HiOutlineX />
                </button>
              )}
            </div>

            {/* Quick Date Chips: Today | Tomorrow */}
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                className={`btn btn-sm ${filterFollowUpDate === getTodayStr() ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setFilterFollowUpDate(filterFollowUpDate === getTodayStr() ? '' : getTodayStr())}
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                title="Show leads to call today"
              >
                Today
              </button>

              <button
                type="button"
                className={`btn btn-sm ${filterFollowUpDate === getTomorrowStr() ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setFilterFollowUpDate(filterFollowUpDate === getTomorrowStr() ? '' : getTomorrowStr())}
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                title="Show leads to call tomorrow"
              >
                Tomorrow
              </button>
            </div>

            {/* Time Slot Filter */}
            <select
              className="form-select"
              value={filterTimeSlot}
              onChange={(e) => {
                setFilterTimeSlot(e.target.value);
                if (e.target.value) setFilterFollowUpTime('');
              }}
              style={{ width: 145, padding: '6px 28px 6px 10px', fontSize: '0.8rem' }}
              title="Filter by Time Slot"
            >
              <option value="">All Time Slots</option>
              <option value="morning">🌅 Morning (6-12)</option>
              <option value="afternoon">☀️ Afternoon (12-5)</option>
              <option value="evening">🌙 Evening (5-11)</option>
            </select>

            {/* Exact Time Picker */}
            <div className="date-filter-box" style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '4px 8px'
            }}>
              <HiOutlineClock style={{ color: 'var(--color-primary)', fontSize: '1rem', flexShrink: 0 }} />
              <input
                type="time"
                value={filterFollowUpTime}
                onChange={(e) => {
                  setFilterFollowUpTime(e.target.value);
                  if (e.target.value) setFilterTimeSlot('');
                }}
                title="Filter by exact Follow-up Time"
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '0.8rem',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              />
              {filterFollowUpTime && (
                <button
                  type="button"
                  onClick={() => setFilterFollowUpTime('')}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 0 }}
                  title="Clear time"
                >
                  <HiOutlineX />
                </button>
              )}
            </div>
          </div>

          {/* Right Toolbar Actions */}
          <div className="table-toolbar-right">
            {hasActiveFilters && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={resetAllFilters}
                style={{ fontSize: '0.75rem', padding: '4px 10px', color: 'var(--color-danger)' }}
                title="Reset all active filters"
              >
                <HiOutlineRefresh />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="loading-center">
            <div className="spinner spinner-lg"></div>
            <p>Loading doctor leads...</p>
          </div>
        ) : leads.length === 0 ? (
          <div className="table-empty">
            <HiOutlineSearch style={{ fontSize: '2.5rem', opacity: 0.4 }} />
            <p>No doctor leads found matching current filters.</p>
            {hasActiveFilters && (
              <button
                className="btn btn-ghost btn-sm"
                style={{ marginTop: 12 }}
                onClick={resetAllFilters}
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Floating Bulk Action Bar */}
            {selectedLeadIds.length > 0 && (
              <div className="bulk-action-bar">
                <div className="bulk-action-left">
                  <span className="bulk-count-badge">
                    <HiOutlineBadgeCheck style={{ fontSize: '1.05rem', color: '#86efac' }} />
                    {selectedLeadIds.length} {selectedLeadIds.length === 1 ? 'Doctor Lead' : 'Doctor Leads'} Selected
                  </span>
                  {leads.length > selectedLeadIds.length && (
                    <button
                      type="button"
                      className="bulk-select-all-btn"
                      onClick={selectAllFiltered}
                    >
                      Select all {leads.length} filtered leads
                    </button>
                  )}
                </div>

                <div className="bulk-action-buttons">
                  <button
                    type="button"
                    className="bulk-btn bulk-btn-calling"
                    onClick={() => openBulkAssign('calling')}
                    title="Assign selected leads to a Calling Agent"
                  >
                    <HiOutlineUserAdd />
                    <span>Assign Calling Rep</span>
                  </button>

                  <button
                    type="button"
                    className="bulk-btn bulk-btn-demo"
                    onClick={() => openBulkAssign('demo')}
                    title="Assign selected leads to a Demo Specialist"
                  >
                    <HiOutlineDesktopComputer />
                    <span>Assign Demo Rep</span>
                  </button>

                  <button
                    type="button"
                    className="bulk-btn bulk-btn-delete"
                    onClick={handleBulkDelete}
                    title="Delete selected leads"
                  >
                    <HiOutlineTrash />
                    <span>Delete</span>
                  </button>

                  <button
                    type="button"
                    className="bulk-btn bulk-btn-clear"
                    onClick={clearSelection}
                    title="Clear selection"
                  >
                    <HiOutlineX />
                    <span>Deselect</span>
                  </button>
                </div>
              </div>
            )}

            {/* Desktop Table View (Sticky Actions Column & Guaranteed Horizontal Scroll) */}
            <div className={`table-scroll table-desktop-view ${isCardsForced ? 'hide-desktop' : ''}`}>
              <table className="data-table" style={{ minWidth: 1100 }}>
                <thead>
                  <tr>
                    <th style={{ width: 44, textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        className="lead-checkbox"
                        checked={isAllPageSelected}
                        onChange={toggleSelectPage}
                        title={isAllPageSelected ? "Deselect Page" : "Select Entire Page"}
                      />
                    </th>
                    <th style={{ minWidth: 220 }}>Doctor & Practice</th>
                    <th style={{ minWidth: 160 }}>Contact & City</th>
                    <th style={{ minWidth: 150 }}>Stage & Status</th>
                    <th style={{ minWidth: 140 }}>Next Follow-up</th>
                    <th style={{ minWidth: 140 }}>Call Notes</th>
                    <th style={{ minWidth: 150 }}>Agents</th>
                    <th className="actions-col" style={{ width: 220, textAlign: 'center' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLeads.map((lead) => {
                    const isSelected = selectedLeadIds.includes(lead.id);
                    const followUp = formatFollowUpInfo(lead.nextFollowUp, lead.followUpTime);

                    return (
                      <tr key={lead.id} className={isSelected ? 'row-selected' : ''}>
                        <td style={{ width: 44, textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            className="lead-checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectLead(lead.id)}
                          />
                        </td>
                        {/* Doctor & Practice */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                              width: 38,
                              height: 38,
                              borderRadius: '10px',
                              background: 'linear-gradient(135deg, #4f46e5, #0284c7)',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              flexShrink: 0,
                              boxShadow: '0 2px 6px rgba(79, 70, 229, 0.2)'
                            }}>
                              {getDoctorInitials(lead.doctorName)}
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                                  {lead.doctorName}
                                </span>
                                {lead.source && lead.source !== 'manual' && lead.source !== 'google_sheet' && (
                                  <span className="badge badge-neutral" style={{ fontSize: '0.68rem', padding: '1px 5px', background: '#eff6ff', color: '#1d4ed8' }}>
                                    {lead.source}
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                {lead.clinicName || lead.specialization || 'Medical Practice'}
                              </div>
                              {lead.needForClinic && (
                                <div style={{ fontSize: '0.72rem', color: '#0d9488', marginTop: 2, display: 'inline-flex', alignItems: 'center', gap: 3 }} title={lead.needForClinic}>
                                  <span>🎯 Need:</span>
                                  <span style={{ maxWidth: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lead.needForClinic}</span>
                                </div>
                              )}
                              {lead.demoTime && (
                                <div style={{ fontSize: '0.72rem', color: '#b45309', fontWeight: 600, marginTop: 1, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                  <HiOutlineClock style={{ fontSize: '0.75rem' }} />
                                  <span>Demo: {lead.demoTime}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Contact & Location */}
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {lead.phone ? (
                              <a
                                href={`tel:${lead.phone}`}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-primary)', textDecoration: 'none' }}
                              >
                                <HiOutlinePhone style={{ fontSize: '0.9rem' }} />
                                {lead.phone}
                              </a>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No phone</span>
                            )}
                            {(lead.address || lead.city) && (
                              <span
                                title={[lead.address, lead.city].filter(Boolean).join(', ')}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  color: 'var(--text-secondary)',
                                  fontSize: '0.78rem',
                                  maxWidth: 190,
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}
                              >
                                <HiOutlineLocationMarker style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                                <span>{lead.address ? lead.address : lead.city}</span>
                                {lead.address && lead.city && !lead.address.toLowerCase().includes(lead.city.toLowerCase()) && (
                                  <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>({lead.city})</span>
                                )}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Stage & Status */}
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                            {getStageBadge(lead.stage)}
                            {getCallStatusBadge(lead.callStatus)}
                          </div>
                        </td>

                        {/* Next Follow-up Date & Time */}
                        <td>
                          {followUp ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                color: followUp.isToday ? '#d97706' : 'var(--text-primary)'
                              }}>
                                <HiOutlineCalendar style={{ color: 'var(--color-primary)' }} />
                                {followUp.formatted}
                              </span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                                <span className={`badge ${followUp.badge} badge-xs`}>
                                  {followUp.label}
                                </span>
                                {followUp.time && (
                                  <span style={{
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    color: '#4338ca',
                                    background: '#e0e7ff',
                                    padding: '1px 6px',
                                    borderRadius: 4,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 3
                                  }}>
                                    <HiOutlineClock style={{ fontSize: '0.75rem' }} />
                                    {followUp.time}
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No date set</span>
                          )}
                        </td>

                        {/* Call Notes snippet */}
                        <td>
                          {lead.notes ? (
                            <span
                              title={lead.notes}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                fontSize: '0.8rem',
                                color: 'var(--text-secondary)',
                                maxWidth: 150,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                            >
                              <HiOutlineChatAlt2 style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                              {lead.notes}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                          )}
                        </td>

                        {/* Agents (Calling / Demo) */}
                        <td>
                          <div style={{ fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <div>
                              <span style={{ color: 'var(--text-muted)' }}>Call: </span>
                              <strong style={{ color: lead.callingAgent ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                                {lead.callingAgent?.name || 'Unassigned'}
                              </strong>
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-muted)' }}>Demo: </span>
                              <strong style={{ color: lead.demoAgent ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                                {lead.demoAgent?.name || 'Unassigned'}
                              </strong>
                            </div>
                          </div>
                        </td>

                        {/* Sticky Actions Column - Always 100% visible on screen */}
                        <td className="actions-col" style={{ textAlign: 'center' }}>
                          <div className="inline-actions" style={{ justifyContent: 'center', gap: 6 }}>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => openStatusModal(lead)}
                              title="Update Status & Set Follow-up Date"
                              style={{ padding: '6px 12px', fontWeight: 700 }}
                            >
                              <HiOutlinePhone />
                              <span>Follow-up</span>
                            </button>

                            <button
                              className="btn btn-ghost btn-icon btn-sm"
                              onClick={() => { setSelectedLead(lead); setAssignAgentId(lead.assignedCallingAgentId || ''); setShowAssignModal(true); }}
                              title="Assign Calling Agent"
                            >
                              <HiOutlineUserAdd />
                            </button>

                            <button
                              className="btn btn-ghost btn-icon btn-sm"
                              onClick={() => { setSelectedLead(lead); setDemoAssign({ assignedDemoAgentId: lead.assignedDemoAgentId || '', demoDate: lead.demoDate || '' }); setShowDemoModal(true); }}
                              title="Schedule Demo"
                              style={{ color: '#0284c7' }}
                            >
                              <HiOutlineDesktopComputer />
                            </button>

                            <button
                              className="btn btn-ghost btn-icon btn-sm"
                              onClick={() => openEditModal(lead)}
                              title="Edit Lead Details"
                            >
                              <HiOutlinePencil />
                            </button>

                            <button
                              className="btn btn-ghost btn-icon btn-sm"
                              onClick={() => handleDeleteLead(lead)}
                              title="Delete Lead"
                              style={{ color: 'var(--color-danger)' }}
                            >
                              <HiOutlineTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile & Tablet Card Grid (Auto on <= 860px or forced via View Switcher) */}
            <div className={`leads-card-grid ${isCardsForced ? 'force-cards' : ''}`}>
              {paginatedLeads.map((lead) => {
                const isSelected = selectedLeadIds.includes(lead.id);
                const followUp = formatFollowUpInfo(lead.nextFollowUp, lead.followUpTime);

                return (
                  <div key={lead.id} className={`lead-mobile-card ${isSelected ? 'card-selected' : ''}`}>
                    {/* Top Row: Doctor Name + Badges */}
                    <div className="lead-card-top">
                      <div className="lead-card-doctor">
                        <div className="card-select-overlay">
                          <input
                            type="checkbox"
                            className="lead-checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectLead(lead.id)}
                          />
                        </div>
                        <div className="doctor-avatar">{getDoctorInitials(lead.doctorName)}</div>
                        <div>
                          <div className="doctor-name">{lead.doctorName}</div>
                          <div className="doctor-clinic">{lead.clinicName || lead.specialization || 'Medical Practice'}</div>
                        </div>
                      </div>
                      <div className="lead-card-badges">
                        {getStageBadge(lead.stage)}
                        {getCallStatusBadge(lead.callStatus)}
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="lead-card-details">
                      <div className="lead-detail-item">
                        <span className="detail-label">Phone Contact</span>
                        {lead.phone ? (
                          <a href={`tel:${lead.phone}`} className="detail-val phone-val">
                            <HiOutlinePhone /> {lead.phone}
                          </a>
                        ) : (
                          <span className="detail-val" style={{ color: 'var(--text-muted)' }}>No phone</span>
                        )}
                      </div>

                      <div className="lead-detail-item">
                        <span className="detail-label">Location & Address</span>
                        <span className="detail-val" title={[lead.address, lead.city].filter(Boolean).join(', ')}>
                          {(lead.address || lead.city) ? (
                            <>
                              <HiOutlineLocationMarker />
                              <span>{lead.address ? lead.address : lead.city}</span>
                              {lead.address && lead.city && !lead.address.toLowerCase().includes(lead.city.toLowerCase()) && (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>({lead.city})</span>
                              )}
                            </>
                          ) : '—'}
                        </span>
                      </div>

                      <div className="lead-detail-item">
                        <span className="detail-label">Next Follow-up</span>
                        <span className="detail-val">
                          {followUp ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <span className={`badge ${followUp.badge} badge-xs`}>
                                <HiOutlineCalendar /> {followUp.formatted} ({followUp.label})
                              </span>
                              {followUp.time && (
                                <span style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  color: '#4338ca',
                                  background: '#e0e7ff',
                                  padding: '1px 6px',
                                  borderRadius: 4,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 3
                                }}>
                                  <HiOutlineClock /> {followUp.time}
                                </span>
                              )}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>No date scheduled</span>
                          )}
                        </span>
                      </div>

                      <div className="lead-detail-item">
                        <span className="detail-label">Assigned Reps</span>
                        <span className="detail-val" style={{ fontSize: '0.75rem' }}>
                          Call: <strong>{lead.callingAgent?.name || 'Unassigned'}</strong>
                        </span>
                      </div>

                      {lead.notes && (
                        <div className="lead-detail-item full-width">
                          <span className="detail-label">Call Notes</span>
                          <span className="detail-val notes-val">
                            <HiOutlineChatAlt2 /> {lead.notes}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons Row */}
                    <div className="lead-card-actions">
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => openStatusModal(lead)}
                        style={{ flex: '1 1 auto', fontWeight: 700 }}
                      >
                        <HiOutlinePhone />
                        <span>Log Follow-up</span>
                      </button>

                      <button
                        className="btn btn-ghost btn-sm btn-icon-mobile"
                        onClick={() => { setSelectedLead(lead); setAssignAgentId(lead.assignedCallingAgentId || ''); setShowAssignModal(true); }}
                        title="Assign Calling Agent"
                      >
                        <HiOutlineUserAdd />
                      </button>

                      <button
                        className="btn btn-ghost btn-sm btn-icon-mobile"
                        onClick={() => { setSelectedLead(lead); setDemoAssign({ assignedDemoAgentId: lead.assignedDemoAgentId || '', demoDate: lead.demoDate || '' }); setShowDemoModal(true); }}
                        title="Schedule Demo"
                        style={{ color: '#0284c7' }}
                      >
                        <HiOutlineDesktopComputer />
                      </button>

                      <button
                        className="btn btn-ghost btn-sm btn-icon-mobile"
                        onClick={() => openEditModal(lead)}
                        title="Edit Lead Details"
                      >
                        <HiOutlinePencil />
                      </button>

                      <button
                        className="btn btn-ghost btn-sm btn-icon-mobile"
                        onClick={() => handleDeleteLead(lead)}
                        title="Delete Lead"
                        style={{ color: 'var(--color-danger)' }}
                      >
                        <HiOutlineTrash />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            <Pagination
              currentPage={currentPage}
              totalItems={totalLeadsCount}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[10, 25, 50, 100]}
              itemLabel="doctor leads"
            />
          </>
        )}
      </div>

      {/* ─── Modal 1: Update Status & Set Follow-up Date (Admin Action) ─── */}
      {showStatusModal && selectedLead && (
        <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="modal-content modal-lead-status" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #4f46e5, #0284c7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontSize: '1.2rem',
                  boxShadow: '0 4px 10px rgba(79, 70, 229, 0.25)',
                  flexShrink: 0
                }}>
                  <HiOutlinePhone />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                    Update Status & Follow-up
                  </h2>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                    Log outreach outcome, schedule callback time, or promote to demo
                  </div>
                </div>
              </div>
              <button className="modal-close" onClick={() => setShowStatusModal(false)}><HiOutlineX /></button>
            </div>

            <form onSubmit={handleSaveStatus}>
              <div className="modal-body">
                {/* Doctor Context Banner */}
                <div className="modal-doctor-banner">
                  <div className="modal-doctor-avatar">
                    {getDoctorInitials(selectedLead.doctorName)}
                  </div>
                  <div className="modal-doctor-info">
                    <div className="modal-doctor-name">
                      <span>{selectedLead.doctorName}</span>
                      <span className="badge badge-primary badge-xs" style={{ textTransform: 'capitalize', fontWeight: 700 }}>
                        {selectedLead.stage} stage
                      </span>
                    </div>
                    <div className="modal-doctor-meta">
                      <span>{selectedLead.clinicName || 'Private Practice'}</span>
                      {selectedLead.city && <span>• {selectedLead.city}</span>}
                      {selectedLead.address && (
                        <span title={selectedLead.address} style={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          • 📍 {selectedLead.address}
                        </span>
                      )}
                      {selectedLead.phone && (
                        <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>• {selectedLead.phone}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Outreach Call Status */}
                <div className="form-group">
                  <div className="field-header-row">
                    <span className="field-header-label">Outreach Call Status *</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Current outcome</span>
                  </div>
                  <select
                    className="form-select"
                    value={statusForm.callStatus}
                    onChange={(e) => setStatusForm({ ...statusForm, callStatus: e.target.value })}
                    required
                    style={{ fontSize: '0.88rem', fontWeight: 600, padding: '10px 14px' }}
                  >
                    {CALL_STATUS_GROUPS.map((grp) => (
                      <optgroup key={grp.group} label={`── ${grp.group} ──`}>
                        {grp.statuses.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                {/* Follow-up Schedule (Date & Time) Card */}
                <div className="followup-schedule-card">
                  <div className="followup-schedule-header">
                    <div className="followup-schedule-title">
                      <HiOutlineCalendar style={{ color: 'var(--color-primary)', fontSize: '1.1rem' }} />
                      <span>Schedule Next Follow-up</span>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Callback & Queue</span>
                  </div>

                  <div className="followup-fields-grid">
                    {/* Follow-up Date Field */}
                    <div>
                      <div className="field-header-row">
                        <span className="field-header-label">Follow-up Date</span>
                      </div>
                      <input
                        type="date"
                        className="form-input"
                        value={statusForm.nextFollowUp}
                        onChange={(e) => setStatusForm({ ...statusForm, nextFollowUp: e.target.value })}
                        style={{ height: 42, fontSize: '0.85rem' }}
                      />
                      <div className="quick-pill-group">
                        <button
                          type="button"
                          className={`quick-pill-btn ${statusForm.nextFollowUp === getTodayStr() ? 'active' : ''}`}
                          onClick={() => setStatusForm({ ...statusForm, nextFollowUp: getTodayStr() })}
                        >
                          Set Today
                        </button>
                        <button
                          type="button"
                          className={`quick-pill-btn ${statusForm.nextFollowUp === getTomorrowStr() ? 'active' : ''}`}
                          onClick={() => setStatusForm({ ...statusForm, nextFollowUp: getTomorrowStr() })}
                        >
                          Set Tomorrow
                        </button>
                        {statusForm.nextFollowUp && (
                          <button
                            type="button"
                            className="quick-pill-btn"
                            style={{ color: 'var(--text-muted)', borderStyle: 'dashed' }}
                            onClick={() => setStatusForm({ ...statusForm, nextFollowUp: '' })}
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Follow-up Time Field */}
                    <div>
                      <div className="field-header-row">
                        <span className="field-header-label">Callback Time</span>
                        {statusForm.followUpTime && (
                          <button
                            type="button"
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.72rem', cursor: 'pointer', padding: 0 }}
                            onClick={() => setStatusForm({ ...statusForm, followUpTime: '' })}
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <input
                        type="time"
                        className="form-input"
                        value={statusForm.followUpTime}
                        onChange={(e) => setStatusForm({ ...statusForm, followUpTime: e.target.value })}
                        style={{ height: 42, fontSize: '0.85rem' }}
                      />
                      <div className="quick-pill-group">
                        {[
                          { time: '10:00', label: '10 AM' },
                          { time: '12:00', label: '12 PM' },
                          { time: '15:00', label: '3 PM' },
                          { time: '17:00', label: '5 PM' },
                        ].map(({ time, label }) => (
                          <button
                            key={time}
                            type="button"
                            className={`quick-pill-btn ${statusForm.followUpTime === time ? 'active' : ''}`}
                            onClick={() => setStatusForm({ ...statusForm, followUpTime: time })}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Informational notice */}
                  <div className="followup-status-notice">
                    <HiOutlineClock style={{ fontSize: '1.05rem', flexShrink: 0 }} />
                    <span>
                      {statusForm.nextFollowUp ? (
                        <>
                          Doctor will appear in scheduled call list on <strong>{statusForm.nextFollowUp}</strong>
                          {statusForm.followUpTime ? <> at <strong>{formatTime(statusForm.followUpTime)}</strong></> : ''}
                        </>
                      ) : (
                        'Doctor will remain in general queue without an overdue follow-up deadline'
                      )}
                    </span>
                  </div>
                </div>

                {/* Conversation Notes */}
                <div className="form-group">
                  <div className="field-header-row">
                    <span className="field-header-label">Call Notes / Feedback</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Feedback log</span>
                  </div>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    placeholder="e.g. Doctor said busy right now, requested callback on 14th Sept at 3 PM..."
                    value={statusForm.notes}
                    onChange={(e) => setStatusForm({ ...statusForm, notes: e.target.value })}
                    style={{ resize: 'vertical', minHeight: 74 }}
                  />
                </div>

                {/* Option to promote to demo */}
                <div className={`demo-handoff-card ${statusForm.moveToDemoStage ? 'active' : ''}`}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', margin: 0, textTransform: 'none', letterSpacing: 'normal' }}>
                    <input
                      type="checkbox"
                      checked={statusForm.moveToDemoStage}
                      onChange={(e) => setStatusForm({ ...statusForm, moveToDemoStage: e.target.checked })}
                      style={{ width: 18, height: 18, accentColor: 'var(--color-primary)', cursor: 'pointer' }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        Also Move to Demo Stage
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        Promote lead to demo pipeline and assign specialist
                      </div>
                    </div>
                  </label>

                  {statusForm.moveToDemoStage && (
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, animation: 'fadeIn 0.2s ease' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.72rem' }}>Demo Specialist (Optional)</label>
                        <select
                          className="form-select"
                          value={statusForm.assignedDemoAgentId}
                          onChange={(e) => setStatusForm({ ...statusForm, assignedDemoAgentId: e.target.value })}
                        >
                          <option value="">Choose specialist...</option>
                          {demoAgents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.72rem' }}>Demo Scheduled Date</label>
                        <input
                          type="date"
                          className="form-input"
                          value={statusForm.demoDate}
                          onChange={(e) => setStatusForm({ ...statusForm, demoDate: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowStatusModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  <HiOutlineCheckCircle style={{ fontSize: '1.1rem' }} />
                  <span>{saving ? 'Saving Follow-up...' : 'Save Follow-up'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal 2: Full Edit Lead Details ─── */}
      {showEditModal && selectedLead && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content modal-lead-form" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-badge-wrap">
                <div className="modal-header-badge-icon" style={{ background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)' }}>
                  <HiOutlinePencil />
                </div>
                <div className="modal-header-texts">
                  <h2>Edit Doctor Lead</h2>
                  <p>Update doctor profile, contact info, pipeline stage, and agent assignment</p>
                </div>
              </div>
              <button className="modal-close" onClick={() => setShowEditModal(false)}><HiOutlineX /></button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div className="modal-body">
                {/* Section 1: Doctor & Practice Profile */}
                <div className="modal-section-divider" style={{ marginTop: 0 }}>
                  <span>Doctor & Practice Profile</span>
                </div>

                <div className="modal-form-grid">
                  <div className="form-group modern-field">
                    <label>
                      <span>Doctor Name <span className="req-star">*</span></span>
                      <span className="field-hint">Full title</span>
                    </label>
                    <div className="input-with-icon">
                      <HiOutlineUser className="input-icon" />
                      <input
                        type="text"
                        className="form-input"
                        value={editForm.doctorName}
                        onChange={(e) => setEditForm({ ...editForm, doctorName: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group modern-field">
                    <label>
                      <span>Specialization</span>
                    </label>
                    <div className="input-with-icon">
                      <HiOutlineBadgeCheck className="input-icon" />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Cardiologist, Dentist"
                        value={editForm.specialization}
                        onChange={(e) => setEditForm({ ...editForm, specialization: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group modern-field">
                    <label>
                      <span>Clinic / Hospital Name</span>
                    </label>
                    <div className="input-with-icon">
                      <HiOutlineOfficeBuilding className="input-icon" />
                      <input
                        type="text"
                        className="form-input"
                        value={editForm.clinicName}
                        onChange={(e) => setEditForm({ ...editForm, clinicName: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group modern-field">
                    <label>
                      <span>City / Town</span>
                    </label>
                    <div className="input-with-icon">
                      <HiOutlineLocationMarker className="input-icon" />
                      <input
                        type="text"
                        className="form-input"
                        value={editForm.city}
                        onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Contact & Physical Address */}
                <div className="modal-section-divider">
                  <span>Contact & Physical Address</span>
                </div>

                <div className="modal-form-grid">
                  <div className="form-group modern-field">
                    <label>
                      <span>Phone Contact</span>
                    </label>
                    <div className="input-with-icon">
                      <HiOutlinePhone className="input-icon" />
                      <input
                        type="text"
                        className="form-input"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group modern-field">
                    <label>
                      <span>Email Address</span>
                    </label>
                    <div className="input-with-icon">
                      <HiOutlineMail className="input-icon" />
                      <input
                        type="email"
                        className="form-input"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group modern-field full-span">
                    <label>
                      <span>Full Clinic / Practice Address</span>
                    </label>
                    <div className="input-with-icon">
                      <HiOutlineLocationMarker className="input-icon" />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. 102 Park Avenue, Suite 4B"
                        value={editForm.address}
                        onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Pipeline, Status & Assignment */}
                <div className="modal-section-divider">
                  <span>Pipeline, Status & Assignment</span>
                </div>

                <div className="modal-form-grid">
                  <div className="form-group modern-field">
                    <label>
                      <span>Pipeline Stage</span>
                    </label>
                    <select
                      className="form-select"
                      value={editForm.stage}
                      onChange={(e) => setEditForm({ ...editForm, stage: e.target.value })}
                    >
                      {STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>

                  <div className="form-group modern-field">
                    <label>
                      <span>Outreach Call Status</span>
                    </label>
                    <select
                      className="form-select"
                      value={editForm.callStatus}
                      onChange={(e) => setEditForm({ ...editForm, callStatus: e.target.value })}
                    >
                      {CALL_STATUS_GROUPS.map((grp) => (
                        <optgroup key={grp.group} label={`── ${grp.group} ──`}>
                          {grp.statuses.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  <div className="form-group modern-field">
                    <label>
                      <span>Assigned Calling Rep</span>
                    </label>
                    <select
                      className="form-select"
                      value={editForm.assignedCallingAgentId}
                      onChange={(e) => setEditForm({ ...editForm, assignedCallingAgentId: e.target.value })}
                    >
                      <option value="">Unassigned</option>
                      {callingAgents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>

                  <div className="form-group modern-field">
                    <label>
                      <span>Assigned Demo Rep</span>
                    </label>
                    <select
                      className="form-select"
                      value={editForm.assignedDemoAgentId}
                      onChange={(e) => setEditForm({ ...editForm, assignedDemoAgentId: e.target.value })}
                    >
                      <option value="">Unassigned</option>
                      {demoAgents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>

                  <div className="form-group modern-field">
                    <label>
                      <span>Next Follow-up Date</span>
                    </label>
                    <input
                      type="date"
                      className="form-input"
                      value={editForm.nextFollowUp}
                      onChange={(e) => setEditForm({ ...editForm, nextFollowUp: e.target.value })}
                    />
                  </div>

                  <div className="form-group modern-field">
                    <label>
                      <span>Callback Time</span>
                    </label>
                    <input
                      type="time"
                      className="form-input"
                      value={editForm.followUpTime}
                      onChange={(e) => setEditForm({ ...editForm, followUpTime: e.target.value })}
                    />
                  </div>
                </div>

                {/* Section 4: Source & Clinic Requirements */}
                <div className="modal-section-divider">
                  <span>Source & Clinic Requirements</span>
                </div>

                <div className="modal-form-grid">
                  <div className="form-group modern-field">
                    <label>
                      <span>Lead Source</span>
                    </label>
                    <div className="input-with-icon">
                      <HiOutlineBookmark className="input-icon" />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Facebook Ads, Instagram, Google, Website"
                        value={editForm.source}
                        onChange={(e) => setEditForm({ ...editForm, source: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group modern-field">
                    <label>
                      <span>Demo Scheduled Date & Time</span>
                    </label>
                    <div className="input-with-icon">
                      <HiOutlineClock className="input-icon" />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. 2026-10-15 11:30 AM"
                        value={editForm.demoTime}
                        onChange={(e) => setEditForm({ ...editForm, demoTime: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group modern-field full-span">
                    <label>
                      <span>Need for Clinic</span>
                    </label>
                    <div className="input-with-icon">
                      <HiOutlineChatAlt2 className="input-icon" />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Patient booking CRM, WhatsApp notifications, Website"
                        value={editForm.needForClinic}
                        onChange={(e) => setEditForm({ ...editForm, needForClinic: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving} style={{ minWidth: 140 }}>
                  {saving ? (
                    <>
                      <span className="spinner spinner-sm"></span>
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <HiOutlineCheckCircle style={{ fontSize: '1.1rem' }} />
                      <span>Update Lead</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal 3: Add New Lead ─── */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content modal-lead-form" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-badge-wrap">
                <div className="modal-header-badge-icon">
                  <HiOutlineUserAdd />
                </div>
                <div className="modal-header-texts">
                  <h2>Add New Doctor Lead</h2>
                  <p>Enter doctor profile, clinic details, and location to expand outreach</p>
                </div>
              </div>
              <button className="modal-close" onClick={() => setShowAddModal(false)}><HiOutlineX /></button>
            </div>

            <form onSubmit={handleAddLead}>
              <div className="modal-body">
                {/* Section 1: Doctor & Practice Profile */}
                <div className="modal-section-divider" style={{ marginTop: 0 }}>
                  <span>Doctor & Practice Profile</span>
                </div>

                <div className="modal-form-grid">
                  <div className="form-group modern-field">
                    <label>
                      <span>Doctor Name <span className="req-star">*</span></span>
                      <span className="field-hint">Full title</span>
                    </label>
                    <div className="input-with-icon">
                      <HiOutlineUser className="input-icon" />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Dr. Rajesh Sharma"
                        value={addForm.doctorName}
                        onChange={(e) => setAddForm({ ...addForm, doctorName: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group modern-field">
                    <label>
                      <span>Specialization</span>
                      <span className="field-hint">Medical field</span>
                    </label>
                    <div className="input-with-icon">
                      <HiOutlineBadgeCheck className="input-icon" />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Cardiologist, Dentist"
                        value={addForm.specialization}
                        onChange={(e) => setAddForm({ ...addForm, specialization: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group modern-field">
                    <label>
                      <span>Clinic / Hospital Name</span>
                    </label>
                    <div className="input-with-icon">
                      <HiOutlineOfficeBuilding className="input-icon" />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Apollo Clinic / Metro Hospital"
                        value={addForm.clinicName}
                        onChange={(e) => setAddForm({ ...addForm, clinicName: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group modern-field">
                    <label>
                      <span>City / Town</span>
                    </label>
                    <div className="input-with-icon">
                      <HiOutlineLocationMarker className="input-icon" />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Mumbai, New York"
                        value={addForm.city}
                        onChange={(e) => setAddForm({ ...addForm, city: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Contact & Physical Address */}
                <div className="modal-section-divider">
                  <span>Contact & Physical Address</span>
                </div>

                <div className="modal-form-grid">
                  <div className="form-group modern-field">
                    <label>
                      <span>Phone Number</span>
                      <span className="field-hint">Outreach line</span>
                    </label>
                    <div className="input-with-icon">
                      <HiOutlinePhone className="input-icon" />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. +91 98765 43210"
                        value={addForm.phone}
                        onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group modern-field">
                    <label>
                      <span>Email Address</span>
                      <span className="field-hint">Official email</span>
                    </label>
                    <div className="input-with-icon">
                      <HiOutlineMail className="input-icon" />
                      <input
                        type="email"
                        className="form-input"
                        placeholder="e.g. doctor@clinic.com"
                        value={addForm.email}
                        onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group modern-field full-span">
                    <label>
                      <span>Full Clinic / Practice Address</span>
                      <span className="field-hint">Physical location</span>
                    </label>
                    <div className="input-with-icon">
                      <HiOutlineLocationMarker className="input-icon" />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Suite 402, 102 Park Avenue, Near City Hospital"
                        value={addForm.address}
                        onChange={(e) => setAddForm({ ...addForm, address: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Source & Clinic Requirements */}
                <div className="modal-section-divider">
                  <span>Source & Clinic Requirements</span>
                </div>

                <div className="modal-form-grid">
                  <div className="form-group modern-field">
                    <label>
                      <span>Lead Source</span>
                      <span className="field-hint">e.g. Facebook, Instagram, Google</span>
                    </label>
                    <div className="input-with-icon">
                      <HiOutlineBookmark className="input-icon" />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Facebook Ads, Instagram, Referral, Website"
                        value={addForm.source}
                        onChange={(e) => setAddForm({ ...addForm, source: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group modern-field">
                    <label>
                      <span>Demo Scheduled Date & Time</span>
                      <span className="field-hint">Scheduled demo</span>
                    </label>
                    <div className="input-with-icon">
                      <HiOutlineClock className="input-icon" />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. 2026-10-15 11:30 AM or 14:00"
                        value={addForm.demoTime}
                        onChange={(e) => setAddForm({ ...addForm, demoTime: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group modern-field full-span">
                    <label>
                      <span>Need for Clinic</span>
                      <span className="field-hint">Key requirements & solutions needed</span>
                    </label>
                    <div className="input-with-icon">
                      <HiOutlineChatAlt2 className="input-icon" />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Patient booking CRM, Automated WhatsApp notifications, Website redesign"
                        value={addForm.needForClinic}
                        onChange={(e) => setAddForm({ ...addForm, needForClinic: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowAddModal(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                  style={{ minWidth: 160, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  {saving ? (
                    <>
                      <span className="spinner spinner-sm"></span>
                      <span>Creating Lead...</span>
                    </>
                  ) : (
                    <>
                      <HiOutlinePlus style={{ fontSize: '1.1rem' }} />
                      <span>Create Doctor Lead</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal 4: Quick Assign Calling Agent ─── */}
      {showAssignModal && selectedLead && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal-content" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-badge-wrap">
                <div className="modal-header-badge-icon" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)' }}>
                  <HiOutlineUserAdd />
                </div>
                <div className="modal-header-texts">
                  <h2>Assign Calling Agent</h2>
                  <p>Assign outreach rep to handle doctor call pipeline</p>
                </div>
              </div>
              <button className="modal-close" onClick={() => setShowAssignModal(false)}><HiOutlineX /></button>
            </div>
            <form onSubmit={handleAssign}>
              <div className="modal-body">
                {/* Doctor Context Banner */}
                <div className="modal-doctor-banner" style={{ marginBottom: 18 }}>
                  <div className="modal-doctor-avatar">
                    {getDoctorInitials(selectedLead.doctorName)}
                  </div>
                  <div className="modal-doctor-info">
                    <div className="modal-doctor-name">
                      <span>{selectedLead.doctorName}</span>
                    </div>
                    <div className="modal-doctor-meta">
                      <span>{selectedLead.clinicName || 'Private Practice'}</span>
                      {selectedLead.city && <span>• {selectedLead.city}</span>}
                    </div>
                  </div>
                </div>

                <div className="form-group modern-field">
                  <label>
                    <span>Select Calling Agent</span>
                    <span className="field-hint">Active callers</span>
                  </label>
                  <select className="form-select" value={assignAgentId} onChange={(e) => setAssignAgentId(e.target.value)} required>
                    <option value="">Choose agent...</option>
                    {callingAgents.map((a) => (
                      <option key={a.id} value={a.id}>{a.name} ({a.email})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowAssignModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Assigning...' : 'Assign Agent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal 5: Quick Move to Demo ─── */}
      {showDemoModal && selectedLead && (
        <div className="modal-overlay" onClick={() => setShowDemoModal(false)}>
          <div className="modal-content" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-badge-wrap">
                <div className="modal-header-badge-icon" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)' }}>
                  <HiOutlineDesktopComputer />
                </div>
                <div className="modal-header-texts">
                  <h2>Schedule Product Demo</h2>
                  <p>Promote lead to demo pipeline & assign specialist</p>
                </div>
              </div>
              <button className="modal-close" onClick={() => setShowDemoModal(false)}><HiOutlineX /></button>
            </div>
            <form onSubmit={handleAssignDemo}>
              <div className="modal-body">
                {/* Doctor Context Banner */}
                <div className="modal-doctor-banner" style={{ marginBottom: 18 }}>
                  <div className="modal-doctor-avatar" style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}>
                    {getDoctorInitials(selectedLead.doctorName)}
                  </div>
                  <div className="modal-doctor-info">
                    <div className="modal-doctor-name">
                      <span>{selectedLead.doctorName}</span>
                    </div>
                    <div className="modal-doctor-meta">
                      <span>{selectedLead.clinicName || 'Private Practice'}</span>
                      {selectedLead.city && <span>• {selectedLead.city}</span>}
                    </div>
                  </div>
                </div>

                <div className="modal-form-grid">
                  <div className="form-group modern-field">
                    <label>
                      <span>Demo Specialist</span>
                      <span className="field-hint">Optional</span>
                    </label>
                    <select className="form-select" value={demoAssign.assignedDemoAgentId} onChange={(e) => setDemoAssign({ ...demoAssign, assignedDemoAgentId: e.target.value })}>
                      <option value="">Choose agent...</option>
                      {demoAgents.map((a) => (
                        <option key={a.id} value={a.id}>{a.name} ({a.email})</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group modern-field">
                    <label>
                      <span>Demo Scheduled Date</span>
                    </label>
                    <input type="date" className="form-input" value={demoAssign.demoDate} onChange={(e) => setDemoAssign({ ...demoAssign, demoDate: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowDemoModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-accent" disabled={saving}>
                  {saving ? 'Scheduling...' : 'Confirm Demo Stage'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal 6: Google Sheet Sync Modal ─── */}
      {showSyncModal && (
        <div className="modal-overlay" onClick={() => !syncing && setShowSyncModal(false)}>
          <div className="modal-content" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  boxShadow: '0 4px 10px rgba(16, 185, 129, 0.25)',
                  flexShrink: 0
                }}>
                  <HiOutlineRefresh className={syncing ? 'spinner' : ''} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Sync Google Sheet</h2>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Pull doctor leads, clinic addresses, and contact info directly
                  </p>
                </div>
              </div>
              <button className="modal-close" onClick={() => !syncing && setShowSyncModal(false)}>
                <HiOutlineX />
              </button>
            </div>

            <form onSubmit={handleSyncSheet}>
              <div className="modal-body">
                {savedSheetUrl && (
                  <div style={{
                    background: '#f0fdf4',
                    border: '1px solid #86efac',
                    borderRadius: 'var(--radius-md)',
                    padding: '8px 12px',
                    marginBottom: 14,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: '0.8rem',
                    color: '#15803d'
                  }}>
                    <HiOutlineBadgeCheck style={{ fontSize: '1.2rem', flexShrink: 0, color: '#16a34a' }} />
                    <span style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Active Saved Link:</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: 0.9 }}>
                      {savedSheetUrl}
                    </span>
                  </div>
                )}

                <div className="form-group">
                  <label style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                    Google Sheet CSV URL or Edit Link *
                  </label>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://docs.google.com/spreadsheets/d/.../edit or .../export?format=csv"
                    value={syncSheetUrl}
                    onChange={(e) => setSyncSheetUrl(e.target.value)}
                    required
                    disabled={syncing}
                    style={{ fontSize: '0.85rem' }}
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                    Standard Google Sheets sharing links (View/Edit) or Published CSV links are supported. Once saved, it stays permanently loaded.
                  </span>
                </div>

                {/* Column format guidance badge list */}
                <div style={{
                  background: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 14px',
                  border: '1px solid var(--border-color)',
                  marginBottom: 16
                }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                    Supported Sheet Columns:
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {['Doctor Name', 'Clinic Name', 'Phone', 'Email', 'City', 'Address', 'Specialization'].map((col) => (
                      <span key={col} className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>
                        {col}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Sync Results Feedback */}
                {syncResults && (
                  <div style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px 16px',
                    animation: 'fadeIn 0.25s ease'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#166534', fontWeight: 700, fontSize: '0.9rem', marginBottom: 10 }}>
                      <HiOutlineCheckCircle style={{ fontSize: '1.2rem' }} />
                      <span>Sync Successful & Link Saved!</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, textAlign: 'center' }}>
                      <div style={{ background: '#ffffff', padding: '8px 4px', borderRadius: 8, border: '1px solid #dcfce7' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{syncResults.totalRows || 0}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Rows</div>
                      </div>
                      <div style={{ background: '#ffffff', padding: '8px 4px', borderRadius: 8, border: '1px solid #dcfce7' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#15803d' }}>{syncResults.created || 0}</div>
                        <div style={{ fontSize: '0.7rem', color: '#15803d', fontWeight: 600 }}>Created</div>
                      </div>
                      <div style={{ background: '#ffffff', padding: '8px 4px', borderRadius: 8, border: '1px solid #dcfce7' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0369a1' }}>{syncResults.updated || 0}</div>
                        <div style={{ fontSize: '0.7rem', color: '#0369a1', fontWeight: 600 }}>Updated</div>
                      </div>
                      <div style={{ background: '#ffffff', padding: '8px 4px', borderRadius: 8, border: '1px solid #dcfce7' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#64748b' }}>{syncResults.skipped || 0}</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Unchanged</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowSyncModal(false)}
                  disabled={syncing}
                >
                  Close
                </button>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={handleSaveSheetUrlOnly}
                    disabled={savingUrl || syncing || !syncSheetUrl.trim()}
                    title="Save link without executing sync"
                  >
                    <HiOutlineBookmark />
                    <span>{savingUrl ? 'Saving...' : 'Save Link'}</span>
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={syncing}
                    style={{ minWidth: 140 }}
                  >
                    {syncing ? (
                      <>
                        <span className="spinner spinner-sm"></span>
                        <span>Syncing Sheet...</span>
                      </>
                    ) : (
                      <>
                        <HiOutlineRefresh />
                        <span>Sync Sheet Now</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal 7: Bulk Assign Modal ─── */}
      {showBulkModal && (
        <div className="modal-overlay" onClick={() => !bulkSaving && setShowBulkModal(false)}>
          <div className="modal-content" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: bulkAssignType === 'calling'
                    ? 'linear-gradient(135deg, #4f46e5, #6366f1)'
                    : 'linear-gradient(135deg, #0284c7, #38bdf8)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  boxShadow: '0 4px 10px rgba(79, 70, 229, 0.25)',
                  flexShrink: 0
                }}>
                  {bulkAssignType === 'calling' ? <HiOutlineUserAdd /> : <HiOutlineDesktopComputer />}
                </div>
                <div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                    {bulkAssignType === 'calling' ? 'Bulk Assign Calling Rep' : 'Bulk Assign Demo Specialist'}
                  </h2>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Reassigning <strong>{selectedLeadIds.length}</strong> selected doctor {selectedLeadIds.length === 1 ? 'lead' : 'leads'}
                  </p>
                </div>
              </div>
              <button className="modal-close" onClick={() => !bulkSaving && setShowBulkModal(false)}>
                <HiOutlineX />
              </button>
            </div>

            <form onSubmit={handleBulkAssignSubmit}>
              <div className="modal-body">
                {/* Mode Switcher Tabs */}
                <div style={{ display: 'flex', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', padding: 4, marginBottom: 18, border: '1px solid var(--border-color)' }}>
                  <button
                    type="button"
                    className={`btn btn-sm ${bulkAssignType === 'calling' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ flex: 1, border: 'none' }}
                    onClick={() => setBulkAssignType('calling')}
                  >
                    <HiOutlineUserAdd /> Calling Agent
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${bulkAssignType === 'demo' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ flex: 1, border: 'none' }}
                    onClick={() => setBulkAssignType('demo')}
                  >
                    <HiOutlineDesktopComputer /> Demo Specialist
                  </button>
                </div>

                {bulkAssignType === 'calling' ? (
                  <div className="form-group modern-field">
                    <label>
                      <span>Select Calling Agent *</span>
                    </label>
                    <div className="input-with-icon">
                      <HiOutlineUser className="input-icon" />
                      <select
                        className="form-select"
                        value={bulkCallingAgentId}
                        onChange={(e) => setBulkCallingAgentId(e.target.value)}
                        required
                      >
                        <option value="">Choose Calling Agent...</option>
                        {callingAgents.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name} ({a.email})
                          </option>
                        ))}
                      </select>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6, display: 'block' }}>
                      All <strong>{selectedLeadIds.length}</strong> selected leads will be routed to this agent's calling queue and set to the Calling Pipeline.
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="form-group modern-field">
                      <label>
                        <span>Select Demo Specialist *</span>
                      </label>
                      <div className="input-with-icon">
                        <HiOutlineDesktopComputer className="input-icon" />
                        <select
                          className="form-select"
                          value={bulkDemoAgentId}
                          onChange={(e) => setBulkDemoAgentId(e.target.value)}
                          required
                        >
                          <option value="">Choose Demo Specialist...</option>
                          {demoAgents.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name} ({a.email})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="form-group modern-field">
                      <label>
                        <span>Scheduled Demo Date (Optional)</span>
                      </label>
                      <div className="input-with-icon">
                        <HiOutlineCalendar className="input-icon" />
                        <input
                          type="date"
                          className="form-input"
                          value={bulkDemoDate}
                          onChange={(e) => setBulkDemoDate(e.target.value)}
                        />
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6, display: 'block' }}>
                        All <strong>{selectedLeadIds.length}</strong> selected leads will advance to the Demo Pipeline.
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowBulkModal(false)}
                  disabled={bulkSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={bulkSaving}
                  style={{ minWidth: 160 }}
                >
                  {bulkSaving ? (
                    <>
                      <span className="spinner spinner-sm"></span>
                      <span>Assigning Leads...</span>
                    </>
                  ) : (
                    <>
                      <HiOutlineBadgeCheck />
                      <span>Assign {selectedLeadIds.length} Leads</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageLeads;
