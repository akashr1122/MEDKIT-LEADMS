const { User } = require('../models');
const { Op } = require('sequelize');

/**
 * Get all users - GET /api/users
 */
const getAll = async (req, res) => {
  try {
    const { role, search, isActive } = req.query;
    const where = {};

    if (role) {
      where.role = role;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const users = await User.findAll({
      where,
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['password'] },
    });

    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Create user - POST /api/users
 */
const create = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password, and role are required.' });
    }

    if (!['calling_agent', 'demo_agent'].includes(role)) {
      return res.status(400).json({ message: 'Role must be calling_agent or demo_agent.' });
    }

    // Check if email already exists
    const existing = await User.findOne({ where: { email: email.toLowerCase() } });
    if (existing) {
      return res.status(400).json({ message: 'Email already exists.' });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role,
      phone: phone || null,
    });

    res.status(201).json({ message: 'User created successfully', user: user.toJSON() });
  } catch (error) {
    console.error('Create user error:', error);
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(e => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Update user - PUT /api/users/:id
 */
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, role, phone, isActive } = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot modify admin account.' });
    }

    // Check email uniqueness if changed
    if (email && email.toLowerCase() !== user.email) {
      const existing = await User.findOne({ where: { email: email.toLowerCase() } });
      if (existing) {
        return res.status(400).json({ message: 'Email already exists.' });
      }
    }

    await user.update({
      name: name || user.name,
      email: email ? email.toLowerCase() : user.email,
      ...(password && { password }),
      role: role || user.role,
      phone: phone !== undefined ? phone : user.phone,
      isActive: isActive !== undefined ? isActive : user.isActive,
    });

    res.json({ message: 'User updated successfully', user: user.toJSON() });
  } catch (error) {
    console.error('Update user error:', error);
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(e => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Deactivate user - DELETE /api/users/:id
 */
const deactivate = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot deactivate admin account.' });
    }

    await user.update({ isActive: false });

    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = { getAll, create, update, deactivate };
