import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as loginApi } from '../api/authApi';
import { useToast } from '../components/Toast';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await loginApi(form);
      const { token, email, name, role, userId, refreshToken } = res.data;
      // Backend returns AuthResponse: { token, refreshToken, email, name, role, userId }
      login({ user: { id: userId, email, name }, token, role, refreshToken });

      addToast(`Welcome back, ${name || 'friend'}!`, 'success');
      // Redirect based on role
      if (role === 'VENDOR') {
        navigate('/vendor');
      } else if (role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/discover');
      }
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Login failed. Please check your credentials.';
      setError(message);
      addToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="card p-8 sm:p-10 shadow-card-hover max-w-md w-full">
        {/* Brand mark */}
        <div className="flex justify-center mb-6">
          <span className="h-14 w-14 rounded-2xl bg-primary text-white flex items-center justify-center shadow-soft">
            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 16V9a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7" />
              <path d="M14 12h4l2 3v1a1 1 0 0 1-1 1h-1" />
              <circle cx="7.5" cy="16.5" r="1.8" />
              <circle cx="17.5" cy="16.5" r="1.8" />
            </svg>
          </span>
        </div>
        {/* Heading */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold text-ink">Welcome Back</h1>
          <p className="text-body mt-1">Sign in to your TruckBites account</p>
        </div>

        {/* Error alert */}
        {error && (
          <div className="bg-error/10 border border-error/30 text-error px-4 py-3 rounded-input mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-ink mb-1.5">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className="input-field"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-ink mb-1.5">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={form.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className="input-field"
            />
          </div>

          <div className="text-right">
            <Link to="/forgot-password" className="text-sm text-primary hover:text-primary-dark font-medium">
              Forgot password?
            </Link>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-block"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        {/* Register link */}
        <p className="text-center text-sm text-body mt-6">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-primary hover:text-primary-dark font-medium">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
