import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineViewGrid,
  HiOutlineUsers,
  HiOutlineClipboardList,
  HiOutlineRefresh,
  HiOutlinePhone,
  HiOutlineDesktopComputer,
  HiOutlineLogout,
  HiOutlineSparkles,
  HiOutlineShieldCheck,
  HiOutlineX,
} from 'react-icons/hi';

const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (path) => {
    navigate(path);
    if (setMobileOpen) setMobileOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'calling_agent': return 'Calling Agent';
      case 'demo_agent': return 'Demo Agent';
      default: return role;
    }
  };

  const adminNav = [
    {
      section: 'OVERVIEW',
      items: [
        { path: '/admin/dashboard', icon: <HiOutlineViewGrid />, label: 'Dashboard', badge: 'Live' },
      ],
    },
    {
      section: 'MANAGEMENT',
      items: [
        { path: '/admin/leads', icon: <HiOutlineClipboardList />, label: 'All Leads' },
        { path: '/admin/users', icon: <HiOutlineUsers />, label: 'Team & Agents' },
        { path: '/admin/sync', icon: <HiOutlineRefresh />, label: 'Google Sheets Sync' },
      ],
    },
  ];

  const callingNav = [
    {
      section: 'AGENT WORKSPACE',
      items: [
        { path: '/calling/dashboard', icon: <HiOutlinePhone />, label: 'Assigned Leads' },
      ],
    },
  ];

  const demoNav = [
    {
      section: 'DEMO PIPELINE',
      items: [
        { path: '/demo/dashboard', icon: <HiOutlineDesktopComputer />, label: 'Product Demos' },
      ],
    },
  ];

  const getNavSections = () => {
    switch (user?.role) {
      case 'admin': return adminNav;
      case 'calling_agent': return callingNav;
      case 'demo_agent': return demoNav;
      default: return [];
    }
  };

  const navSections = getNavSections();

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileOpen && setMobileOpen(false)} />
      )}

      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        {/* Brand Logo Header */}
        <div className="sidebar-brand">
          <div className="brand-logo-wrapper">
            <div className="brand-logo-icon">
              <HiOutlineSparkles />
            </div>
            <div className="brand-logo-text">
              <span className="brand-title">LeadFlow</span>
              <span className="brand-badge">ENTERPRISE</span>
            </div>
          </div>
          {mobileOpen && (
            <button
              className="sidebar-close-btn"
              onClick={() => setMobileOpen && setMobileOpen(false)}
            >
              <HiOutlineX />
            </button>
          )}
        </div>

        {/* Workspace pill */}
        <div className="sidebar-workspace">
          <div className="workspace-card">
            <div className="workspace-icon">
              <HiOutlineShieldCheck />
            </div>
            <div className="workspace-info">
              <div className="workspace-title">Medical Leads CRM</div>
              <div className="workspace-status">● Realtime Sync</div>
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="sidebar-nav">
          {navSections.map((section, idx) => (
            <div key={idx} className="sidebar-section">
              <div className="sidebar-section-title">{section.section}</div>
              {section.items.map((link) => {
                const active = isActive(link.path);
                return (
                  <button
                    key={link.path}
                    className={`sidebar-link ${active ? 'active' : ''}`}
                    onClick={() => handleNavigate(link.path)}
                  >
                    <span className="sidebar-link-icon">{link.icon}</span>
                    <span className="sidebar-link-label">{link.label}</span>
                    {link.badge && <span className="sidebar-pill">{link.badge}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User Card in Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-user-card">
            <div className="sidebar-user-avatar">
              {getInitials(user?.name)}
              <span className="user-online-dot"></span>
            </div>
            <div className="sidebar-user-details">
              <div className="sidebar-user-name" title={user?.name}>{user?.name}</div>
              <div className="sidebar-user-role">{getRoleLabel(user?.role)}</div>
            </div>
          </div>
          <button className="sidebar-logout-btn" onClick={handleLogout} title="Sign Out">
            <HiOutlineLogout />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
