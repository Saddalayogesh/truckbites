import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function NotFound() {
  const { token, role } = useAuth();

  const getHomeLink = () => {
    if (!token) return '/discover';
    if (role === 'VENDOR') return '/vendor';
    if (role === 'ADMIN') return '/admin';
    return '/discover';
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <span className="text-8xl block mb-6">🔍</span>
        <h1 className="text-6xl font-bold text-orange-600 mb-2">404</h1>
        <h2 className="text-2xl font-bold text-gray-800 mb-3">Page Not Found</h2>
        <p className="text-gray-500 mb-8">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link
          to={getHomeLink()}
          className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 transition-all shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Go Home
        </Link>
      </div>
    </div>
  );
}
