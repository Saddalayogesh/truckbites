import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lightbulb, Truck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { register as registerApi } from '../api/authApi';
import { useToast } from '../components/Toast';

export default function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  });
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
    if (!form.name || !form.email || !form.password) {
      setError('Please fill in all fields.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await registerApi(form);
      const { token, email, name, role, userId, refreshToken } = res.data;
      // Backend always assigns CUSTOMER role on registration
      // Returns AuthResponse: { token, refreshToken, email, name, role, userId }
      login({ user: { id: userId, email, name }, token, role, refreshToken });

      addToast(`Welcome to TruckBites, ${name || 'friend'}!`, 'success');
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
        'Registration failed. Please try again.';
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
            <Truck className="h-7 w-7" strokeWidth={2} />
          </span>
        </div>
        {/* Heading */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold text-ink">Create Account</h1>
          <p className="text-body mt-1">Join TruckBites today</p>
        </div>

        {/* Error alert */}
        {error && (
          <div className="bg-error/10 border border-error/30 text-error px-4 py-3 rounded-input mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-ink mb-1.5">
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              value={form.name}
              onChange={handleChange}
              placeholder="Jane Doe"
              className="input-field"
            />
          </div>

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
              autoComplete="new-password"
              required
              value={form.password}
              onChange={handleChange}
              placeholder="At least 6 characters"
              className="input-field"
            />
          </div>

          {/* Role hint — backend always creates CUSTOMER; role is not sent */}
          <div className="bg-sage/15 border border-sage/40 rounded-input px-4 py-3 text-sm text-primary flex items-start gap-2.5">
            <Lightbulb className="h-4 w-4 shrink-0 mt-0.5" strokeWidth={2} />
            <span><span className="font-heading font-semibold">Note:</span> New accounts are registered as{' '}
            <strong>Customer</strong>. If you are a food truck owner, contact an admin to
            upgrade your account to Vendor.</span>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-block"
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        {/* Login link */}
        <p className="text-center text-sm text-body mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:text-primary-dark font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
