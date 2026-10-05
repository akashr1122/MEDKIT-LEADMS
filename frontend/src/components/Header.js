import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { leadService } from '../services/authService';
import {
  HiOutlineBell,
  HiOutlineRefresh,
  HiOutlineMenu,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineClipboardList,
  HiOutlinePhone,
  HiOutlineDesktopComputer,
  HiOutlineInformationCircle,
  HiOutlineSun,
  HiOutlineMoon,
} from 'react-icons/hi';

const Header = ({ onToggleSidebar }) => {
  const { user } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 'welcome',
      title: 'Workspace Active',
      message: 'LeadFlow enterprise management environment initialized.',
      time: 'Just now',
      read: false,
      type: 'info',
      path: user?.role === 'admin' ? '/admin/dashboard' : user?.role === 'calling_agent' ? '/calling/dashboard' : '/demo/dashboard',
    },
    {
      id: 'sync-ready',
      title: 'Google Sheet Sync',
      message: 'Automated CSV sync pipeline is ready for lead ingestion.',
      time: '10m ago',
      read: false,
      type: 'sync',
      path: '/admin/sync',
    },
  ]);

  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch dynamic lead alerts on mount
  useEffect(() => {
    const fetchLeadAlerts = async () => {
      try {
        if (user?.role === 'admin') {
          const res = await leadService.getStats();
          const stats = res.data.stats;
          if (stats?.newLeads > 0) {
            setNotifications(prev => {
              if (prev.some(n => n.id === 'new-leads-alert')) return prev;
              return [
                {
                  id: 'new-leads-alert',
                  title: 'New Leads Ingested',
                  message: `${stats.newLeads} doctor lead(s) require calling agent assignment.`,
                  time: '5m ago',
                  read: false,
                  type: 'lead',
                  path: '/admin/leads',
                },
                ...prev,
              ];
            });
          }
          if (stats?.saleCompleted > 0) {
            setNotifications(prev => {
              if (prev.some(n => n.id === 'sales-alert')) return prev;
              return [
                {
                  id: 'sales-alert',
                  title: 'Sales Won',
                  message: `${stats.saleCompleted} deal(s) successfully converted to client!`,
                  time: '1h ago',
                  read: false,
                  type: 'sale',
                  path: '/admin/dashboard',
                },
                ...prev,
              ];
            });
          }
        }
      } catch (err) {
        // Silently handle if unauthenticated/offline
      }
    };

    fetchLeadAlerts();
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setShowNotifications(false);
  };

  const handleNotificationClick = (item) => {
    setNotifications(notifications.map(n => n.id === item.id ? { ...n, read: true } : n));
    setShowNotifications(false);
    if (item.path) {
      navigate(item.path);
    }
  };

  const getPageInfo = () => {
    switch (location.pathname) {
      case '/admin/dashboard':
        return { title: 'Executive Dashboard', subtitle: 'Pipeline performance & key agent metrics' };
      case '/admin/leads':
        return { title: 'Lead Management', subtitle: 'Track, assign and filter all inbound leads' };
      case '/admin/users':
        return { title: 'User Management', subtitle: 'Configure calling and demo agent access' };
      case '/admin/sync':
        return { title: 'Google Sheet Sync', subtitle: 'Real-time CSV automated lead ingestion' };
      case '/calling/dashboard':
        return { title: 'Calling Workspace', subtitle: 'Manage your assigned doctor outreach leads' };
      case '/demo/dashboard':
        return { title: 'Demo Pipeline', subtitle: 'Schedule, conduct and close product demos' };
      default:
        return { title: 'Dashboard', subtitle: 'LeadFlow Management System' };
    }
  };

  const { title } = getPageInfo();

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin': return { label: 'Admin', class: 'badge-primary' };
      case 'calling_agent': return { label: 'Calling Agent', class: 'badge-info' };
      case 'demo_agent': return { label: 'Demo Agent', class: 'badge-accent' };
      default: return { label: role, class: 'badge-neutral' };
    }
  };

  const roleInfo = getRoleBadge(user?.role);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'lead':
        return <HiOutlineClipboardList style={{ color: 'var(--color-primary)' }} />;
      case 'sync':
        return <HiOutlineRefresh style={{ color: '#0284c7' }} />;
      case 'sale':
        return <HiOutlineCheck style={{ color: 'var(--color-success-dark)' }} />;
      case 'call':
        return <HiOutlinePhone style={{ color: '#0ea5e9' }} />;
      case 'demo':
        return <HiOutlineDesktopComputer style={{ color: '#f59e0b' }} />;
      default:
        return <HiOutlineInformationCircle style={{ color: 'var(--color-primary)' }} />;
    }
  };

  return (
    <header className="top-header">
      <div className="top-header-left">
        <button
          className="mobile-menu-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
        >
          <HiOutlineMenu />
        </button>
        <div className="header-breadcrumbs">
          <span className="breadcrumb-root">LeadFlow</span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">{title}</span>
        </div>
      </div>

      <div className="top-header-right">
        {/* Live system status indicator */}
        <div className="system-status-pill">
          <span className="status-live-dot"></span>
          <span className="status-text">System Live</span>
        </div>

        {/* Vibrant Dark / Light Mode Switcher */}
        <button
          type="button"
          className="header-icon-btn theme-toggle-btn"
          onClick={toggleTheme}
          title={isDark ? "Switch to Crisp Light Mode" : "Switch to Vibrant Cyber Dark Mode"}
          aria-label={isDark ? "Switch to Crisp Light Mode" : "Switch to Vibrant Cyber Dark Mode"}
          style={{
            background: isDark ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(14, 165, 233, 0.25))' : 'var(--bg-subtle)',
            color: isDark ? '#fbbf24' : '#6366f1',
            border: isDark ? '1px solid rgba(251, 191, 36, 0.35)' : '1px solid var(--border-color)',
            boxShadow: isDark ? '0 0 12px rgba(99, 102, 241, 0.3)' : 'none',
          }}
        >
          {isDark ? (
            <HiOutlineSun className="theme-icon sun-icon" style={{ fontSize: '1.25rem', filter: 'drop-shadow(0 0 4px rgba(251, 191, 36, 0.8))' }} />
          ) : (
            <HiOutlineMoon className="theme-icon moon-icon" style={{ fontSize: '1.2rem' }} />
          )}
        </button>

        {/* Quick Sync Action for Admin (New Lead button removed as requested) */}
        {user?.role === 'admin' && (
          <div className="header-quick-actions">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => navigate('/admin/sync')}
              title="Sync Google Sheet"
            >
              <HiOutlineRefresh className="spin-on-hover" />
              <span>Sync Sheet</span>
            </button>
          </div>
        )}

        {/* Working Notification Bell with Dropdown */}
        <div className="notification-wrapper" ref={dropdownRef}>
          <button
            type="button"
            className={`header-icon-btn ${showNotifications ? 'active' : ''}`}
            title="Notifications"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
          >
            <HiOutlineBell />
            {unreadCount > 0 && (
              <span className="notification-badge-count">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotifications && (
            <div className="notifications-dropdown">
              <div className="notifications-dropdown-header">
                <div className="notifications-header-left">
                  <h3>Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="badge badge-primary badge-xs">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="notifications-header-actions">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      className="notification-action-link"
                      onClick={markAllAsRead}
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    type="button"
                    className="notification-close-btn"
                    onClick={() => setShowNotifications(false)}
                    aria-label="Close notifications"
                  >
                    <HiOutlineX />
                  </button>
                </div>
              </div>

              <div className="notifications-list">
                {notifications.length === 0 ? (
                  <div className="notifications-empty">
                    <div className="empty-bell-icon">
                      <HiOutlineBell />
                    </div>
                    <p className="empty-title">All caught up!</p>
                    <p className="empty-desc">You have no new alerts at this moment.</p>
                  </div>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      className={`notification-item ${!item.read ? 'unread' : ''}`}
                      onClick={() => handleNotificationClick(item)}
                    >
                      <div className="notification-item-icon">
                        {getNotificationIcon(item.type)}
                      </div>
                      <div className="notification-item-body">
                        <div className="notification-item-title-row">
                          <span className="notification-item-title">{item.title}</span>
                          <span className="notification-item-time">{item.time}</span>
                        </div>
                        <p className="notification-item-message">{item.message}</p>
                      </div>
                      {!item.read && <span className="notification-unread-dot"></span>}
                    </div>
                  ))
                )}
              </div>

              {notifications.length > 0 && (
                <div className="notifications-dropdown-footer">
                  <button
                    type="button"
                    className="notifications-clear-all"
                    onClick={clearAllNotifications}
                  >
                    Clear all alerts
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Header Profile Chip */}
        <div className="header-profile-chip">
          <div className="header-profile-avatar">
            {getInitials(user?.name)}
          </div>
          <div className="header-profile-details">
            <span className="header-profile-name">{user?.name}</span>
            <span className={`badge ${roleInfo.class} badge-xs`}>{roleInfo.label}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
