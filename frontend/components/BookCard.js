import { BookOpen, User, Calendar, MapPin } from 'lucide-react';

export default function BookCard({ book, onBorrow, showBorrowBtn = true, borrowed = false }) {
  const available = book.available_copies > 0;

  return (
    <div className="book-card">
      {/* Cover */}
      <div
        className="relative flex items-center justify-center"
        style={{ height: '140px', background: `linear-gradient(135deg, ${book.cover_color}33 0%, ${book.cover_color}11 100%)`, borderBottom: '1px solid var(--border)' }}
      >
        <div
          className="w-16 h-20 rounded-xl flex items-center justify-center shadow-2xl"
          style={{ background: `linear-gradient(135deg, ${book.cover_color}, ${book.cover_color}99)` }}
        >
          <BookOpen size={24} color="white" />
        </div>
        {/* Category badge */}
        {book.category && (
          <div className="absolute top-3 left-3 badge" style={{ background: `${book.cover_color}22`, color: book.cover_color, border: `1px solid ${book.cover_color}44`, fontSize: '10px', padding: '2px 8px' }}>
            {book.category}
          </div>
        )}
        {/* Availability */}
        <div className={`absolute top-3 right-3 badge ${available ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '10px', padding: '2px 8px' }}>
          {available ? `${book.available_copies} left` : 'Unavailable'}
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-sm leading-snug mb-1 line-clamp-2" style={{ fontFamily: 'Playfair Display, serif' }}>
          {book.title}
        </h3>
        <div className="flex items-center gap-1 text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
          <User size={11} />
          <span className="truncate">{book.author}</span>
        </div>

        {book.shelf_location && (
          <div className="flex items-center gap-1 text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
            <MapPin size={11} />
            <span>Shelf {book.shelf_location}</span>
          </div>
        )}

        {showBorrowBtn && (
          <button
            className="btn-primary w-full text-xs"
            style={{
              height: '34px',
              background: borrowed ? 'rgba(239,68,68,0.2)' : available ? undefined : 'rgba(100,100,120,0.3)',
              cursor: available && !borrowed ? 'pointer' : 'not-allowed',
              opacity: available && !borrowed ? 1 : 0.7,
            }}
            onClick={() => available && !borrowed && onBorrow && onBorrow(book)}
            disabled={!available || borrowed}
          >
            {borrowed ? '✓ Already Borrowed' : available ? 'Borrow Book' : 'Not Available'}
          </button>
        )}
      </div>
    </div>
  );
}
