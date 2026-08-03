import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, CircleCheck, Wrench } from 'lucide-react';
import { forgotPassword } from '../api/userApi';
import { useToast } from '../components/Toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const navigate = useNavigate();
  const addToast = useToast().addToast;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { setError('Please enter your email'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await forgotPassword(email);
      const token = res.data?.resetToken;
      setResetToken(token);
      setSuccess(true);
      addToast('Reset link generated! Check your email.', 'success');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send reset email. Please try again.';
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
            <KeyRound className="h-7 w-7" strokeWidth={1.7} />
          </span>
          <h1 className="text-3xl font-heading font-bold text-ink">Forgot Password</h1>
          <p className="text-body mt-1">Enter your email to receive a reset link</p>
        </div>

        {error && (
          <div className="bg-error/10 border border-error/30 text-error px-4 py-3 rounded-input mb-6 text-sm">{error}</div>
        )}

        {success ? (
          <div className="space-y-4">
            <div className="bg-success/10 border border-success/30 text-success px-4 py-4 rounded-input text-sm">
              <p className="font-heading font-semibold mb-2 inline-flex items-center gap-1.5">
                <CircleCheck className="h-4 w-4" strokeWidth={2.2} /> Reset link sent!
              </p>
              <p>If an account with that email exists, you will receive a password reset link shortly.</p>
            </div>

            {resetToken && (
              <div className="bg-primary/5 border border-primary/20 rounded-input p-4">
                <p className="text-xs text-primary font-medium mb-2 inline-flex items-center gap-1.5">
                  <Wrench className="h-3.5 w-3.5" strokeWidth={2.2} /> Dev Mode: Reset Token (click to auto-fill)
                </p>
                <p className="text-sm text-primary break-all font-mono">{resetToken}</p>
                <button
                  onClick={() => navigate('/reset-password?token=' + encodeURIComponent(resetToken))}
                  className="btn btn-primary btn-sm btn-block mt-3"
                >
                  Continue to Reset Password
                </button>
              </div>
            )}

            <Link to="/login" className="block text-center text-primary hover:text-primary-dark font-medium text-sm">
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-ink mb-1.5">Email</label>
              <input
                id="email" type="email" autoComplete="email" required
                value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }}
                placeholder="you@example.com"
                className="input-field"
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="btn btn-primary btn-block"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
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
