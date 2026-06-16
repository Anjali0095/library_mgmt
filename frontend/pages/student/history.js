import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import DataTable from '../../components/DataTable';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { BookOpen, RotateCcw, Filter } from 'lucide-react';

export default function StudentHistory() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [borrowings, setBorrowings] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [fetching, setFetching] = useState(false);
  const [returning, setReturning] = useState(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'student')) router.push('/login');
  }, [user, loading]);

  const fetchHistory = useCallback(async () => {
    setFetching(true);
    try {
      const { data } = await api.get('/borrowings', {
        params: { page, limit: 10, status: statusFilter },
      });
      setBorrowings(data.borrowings);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (e) {}
    setFetching(false);
  }, [page, statusFilter]);

  useEffect(() => {
    if (user?.role === 'student') fetchHistory();
  }, [fetchHistory, user]);

  const handleReturn = async (id) => {
    if (!confirm('Return this book?')) return;
    setReturning(id);
    try {
      const { data } = await api.post(`/borrowings/return/${id}`);
      toast.success(data.fine > 0 ? `Returned! Fine: ₹${data.fine}` : 'Book returned!');
      fetchHistory();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Return failed');
    }
    setReturning(null);
  };

  const columns = [
    {
      key: 'title',
      label: 'Book',
      render: (v, row) => (
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${row.cover_color}22` }}
          >
            <BookOpen size={16} style={{ color: row.cover_color }} />
          </div>
          <div>
            <div className="font-semibold text-sm">{v}</div>
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{row.author}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      render: v => v ? <span className="badge badge-info">{v}</span> : '—',
    },
    {
      key: 'borrow_date',
      label: 'Borrowed On',
      render: v => (
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          {v ? new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
        </span>
      ),
    },
    {
      key: 'due_date',
      label: 'Due Date',
      render: (v, row) => {
        const overdue = row.status !== 'returned' && new Date(v) < new Date();
        return (
          <span className="text-xs" style={{ color: overdue ? '#ef4444' : 'var(--text-secondary)' }}>
            {v ? new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
            {overdue && ' ⚠'}
          </span>
        );
      },
    },
    {
      key: 'return_date',
      label: 'Returned On',
      render: v => (
        <span className="text-xs" style={{ color: v ? '#10b981' : 'var(--text-secondary)' }}>
          {v ? new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: v => (
        <span className={`badge ${v === 'returned' ? 'badge-success' : v === 'overdue' ? 'badge-danger' : 'badge-info'}`}>
          {v}
        </span>
      ),
    },
    {
      key: 'fine_amount',
      label: 'Fine',
      render: v =>
        v > 0 ? (
          <span className="text-xs font-semibold" style={{ color: '#ef4444' }}>₹{v}</span>
        ) : (
          <span style={{ color: 'var(--text-secondary)' }}>—</span>
        ),
    },
    {
      key: 'id',
      label: 'Action',
      render: (id, row) =>
        row.status !== 'returned' ? (
          <button
            onClick={() => handleReturn(id)}
            disabled={returning === id}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-all"
            style={{
              background: 'rgba(16,185,129,0.1)',
              border: '1px solid rgba(16,185,129,0.3)',
              color: '#10b981',
              cursor: 'pointer',
            }}
          >
            {returning === id ? (
              <div className="w-3 h-3 border border-green-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <RotateCcw size={12} />
            )}
            Return
          </button>
        ) : (
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>✓ Done</span>
        ),
    },
  ];

  if (loading || !user) return null;

  return (
    <Layout title="My History">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>
            My Borrowing History
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {total} total record{total !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={14} style={{ color: 'var(--text-secondary)' }} />
          {['', 'borrowed', 'returned', 'overdue'].map(s => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className="text-xs px-3 py-1.5 rounded-lg transition-all capitalize"
              style={{
                background: statusFilter === s ? 'var(--accent)' : 'var(--bg-card)',
                border: `1px solid ${statusFilter === s ? 'var(--accent)' : 'var(--border)'}`,
                color: statusFilter === s ? 'white' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              {s || 'All'}
            </button>
          ))}
        </div>

        <DataTable
          columns={columns}
          data={borrowings}
          total={total}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          loading={fetching}
          emptyMessage="No borrowing history found"
        />
      </div>
    </Layout>
  );
}
