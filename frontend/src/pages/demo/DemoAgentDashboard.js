import React, { useState, useEffect, useCallback } from 'react';
import { leadService } from '../../services/authService';
import Pagination from '../../components/Pagination';
import { toast } from 'react-toastify';
import {
  HiOutlineSearch,
  HiOutlineX,
  HiOutlinePhone,
  HiOutlineCalendar,
  HiOutlineDesktopComputer,
  HiOutlineLocationMarker,
} from 'react-icons/hi';

const DEMO_STATUSES = [
  'Not Started',
  'Demo Scheduled',
  'Demo Completed',
  'Demo Cancelled',
  'Doctor Interested',
  'Doctor Not Interested',
  'Sale Completed',
];

const DemoAgentDashboard = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Update modal
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [updateForm, setUpdateForm] = useState({
    demoStatus: '',
    demoNotes: '',
    nextFollowUp: '',
    demoDate: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchDemos = useCallback(async () => {
    try {
      const params = {};
      if (filterStatus) params.demoStatus = filterStatus;
      if (search) params.search = search;
      const response = await leadService.getMyDemos(params);
      setLeads(response.data.leads);
    } catch (error) {
      toast.error('Failed to fetch demos');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, search]);

  useEffect(() => {
    fetchDemos();
  }, [fetchDemos]);

  // Reset pagination when search or status filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, search]);

  const totalDemosCount = leads.length;
  const paginatedLeads = leads.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const openUpdateModal = (lead) => {
    setSelectedLead(lead);
    setUpdateForm({
      demoStatus: lead.demoStatus,
      demoNotes: lead.demoNotes || '',
      nextFollowUp: lead.nextFollowUp || '',
      demoDate: lead.demoDate || '',
    });
    setShowUpdateModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await leadService.updateDemoStatus(selectedLead.id, updateForm);
      toast.success('Demo presentation record updated');
      setShowUpdateModal(false);
      fetchDemos();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const getDemoStatusBadge = (status) => {
    const map = {
      'Not Started': 'badge-neutral',
      'Demo Scheduled': 'badge-warning',
      'Demo Completed': 'badge-info',
      'Demo Cancelled': 'badge-danger',
      'Doctor Interested': 'badge-accent',
      'Doctor Not Interested': 'badge-danger',
      'Sale Completed': 'badge-success',
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

  // Mini metrics
  const totalDemos = leads.length;
  const scheduledDemos = leads.filter(l => l.demoStatus === 'Demo Scheduled').length;
  const completedDemos = leads.filter(l => l.demoStatus === 'Demo Completed').length;
  const closedSales = leads.filter(l => l.demoStatus === 'Sale Completed').length;

  return (
    <div>
      <div className="page-header">
        <h1>Demo Specialist Workspace</h1>
        <p>Conduct software demos, track doctor evaluations, and close final sales</p>
      </div>

      {/* Mini KPI Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Assigned Demos</div>
          <div style={{ fontFamily: 'Outfit', fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>{totalDemos}</div>
        </div>
        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Upcoming Scheduled</div>
          <div style={{ fontFamily: 'Outfit', fontSize: '1.8rem', fontWeight: 800, color: '#f59e0b', marginTop: 4 }}>{scheduledDemos}</div>
        </div>
        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Demos Presented</div>
          <div style={{ fontFamily: 'Outfit', fontSize: '1.8rem', fontWeight: 800, color: '#0ea5e9', marginTop: 4 }}>{completedDemos}</div>
        </div>
        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Sales Closed</div>
          <div style={{ fontFamily: 'Outfit', fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-success-dark)', marginTop: 4 }}>{closedSales} 🎉</div>
        </div>
      </div>

      <div className="table-wrapper">
        <div className="table-header">
          <h2>Demo Pipeline ({leads.length})</h2>
          <div className="table-actions">
            <div className="filter-bar">
              <select className="form-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">All Statuses</option>
                {DEMO_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
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
              <p>Loading scheduled demos...</p>
            </div>
          ) : leads.length === 0 ? (
            <div className="table-empty">
              <HiOutlineDesktopComputer style={{ fontSize: '2.5rem', opacity: 0.4 }} />
              <p>No product demos assigned to you yet</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Doctor / Clinic</th>
                  <th>Contact Info</th>
                  <th>Demo Date</th>
                  <th>Demo Status</th>
                  <th>Follow-up</th>
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
                          background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          flexShrink: 0,
                          boxShadow: '0 2px 6px rgba(245, 158, 11, 0.2)'
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
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {lead.phone ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600, fontSize: '0.85rem' }}>
                            <HiOutlinePhone style={{ color: 'var(--color-primary)' }} />
                            {lead.phone}
                          </span>
                        ) : '—'}
                        {(lead.address || lead.city) && (
                          <span
                            title={[lead.address, lead.city].filter(Boolean).join(', ')}
                            style={{
                              fontSize: '0.75rem',
                              color: 'var(--text-muted)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3,
                              maxWidth: 160,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            <HiOutlineLocationMarker style={{ flexShrink: 0 }} />
                            <span>{lead.address ? lead.address : lead.city}</span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      {lead.demoDate ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700, color: '#f59e0b', fontSize: '0.85rem' }}>
                          <HiOutlineCalendar />
                          {lead.demoDate}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Unscheduled</span>
                      )}
                    </td>
                    <td>{getDemoStatusBadge(lead.demoStatus)}</td>
                    <td>
                      {lead.nextFollowUp ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                          <HiOutlineCalendar />
                          {lead.nextFollowUp}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => openUpdateModal(lead)}
                        title="Update Demo Status"
                      >
                        <HiOutlineDesktopComputer />
                        <span>Update</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalDemosCount > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={totalDemosCount}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[10, 25, 50, 100]}
            itemLabel="demo presentations"
          />
        )}
      </div>

      {/* Update Modal */}
      {showUpdateModal && selectedLead && (
        <div className="modal-overlay" onClick={() => setShowUpdateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Demo Session — {selectedLead.doctorName}</h2>
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
                  <label>Demo Status *</label>
                  <select
                    className="form-select"
                    value={updateForm.demoStatus}
                    onChange={(e) => setUpdateForm({ ...updateForm, demoStatus: e.target.value })}
                  >
                    {DEMO_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label>Demo Presentation Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={updateForm.demoDate}
                    onChange={(e) => setUpdateForm({ ...updateForm, demoDate: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Demo Feedback & Doctor Notes</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Doctor concerns, feature questions, contract terms discussed..."
                    value={updateForm.demoNotes}
                    onChange={(e) => setUpdateForm({ ...updateForm, demoNotes: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Next Follow-up Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={updateForm.nextFollowUp}
                    onChange={(e) => setUpdateForm({ ...updateForm, nextFollowUp: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowUpdateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Demo Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DemoAgentDashboard;
