const express = require('express');
const router = express.Router();
const { pool } = require('../db/connection');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Get all users (admin only)
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { search, role, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    let where = 'WHERE 1=1';
    const params = [];

    if (search) {
      where += ' AND (name LIKE ? OR email LIKE ? OR roll_number LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (role) {
      where += ' AND role = ?';
      params.push(role);
    }

    const [users] = await pool.query(
      `SELECT id, name, email, role, roll_number, department, phone, avatar_color, is_active, created_at
       FROM users ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM users ${where}`,
      params
    );

    res.json({
      users,
      total: countResult[0].total,
      page: parseInt(page),
      totalPages: Math.ceil(countResult[0].total / limit),
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get dashboard stats (admin)
router.get('/stats/dashboard', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [[totalBooks]] = await pool.query('SELECT COUNT(*) as count FROM books WHERE is_active=1');
    const [[totalUsers]] = await pool.query("SELECT COUNT(*) as count FROM users WHERE role='student' AND is_active=1");
    const [[activeBorrowings]] = await pool.query("SELECT COUNT(*) as count FROM borrowings WHERE status IN ('borrowed','overdue')");
    const [[overdue]] = await pool.query("SELECT COUNT(*) as count FROM borrowings WHERE status='overdue'");
    const [[returnedToday]] = await pool.query("SELECT COUNT(*) as count FROM borrowings WHERE return_date = CURDATE()");
    const [[totalFines]] = await pool.query("SELECT COALESCE(SUM(fine_amount),0) as total FROM borrowings WHERE fine_amount > 0");

    const [recentActivity] = await pool.query(`
      SELECT br.*, b.title, b.cover_color, u.name as user_name, u.avatar_color as user_avatar_color
      FROM borrowings br
      JOIN books b ON br.book_id = b.id
      JOIN users u ON br.user_id = u.id
      ORDER BY br.created_at DESC LIMIT 5
    `);

    const [popularBooks] = await pool.query(`
      SELECT b.title, b.author, b.cover_color, COUNT(br.id) as borrow_count
      FROM borrowings br JOIN books b ON br.book_id = b.id
      GROUP BY br.book_id ORDER BY borrow_count DESC LIMIT 5
    `);

    res.json({
      totalBooks: totalBooks.count,
      totalStudents: totalUsers.count,
      activeBorrowings: activeBorrowings.count,
      overdueBooks: overdue.count,
      returnedToday: returnedToday.count,
      totalFines: totalFines.total,
      recentActivity,
      popularBooks,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get student dashboard stats
router.get('/stats/student', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const [[active]] = await pool.query(
      "SELECT COUNT(*) as count FROM borrowings WHERE user_id=? AND status IN ('borrowed','overdue')",
      [userId]
    );
    const [[total]] = await pool.query(
      'SELECT COUNT(*) as count FROM borrowings WHERE user_id=?',
      [userId]
    );
    const [[overdue]] = await pool.query(
      "SELECT COUNT(*) as count FROM borrowings WHERE user_id=? AND status='overdue'",
      [userId]
    );
    const [[fines]] = await pool.query(
      "SELECT COALESCE(SUM(fine_amount),0) as total FROM borrowings WHERE user_id=? AND fine_amount > 0",
      [userId]
    );

    res.json({
      activeBorrowings: active.count,
      totalBorrowed: total.count,
      overdueBooks: overdue.count,
      totalFines: fines.total,
      booksLeft: 3 - active.count,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle user active status (admin)
router.patch('/:id/toggle', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await pool.query('UPDATE users SET is_active = NOT is_active WHERE id = ?', [req.params.id]);
    res.json({ message: 'User status updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
