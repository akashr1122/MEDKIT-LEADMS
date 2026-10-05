import React, { useState, useEffect, useCallback } from 'react';
import { leadService, userService } from '../../services/authService';
import Pagination from '../../components/Pagination';
import { toast } from 'react-toastify';
import {
  HiOutlineSearch,
  HiOutlineX,
  HiOutlinePhone,
  HiOutlineLocationMarker,
  HiOutlineCalendar,
  HiOutlinePencilAlt,
  HiOutlineClock,
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

const CallingAgentDashboard = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [demoAgents, setDemoAgents] = useState([]);

  // Update modal
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [updateForm, setUpdateForm] = useState({
    callStatus: '',
    notes: '',
    nextFollowUp: '',
    followUpTime: '',
    moveToDemoStage: false,
    assignedDemoAgentId: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchLeads = useCallback(async () => {
    try {
      const params = {};
      if (filterStatus) params.callStatus = filterStatus;
      if (search) params.search = search;
      const response = await leadService.getMyLeads(params);
      setLeads(response.data.leads);
    } catch (error) {
      toast.error('Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, search]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Reset pagination when search or status filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, search]);

  const totalLeadsCount = leads.length;
  const paginatedLeads = leads.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    const fetchDemoAgents = async () => {
      try {
        const res = await userService.getAll({ role: 'demo_agent', isActive: 'true' });
        setDemoAgents(res.data.users);
      } catch (error) {
        console.error('Failed to fetch demo agents:', error);
      }
    };
    fetchDemoAgents();
  }, []);

  const openUpdateModal = (lead) => {
    setSelectedLead(lead);
    setUpdateForm({
      callStatus: lead.callStatus,
      notes: lead.notes || '',
      nextFollowUp: lead.nextFollowUp || '',
      followUpTime: lead.followUpTime || '',
      moveToDemoStage: false,
      assignedDemoAgentId: '',
    });
    setShowUpdateModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        callStatus: updateForm.callStatus,
        notes: updateForm.notes,
        nextFollowUp: updateForm.nextFollowUp || null,
        followUpTime: updateForm.followUpTime || null,
        moveToDemoStage: updateForm.moveToDemoStage,
      };

      if (updateForm.moveToDemoStage && updateForm.assignedDemoAgentId) {
        payload.assignedDemoAgentId = parseInt(updateForm.assignedDemoAgentId);
      }

      await leadService.updateCallStatus(selectedLead.id, payload);
      toast.success('Lead status updated successfully');
      setShowUpdateModal(false);
      fetchLeads();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update lead');
    } finally {
      setSaving(false);
    }
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

  const getDoctorInitials = (name) => {
    if (!name) return 'DR';
    return name.replace(/^(dr\.?\s*)/i, '').slice(0, 2).toUpperCase();
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

  // Quick stats
  const totalAssigned = leads.length;
  const pendingCount = leads.filter(l => l.callStatus === 'Pending').length;
  const interestedCount = leads.filter(l => l.callStatus === 'Interested').length;
  const followUpCount = leads.filter(l => l.callStatus === 'Follow-up Required').length;

  return (
    <div>
      <div className="page-header">
        <h1>Calling Agent Workspace</h1>
        <p>Your assigned doctor outreach leads, call logs, and demo handoff</p>
      </div>

      {/* Mini KPI Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Assigned</div>
          <div style={{ fontFamily: 'Outfit', fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>{totalAssigned}</div>
        </div>
        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pending Calls</div>
          <div style={{ fontFamily: 'Outfit', fontSize: '1.8rem', fontWeight: 800, color: '#0284c7', marginTop: 4 }}>{pendingCount}</div>
        </div>
        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Interested Doctors</div>
          <div style={{ fontFamily: 'Outfit', fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-success-dark)', marginTop: 4 }}>{interestedCount}</div>
        </div>
        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Follow-ups Needed</div>
          <div style={{ fontFamily: 'Outfit', fontSize: '1.8rem', fontWeight: 800, color: '#d97706', marginTop: 4 }}>{followUpCount}</div>
        </div>
      </div>

      <div className="table-wrapper">
        <div className="table-header">
          <h2>Assigned Outreach Queue ({leads.length})</h2>
          <div className="table-actions">
            <div className="filter-bar">
              <select className="form-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">All Statuses</option>
                {CALL_STATUS_GROUPS.map((grp) => (
                  <optgroup key={grp.group} label={`── ${grp.group} ──`}>
                    {grp.statuses.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
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
            </div>
          </div>
        </div>

        <div className="table-scroll">
          {loading ? (
            <div className="loading-center">
              <div className="spinner spinner-lg"></div>
              <p>Loading assigned leads...</p>
            </div>
          ) : leads.length === 0 ? (
            <div className="table-empty">
              <HiOutlineSearch style={{ fontSize: '2.5rem', opacity: 0.4 }} />
              <p>No leads currently assigned in this status view</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Doctor / Practice</th>
                  <th>Phone Outreach</th>
                  <th>Location</th>
                  <th>Call Status</th>
                  <th>Follow-up Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLeads.map((lead) => (
                  <tr key={lead.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 36,
                          height: 36,
                          borderRadius: '10px',
                          background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          flexShrink: 0,
                          boxShadow: '0 2px 6px rgba(2, 132, 199, 0.2)'
                        }}>
                          {getDoctorInitials(lead.doctorName)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{lead.doctorName}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {lead.clinicName || lead.specialization || 'Medical Practice'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {lead.phone ? (
                        <a
                          href={`tel:${lead.phone}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            fontWeight: 600,
                            color: 'var(--color-primary)',
                            textDecoration: 'none'
                          }}
                        >
                          <HiOutlinePhone />
                          {lead.phone}
                        </a>
                      ) : '—'}
                    </td>
                    <td>
                      {(lead.address || lead.city) ? (
                        <span
                          title={[lead.address, lead.city].filter(Boolean).join(', ')}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            color: 'var(--text-secondary)',
                            fontSize: '0.8rem',
                            maxWidth: 180,
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
                      ) : '—'}
                    </td>
                    <td>{getCallStatusBadge(lead.callStatus)}</td>
                    <td>
                      {lead.nextFollowUp ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600, color: '#d97706', fontSize: '0.825rem' }}>
                            <HiOutlineCalendar />
                            {lead.nextFollowUp}
                          </span>
                          {lead.followUpTime && (
                            <span style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              color: '#4338ca',
                              background: '#e0e7ff',
                              padding: '1px 6px',
                              borderRadius: 4,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3,
                              alignSelf: 'flex-start'
                            }}>
                              <HiOutlineClock style={{ fontSize: '0.75rem' }} />
                              {formatTime(lead.followUpTime)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>None scheduled</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => openUpdateModal(lead)}
                        title="Update Call Status"
                      >
                        <HiOutlinePencilAlt />
                        <span>Log Call</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalLeadsCount > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={totalLeadsCount}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[10, 25, 50, 100]}
            itemLabel="assigned leads"
          />
        )}
      </div>

      {/* Update Modal */}
      {showUpdateModal && selectedLead && (
        <div className="modal-overlay" onClick={() => setShowUpdateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Log Call — {selectedLead.doctorName}</h2>
              <button className="modal-close" onClick={() => setShowUpdateModal(false)}><HiOutlineX /></button>
            </div>
            <form onSubmit={handleUpdate}>
              <div className="modal-body">
                {/* Doctor Context Banner */}
                <div className="modal-doctor-banner" style={{ marginBottom: 16 }}>
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
                      {selectedLead.address && (
                        <span title={selectedLead.address}>• 📍 {selectedLead.address}</span>
                      )}
                      {selectedLead.phone && (
                        <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>• {selectedLead.phone}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Outcome Status *</label>
                  <select
                    className="form-select"
                    value={updateForm.callStatus}
                    onChange={(e) => setUpdateForm({ ...updateForm, callStatus: e.target.value })}
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

                <div className="form-group">
                  <label>Conversation Notes</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Doctor feedback, clinic timing, pricing interest..."
                    value={updateForm.notes}
                    onChange={(e) => setUpdateForm({ ...updateForm, notes: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label>Next Scheduled Follow-up Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={updateForm.nextFollowUp}
                      onChange={(e) => setUpdateForm({ ...updateForm, nextFollowUp: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Follow-up Time</label>
                    <input
                      type="time"
                      className="form-input"
                      value={updateForm.followUpTime}
                      onChange={(e) => setUpdateForm({ ...updateForm, followUpTime: e.target.value })}
                    />
                  </div>
                </div>

                {/* Move to Demo Stage Section */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 20, marginTop: 20 }}>
                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', textTransform: 'none', letterSpacing: 0, fontSize: '0.9rem', fontWeight: 700 }}>
                      <input
                        type="checkbox"
                        checked={updateForm.moveToDemoStage}
                        onChange={(e) => setUpdateForm({ ...updateForm, moveToDemoStage: e.target.checked })}
                        style={{ width: 18, height: 18, accentColor: 'var(--color-primary)' }}
                      />
                      <span>Promote to Product Demo Stage</span>
                    </label>
                  </div>

                  {updateForm.moveToDemoStage && (
                    <div className="form-group" style={{ animation: 'fadeIn 0.2s ease' }}>
                      <label>Select Demo Specialist (Optional)</label>
                      <select
                        className="form-select"
                        value={updateForm.assignedDemoAgentId}
                        onChange={(e) => setUpdateForm({ ...updateForm, assignedDemoAgentId: e.target.value })}
                      >
                        <option value="">Choose specialist...</option>
                        {demoAgents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowUpdateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Call Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallingAgentDashboard;
