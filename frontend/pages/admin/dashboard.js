import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import { BookOpen, Users, AlertTriangle, TrendingUp, Clock, DollarSign, ArrowUpRight } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <div className="stat-card">
    <div className="flex items-start justify-between relative z-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>{label}</p>
        <p className="text-3xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>{value ?? '—'}</p>
        {sub && <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{sub}</p>}
      </div>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}22` }}>
        <Icon size={22} style={{ color }} />
      </div>
    </div>
  </div>
);

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'admin') router.push('/login');
      else fetchStats();
    }
  }, [user, loading]);

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/users/stats/dashboard');
      setStats(data);
    } catch (e) {}
    setFetching(false);
  };

  if (loading || !user) return null;

  return (
    <Layout title="Dashboard">
      <div className="space-y-6">
        {/* Greeting */}
        <div>
          <h2 className="text-2xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>
            Good day, {user.name?.split(' ')[0]} 👋
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Here's what's happening in your library today
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard icon={BookOpen} label="Total Books" value={stats?.totalBooks} color="#6366f1" sub="in catalog" />
          <StatCard icon={Users} label="Students" value={stats?.totalStudents} color="#10b981" sub="registered" />
          <StatCard icon={TrendingUp} label="Active Loans" value={stats?.activeBorrowings} color="#f59e0b" sub="currently out" />
          <StatCard icon={AlertTriangle} label="Overdue" value={stats?.overdueBooks} color="#ef4444" sub="past due date" />
          <StatCard icon={Clock} label="Returned Today" value={stats?.returnedToday} color="#06b6d4" sub="returned" />
          <StatCard icon={DollarSign} label="Total Fines" value={`₹${stats?.totalFines || 0}`} color="#a78bfa" sub="collected" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="glass rounded-2xl p-5" style={{ border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ fontFamily: 'Playfair Display, serif' }}>Recent Activity</h3>
              <a href="/admin/borrowings" className="text-xs flex items-center gap-1" style={{ color: 'var(--accent-light)', textDecoration: 'none' }}>
                View all <ArrowUpRight size={12} />
              </a>
            </div>
            <div className="space-y-3">
              {fetching ? Array(4).fill(0).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="skeleton w-9 h-9 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-3 rounded w-3/4" />
                    <div className="skeleton h-3 rounded w-1/2" />
                  </div>
                </div>
              )) : stats?.recentActivity?.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl transition-all" style={{ background: 'var(--bg-secondary)' }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold"
                    style={{ background: item.user_avatar_color || 'var(--accent)', color: 'white' }}>
                    {item.user_name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.user_name}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                      {item.status === 'returned' ? '↩ Returned' : '📗 Borrowed'} <span style={{ color: item.cover_color }}>{item.title}</span>
                    </p>
                  </div>
                  <span className={`badge ${item.status === 'returned' ? 'badge-success' : item.status === 'overdue' ? 'badge-danger' : 'badge-info'}`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Popular Books */}
          <div className="glass rounded-2xl p-5" style={{ border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ fontFamily: 'Playfair Display, serif' }}>Most Popular</h3>
              <a href="/admin/books" className="text-xs flex items-center gap-1" style={{ color: 'var(--accent-light)', textDecoration: 'none' }}>
                All books <ArrowUpRight size={12} />
              </a>
            </div>
            <div className="space-y-3">
              {stats?.popularBooks?.map((book, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-lg font-bold w-6 text-center" style={{ color: i === 0 ? '#f59e0b' : i === 1 ? '#9ca3af' : i === 2 ? '#cd7c2f' : 'var(--text-secondary)', fontFamily: 'Playfair Display, serif' }}>
                    {i + 1}
                  </span>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${book.cover_color}22` }}>
                    <BookOpen size={16} style={{ color: book.cover_color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{book.title}</p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{book.author}</p>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ background: 'var(--accent-glow)', color: 'var(--accent-light)' }}>
                    {book.borrow_count}×
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
