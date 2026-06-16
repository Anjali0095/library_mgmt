import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import { BookOpen, Clock, AlertTriangle, DollarSign, ArrowUpRight, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';

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

export default function StudentDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [activeBorrowings, setActiveBorrowings] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [returning, setReturning] = useState(null);

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'student') router.push('/login');
      else fetchData();
    }
  }, [user, loading]);

  const fetchData = async () => {
    try {
      const [statsRes, borrowRes] = await Promise.all([
        api.get('/users/stats/student'),
        api.get('/borrowings', { params: { status: 'borrowed', limit: 5 } }),
      ]);
      setStats(statsRes.data);
      setActiveBorrowings(borrowRes.data.borrowings);
    } catch (e) {}
    setFetching(false);
  };

  const handleReturn = async (id) => {
    if (!confirm('Return this book?')) return;
    setReturning(id);
    try {
      const { data } = await api.post(`/borrowings/return/${id}`);
      toast.success(data.fine > 0 ? `Returned! Fine: ₹${data.fine}` : 'Book returned successfully!');
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Return failed');
    }
    setReturning(null);
  };

  if (loading || !user) return null;

  return (
    <Layout title="Dashboard">
      <div className="space-y-6">
        {/* Greeting */}
        <div>
          <h2 className="text-2xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>
            Hello, {user.name?.split(' ')[0]} 📚
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            You can borrow up to 3 books at a time
          </p>
        </div>

        {/* Borrow limit indicator */}
        <div className="glass rounded-2xl p-5 flex items-center gap-6" style={{ border: '1px solid var(--border)' }}>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold">Borrow Limit Used</span>
              <span className="text-sm font-bold" style={{ color: 'var(--accent-light)' }}>
                {stats?.activeBorrowings || 0}/3
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${((stats?.activeBorrowings || 0) / 3) * 100}%`,
                  background: stats?.activeBorrowings >= 3 ? '#ef4444' : stats?.activeBorrowings === 2 ? '#f59e0b' : '#10b981',
                }}
              />
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              {stats?.booksLeft > 0 ? `${stats.booksLeft} slot${stats.booksLeft > 1 ? 's' : ''} remaining` : 'Limit reached'}
            </p>
          </div>
          <a href="/student/books" className="btn-primary flex items-center gap-2 flex-shrink-0 text-sm" style={{ padding: '10px 18px' }}>
            Browse Books <ArrowUpRight size={14} />
          </a>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={BookOpen} label="Active Loans" value={stats?.activeBorrowings} color="#6366f1" sub="books out" />
          <StatCard icon={Clock} label="Total Borrowed" value={stats?.totalBorrowed} color="#10b981" sub="all time" />
          <StatCard icon={AlertTriangle} label="Overdue" value={stats?.overdueBooks} color="#ef4444" sub="past due" />
          <StatCard icon={DollarSign} label="Fines" value={`₹${stats?.totalFines || 0}`} color="#f59e0b" sub="total" />
        </div>

        {/* Currently Borrowed */}
        <div className="glass rounded-2xl p-5" style={{ border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold" style={{ fontFamily: 'Playfair Display, serif' }}>Currently Borrowed</h3>
            <a href="/student/history" className="text-xs flex items-center gap-1" style={{ color: 'var(--accent-light)', textDecoration: 'none' }}>
              Full history <ArrowUpRight size={12} />
            </a>
          </div>

          {fetching ? (
            <div className="space-y-3">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
                  <div className="skeleton w-10 h-10 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-3 rounded w-3/4" />
                    <div className="skeleton h-3 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : activeBorrowings.length === 0 ? (
            <div className="text-center py-10" style={{ color: 'var(--text-secondary)' }}>
              <div className="text-4xl mb-2">📖</div>
              <p className="text-sm">No active borrowings</p>
              <a href="/student/books" className="text-xs mt-2 inline-block" style={{ color: 'var(--accent-light)', textDecoration: 'none' }}>
                Browse books →
              </a>
            </div>
          ) : (
            <div className="space-y-3">
              {activeBorrowings.map(b => {
                const due = new Date(b.due_date);
                const isOverdue = due < new Date();
                const daysLeft = Math.ceil((due - new Date()) / (1000 * 60 * 60 * 24));

                return (
                  <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-secondary)', border: `1px solid ${isOverdue ? 'rgba(239,68,68,0.2)' : 'transparent'}` }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${b.cover_color}22` }}>
                      <BookOpen size={18} style={{ color: b.cover_color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{b.title}</p>
                      <p className="text-xs" style={{ color: isOverdue ? '#ef4444' : 'var(--text-secondary)' }}>
                        {isOverdue ? `⚠ Overdue by ${Math.abs(daysLeft)} days` : `Due in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`}
                      </p>
                    </div>
                    <button
                      onClick={() => handleReturn(b.id)}
                      disabled={returning === b.id}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg flex-shrink-0"
                      style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', cursor: 'pointer' }}
                    >
                      {returning === b.id
                        ? <div className="w-3 h-3 border border-green-400 border-t-transparent rounded-full animate-spin" />
                        : <><RotateCcw size={12} /> Return</>
                      }
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
