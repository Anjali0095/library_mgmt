import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { BookOpen, Mail, Lock, User, GraduationCap, Shield, Phone, Building2 } from 'lucide-react';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: '', roll_number: '', department: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.role) return toast.error('Please select a role');
    setLoading(true);
    try {
      const user = await register(form);
      toast.success(`Account created! Welcome, ${user.name}!`);
      router.push(user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-3">
            <BookOpen size={24} color="white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text" style={{ fontFamily: 'Playfair Display, serif' }}>
            Create Account
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Join the library community</p>
        </div>

        {/* Role Selector */}
        {!form.role && (
          <div className="glass rounded-2xl p-8 mb-0" style={{ border: '1px solid var(--border)' }}>
            <h2 className="text-center text-lg font-semibold mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
              I am a...
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => update('role', 'student')}
                className="flex flex-col items-center gap-3 p-6 rounded-xl transition-all"
                style={{ background: 'var(--bg-secondary)', border: '2px solid var(--border)', cursor: 'pointer', color: 'var(--text-primary)' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.15)' }}>
                  <GraduationCap size={28} style={{ color: 'var(--accent-light)' }} />
                </div>
                <span className="font-semibold">Student</span>
                <span className="text-xs text-center" style={{ color: 'var(--text-secondary)' }}>Browse & borrow books</span>
              </button>
              <button
                onClick={() => update('role', 'admin')}
                className="flex flex-col items-center gap-3 p-6 rounded-xl transition-all"
                style={{ background: 'var(--bg-secondary)', border: '2px solid var(--border)', cursor: 'pointer', color: 'var(--text-primary)' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#f59e0b'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.15)' }}>
                  <Shield size={28} style={{ color: '#f59e0b' }} />
                </div>
                <span className="font-semibold">Admin</span>
                <span className="text-xs text-center" style={{ color: 'var(--text-secondary)' }}>Manage the library</span>
              </button>
            </div>
          </div>
        )}

        {form.role && (
          <div className="glass rounded-2xl p-8" style={{ border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: form.role === 'admin' ? 'rgba(245,158,11,0.15)' : 'rgba(99,102,241,0.15)' }}>
                {form.role === 'admin' ? <Shield size={16} style={{ color: '#f59e0b' }} /> : <GraduationCap size={16} style={{ color: 'var(--accent-light)' }} />}
              </div>
              <span className="font-semibold capitalize">{form.role} Registration</span>
              <button
                className="ml-auto text-xs btn-ghost"
                style={{ padding: '4px 10px' }}
                onClick={() => update('role', '')}
              >Change</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Full Name *</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secondary)' }} />
                    <input className="input-field" style={{ paddingLeft: '36px' }} placeholder="John Doe" value={form.name} onChange={e => update('name', e.target.value)} required />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Phone</label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secondary)' }} />
                    <input className="input-field" style={{ paddingLeft: '36px' }} placeholder="+91 9999999999" value={form.phone} onChange={e => update('phone', e.target.value)} />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Email *</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secondary)' }} />
                  <input className="input-field" style={{ paddingLeft: '36px' }} type="email" placeholder="you@university.edu" value={form.email} onChange={e => update('email', e.target.value)} required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {form.role === 'student' && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Roll Number</label>
                    <input className="input-field" placeholder="2024CS001" value={form.roll_number} onChange={e => update('roll_number', e.target.value)} />
                  </div>
                )}
                <div className={form.role === 'student' ? '' : 'col-span-2'}>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Department</label>
                  <div className="relative">
                    <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secondary)' }} />
                    <input className="input-field" style={{ paddingLeft: '36px' }} placeholder="Computer Science" value={form.department} onChange={e => update('department', e.target.value)} />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Password *</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secondary)' }} />
                  <input className="input-field" style={{ paddingLeft: '36px' }} type="password" placeholder="Min. 6 characters" value={form.password} onChange={e => update('password', e.target.value)} required minLength={6} />
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary w-full"
                style={{ height: '48px', marginTop: '8px' }}
                disabled={loading}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                ) : 'Create Account'}
              </button>
            </form>

            <p className="text-center text-sm mt-5" style={{ color: 'var(--text-secondary)' }}>
              Already have an account?{' '}
              <a href="/login" style={{ color: 'var(--accent-light)', textDecoration: 'none', fontWeight: 600 }}>Sign in</a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
