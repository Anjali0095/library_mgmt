const express = require('express');
const router = express.Router();
const { pool } = require('../db/connection');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Borrow a book (student or admin)
router.post('/borrow', authMiddleware, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { book_id, user_id } = req.body;
    const targetUserId = req.user.role === 'admin' && user_id ? user_id : req.user.id;

    // Check student 3-book limit
    const [active] = await conn.query(
      "SELECT COUNT(*) as count FROM borrowings WHERE user_id = ? AND status = 'borrowed'",
      [targetUserId]
    );
    if (active[0].count >= 3) {
      await conn.rollback();
      return res.status(400).json({ message: 'Borrow limit reached. Maximum 3 books at a time.' });
    }

    // Check already borrowed same book
    const [duplicate] = await conn.query(
      "SELECT id FROM borrowings WHERE user_id = ? AND book_id = ? AND status = 'borrowed'",
      [targetUserId, book_id]
    );
    if (duplicate.length > 0) {
      await conn.rollback();
      return res.status(400).json({ message: 'You have already borrowed this book' });
    }

    // Check book availability
    const [books] = await conn.query('SELECT * FROM books WHERE id = ? AND is_active = 1', [book_id]);
    if (books.length === 0 || books[0].available_copies < 1) {
      await conn.rollback();
      return res.status(400).json({ message: 'Book not available' });
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14); // 14-day loan

    const [result] = await conn.query(
      `INSERT INTO borrowings (user_id, book_id, borrow_date, due_date, status, issued_by)
       VALUES (?, ?, CURDATE(), ?, 'borrowed', ?)`,
      [targetUserId, book_id, dueDate.toISOString().split('T')[0], req.user.id]
    );

    await conn.query(
      'UPDATE books SET available_copies = available_copies - 1 WHERE id = ?',
      [book_id]
    );

    await conn.commit();

    const [borrowing] = await pool.query(
      `SELECT br.*, b.title, b.author, b.cover_color, b.isbn, u.name as user_name, u.email as user_email
       FROM borrowings br
       JOIN books b ON br.book_id = b.id
       JOIN users u ON br.user_id = u.id
       WHERE br.id = ?`,
      [result.insertId]
    );

    res.status(201).json(borrowing[0]);
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    conn.release();
  }
});

// Return a book
router.post('/return/:id', authMiddleware, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [borrowings] = await conn.query(
      "SELECT * FROM borrowings WHERE id = ? AND status = 'borrowed'",
      [req.params.id]
    );

    if (borrowings.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: 'Active borrowing not found' });
    }

    const borrowing = borrowings[0];
    if (req.user.role !== 'admin' && borrowing.user_id !== req.user.id) {
      await conn.rollback();
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const today = new Date();
    const due = new Date(borrowing.due_date);
    let fine = 0;
    if (today > due) {
      const days = Math.floor((today - due) / (1000 * 60 * 60 * 24));
      fine = days * 5; // ₹5 per day
    }

    await conn.query(
      "UPDATE borrowings SET return_date = CURDATE(), status = 'returned', fine_amount = ?, returned_to = ? WHERE id = ?",
      [fine, req.user.id, req.params.id]
    );

    await conn.query(
      'UPDATE books SET available_copies = available_copies + 1 WHERE id = ?',
      [borrowing.book_id]
    );

    await conn.commit();
    res.json({ message: 'Book returned successfully', fine });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    conn.release();
  }
});

// Get borrowings - students see own, admins see all
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, page = 1, limit = 10, user_id } = req.query;
    const offset = (page - 1) * limit;

    let where = 'WHERE 1=1';
    const params = [];

    if (req.user.role !== 'admin') {
      where += ' AND br.user_id = ?';
      params.push(req.user.id);
    } else if (user_id) {
      where += ' AND br.user_id = ?';
      params.push(user_id);
    }

    if (status) {
      where += ' AND br.status = ?';
      params.push(status);
    }

    // Auto-mark overdue
    await pool.query(
      "UPDATE borrowings SET status = 'overdue' WHERE status = 'borrowed' AND due_date < CURDATE()"
    );

    const [borrowings] = await pool.query(
      `SELECT br.*, b.title, b.author, b.cover_color, b.isbn, b.category,
              u.name as user_name, u.email as user_email, u.roll_number,
              u.avatar_color as user_avatar_color
       FROM borrowings br
       JOIN books b ON br.book_id = b.id
       JOIN users u ON br.user_id = u.id
       ${where}
       ORDER BY br.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM borrowings br ${where}`,
      params
    );

    res.json({
      borrowings,
      total: countResult[0].total,
      page: parseInt(page),
      totalPages: Math.ceil(countResult[0].total / limit),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
