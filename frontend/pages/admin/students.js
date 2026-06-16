import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import DataTable from '../../components/DataTable';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { UserCheck, UserX, GraduationCap, Shield } from 'lucide-react';

export default function AdminStudents() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) router.push('/login');
  }, [user, loading]);

  const fetchUsers = useCallback(async () => {
    setFetching(true);
    try {
      const { data } = await api.get('/users', { params: { search, page, limit: 10, role: roleFilter } });
      setUsers(data.users);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (e) {}
    setFetching(false);
  }, [search, page, roleFilter]);

  useEffect(() => { if (user?.role === 'admin') fetchUsers(); }, [fetchUsers, user]);

  const toggleActive = async (id) => {
    try {
      await api.patch(`/users/${id}/toggle`);
      toast.success('User status updated');
      fetchUsers();
    } catch (e) { toast.error('Failed'); }
  };

  const columns = [
    {
      key: 'name', label: 'User',
      render: (v, row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: row.avatar_color || 'var(--accent)', color: 'white' }}>
            {v?.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-sm">{v}</div>
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{row.email}</div>
          </div>
        </div>
      )
    },
    {
      key: 'role', label: 'Role',
      render: v => (
        <div className="flex items-center gap-1.5">
          {v === 'admin' ? <Shield size={12} style={{ color: '#f59e0b' }} /> : <GraduationCap size={12} style={{ color: 'var(--accent-light)' }} />}
          <span className={`badge ${v === 'admin' ? 'badge-warning' : 'badge-info'}`}>{v}</span>
        </div>
      )
    },
    { key: 'roll_number', label: 'Roll No.', render: v => <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{v || '—'}</span> },
    { key: 'department', label: 'Department', render: v => <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{v || '—'}</span> },
    { key: 'phone', label: 'Phone', render: v => <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{v || '—'}</span> },
    {
      key: 'is_active', label: 'Status',
      render: v => <span className={`badge ${v ? 'badge-success' : 'badge-danger'}`}>{v ? 'Active' : 'Blocked'}</span>
    },
    {
      key: 'created_at', label: 'Joined',
      render: v => <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{v ? new Date(v).toLocaleDateString('en-IN') : '—'}</span>
    },
    {
      key: 'id', label: 'Action',
      render: (id, row) => (
        <button
          onClick={() => toggleActive(id)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all"
          style={{
            background: row.is_active ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
            border: `1px solid ${row.is_active ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
            color: row.is_active ? '#ef4444' : '#10b981',
            cursor: 'pointer',
          }}
        >
          {row.is_active ? <><UserX size={12} /> Block</> : <><UserCheck size={12} /> Activate</>}
        </button>
      )
    },
  ];

  return (
    <Layout title="Students">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>All Users</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{total} registered users</p>
        </div>

        {/* Role filter */}
        <div className="flex items-center gap-2">
          {['', 'student', 'admin'].map(r => (
            <button
              key={r}
              onClick={() => { setRoleFilter(r); setPage(1); }}
              className="text-xs px-3 py-1.5 rounded-lg transition-all capitalize"
              style={{
                background: roleFilter === r ? 'var(--accent)' : 'var(--bg-card)',
                border: `1px solid ${roleFilter === r ? 'var(--accent)' : 'var(--border)'}`,
                color: roleFilter === r ? 'white' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              {r || 'All'}
            </button>
          ))}
        </div>

        <DataTable
          columns={columns}
          data={users}
          total={total}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          onSearch={s => { setSearch(s); setPage(1); }}
          searchPlaceholder="Search by name, email, roll number..."
          loading={fetching}
          emptyMessage="No users found"
        />
      </div>
    </Layout>
  );
}
