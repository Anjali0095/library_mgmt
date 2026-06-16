import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import {
  BookOpen, LayoutDashboard, Library, ClipboardList, Users,
  LogOut, Menu, X, ChevronRight, Bell
} from 'lucide-react';

const adminNav = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/books', label: 'Books', icon: Library },
  { href: '/admin/borrowings', label: 'Borrowings', icon: ClipboardList },
  { href: '/admin/students', label: 'Students', icon: Users },
];

const studentNav = [
  { href: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/student/books', label: 'Browse Books', icon: Library },
  { href: '/student/history', label: 'My History', icon: ClipboardList },
];

export default function Layout({ children, title }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const nav = user?.role === 'admin' ? adminNav : studentNav;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen relative z-10" style={{ display: 'grid', gridTemplateColumns: '260px 1fr', minHeight: '100vh' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className="fixed lg:sticky top-0 h-screen z-50 flex flex-col transition-transform duration-300"
        style={{
          width: '260px',
          background: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border)',
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
      >
        {/* Force visible on desktop */}
        <style jsx>{`
          @media (min-width: 1024px) {
            aside { transform: translateX(0) !important; position: sticky !important; }
          }
        `}</style>

        {/* Logo */}
        <div className="p-6 flex items-center gap-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #6366f1, #818cf8)' }}>
            <BookOpen size={18} color="white" />
          </div>
          <div>
            <div className="font-bold text-sm" style={{ fontFamily: 'Playfair Display, serif', color: 'var(--text-primary)' }}>Bibliotheca</div>
            <div className="text-xs capitalize" style={{ color: 'var(--accent-light)' }}>{user?.role} portal</div>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <X size={20} />
          </button>
        </div>

        {/* User info */}
        <div className="p-4 mx-4 mt-4 rounded-xl" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{ background: user?.avatar_color || 'var(--accent)', color: 'white' }}>
              {initials}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-sm truncate">{user?.name}</div>
              <div className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{user?.email}</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="text-xs font-semibold uppercase tracking-wider mb-3 px-3" style={{ color: 'var(--text-secondary)' }}>
            Navigation
          </div>
          {nav.map(({ href, label, icon: Icon }) => (
            <a
              key={href}
              href={href}
              className={`sidebar-item ${router.pathname === href ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{label}</span>
              {router.pathname === href && <ChevronRight size={14} className="ml-auto" style={{ color: 'var(--accent-light)' }} />}
            </a>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4" style={{ borderTop: '1px solid var(--border)' }}>
          <button
            onClick={handleLogout}
            className="sidebar-item w-full"
            style={{ color: '#ef4444', border: 'none', background: 'none', width: '100%' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-col min-h-screen overflow-hidden" style={{ gridColumn: '2', background: 'var(--bg-primary)' }}>
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex items-center gap-4 px-6 py-4" style={{ background: 'rgba(10,10,15,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)', minHeight: '65px' }}>
          <button
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
          >
            <Menu size={22} />
          </button>
          <div>
            <h1 className="font-bold text-lg" style={{ fontFamily: 'Playfair Display, serif' }}>{title}</h1>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button className="w-9 h-9 rounded-xl flex items-center justify-center transition-all" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <Bell size={16} />
            </button>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold" style={{ background: user?.avatar_color || 'var(--accent)', color: 'white' }}>
              {initials}
            </div>
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 p-6 page-enter overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
