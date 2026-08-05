import { Link } from 'react-router-dom';
import { Search, ArrowLeft } from 'lucide-react';
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
        <span className="w-20 h-20 rounded-3xl bg-sage/20 text-primary flex items-center justify-center mx-auto mb-6">
          <Search className="h-9 w-9" strokeWidth={1.6} />
        </span>
        <h1 className="text-6xl font-heading font-bold text-primary mb-2">404</h1>
        <h2 className="text-2xl font-heading font-bold text-ink mb-3">Page Not Found</h2>
        <p className="text-body mb-8">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link
          to={getHomeLink()}
          className="btn btn-primary inline-flex"
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={2} />
          Go Home
        </Link>
      </div>
    </div>
  );
}
