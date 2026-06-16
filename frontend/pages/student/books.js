import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import BookCard from '../../components/BookCard';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Search, Filter, BookOpen, X } from 'lucide-react';

export default function StudentBooks() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [books, setBooks] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [fetching, setFetching] = useState(false);
  const [activeBorrowedIds, setActiveBorrowedIds] = useState([]);
  const [borrowLimit, setBorrowLimit] = useState(0);
  const [borrowing, setBorrowing] = useState(null);
  const [detailBook, setDetailBook] = useState(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'student')) router.push('/login');
  }, [user, loading]);

  const fetchBooks = useCallback(async () => {
    setFetching(true);
    try {
      const { data } = await api.get('/books', { params: { search, category, page, limit: 12 } });
      setBooks(data.books);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      if (data.categories) setCategories(data.categories);
    } catch (e) {}
    setFetching(false);
  }, [search, category, page]);

  const fetchActiveIds = async () => {
    try {
      const { data } = await api.get('/borrowings', { params: { status: 'borrowed', limit: 100 } });
      setActiveBorrowedIds(data.borrowings.map(b => b.book_id));
      setBorrowLimit(data.borrowings.length);
    } catch (e) {}
  };

  useEffect(() => {
    if (user?.role === 'student') { fetchBooks(); fetchActiveIds(); }
  }, [fetchBooks, user]);

  const handleBorrow = async (book) => {
    if (borrowLimit >= 3) {
      toast.error('Borrow limit reached! Return a book first.');
      return;
    }
    setBorrowing(book.id);
    try {
      await api.post('/borrowings/borrow', { book_id: book.id });
      toast.success(`"${book.title}" borrowed! Due in 14 days.`);
      fetchBooks();
      fetchActiveIds();
      setDetailBook(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to borrow');
    }
    setBorrowing(null);
  };

  if (loading || !user) return null;

  return (
    <Layout title="Browse Books">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>Book Catalog</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {total} books · {3 - borrowLimit} borrow slot{3 - borrowLimit !== 1 ? 's' : ''} left
            </p>
          </div>
        </div>

        {/* Search + Filter bar */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secondary)' }} />
            <input
              className="input-field"
              style={{ paddingLeft: '38px' }}
              placeholder="Search title, author, ISBN..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={14} style={{ color: 'var(--text-secondary)' }} />
            <button
              onClick={() => { setCategory(''); setPage(1); }}
              className="text-xs px-3 py-2 rounded-lg transition-all"
              style={{ background: !category ? 'var(--accent)' : 'var(--bg-card)', border: `1px solid ${!category ? 'var(--accent)' : 'var(--border)'}`, color: !category ? 'white' : 'var(--text-secondary)', cursor: 'pointer' }}
            >All</button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => { setCategory(cat === category ? '' : cat); setPage(1); }}
                className="text-xs px-3 py-2 rounded-lg transition-all"
                style={{ background: category === cat ? 'var(--accent)' : 'var(--bg-card)', border: `1px solid ${category === cat ? 'var(--accent)' : 'var(--border)'}`, color: category === cat ? 'white' : 'var(--text-secondary)', cursor: 'pointer' }}
              >{cat}</button>
            ))}
          </div>
        </div>

        {/* Books Grid */}
        {fetching ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {Array(12).fill(0).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div className="skeleton h-32" />
                <div className="p-4 space-y-2">
                  <div className="skeleton h-4 rounded" />
                  <div className="skeleton h-3 rounded w-2/3" />
                  <div className="skeleton h-8 rounded-xl mt-3" />
                </div>
              </div>
            ))}
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-20" style={{ color: 'var(--text-secondary)' }}>
            <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-semibold">No books found</p>
            <p className="text-sm mt-1">Try a different search or category</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {books.map((book, i) => (
              <div
                key={book.id}
                style={{ animationDelay: `${i * 40}ms`, animation: 'slide-up 0.4s ease-out both' }}
                onClick={() => setDetailBook(book)}
              >
                <BookCard
                  book={book}
                  onBorrow={handleBorrow}
                  borrowed={activeBorrowedIds.includes(book.id)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 flex-wrap">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className="w-9 h-9 rounded-lg text-sm font-semibold transition-all"
                style={{ background: p === page ? 'var(--accent)' : 'var(--bg-card)', border: `1px solid ${p === page ? 'var(--accent)' : 'var(--border)'}`, color: p === page ? 'white' : 'var(--text-secondary)', cursor: 'pointer' }}
              >{p}</button>
            ))}
          </div>
        )}
      </div>

      {/* Book Detail Modal */}
      {detailBook && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDetailBook(null)}>
          <div className="modal-box" style={{ maxWidth: '480px' }}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: `${detailBook.cover_color}33` }}>
                  <BookOpen size={24} style={{ color: detailBook.cover_color }} />
                </div>
                <div>
                  {detailBook.category && <span className="badge badge-info text-xs">{detailBook.category}</span>}
                </div>
              </div>
              <button onClick={() => setDetailBook(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={20} />
              </button>
            </div>

            <h3 className="text-xl font-bold mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>{detailBook.title}</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>by {detailBook.author}</p>

            {detailBook.description && (
              <p className="text-sm mb-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{detailBook.description}</p>
            )}

            <div className="grid grid-cols-2 gap-3 mb-5">
              {detailBook.isbn && <div className="p-3 rounded-xl" style={{ background: 'var(--bg-secondary)' }}><p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>ISBN</p><p className="text-sm font-medium">{detailBook.isbn}</p></div>}
              {detailBook.publisher && <div className="p-3 rounded-xl" style={{ background: 'var(--bg-secondary)' }}><p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Publisher</p><p className="text-sm font-medium">{detailBook.publisher}</p></div>}
              {detailBook.publish_year && <div className="p-3 rounded-xl" style={{ background: 'var(--bg-secondary)' }}><p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Year</p><p className="text-sm font-medium">{detailBook.publish_year}</p></div>}
              {detailBook.shelf_location && <div className="p-3 rounded-xl" style={{ background: 'var(--bg-secondary)' }}><p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Shelf</p><p className="text-sm font-medium">{detailBook.shelf_location}</p></div>}
              <div className="p-3 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
                <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Available</p>
                <p className="text-sm font-medium">{detailBook.available_copies}/{detailBook.total_copies} copies</p>
              </div>
            </div>

            <button
              className="btn-primary w-full"
              style={{ height: '46px', opacity: detailBook.available_copies < 1 || activeBorrowedIds.includes(detailBook.id) || borrowLimit >= 3 ? 0.5 : 1, cursor: detailBook.available_copies < 1 ? 'not-allowed' : 'pointer' }}
              disabled={detailBook.available_copies < 1 || activeBorrowedIds.includes(detailBook.id) || borrowLimit >= 3 || borrowing === detailBook.id}
              onClick={() => handleBorrow(detailBook)}
            >
              {borrowing === detailBook.id ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
              ) : activeBorrowedIds.includes(detailBook.id) ? '✓ Already Borrowed'
                : borrowLimit >= 3 ? 'Borrow Limit Reached'
                : detailBook.available_copies < 1 ? 'Not Available'
                : 'Borrow This Book'}
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}
