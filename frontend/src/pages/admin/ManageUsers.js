import React, { useState, useEffect, useCallback } from 'react';
import { userService } from '../../services/authService';
import Pagination from '../../components/Pagination';
import { toast } from 'react-toastify';
import {
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineX,
  HiOutlineMail,
  HiOutlinePhone,
} from 'react-icons/hi';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'calling_agent', phone: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const params = {};
      if (filterRole) params.role = filterRole;
      if (search) params.search = search;
      const response = await userService.getAll(params);
      setUsers(response.data.users);
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [filterRole, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterRole, search]);

  const totalUsersCount = users.length;
  const paginatedUsers = users.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', password: '', role: 'calling_agent', phone: '' });
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      phone: user.phone || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingUser) {
        const updateData = { ...formData };
        if (!updateData.password) delete updateData.password;
        await userService.update(editingUser.id, updateData);
        toast.success('User updated successfully');
      } else {
        await userService.create(formData);
        toast.success('User created successfully');
      }
      setShowModal(false);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (user) => {
    if (!window.confirm(`Deactivate agent account for ${user.name}?`)) return;
    try {
      await userService.deactivate(user.id);
      toast.success('User deactivated');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to deactivate');
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return (
          <span className="badge badge-primary">
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }}></span>
            Administrator
          </span>
        );
      case 'calling_agent':
        return (
          <span className="badge badge-info">
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }}></span>
            Calling Agent
          </span>
        );
      case 'demo_agent':
        return (
          <span className="badge badge-warning">
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }}></span>
            Demo Specialist
          </span>
        );
      default:
        return <span className="badge badge-neutral">{role}</span>;
    }
  };

  const getStatusBadge = (isActive) => {
    return isActive ? (
      <span className="badge badge-success">
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }}></span>
        Active
      </span>
    ) : (
      <span className="badge badge-danger">
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }}></span>
        Inactive
      </span>
    );
  };

  const getUserInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div>
      <div className="page-header">
        <h1>Team & User Management</h1>
        <p>Provision agent credentials, configure roles, and monitor workforce status</p>
      </div>

      <div className="table-wrapper">
        <div className="table-header">
          <h2>Registered Agents ({users.length})</h2>
          <div className="table-actions">
            <div className="filter-bar">
              <select
                className="form-select"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
              >
                <option value="">All Roles</option>
                <option value="calling_agent">Calling Agents</option>
                <option value="demo_agent">Demo Specialists</option>
                <option value="admin">Administrators</option>
              </select>
              <div className="search-input-wrapper">
                <HiOutlineSearch className="search-icon" />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <button className="btn btn-primary btn-sm" onClick={openCreateModal}>
              <HiOutlinePlus /> Add New Agent
            </button>
          </div>
        </div>

        <div className="table-scroll">
          {loading ? (
            <div className="loading-center">
              <div className="spinner spinner-lg"></div>
              <p>Loading agent roster...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="table-empty">
              <HiOutlineSearch style={{ fontSize: '2.5rem', opacity: 0.4 }} />
              <p>No agents found matching current search</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Agent Name</th>
                  <th>Email Address</th>
                  <th>Role</th>
                  <th>Phone Contact</th>
                  <th>Account Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 36,
                          height: 36,
                          borderRadius: '10px',
                          background: u.role === 'admin'
                            ? 'linear-gradient(135deg, #4f46e5, #7c3aed)'
                            : u.role === 'calling_agent'
                            ? 'linear-gradient(135deg, #0284c7, #38bdf8)'
                            : 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          flexShrink: 0,
                          boxShadow: '0 2px 6px rgba(15, 23, 42, 0.1)'
                        }}>
                          {getUserInitials(u.name)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{u.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID #{u.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
                        <HiOutlineMail style={{ color: 'var(--text-muted)' }} />
                        {u.email}
                      </span>
                    </td>
                    <td>{getRoleBadge(u.role)}</td>
                    <td>
                      {u.phone ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
                          <HiOutlinePhone style={{ color: 'var(--text-muted)' }} />
                          {u.phone}
                        </span>
                      ) : '—'}
                    </td>
                    <td>{getStatusBadge(u.isActive)}</td>
                    <td>
                      {u.role !== 'admin' && (
                        <div className="inline-actions">
                          <button
                            className="btn btn-ghost btn-icon btn-sm"
                            onClick={() => openEditModal(u)}
                            title="Edit Agent"
                          >
                            <HiOutlinePencil />
                          </button>
                          {u.isActive && (
                            <button
                              className="btn btn-ghost btn-icon btn-sm"
                              onClick={() => handleDeactivate(u)}
                              title="Deactivate Agent"
                              style={{ color: 'var(--color-danger)' }}
                            >
                              <HiOutlineTrash />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalUsersCount > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={totalUsersCount}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[10, 25, 50, 100]}
            itemLabel="agents & admins"
          />
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingUser ? 'Edit Agent Profile' : 'Create New Agent Account'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <HiOutlineX />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Alex Johnson"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="alex@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Password {editingUser ? '(leave blank to keep current)' : '*'}</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="••••••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!editingUser}
                  />
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Agent Role *</label>
                    <select
                      className="form-select"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      required
                    >
                      <option value="calling_agent">Calling Agent</option>
                      <option value="demo_agent">Demo Specialist</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Phone Contact</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="+1 234 567 8900"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? (
                    <>
                      <span className="spinner spinner-sm"></span>
                      Saving...
                    </>
                  ) : editingUser ? 'Update Agent' : 'Create Agent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;
