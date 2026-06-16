# 📚 Bibliotheca — Library Management System

A full-stack, modern library management system built with **Next.js**, **Node.js/Express**, and **MySQL**.
Anjali
---

## ✨ Features

### Student Portal
- Browse & search the entire book catalog (with category filters)
- Borrow up to **3 books** at a time
- See real-time availability of each book
- View full personal borrowing history with status & fine info
- Return books directly from dashboard or history page

### Admin Portal
- Full dashboard with live stats (books, students, active loans, overdue, fines)
- Add / Edit / Delete books with color-coded covers
- View & manage **all borrowings** across all students
- Manage all users — activate or block accounts
- Filter borrowings by status (borrowed / returned / overdue)
- Fines auto-calculated at ₹5/day after due date

### System
- JWT authentication (7-day tokens stored in cookie + localStorage)
- Role-based access (student / admin)
- Fully responsive — mobile-first layout with sidebar
- Dynamic tables with search, pagination, skeleton loaders
- Animated UI — smooth transitions, glassmorphism, gradient effects
- All config via `.env` files — zero hardcoded values

---

## 🗂 Project Structure

```
library-mgmt/
├── backend/
│   ├── db/
│   │   ├── connection.js       # MySQL pool
│   │   └── migrate.js          # Auto-creates all tables + seeds data
│   ├── middleware/
│   │   └── auth.js             # JWT + admin guard
│   ├── routes/
│   │   ├── auth.js             # /api/auth/*
│   │   ├── books.js            # /api/books/*
│   │   ├── borrowings.js       # /api/borrowings/*
│   │   └── users.js            # /api/users/*
│   ├── .env                    # ← configure this
│   ├── package.json
│   └── server.js               # Express entry point
│
└── frontend/
    ├── components/
    │   ├── Layout.js           # Sidebar + topbar shell
    │   ├── BookCard.js         # Book grid card
    │   └── DataTable.js        # Reusable dynamic table
    ├── context/
    │   └── AuthContext.js      # Auth state + login/logout
    ├── lib/
    │   └── api.js              # Axios instance with JWT interceptor
    ├── pages/
    │   ├── index.js            # Redirect by role
    │   ├── login.js
    │   ├── register.js
    │   ├── admin/
    │   │   ├── dashboard.js
    │   │   ├── books.js
    │   │   ├── borrowings.js
    │   │   └── students.js
    │   └── student/
    │       ├── dashboard.js
    │       ├── books.js
    │       └── history.js
    ├── styles/
    │   └── globals.css         # Dark theme, animations, components
    ├── .env.local              # ← configure this
    └── package.json
```

---

## 🚀 Setup Guide

### Prerequisites
- Node.js 18+
- MySQL 8+ running locally
- npm or yarn

---

### 1. Configure Backend

Edit `backend/.env`:

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password   # ← change this
DB_NAME=library_mgmt

JWT_SECRET=your_super_secret_key  # ← change this
JWT_EXPIRES_IN=7d

FRONTEND_URL=http://localhost:3000
```

### 2. Install & Migrate Backend

```bash
cd backend
npm install

# Create database, all tables, seed admin + sample books
node db/migrate.js

# Start backend
npm run dev
```

The migration will:
- Create the `library_mgmt` database
- Create `users`, `books`, `borrowings` tables
- Seed a default **admin** account: `admin@library.com` / `admin123`
- Seed **8 sample books**

### 3. Configure Frontend

Edit `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 4. Install & Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000**

---

## 🔑 Default Credentials

| Role  | Email                | Password   |
|-------|----------------------|------------|
| Admin | admin@library.com    | admin123   |

> Students register themselves at `/register`

---

## 🗄 Database Schema

### `users`
| Column        | Type                        |
|---------------|-----------------------------|
| id            | INT PK AUTO_INCREMENT       |
| name          | VARCHAR(100)                |
| email         | VARCHAR(150) UNIQUE         |
| password      | VARCHAR(255) bcrypt hashed  |
| role          | ENUM('student','admin')     |
| roll_number   | VARCHAR(50)                 |
| department    | VARCHAR(100)                |
| phone         | VARCHAR(20)                 |
| avatar_color  | VARCHAR(10)                 |
| is_active     | TINYINT(1)                  |

### `books`
| Column           | Type               |
|------------------|--------------------|
| id               | INT PK             |
| title            | VARCHAR(255)       |
| author           | VARCHAR(150)       |
| isbn             | VARCHAR(30) UNIQUE |
| category         | VARCHAR(100)       |
| publisher        | VARCHAR(150)       |
| publish_year     | INT                |
| total_copies     | INT                |
| available_copies | INT                |
| description      | TEXT               |
| cover_color      | VARCHAR(10)        |
| shelf_location   | VARCHAR(50)        |

### `borrowings`
| Column       | Type                                  |
|--------------|---------------------------------------|
| id           | INT PK                                |
| user_id      | FK → users.id                         |
| book_id      | FK → books.id                         |
| borrow_date  | DATE                                  |
| due_date     | DATE (borrow + 14 days)               |
| return_date  | DATE nullable                         |
| status       | ENUM('borrowed','returned','overdue') |
| fine_amount  | DECIMAL(10,2) — ₹5/day overdue        |

---

## 📡 API Reference

### Auth
| Method | Endpoint            | Description        |
|--------|---------------------|--------------------|
| POST   | /api/auth/register  | Register new user  |
| POST   | /api/auth/login     | Login              |
| GET    | /api/auth/me        | Get current user   |

### Books
| Method | Endpoint         | Auth    | Description            |
|--------|------------------|---------|------------------------|
| GET    | /api/books       | Any     | List books (paginated) |
| GET    | /api/books/:id   | Any     | Get single book        |
| POST   | /api/books       | Admin   | Add book               |
| PUT    | /api/books/:id   | Admin   | Update book            |
| DELETE | /api/books/:id   | Admin   | Soft-delete book       |

### Borrowings
| Method | Endpoint                  | Auth    | Description                    |
|--------|---------------------------|---------|--------------------------------|
| GET    | /api/borrowings           | Any     | List (students see own only)   |
| POST   | /api/borrowings/borrow    | Any     | Borrow a book (max 3 limit)    |
| POST   | /api/borrowings/return/:id| Any     | Return a book                  |

### Users
| Method | Endpoint                    | Auth  | Description         |
|--------|-----------------------------|-------|---------------------|
| GET    | /api/users                  | Admin | List all users      |
| GET    | /api/users/stats/dashboard  | Admin | Admin stats         |
| GET    | /api/users/stats/student    | Any   | Student's own stats |
| PATCH  | /api/users/:id/toggle       | Admin | Block/unblock user  |

---

## 🛠 Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Frontend  | Next.js 14, React 18, Tailwind CSS|
| Animation | Framer Motion, CSS animations     |
| Backend   | Node.js, Express.js               |
| Database  | MySQL 8 (mysql2 driver)           |
| Auth      | JWT (jsonwebtoken) + bcryptjs     |
| HTTP      | Axios                             |
| Toast     | react-hot-toast                   |

---

## 🎨 Design System

- **Theme**: Dark glassmorphism (`#0a0a0f` base)
- **Accent**: Indigo (`#6366f1`) with purple gradients
- **Fonts**: Playfair Display (headings) + DM Sans (body)
- **Components**: Reusable `DataTable`, `BookCard`, `Layout` with sidebar
- **Animations**: Floating orbs background, slide-up page transitions, hover glow effects

---

## 📝 Notes

- The `DataTable` component is fully dynamic — just pass a `columns` config array; no manual HTML table markup needed
- Fines are auto-calculated every time borrowings are fetched; overdue status is updated in the DB automatically
- All `.env` values are respected; nothing is hardcoded in the source files
- The project runs on two ports: **3000** (frontend) and **5000** (backend)
