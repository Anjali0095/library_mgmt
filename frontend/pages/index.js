import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) router.replace('/login');
      else if (user.role === 'admin') router.replace('/admin/dashboard');
      else router.replace('/student/dashboard');
    }
  }, [user, loading]);

  return (
    <div className="min-h-screen flex items-center justify-center relative z-10">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Loading Bibliotheca...</p>
      </div>
    </div>
  );
}
