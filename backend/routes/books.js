const express = require('express');
const router = express.Router();
const { pool } = require('../db/connection');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Get all books (with search/filter/pagination)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { search, category, page = 1, limit = 12 } = req.query;
    const offset = (page - 1) * limit;
    let where = 'WHERE b.is_active = 1';
    const params = [];

    if (search) {
      where += ' AND (b.title LIKE ? OR b.author LIKE ? OR b.isbn LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (category) {
      where += ' AND b.category = ?';
      params.push(category);
    }

    const [books] = await pool.query(
      `SELECT * FROM books b ${where} ORDER BY b.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM books b ${where}`,
      params
    );

    const [categories] = await pool.query(
      'SELECT DISTINCT category FROM books WHERE is_active = 1 AND category IS NOT NULL ORDER BY category'
    );

    res.json({
      books,
      total: countResult[0].total,
      page: parseInt(page),
      totalPages: Math.ceil(countResult[0].total / limit),
      categories: categories.map(c => c.category),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single book
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const [books] = await pool.query('SELECT * FROM books WHERE id = ?', [req.params.id]);
    if (books.length === 0) return res.status(404).json({ message: 'Book not found' });
    res.json(books[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add book (admin only)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { title, author, isbn, category, publisher, publish_year, total_copies, description, cover_color, shelf_location } = req.body;

    if (!title || !author) {
      return res.status(400).json({ message: 'Title and author are required' });
    }

    const copies = total_copies || 1;
    const [result] = await pool.query(
      `INSERT INTO books (title, author, isbn, category, publisher, publish_year, total_copies, available_copies, description, cover_color, shelf_location)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, author, isbn || null, category || null, publisher || null, publish_year || null, copies, copies, description || null, cover_color || '#6366f1', shelf_location || null]
    );

    const [book] = await pool.query('SELECT * FROM books WHERE id = ?', [result.insertId]);
    res.status(201).json(book[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'ISBN already exists' });
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update book (admin only)
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { title, author, isbn, category, publisher, publish_year, total_copies, description, cover_color, shelf_location, is_active } = req.body;

    const [existing] = await pool.query('SELECT * FROM books WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ message: 'Book not found' });

    const book = existing[0];
    const newTotal = total_copies !== undefined ? total_copies : book.total_copies;
    const diff = newTotal - book.total_copies;
    const newAvailable = Math.max(0, book.available_copies + diff);

    await pool.query(
      `UPDATE books SET title=?, author=?, isbn=?, category=?, publisher=?, publish_year=?, total_copies=?, available_copies=?, description=?, cover_color=?, shelf_location=?, is_active=? WHERE id=?`,
      [
        title || book.title, author || book.author, isbn || book.isbn,
        category || book.category, publisher || book.publisher,
        publish_year || book.publish_year, newTotal, newAvailable,
        description || book.description, cover_color || book.cover_color,
        shelf_location || book.shelf_location,
        is_active !== undefined ? is_active : book.is_active,
        req.params.id
      ]
    );

    const [updated] = await pool.query('SELECT * FROM books WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete book (admin only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await pool.query('UPDATE books SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ message: 'Book deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
