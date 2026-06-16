import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import DataTable from '../../components/DataTable';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { BookOpen, RotateCcw, Filter } from 'lucide-react';

export default function AdminBorrowings() {
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
    if (!loading && (!user || user.role !== 'admin')) router.push('/login');
  }, [user, loading]);

  const fetchBorrowings = useCallback(async () => {
    setFetching(true);
    try {
      const { data } = await api.get('/borrowings', { params: { page, limit: 10, status: statusFilter } });
      setBorrowings(data.borrowings);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (e) {}
    setFetching(false);
  }, [page, statusFilter]);

  useEffect(() => { if (user?.role === 'admin') fetchBorrowings(); }, [fetchBorrowings, user]);

  const handleReturn = async (id) => {
    if (!confirm('Confirm book return?')) return;
    setReturning(id);
    try {
      const { data } = await api.post(`/borrowings/return/${id}`);
      toast.success(data.fine > 0 ? `Book returned. Fine: ₹${data.fine}` : 'Book returned successfully!');
      fetchBorrowings();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Return failed');
    }
    setReturning(null);
  };

  const columns = [
    {
      key: 'user_name', label: 'Student',
      render: (v, row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: row.user_avatar_color || 'var(--accent)', color: 'white' }}>
            {v?.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="font-medium text-sm">{v}</div>
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{row.roll_number || row.user_email}</div>
          </div>
        </div>
      )
    },
    {
      key: 'title', label: 'Book',
      render: (v, row) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${row.cover_color}22` }}>
            <BookOpen size={12} style={{ color: row.cover_color }} />
          </div>
          <span className="text-sm font-medium">{v}</span>
        </div>
      )
    },
    { key: 'borrow_date', label: 'Borrowed', render: v => <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{v ? new Date(v).toLocaleDateString('en-IN') : '—'}</span> },
    {
      key: 'due_date', label: 'Due Date',
      render: (v, row) => {
        const overdue = row.status !== 'returned' && new Date(v) < new Date();
        return <span className="text-xs" style={{ color: overdue ? '#ef4444' : 'var(--text-secondary)' }}>
          {v ? new Date(v).toLocaleDateString('en-IN') : '—'}
          {overdue && ' ⚠'}
        </span>;
      }
    },
    {
      key: 'status', label: 'Status',
      render: v => (
        <span className={`badge ${v === 'returned' ? 'badge-success' : v === 'overdue' ? 'badge-danger' : 'badge-info'}`}>
          {v}
        </span>
      )
    },
    { key: 'fine_amount', label: 'Fine', render: v => v > 0 ? <span className="text-xs font-semibold" style={{ color: '#ef4444' }}>₹{v}</span> : <span style={{ color: 'var(--text-secondary)' }}>—</span> },
    {
      key: 'id', label: 'Action',
      render: (id, row) => row.status !== 'returned' ? (
        <button
          onClick={() => handleReturn(id)}
          disabled={returning === id}
          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-all"
          style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', cursor: 'pointer' }}
        >
          {returning === id ? <div className="w-3 h-3 border border-green-400 border-t-transparent rounded-full animate-spin" /> : <RotateCcw size={12} />}
          Return
        </button>
      ) : <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Done</span>
    },
  ];

  const statusBtns = ['', 'borrowed', 'returned', 'overdue'];

  return (
    <Layout title="Borrowings">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>All Borrowings</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{total} total records</p>
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={14} style={{ color: 'var(--text-secondary)' }} />
          {statusBtns.map(s => (
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
          emptyMessage="No borrowings found"
        />
      </div>
    </Layout>
  );
}
