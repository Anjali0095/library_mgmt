require('dotenv').config();
const mysql = require('mysql2/promise');

const migrate = async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    // Create database
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``);
    await conn.query(`USE \`${process.env.DB_NAME}\``);

    // Users table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('student', 'admin') NOT NULL DEFAULT 'student',
        roll_number VARCHAR(50),
        department VARCHAR(100),
        phone VARCHAR(20),
        avatar_color VARCHAR(10) DEFAULT '#6366f1',
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Books table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS books (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        author VARCHAR(150) NOT NULL,
        isbn VARCHAR(30) UNIQUE,
        category VARCHAR(100),
        publisher VARCHAR(150),
        publish_year INT,
        total_copies INT NOT NULL DEFAULT 1,
        available_copies INT NOT NULL DEFAULT 1,
        description TEXT,
        cover_color VARCHAR(10) DEFAULT '#6366f1',
        shelf_location VARCHAR(50),
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Borrowings table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS borrowings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        book_id INT NOT NULL,
        borrow_date DATE NOT NULL DEFAULT (CURDATE()),
        due_date DATE NOT NULL,
        return_date DATE,
        status ENUM('borrowed', 'returned', 'overdue') DEFAULT 'borrowed',
        fine_amount DECIMAL(10,2) DEFAULT 0.00,
        notes TEXT,
        issued_by INT,
        returned_to INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
      )
    `);

    // Create default admin
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('admin123', 10);
    await conn.query(`
      INSERT IGNORE INTO users (name, email, password, role, department)
      VALUES ('Super Admin', 'admin@library.com', ?, 'admin', 'Administration')
    `, [hash]);

    // Seed sample books
    const sampleBooks = [
      ['The Great Gatsby', 'F. Scott Fitzgerald', '978-0743273565', 'Fiction', 'Scribner', 1925, 5, 5, 'A story of the fabulously wealthy Jay Gatsby', '#f59e0b', 'A-01'],
      ['Clean Code', 'Robert C. Martin', '978-0132350884', 'Technology', 'Prentice Hall', 2008, 3, 3, 'A handbook of agile software craftsmanship', '#3b82f6', 'B-03'],
      ['To Kill a Mockingbird', 'Harper Lee', '978-0061935466', 'Fiction', 'HarperCollins', 1960, 4, 4, 'The unforgettable novel of a childhood in a sleepy Southern town', '#10b981', 'A-02'],
      ['Sapiens', 'Yuval Noah Harari', '978-0062316097', 'History', 'Harper', 2011, 6, 6, 'A brief history of humankind', '#8b5cf6', 'C-01'],
      ['The Pragmatic Programmer', 'David Thomas', '978-0135957059', 'Technology', 'Addison-Wesley', 1999, 2, 2, 'Your journey to mastery', '#ef4444', 'B-04'],
      ['1984', 'George Orwell', '978-0451524935', 'Fiction', 'Signet Classic', 1949, 5, 5, 'A dystopian social science fiction novel', '#06b6d4', 'A-03'],
      ['Introduction to Algorithms', 'Thomas H. Cormen', '978-0262033848', 'Technology', 'MIT Press', 2009, 3, 3, 'Comprehensive guide to algorithms', '#f97316', 'B-01'],
      ['Atomic Habits', 'James Clear', '978-0735211292', 'Self-Help', 'Avery', 2018, 4, 4, 'An easy and proven way to build good habits', '#84cc16', 'D-02'],
    ];

    for (const book of sampleBooks) {
      await conn.query(`
        INSERT IGNORE INTO books (title, author, isbn, category, publisher, publish_year, total_copies, available_copies, description, cover_color, shelf_location)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, book);
    }

    console.log('✅ Database migrated successfully!');
    console.log('📧 Admin login: admin@library.com / admin123');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await conn.end();
  }
};

migrate();
