import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import DataTable from '../../components/DataTable';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, BookOpen, X, Package } from 'lucide-react';

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'];

const emptyForm = { title: '', author: '', isbn: '', category: '', publisher: '', publish_year: '', total_copies: 1, description: '', cover_color: '#6366f1', shelf_location: '' };

export default function AdminBooks() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [books, setBooks] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [fetching, setFetching] = useState(false);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) router.push('/login');
  }, [user, loading]);

  const fetchBooks = useCallback(async () => {
    setFetching(true);
    try {
      const { data } = await api.get('/books', { params: { search, page, limit: 10 } });
      setBooks(data.books);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (e) {}
    setFetching(false);
  }, [search, page]);

  useEffect(() => { if (user?.role === 'admin') fetchBooks(); }, [fetchBooks, user]);

  const openAdd = () => { setForm(emptyForm); setEditId(null); setModal(true); };
  const openEdit = (book) => {
    setForm({ ...book, publish_year: book.publish_year || '', total_copies: book.total_copies });
    setEditId(book.id);
    setModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this book?')) return;
    try {
      await api.delete(`/books/${id}`);
      toast.success('Book deleted');
      fetchBooks();
    } catch (e) { toast.error('Failed to delete'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        await api.put(`/books/${editId}`, form);
        toast.success('Book updated!');
      } else {
        await api.post('/books', form);
        toast.success('Book added!');
      }
      setModal(false);
      fetchBooks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    }
    setSaving(false);
  };

  const columns = [
    {
      key: 'title',
      label: 'Book',
      render: (v, row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${row.cover_color}22` }}>
            <BookOpen size={16} style={{ color: row.cover_color }} />
          </div>
          <div>
            <div className="font-semibold text-sm">{row.title}</div>
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{row.author}</div>
          </div>
        </div>
      )
    },
    { key: 'isbn', label: 'ISBN', render: v => <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{v || '—'}</span> },
    { key: 'category', label: 'Category', render: v => v ? <span className="badge badge-info">{v}</span> : '—' },
    {
      key: 'available_copies', label: 'Copies',
      render: (v, row) => (
        <div className="flex items-center gap-2">
          <div className="w-16 h-1.5 rounded-full" style={{ background: 'var(--bg-secondary)' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${(v / row.total_copies) * 100}%`, background: v > 0 ? '#10b981' : '#ef4444' }} />
          </div>
          <span className="text-xs">{v}/{row.total_copies}</span>
        </div>
      )
    },
    { key: 'shelf_location', label: 'Shelf', render: v => v ? <span className="badge badge-warning">{v}</span> : '—' },
    {
      key: 'id', label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button onClick={() => openEdit(row)} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', cursor: 'pointer', color: 'var(--accent-light)' }}>
            <Edit2 size={13} />
          </button>
          <button onClick={() => handleDelete(row.id)} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer', color: '#ef4444' }}>
            <Trash2 size={13} />
          </button>
        </div>
      )
    },
  ];

  return (
    <Layout title="Books">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>Book Catalog</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{total} books in library</p>
          </div>
          <button className="btn-primary flex items-center gap-2" onClick={openAdd}>
            <Plus size={16} /> Add Book
          </button>
        </div>

        <DataTable
          columns={columns}
          data={books}
          total={total}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          onSearch={s => { setSearch(s); setPage(1); }}
          searchPlaceholder="Search by title, author, ISBN..."
          loading={fetching}
          emptyMessage="No books found"
        />
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal-box">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>
                {editId ? 'Edit Book' : 'Add New Book'}
              </h3>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Title *</label>
                  <input className="input-field" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required placeholder="Book title" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Author *</label>
                  <input className="input-field" value={form.author} onChange={e => setForm(p => ({ ...p, author: e.target.value }))} required placeholder="Author name" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>ISBN</label>
                  <input className="input-field" value={form.isbn} onChange={e => setForm(p => ({ ...p, isbn: e.target.value }))} placeholder="ISBN number" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Category</label>
                  <input className="input-field" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} placeholder="e.g. Fiction" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Publisher</label>
                  <input className="input-field" value={form.publisher} onChange={e => setForm(p => ({ ...p, publisher: e.target.value }))} placeholder="Publisher name" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Publish Year</label>
                  <input className="input-field" type="number" value={form.publish_year} onChange={e => setForm(p => ({ ...p, publish_year: e.target.value }))} placeholder="2024" min={1800} max={2030} />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Total Copies</label>
                  <input className="input-field" type="number" value={form.total_copies} onChange={e => setForm(p => ({ ...p, total_copies: parseInt(e.target.value) }))} min={1} required />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Shelf Location</label>
                  <input className="input-field" value={form.shelf_location} onChange={e => setForm(p => ({ ...p, shelf_location: e.target.value }))} placeholder="A-01" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Cover Color</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {COLORS.map(c => (
                      <button type="button" key={c} onClick={() => setForm(p => ({ ...p, cover_color: c }))}
                        className="w-8 h-8 rounded-lg transition-all"
                        style={{ background: c, border: form.cover_color === c ? '3px solid white' : '3px solid transparent', cursor: 'pointer', transform: form.cover_color === c ? 'scale(1.2)' : 'scale(1)' }}
                      />
                    ))}
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Description</label>
                  <textarea className="input-field" rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Brief description..." style={{ resize: 'vertical' }} />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" className="btn-ghost flex-1" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary flex-1" disabled={saving}>
                  {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" /> : editId ? 'Update Book' : 'Add Book'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
