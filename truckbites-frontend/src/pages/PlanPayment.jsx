import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BadgeCheck, Check, Smartphone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { subscribeMembership, subscribeVendorPlan } from '../api/userApi';
import UpiPayment from '../components/UpiPayment';
import { isValidUtr } from '../utils/upi';
import {
  MEMBERSHIP_TIERS,
  VENDOR_PLANS,
  membershipByTier,
  vendorPlanByPlan,
  formatINR,
} from '../utils/pricing';

/**
 * Plan checkout page.
 * kind="membership" -> /pay/membership/:tier  (customer membership tiers)
 * kind="vendor"     -> /pay/vendor/:plan      (vendor subscription plans)
 */
export default function PlanPayment({ kind }) {
  const { planKey } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { user } = useAuth();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [paid, setPaid] = useState(false);
  const [upiRef, setUpiRef] = useState('');
  const [upiRefError, setUpiRefError] = useState('');

  const isMembership = kind === 'membership';
  const validKeys = isMembership
    ? MEMBERSHIP_TIERS.map((t) => t.tier)
    : VENDOR_PLANS.map((p) => p.plan);
  const plan = isMembership ? membershipByTier(planKey) : vendorPlanByPlan(planKey);
  const isValid = validKeys.includes(planKey);

  const planLabel = isMembership ? 'Membership' : 'Vendor Plan';
  const features = plan.features || [];

  const handlePay = async () => {
    // UPI payment verification: the customer must provide the transaction
    // reference (UTR) from their UPI app — the backend only activates the plan
    // once the payment is verified.
    const trimmedRef = upiRef.trim();
    if (!trimmedRef) {
      setUpiRefError('Enter the UPI transaction ID from your payment app to verify the payment.');
      addToast('Enter your UPI transaction ID', 'warning');
      return;
    }
    if (!isValidUtr(trimmedRef)) {
      setUpiRefError('That does not look like a valid UPI transaction ID (6+ letters/numbers).');
      addToast('Invalid UPI transaction ID', 'warning');
      return;
    }

    setSubmitting(true);
    setError(null);
    setUpiRefError('');
    try {
      if (isMembership) {
        await subscribeMembership(user.id, plan.tier, trimmedRef);
      } else {
        await subscribeVendorPlan(user.id, plan.plan, trimmedRef);
      }
      setPaid(true);
      addToast(`You're now subscribed to the ${plan.displayName} ${planLabel.toLowerCase()}!`, 'success');
    } catch (err) {
      // Surface the real failure: backend message (if any), HTTP status, or a network hint.
      const status = err.response?.status;
      const detail = err.response?.data?.message || err.response?.data?.error || err.message;
      const message = detail
        ? (status ? `Payment failed (${status}): ${detail}` : `Payment failed: ${detail}`)
        : (status
            ? `Payment failed (${status}). Please try again.`
            : 'Payment failed: could not reach the server. Check that the backend is running.');
      setError(message);
      addToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Unknown plan key
  if (!isValid) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="card p-10 text-center max-w-md">
          <h1 className="text-2xl font-heading font-bold text-ink">Plan not found</h1>
          <p className="text-body mt-2">We couldn't find the plan you're looking for.</p>
          <Link to="/pricing" className="btn btn-primary mt-6">Back to Pricing</Link>
        </div>
      </div>
    );
  }

  // Payment success
  if (paid) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="card p-10 sm:p-14 text-center max-w-lg w-full">
          <span className="mx-auto w-20 h-20 rounded-full bg-success/15 text-success flex items-center justify-center">
            <Check className="h-10 w-10" strokeWidth={2.5} />
          </span>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-ink mt-6">You're now subscribed!</h1>
          <p className="text-body mt-2">
            Your <strong>{plan.displayName}</strong> {planLabel.toLowerCase()} is active.
            {isMembership
              ? ' Enjoy discounts and member perks on your next order.'
              : ' Enjoy lower commission and premium vendor features.'}
          </p>
          <p className="text-sm text-body/70 mt-2">
            {formatINR(plan.monthlyPrice)}/month · see your plan and badge on your profile.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            <Link to="/profile" className="btn btn-primary">Go to My Profile</Link>
            <Link to={isMembership ? '/' : '/vendor'} className="btn btn-secondary">
              {isMembership ? 'Start Ordering' : 'Open Dashboard'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] max-w-4xl mx-auto">
      <Link
        to="/pricing"
        className="inline-flex items-center gap-1.5 text-sm text-body hover:text-primary transition-colors mb-4"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2} /> Back to pricing
      </Link>

      <div className="mb-8">
        <span className="section-eyebrow">Secure checkout</span>
        <h1 className="text-3xl font-heading font-bold text-ink mt-1 flex items-center gap-3">
          <span className={`h-12 w-12 rounded-full flex items-center justify-center text-2xl ${isMembership ? plan.color : 'bg-primary/10'}`}>
            {plan.emoji}
          </span>
          {plan.displayName} {planLabel}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left: plan details + payment method */}
        <div className="lg:col-span-3 space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-heading font-semibold text-ink mb-4">What you get</h2>
            {features.length > 0 ? (
              <ul className="space-y-2.5">
                {features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm text-body">
                    <span className="mt-0.5 h-4 w-4 rounded-full bg-success/15 text-success flex items-center justify-center shrink-0">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-body">Standard platform fees and no member discounts apply.</p>
            )}
            {isMembership ? (
              <p className="text-xs font-heading font-medium text-primary mt-4">
                Platform fee {formatINR(plan.platformFeePerOrder)}/order · {plan.discountPercent}% member discount
              </p>
            ) : (
              <p className="text-xs font-heading font-medium text-primary mt-4">
                {plan.commissionPercent}% order commission
              </p>
            )}
          </div>

          {/* UPI payment — QR only */}
          <div className="card p-6">
            <h2 className="text-lg font-heading font-semibold text-ink mb-4 flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" strokeWidth={2} /> Pay via UPI
            </h2>
            <UpiPayment
              label="TruckBites"
              amount={plan.monthlyPrice}
              note={plan.displayName + ' ' + planLabel}
            />

            {/* UPI verification */}
            <div className="mt-5 pt-5 border-t border-line">
              <label
                htmlFor="upi-ref"
                className="flex items-center gap-1.5 text-sm font-heading font-semibold text-ink mb-1.5"
              >
                <BadgeCheck className="w-4 h-4 text-primary" strokeWidth={2} />
                UPI Transaction ID
              </label>
              <input
                id="upi-ref"
                type="text"
                inputMode="text"
                value={upiRef}
                onChange={(e) => { setUpiRef(e.target.value); if (upiRefError) setUpiRefError(''); }}
                placeholder="e.g. 123456789012"
                className="input-field text-center font-mono tracking-widest"
                aria-invalid={!!upiRefError}
                autoComplete="off"
              />
              <p className="text-xs text-body/60 mt-2">
                After paying in your UPI app, copy the transaction ID / UTR shown in the payment
                confirmation and enter it above. Your plan is only activated once the payment is verified.
              </p>
              {upiRefError && (
                <p className="text-xs text-error mt-1.5">{upiRefError}</p>
              )}
            </div>

            <p className="text-xs text-body/60 mt-4 text-center">
              Scan the QR with any UPI app, complete the payment, then enter the transaction ID to activate your plan.
            </p>
          </div>
        </div>

        {/* Right: summary sidebar */}
        <div className="lg:col-span-2">
          <div className="card p-6 sticky top-8">
            <h2 className="text-lg font-heading font-semibold text-ink mb-4">Order Summary</h2>
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-body">
                <span>{plan.displayName} {planLabel}</span>
                <span className="font-medium text-ink">{formatINR(plan.monthlyPrice)}</span>
              </div>
              <div className="flex justify-between text-body">
                <span>Billing period</span>
                <span className="font-medium text-ink">Monthly</span>
              </div>
            </div>
            <div className="border-t border-line pt-4 mb-4">
              <div className="flex justify-between text-lg font-heading font-bold text-ink">
                <span>Total</span>
                <span className="text-primary">{formatINR(plan.monthlyPrice)}</span>
              </div>
            </div>

            {error && (
              <div className="bg-error/10 border border-error/30 text-error rounded-input p-4 mb-4 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handlePay}
              disabled={submitting}
              className="btn btn-primary btn-block text-lg"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </>
              ) : (
                'Pay ' + formatINR(plan.monthlyPrice)
              )}
            </button>

            <button
              onClick={() => navigate('/pricing')}
              className="w-full text-center text-body hover:text-ink py-3 mt-2 transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

