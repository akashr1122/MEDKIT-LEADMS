import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { leadService } from '../../services/authService';
import {
  HiOutlineClipboardList,
  HiOutlinePhone,
  HiOutlineDesktopComputer,
  HiOutlineCheckCircle,
  HiOutlineStar,
  HiOutlineCurrencyDollar,
  HiOutlineSparkles,
  HiOutlineRefresh,
  HiOutlineArrowRight,
  HiOutlineUserAdd,
  HiOutlineTrendingUp,
} from 'react-icons/hi';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await leadService.getStats();
      setStats(response.data.stats);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner spinner-lg"></div>
        <p>Loading analytics & pipeline...</p>
      </div>
    );
  }

  const totalLeads = stats?.totalLeads || 0;
  const newLeads = stats?.newLeads || 0;
  const callingLeads = stats?.callingLeads || 0;
  const demoLeads = stats?.demoLeads || 0;
  const completedLeads = stats?.completedLeads || 0;
  const interestedLeads = stats?.interestedLeads || 0;
  const demoScheduled = stats?.demoScheduled || 0;
  const saleCompleted = stats?.saleCompleted || 0;
  const totalCallingAgents = stats?.totalCallingAgents || 0;
  const totalDemoAgents = stats?.totalDemoAgents || 0;

  // Calculate percentages
  const conversionRate = totalLeads > 0 ? ((saleCompleted / totalLeads) * 100).toFixed(1) : 0;
  const interestRate = totalLeads > 0 ? ((interestedLeads / totalLeads) * 100).toFixed(1) : 0;

  return (
    <div className="dashboard-container">
      {/* Executive Welcome Hero Banner */}
      <div className="dashboard-welcome-banner">
        <div className="banner-content">
          <div className="banner-badge">
            <HiOutlineSparkles /> Real-time Analytics Active
          </div>
          <h1 className="banner-title">
            Welcome back, {user?.name || 'Administrator'} 👋
          </h1>
          <p className="banner-subtitle">
            Here is your live pipeline status across calling agents, doctor demos, and closed sales.
          </p>
        </div>
        <div className="banner-actions">
          <button
            className="btn btn-ghost banner-btn"
            onClick={() => navigate('/admin/sync')}
          >
            <HiOutlineRefresh />
            <span>Sync Sheet</span>
          </button>
          <button
            className="btn btn-primary banner-btn"
            onClick={() => navigate('/admin/leads')}
          >
            <HiOutlineClipboardList />
            <span>Manage Leads</span>
          </button>
        </div>
      </div>

      {/* Top 4 Primary KPI Hero Cards */}
      <div className="kpi-hero-grid">
        {/* Total Inbound Leads */}
        <div className="kpi-card kpi-card-primary">
          <div className="kpi-top">
            <div className="kpi-icon-wrap bg-primary-subtle text-primary">
              <HiOutlineClipboardList />
            </div>
            <div className="kpi-trend-pill trend-up">
              <HiOutlineTrendingUp /> +14.8%
            </div>
          </div>
          <div className="kpi-value">{totalLeads}</div>
          <div className="kpi-label">Total Doctor Leads</div>
          <div className="kpi-subtext">
            <span>{newLeads} pending assignment</span>
          </div>
        </div>

        {/* Calling Stage */}
        <div className="kpi-card kpi-card-info">
          <div className="kpi-top">
            <div className="kpi-icon-wrap bg-info-subtle text-info">
              <HiOutlinePhone />
            </div>
            <div className="kpi-pill-badge badge-info">
              {totalCallingAgents} Agents Active
            </div>
          </div>
          <div className="kpi-value">{callingLeads}</div>
          <div className="kpi-label">In Calling Pipeline</div>
          <div className="kpi-subtext">
            <span>{interestedLeads} marked interested ({interestRate}%)</span>
          </div>
        </div>

        {/* Demo Stage */}
        <div className="kpi-card kpi-card-warning">
          <div className="kpi-top">
            <div className="kpi-icon-wrap bg-warning-subtle text-warning">
              <HiOutlineDesktopComputer />
            </div>
            <div className="kpi-pill-badge badge-warning">
              {demoScheduled} Scheduled
            </div>
          </div>
          <div className="kpi-value">{demoLeads}</div>
          <div className="kpi-label">Demo Presentations</div>
          <div className="kpi-subtext">
            <span>{totalDemoAgents} demo agents assigned</span>
          </div>
        </div>

        {/* Closed Won / Sales */}
        <div className="kpi-card kpi-card-success">
          <div className="kpi-top">
            <div className="kpi-icon-wrap bg-success-subtle text-success">
              <HiOutlineCurrencyDollar />
            </div>
            <div className="kpi-trend-pill trend-success">
              <HiOutlineStar /> {conversionRate}% Win Rate
            </div>
          </div>
          <div className="kpi-value">{saleCompleted}</div>
          <div className="kpi-label">Deals Converted</div>
          <div className="kpi-subtext">
            <span>{completedLeads} total completed leads</span>
          </div>
        </div>
      </div>

      {/* Pipeline Funnel Progression Card */}
      <div className="glass-card funnel-card">
        <div className="funnel-header">
          <div>
            <h2 className="funnel-title">Doctor Lead Conversion Funnel</h2>
            <p className="funnel-subtitle">End-to-end stage progression from import to final sale</p>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigate('/admin/leads')}
          >
            <span>View Leads Table</span>
            <HiOutlineArrowRight />
          </button>
        </div>

        <div className="funnel-stages-row">
          <div className="funnel-stage-item">
            <div className="stage-chip-header">
              <span className="stage-step-num">01</span>
              <span className="stage-name">New Ingestion</span>
            </div>
            <div className="stage-count">{newLeads}</div>
            <div className="stage-bar">
              <div
                className="stage-bar-fill bg-indigo"
                style={{ width: `${totalLeads > 0 ? (newLeads / totalLeads) * 100 : 0}%` }}
              ></div>
            </div>
            <div className="stage-meta">Imported from Sheets / CSV</div>
          </div>

          <div className="funnel-arrow">➔</div>

          <div className="funnel-stage-item">
            <div className="stage-chip-header">
              <span className="stage-step-num">02</span>
              <span className="stage-name">Calling Outreach</span>
            </div>
            <div className="stage-count">{callingLeads}</div>
            <div className="stage-bar">
              <div
                className="stage-bar-fill bg-sky"
                style={{ width: `${totalLeads > 0 ? (callingLeads / totalLeads) * 100 : 0}%` }}
              ></div>
            </div>
            <div className="stage-meta">Under calling agent follow-up</div>
          </div>

          <div className="funnel-arrow">➔</div>

          <div className="funnel-stage-item">
            <div className="stage-chip-header">
              <span className="stage-step-num">03</span>
              <span className="stage-name">Doctor Interested</span>
            </div>
            <div className="stage-count">{interestedLeads}</div>
            <div className="stage-bar">
              <div
                className="stage-bar-fill bg-amber"
                style={{ width: `${totalLeads > 0 ? (interestedLeads / totalLeads) * 100 : 0}%` }}
              ></div>
            </div>
            <div className="stage-meta">Qualified for demo booking</div>
          </div>

          <div className="funnel-arrow">➔</div>

          <div className="funnel-stage-item">
            <div className="stage-chip-header">
              <span className="stage-step-num">04</span>
              <span className="stage-name">Demo Stage</span>
            </div>
            <div className="stage-count">{demoLeads}</div>
            <div className="stage-bar">
              <div
                className="stage-bar-fill bg-purple"
                style={{ width: `${totalLeads > 0 ? (demoLeads / totalLeads) * 100 : 0}%` }}
              ></div>
            </div>
            <div className="stage-meta">{demoScheduled} scheduled sessions</div>
          </div>

          <div className="funnel-arrow">➔</div>

          <div className="funnel-stage-item highlight-stage">
            <div className="stage-chip-header">
              <span className="stage-step-num">05</span>
              <span className="stage-name">Sale Closed</span>
            </div>
            <div className="stage-count text-success">{saleCompleted}</div>
            <div className="stage-bar">
              <div
                className="stage-bar-fill bg-emerald"
                style={{ width: `${totalLeads > 0 ? (saleCompleted / totalLeads) * 100 : 0}%` }}
              ></div>
            </div>
            <div className="stage-meta text-success font-medium">Final converted clients 🎉</div>
          </div>
        </div>
      </div>

      {/* Grid: Quick Operational Shortcuts & Team Resource Overview */}
      <div className="dashboard-grid-two">
        {/* Quick Operations */}
        <div className="glass-card">
          <div className="section-card-header">
            <div>
              <h3 className="section-card-title">Quick Administration</h3>
              <p className="section-card-subtitle">Common pipeline actions and routing shortcuts</p>
            </div>
          </div>

          <div className="quick-action-cards">
            <div className="quick-action-item" onClick={() => navigate('/admin/sync')}>
              <div className="action-item-icon bg-indigo-subtle text-primary">
                <HiOutlineRefresh />
              </div>
              <div className="action-item-text">
                <div className="action-item-title">Sync Google Sheet</div>
                <div className="action-item-desc">Pull latest doctor contacts directly into pipeline</div>
              </div>
              <HiOutlineArrowRight className="action-item-arrow" />
            </div>

            <div className="quick-action-item" onClick={() => navigate('/admin/leads')}>
              <div className="action-item-icon bg-sky-subtle text-info">
                <HiOutlineClipboardList />
              </div>
              <div className="action-item-text">
                <div className="action-item-title">Assign Calling Agents</div>
                <div className="action-item-desc">Distribute unassigned leads to your outreach team</div>
              </div>
              <HiOutlineArrowRight className="action-item-arrow" />
            </div>

            <div className="quick-action-item" onClick={() => navigate('/admin/users')}>
              <div className="action-item-icon bg-emerald-subtle text-success">
                <HiOutlineUserAdd />
              </div>
              <div className="action-item-text">
                <div className="action-item-title">Manage Agent Accounts</div>
                <div className="action-item-desc">Add or edit credentials for calling and demo reps</div>
              </div>
              <HiOutlineArrowRight className="action-item-arrow" />
            </div>
          </div>
        </div>

        {/* Team Capacity & Metrics */}
        <div className="glass-card">
          <div className="section-card-header">
            <div>
              <h3 className="section-card-title">Agent Network Capacity</h3>
              <p className="section-card-subtitle">Workforce distribution and operational load</p>
            </div>
          </div>

          <div className="team-stats-list">
            <div className="team-stat-row">
              <div className="team-stat-info">
                <div className="team-stat-icon-wrap text-primary bg-primary-subtle">
                  <HiOutlinePhone />
                </div>
                <div>
                  <div className="team-stat-name">Calling Reps</div>
                  <div className="team-stat-meta">Active doctor outreach agents</div>
                </div>
              </div>
              <div className="team-stat-right">
                <span className="team-stat-number">{totalCallingAgents}</span>
                <span className="badge badge-info">Active</span>
              </div>
            </div>

            <div className="team-stat-row">
              <div className="team-stat-info">
                <div className="team-stat-icon-wrap text-warning bg-warning-subtle">
                  <HiOutlineDesktopComputer />
                </div>
                <div>
                  <div className="team-stat-name">Demo Specialists</div>
                  <div className="team-stat-meta">Product presentation agents</div>
                </div>
              </div>
              <div className="team-stat-right">
                <span className="team-stat-number">{totalDemoAgents}</span>
                <span className="badge badge-warning">Active</span>
              </div>
            </div>

            <div className="team-stat-row">
              <div className="team-stat-info">
                <div className="team-stat-icon-wrap text-success bg-success-subtle">
                  <HiOutlineCheckCircle />
                </div>
                <div>
                  <div className="team-stat-name">Completed Pipeline Leads</div>
                  <div className="team-stat-meta">Full cycle processed leads</div>
                </div>
              </div>
              <div className="team-stat-right">
                <span className="team-stat-number">{completedLeads}</span>
                <span className="badge badge-success">Closed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
