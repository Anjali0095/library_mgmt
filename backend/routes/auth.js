const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db/connection');

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, roll_number, department, phone } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password, and role are required' });
    }

    if (!['student', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Role must be student or admin' });
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const colors = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];
    const avatar_color = colors[Math.floor(Math.random() * colors.length)];

    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role, roll_number, department, phone, avatar_color) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, email, hashed, role, roll_number || null, department || null, phone || null, avatar_color]
    );

    const token = jwt.sign(
      { id: result.insertId, email, role, name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    const [user] = await pool.query(
      'SELECT id, name, email, role, roll_number, department, phone, avatar_color, created_at FROM users WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({ token, user: user[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const [users] = await pool.query('SELECT * FROM users WHERE email = ? AND is_active = 1', [email]);
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = users[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    const { password: _, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user
router.get('/me', require('../middleware/auth').authMiddleware, async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, name, email, role, roll_number, department, phone, avatar_color, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (users.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(users[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
