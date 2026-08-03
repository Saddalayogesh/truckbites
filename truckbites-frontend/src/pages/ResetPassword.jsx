import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, CircleCheck } from 'lucide-react';
import { resetPassword } from '../api/userApi';
import { useToast } from '../components/Toast';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const addToast = useToast().addToast;

  const initialToken = searchParams.get('token') || '';
  const [token, setToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) { setError('Reset token is required'); return; }
    if (!newPassword) { setError('Please enter a new password'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }

    setLoading(true);
    try {
      await resetPassword(token, newPassword);
      setSuccess(true);
      addToast('Password reset successful! Please sign in.', 'success');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to reset password. The token may be invalid or expired.';
      setError(msg);
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="card p-8 sm:p-10 shadow-card-hover max-w-md w-full">
        <div className="text-center mb-8">
          <span className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-5">
            <Lock className="h-7 w-7" strokeWidth={1.7} />
          </span>
          <h1 className="text-3xl font-heading font-bold text-ink">Reset Password</h1>
          <p className="text-body mt-1">Enter your new password</p>
        </div>

        {error && (
          <div className="bg-error/10 border border-error/30 text-error px-4 py-3 rounded-input mb-6 text-sm">{error}</div>
        )}

        {success ? (
          <div className="text-center space-y-4">
            <div className="bg-success/10 border border-success/30 text-success px-4 py-6 rounded-input">
              <span className="w-14 h-14 rounded-full bg-success/15 text-success flex items-center justify-center mx-auto mb-3">
                <CircleCheck className="h-7 w-7" strokeWidth={2} />
              </span>
              <p className="font-heading font-semibold text-lg">Password Reset Successful!</p>
              <p className="text-sm mt-1">You can now sign in with your new password.</p>
            </div>
            <Link
              to="/login"
              className="btn btn-primary inline-flex"
            >
              Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Reset Token</label>
              <input
                value={token} readOnly={!!initialToken}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste your reset token here"
                className="input-field font-mono text-sm"
              />
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-ink mb-1.5">New Password</label>
              <input
                id="newPassword" type="password" autoComplete="new-password" required
                value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                placeholder="At least 6 characters"
                className="input-field"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-ink mb-1.5">Confirm Password</label>
              <input
                id="confirmPassword" type="password" autoComplete="new-password" required
                value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                placeholder="Repeat new password"
                className="input-field"
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="btn btn-primary btn-block"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-body mt-6">
          Remember your password?{' '}
          <Link to="/login" className="text-primary hover:text-primary-dark font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
