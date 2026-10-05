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
} from 'react-icons/hi';

const SyncSheet = () => {
  const [sheetUrl, setSheetUrl] = useState('');
  const [savedUrl, setSavedUrl] = useState('');
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [savingUrl, setSavingUrl] = useState(false);
  const [results, setResults] = useState(null);

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
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: 12 }}>
              Paste your standard Google Sheet link (or published CSV link). Once entered, the link is <strong>permanently saved</strong> so you can execute 1-click syncs anytime without repasting!
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['Doctor Name', 'Clinic Name', 'Phone', 'Email', 'City', 'Address', 'Specialization'].map(col => (
                <span key={col} className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>{col}</span>
              ))}
            </div>
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
