import React, { useState, useEffect } from 'react';
import { leadService } from '../../services/authService';
import { toast } from 'react-toastify';
import {
  HiOutlineRefresh,
  HiOutlineLink,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineInformationCircle,
  HiOutlineBookmark,
  HiOutlineClock,
  HiOutlineDownload,
  HiOutlineDocumentDownload,
  HiOutlineTable,
  HiOutlineClipboardCopy,
  HiOutlineEye,
  HiOutlineEyeOff
} from 'react-icons/hi';


const SAMPLE_LEADS = [
  {
    doctorName: 'Dr. Rajesh Sharma',
    clinicName: 'Apex Heart & Vascular Clinic',
    phone: '+919876543210',
    email: 'dr.rajesh@apexclinic.com',
    city: 'Mumbai',
    address: '102, Bandra West, Linking Road',
    specialization: 'Cardiology',
    source: 'Facebook Ads',
    needForClinic: 'Lead Generation & Patient Booking CRM',
    demoTime: '2026-10-12 11:30 AM'
  },
  {
    doctorName: 'Dr. Priya Nair',
    clinicName: 'SkinCare Dermatology Center',
    phone: '+919812345678',
    email: 'priya.nair@skincare.in',
    city: 'Bangalore',
    address: '45 Indiranagar, 100ft Road',
    specialization: 'Dermatology',
    source: 'Instagram',
    needForClinic: 'Automated WhatsApp Reminders & EHR',
    demoTime: '2026-10-14 03:00 PM'
  },
  {
    doctorName: 'Dr. Amit Patel',
    clinicName: 'City Orthopedic Hospital',
    phone: '+919923456789',
    email: 'dr.amitpatel@cityortho.com',
    city: 'Ahmedabad',
    address: 'Opp. Commerce College, Navrangpura',
    specialization: 'Orthopedics',
    source: 'Google Search',
    needForClinic: 'Online OPD Appointment Software',
    demoTime: '2026-10-15 10:00 AM'
  },
  {
    doctorName: 'Dr. Sunita Rao',
    clinicName: 'Apollo Pediatrics Clinic',
    phone: '+919734567890',
    email: 'sunita.rao@apollopediatrics.com',
    city: 'Hyderabad',
    address: 'Plot 12, Jubilee Hills, Road No. 36',
    specialization: 'Pediatrics',
    source: 'Website',
    needForClinic: 'Telemedicine & Digital Prescriptions',
    demoTime: '2026-10-16 04:30 PM'
  },
  {
    doctorName: 'Dr. Vikram Malhotra',
    clinicName: 'Metro Dental & Maxillofacial',
    phone: '+919845678901',
    email: 'vikram@metrodental.com',
    city: 'Delhi',
    address: 'B-4/22 Safdarjung Enclave',
    specialization: 'Dentistry',
    source: 'Referral',
    needForClinic: 'Billing Management & Marketing Funnel',
    demoTime: '2026-10-18 01:00 PM'
  }
];

const SyncSheet = () => {
  const [sheetUrl, setSheetUrl] = useState('');
  const [savedUrl, setSavedUrl] = useState('');
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [savingUrl, setSavingUrl] = useState(false);
  const [results, setResults] = useState(null);
  const [showSamplePreview, setShowSamplePreview] = useState(false);

  // Auto-load saved sheet configuration on mount
  useEffect(() => {
    // 1. Instant populate from browser localStorage
    const cachedUrl = localStorage.getItem('saved_sheet_url');
    if (cachedUrl) {
      setSheetUrl(cachedUrl);
      setSavedUrl(cachedUrl);
    }

    // 2. Fetch ground-truth persisted config from PostgreSQL database
    const loadConfig = async () => {
      try {
        const res = await leadService.getSheetConfig();
        if (res.data?.sheetUrl) {
          setSheetUrl(res.data.sheetUrl);
          setSavedUrl(res.data.sheetUrl);
          localStorage.setItem('saved_sheet_url', res.data.sheetUrl);
        }
        if (res.data?.lastSyncedAt) {
          setLastSyncedAt(res.data.lastSyncedAt);
        }
        if (res.data?.lastStats) {
          setResults(res.data.lastStats);
        }
      } catch (err) {
        console.log('Notice: Could not load sheet config:', err.message);
      }
    };

    loadConfig();
  }, []);

  const formatSyncedDate = (isoStr) => {
    if (!isoStr) return null;
    try {
      const d = new Date(isoStr);
      return d.toLocaleString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch (e) {
      return isoStr;
    }
  };

  // Download sample CSV template
  const handleDownloadSampleCsv = () => {
    const headers = ['Doctor Name', 'Clinic Name', 'Phone', 'Email', 'City', 'Address', 'Specialization', 'Source', 'Need for Clinic', 'Demo Time'];
    const rows = SAMPLE_LEADS.map(lead => [
      `"${lead.doctorName}"`,
      `"${lead.clinicName}"`,
      `"${lead.phone}"`,
      `"${lead.email}"`,
      `"${lead.city}"`,
      `"${lead.address.replace(/"/g, '""')}"`,
      `"${lead.specialization}"`,
      `"${lead.source}"`,
      `"${lead.needForClinic.replace(/"/g, '""')}"`,
      `"${lead.demoTime}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'leadflow_doctor_leads_sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Sample template downloaded! Open or import it directly into Google Sheets.');
  };

  // Copy sample column headers
  const handleCopyHeaders = () => {
    const headersText = 'Doctor Name\tClinic Name\tPhone\tEmail\tCity\tAddress\tSpecialization\tSource\tNeed for Clinic\tDemo Time';
    navigator.clipboard.writeText(headersText).then(() => {
      toast.success('All 10 column headers copied! Paste directly into row 1 of Google Sheets.');
    }).catch(() => {
      toast.error('Failed to copy to clipboard.');
    });
  };

  // Save URL without running sync
  const handleSaveOnly = async () => {
    if (!sheetUrl.trim()) {
      toast.error('Please enter a Google Sheet URL to save');
      return;
    }
    setSavingUrl(true);
    try {
      await leadService.saveSheetUrl(sheetUrl.trim());
      setSavedUrl(sheetUrl.trim());
      localStorage.setItem('saved_sheet_url', sheetUrl.trim());
      toast.success('Google Sheet link saved! It will load automatically every time.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save sheet URL');
    } finally {
      setSavingUrl(false);
    }
  };

  // Sync and automatically save
  const handleSync = async (e) => {
    e.preventDefault();

    if (!sheetUrl.trim()) {
      toast.error('Please enter a Google Sheet URL');
      return;
    }

    setSyncing(true);
    setResults(null);

    try {
      const response = await leadService.syncSheet(sheetUrl.trim());
      setResults(response.data.results);
      setSavedUrl(sheetUrl.trim());
      localStorage.setItem('saved_sheet_url', sheetUrl.trim());
      if (response.data.lastSyncedAt) {
        setLastSyncedAt(response.data.lastSyncedAt);
      }
      toast.success(response.data.message || 'Sheet synced and link saved successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to sync Google Sheet');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div style={{ maxWidth: 840 }}>
      <div className="page-header">
        <h1>Google Sheet Ingestion</h1>
        <p>Sync inbound doctor leads instantly from your shared Google Sheets pipeline</p>
      </div>

      {/* Active Saved Link Status Badge */}
      {savedUrl && (
        <div style={{
          background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
          border: '1px solid #86efac',
          borderRadius: 'var(--radius-lg)',
          padding: '14px 18px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: '#15803d',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
              flexShrink: 0
            }}>
              <HiOutlineBookmark />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#14532d' }}>
                Active Sheet Link Saved & Ready
              </div>
              <div style={{ fontSize: '0.78rem', color: '#166534', maxWidth: 460, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {savedUrl}
              </div>
            </div>
          </div>

          {lastSyncedAt && (
            <div style={{
              fontSize: '0.75rem',
              color: '#166534',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              background: '#ffffff',
              padding: '5px 10px',
              borderRadius: 6,
              border: '1px solid #bbf7d0',
              fontWeight: 600
            }}>
              <HiOutlineClock style={{ fontSize: '0.85rem' }} />
              <span>Last synced: {formatSyncedDate(lastSyncedAt)}</span>
            </div>
          )}
        </div>
      )}

      {/* Sample Sheet Template & Download Card */}
      <div className="glass-card" style={{
        marginBottom: 24,
        background: 'linear-gradient(135deg, #ffffff 0%, #f0fdfa 100%)',
        border: '1px solid #99f6e4'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flex: '1 1 300px' }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: '12px',
              background: '#0d9488',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)'
            }}>
              <HiOutlineDocumentDownload />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#134e4a' }}>
                  Sample Google Sheet Template
                </h3>
                <span className="badge badge-success" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                  Standard Format
                </span>
              </div>
              <p style={{ color: '#115e59', fontSize: '0.86rem', lineHeight: 1.5, margin: 0 }}>
                Download our pre-formatted CSV template or copy columns to prepare your Google Sheet for instant syncing.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setShowSamplePreview(!showSamplePreview)}
              style={{
                fontSize: '0.84rem',
                padding: '8px 14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: '#ffffff',
                border: '1px solid #ccfbf1',
                color: '#0f766e'
              }}
            >
              {showSamplePreview ? <HiOutlineEyeOff /> : <HiOutlineEye />}
              <span>{showSamplePreview ? 'Hide Sample' : 'Preview Sample'}</span>
            </button>

            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleCopyHeaders}
              title="Copy column headers to paste into row 1 of Google Sheets"
              style={{
                fontSize: '0.84rem',
                padding: '8px 14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: '#ffffff',
                border: '1px solid #ccfbf1',
                color: '#0f766e'
              }}
            >
              <HiOutlineClipboardCopy />
              <span>Copy Headers</span>
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleDownloadSampleCsv}
              style={{
                fontSize: '0.84rem',
                padding: '8px 16px',
                background: '#0d9488',
                borderColor: '#0d9488',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 4px 10px rgba(13, 148, 136, 0.3)'
              }}
            >
              <HiOutlineDownload style={{ fontSize: '1rem' }} />
              <span>Download Sample (.CSV)</span>
            </button>
          </div>
        </div>

        {/* Required Headers Pill Badges */}
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px dashed #99f6e4' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#115e59' }}>Supported Column Headers:</span>
            {['Doctor Name', 'Clinic Name', 'Phone', 'Email', 'City', 'Address', 'Specialization', 'Source', 'Need for Clinic', 'Demo Time'].map(col => (
              <span key={col} className="badge badge-neutral" style={{
                fontSize: '0.72rem',
                background: '#ffffff',
                borderColor: '#99f6e4',
                color: '#0f766e',
                fontWeight: 600
              }}>
                {col}
              </span>
            ))}
          </div>
        </div>

        {/* Expandable Sample Data Table Preview */}
        {showSamplePreview && (
          <div style={{
            marginTop: 18,
            padding: '16px',
            background: '#ffffff',
            borderRadius: 'var(--radius-md)',
            border: '1px solid #ccfbf1',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#134e4a', display: 'flex', alignItems: 'center', gap: 6 }}>
                <HiOutlineTable /> Sample Google Sheet Layout (5 Demo Rows)
              </div>
              <span style={{ fontSize: '0.75rem', color: '#0f766e' }}>
                Tip: In Google Sheets, go to <strong>File → Import → Upload</strong> this sample file.
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.78rem',
                textAlign: 'left'
              }}>
                <thead>
                  <tr style={{ background: '#f0fdfa', borderBottom: '2px solid #99f6e4' }}>
                    <th style={{ padding: '8px 10px', color: '#134e4a', fontWeight: 700 }}>Doctor Name</th>
                    <th style={{ padding: '8px 10px', color: '#134e4a', fontWeight: 700 }}>Clinic Name</th>
                    <th style={{ padding: '8px 10px', color: '#134e4a', fontWeight: 700 }}>Phone</th>
                    <th style={{ padding: '8px 10px', color: '#134e4a', fontWeight: 700 }}>Email</th>
                    <th style={{ padding: '8px 10px', color: '#134e4a', fontWeight: 700 }}>City</th>
                    <th style={{ padding: '8px 10px', color: '#134e4a', fontWeight: 700 }}>Address</th>
                    <th style={{ padding: '8px 10px', color: '#134e4a', fontWeight: 700 }}>Specialization</th>
                    <th style={{ padding: '8px 10px', color: '#134e4a', fontWeight: 700 }}>Source</th>
                    <th style={{ padding: '8px 10px', color: '#134e4a', fontWeight: 700 }}>Need for Clinic</th>
                    <th style={{ padding: '8px 10px', color: '#134e4a', fontWeight: 700 }}>Demo Time</th>
                  </tr>
                </thead>
                <tbody>
                  {SAMPLE_LEADS.map((lead, idx) => (
                    <tr key={idx} style={{
                      borderBottom: '1px solid #f1f5f9',
                      background: idx % 2 === 0 ? '#ffffff' : '#fafafa'
                    }}>
                      <td style={{ padding: '8px 10px', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap' }}>{lead.doctorName}</td>
                      <td style={{ padding: '8px 10px', color: '#475569', whiteSpace: 'nowrap' }}>{lead.clinicName}</td>
                      <td style={{ padding: '8px 10px', color: '#475569', whiteSpace: 'nowrap' }}>{lead.phone}</td>
                      <td style={{ padding: '8px 10px', color: '#475569' }}>{lead.email}</td>
                      <td style={{ padding: '8px 10px', color: '#475569', whiteSpace: 'nowrap' }}>{lead.city}</td>
                      <td style={{ padding: '8px 10px', color: '#475569', maxWidth: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {lead.address}
                      </td>
                      <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                        <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                          {lead.specialization}
                        </span>
                      </td>
                      <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                        <span className="badge badge-primary" style={{ fontSize: '0.7rem', background: '#eff6ff', color: '#1d4ed8' }}>
                          {lead.source}
                        </span>
                      </td>
                      <td style={{ padding: '8px 10px', color: '#0f766e', maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {lead.needForClinic}
                      </td>
                      <td style={{ padding: '8px 10px', color: '#b45309', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {lead.demoTime}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Guide Card */}
      <div className="glass-card" style={{ marginBottom: 24, background: 'linear-gradient(135deg, #ffffff 0%, #f8faff 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: '12px',
            background: 'var(--color-primary-subtle)',
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
            flexShrink: 0
          }}>
            <HiOutlineInformationCircle />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 4 }}>How to connect your Google Sheet</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: 8 }}>
              1. Open or create your Google Sheet using the headers above.
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: 8 }}>
              2. Make sure sharing is set to <strong>"Anyone with the link can view"</strong> (or go to <em>File → Share → Publish to web → CSV</em>).
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: 0 }}>
              3. Paste the URL below and click <strong>Execute Sync</strong>. The URL will be saved permanently.
            </p>
          </div>
        </div>
      </div>


      {/* Ingestion Input Card */}
      <div className="glass-card sync-card" style={{ maxWidth: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 8 }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <HiOutlineLink style={{ color: 'var(--color-primary)' }} />
            Google Sheet URL
          </h2>
          {savedUrl && (
            <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
              <HiOutlineCheckCircle /> Saved to System
            </span>
          )}
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 20 }}>
          Standard sharing/edit links or Published CSV links are supported. Once saved, this link is retained for instant future syncs.
        </p>

        <form onSubmit={handleSync}>
          <div className="sync-url-row" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input
              type="url"
              className="form-input"
              placeholder="https://docs.google.com/spreadsheets/d/.../edit or pub?output=csv"
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              required
              style={{ flex: '1 1 320px', minWidth: 260 }}
            />
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleSaveOnly}
              disabled={savingUrl || syncing || !sheetUrl.trim()}
              title="Save link without executing sync"
              style={{ padding: '0 16px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <HiOutlineBookmark />
              <span>{savingUrl ? 'Saving...' : 'Save Link'}</span>
            </button>
            <button type="submit" className="btn btn-primary" disabled={syncing}>
              {syncing ? (
                <>
                  <span className="spinner spinner-sm"></span>
                  <span>Syncing Pipeline...</span>
                </>
              ) : (
                <>
                  <HiOutlineRefresh className="spin-on-hover" />
                  <span>Execute Sync</span>
                </>
              )}
            </button>
          </div>
        </form>

        {results && (
          <div style={{ marginTop: 28, borderTop: '1px solid var(--border-color)', paddingTop: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Latest Ingestion Summary</h3>
              {lastSyncedAt && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Synced on {formatSyncedDate(lastSyncedAt)}
                </span>
              )}
            </div>
            <div className="sync-results" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))' }}>
              <div className="sync-result-item">
                <div className="value">{results.totalRows}</div>
                <div className="label">Rows Analyzed</div>
              </div>
              <div className="sync-result-item">
                <div className="value" style={{ color: 'var(--color-success-dark)' }}>
                  <HiOutlineCheckCircle style={{ marginRight: 4, verticalAlign: 'middle' }} />
                  {results.created}
                </div>
                <div className="label">New Leads</div>
              </div>
              <div className="sync-result-item">
                <div className="value" style={{ color: '#0369a1' }}>
                  {results.updated || 0}
                </div>
                <div className="label">Updated</div>
              </div>
              <div className="sync-result-item">
                <div className="value" style={{ color: 'var(--color-warning-dark)' }}>
                  {results.skipped}
                </div>
                <div className="label">Unchanged</div>
              </div>
              <div className="sync-result-item">
                <div className="value" style={{ color: 'var(--color-danger-dark)' }}>
                  <HiOutlineExclamationCircle style={{ marginRight: 4, verticalAlign: 'middle' }} />
                  {results.errors}
                </div>
                <div className="label">Failed Rows</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SyncSheet;
