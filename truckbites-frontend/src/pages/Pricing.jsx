import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Crown, Zap, Sparkles, BadgeCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { subscribeMembership, subscribeVendorPlan } from '../api/userApi';
import {
  MEMBERSHIP_TIERS,
  VENDOR_PLANS,
  FEATURED_PROMOTIONS,
  NON_MEMBER,
  formatINR,
  estimatePricing,
} from '../utils/pricing';

function FeatureList({ features }) {
  if (!features || features.length === 0) {
    return (
      <p className="text-sm text-body/70">
        Standard platform fees and no member discounts apply.
      </p>
    );
  }
  return (
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
  );
}

export default function Pricing() {
  const { token, user, role } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [subscribing, setSubscribing] = useState(null);

  const requireAuth = () => {
    if (!token) {
      addToast('Sign in to subscribe', 'warning');
      navigate('/login', { state: { from: 'pricing' } });
      return false;
    }
    return true;
  };

  const handleSubscribeMembership = async (tier) => {
    if (!requireAuth()) return;
    setSubscribing('member-' + tier);
    try {
      await subscribeMembership(user.id, tier);
      addToast('Membership ' + tier + ' activated!', 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to activate membership', 'error');
    } finally {
      setSubscribing(null);
    }
  };

  const handleSubscribeVendorPlan = async (plan) => {
    if (!requireAuth()) return;
    setSubscribing('vendor-' + plan);
    try {
      await subscribeVendorPlan(user.id, plan);
      addToast('Vendor plan ' + plan + ' activated!', 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to activate vendor plan', 'error');
    } finally {
      setSubscribing(null);
    }
  };

  const example = estimatePricing(500, NON_MEMBER);

  return (
    <div className="min-h-[80vh]">
      <div className="text-center mb-12">
        <span className="section-eyebrow">Pricing &amp; Plans</span>
        <h1 className="text-3xl sm:text-4xl font-heading font-bold text-ink mt-2">
          Simple, transparent <span className="text-primary">pricing</span>
        </h1>
        <p className="text-body mt-3 max-w-2xl mx-auto">
          Save on every order with a membership, or grow your business with a
          vendor plan. No hidden charges — GST is calculated separately at checkout.
        </p>
      </div>

      {/* Customer membership */}
      <section id="customer-plans" className="mb-16">
        <div className="flex items-center gap-3 mb-8">
          <span className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Crown className="h-5 w-5" strokeWidth={1.8} />
          </span>
          <div>
            <h2 className="text-2xl font-heading font-bold text-ink">Customer Membership</h2>
            <p className="text-sm text-body">Save on every order — pay less in platform fees, earn discounts &amp; coupons.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {MEMBERSHIP_TIERS.map((tier) => (
            <div
              key={tier.tier}
              className={`card p-7 flex flex-col card-hover ${tier.tier === 'GOLD' ? 'border-2 border-accent shadow-glow-brand relative' : ''}`}
            >
              {tier.tier === 'GOLD' && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-ink text-[11px] font-heading font-bold uppercase tracking-wide px-3 py-1 rounded-full shadow-sm">
                  Most Popular
                </span>
              )}
              <div className="flex items-center justify-between mb-4">
                <span className={`h-12 w-12 rounded-full flex items-center justify-center text-2xl ${tier.color}`}>
                  {tier.emoji}
                </span>
                <span className="badge bg-cream text-body/80">{tier.displayName}</span>
              </div>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-3xl font-heading font-bold text-ink">{formatINR(tier.monthlyPrice)}</span>
                <span className="text-sm text-body/70 mb-1.5">/month</span>
              </div>
              <div className="h-px bg-line my-5" />
              <div className="flex-1">
                <FeatureList features={tier.features} />
              </div>
              <button
                onClick={() => handleSubscribeMembership(tier.tier)}
                disabled={subscribing === 'member-' + tier.tier}
                className={`btn mt-6 btn-block ${tier.tier === 'GOLD' ? 'btn-primary' : 'btn-secondary'}`}
              >
                {subscribing === 'member-' + tier.tier ? 'Activating...' : 'Subscribe'}
              </button>
            </div>
          ))}
        </div>

        <p className="text-sm text-body/80 mt-6 max-w-3xl mx-auto text-center bg-cream border border-line rounded-card px-5 py-4">
          <Sparkles className="h-4 w-4 inline text-primary mr-1" strokeWidth={2} />
          <strong className="text-ink">Why subscribe?</strong> The Silver plan pays for itself
          in just a few orders by cutting your platform fee from ₹15 to ₹5 and adding a 3% discount.
          Gold &amp; Platinum members pay <strong className="text-ink">zero platform fees</strong>,
          get bigger discounts and priority order processing.
        </p>
      </section>

      {/* Platform fee + GST */}
      <section className="mb-16">
        <div className="flex items-center gap-3 mb-8">
          <span className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <BadgeCheck className="h-5 w-5" strokeWidth={1.8} />
          </span>
          <div>
            <h2 className="text-2xl font-heading font-bold text-ink">Platform Fee &amp; GST</h2>
            <p className="text-sm text-body">A small platform fee per order — waived for members. GST per Indian tax regulations.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-0 overflow-hidden">
            <div className="px-6 py-4 bg-primary text-white font-heading font-semibold">Platform Fee per Order</div>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-line">
                {[
                  { tier: 'Non-Member', fee: '₹15/order', badge: 'bg-line/60 text-body' },
                  { tier: 'Silver', fee: '₹5/order', badge: 'bg-slate-200 text-slate-700' },
                  { tier: 'Gold', fee: 'Free', badge: 'bg-amber-300 text-amber-900' },
                  { tier: 'Platinum', fee: 'Free', badge: 'bg-slate-400 text-white' },
                ].map((row) => (
                  <tr key={row.tier} className="hover:bg-cream transition-colors">
                    <td className="px-6 py-3.5">
                      <span className={`badge ${row.badge}`}>{row.tier}</span>
                    </td>
                    <td className="px-6 py-3.5 text-right font-heading font-semibold text-ink">{row.fee}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card p-6">
            <h3 className="font-heading font-semibold text-ink mb-1">GST Billing Example</h3>
            <p className="text-sm text-body mb-5">
              Non-member ordering food worth {formatINR(500)} — GST 5% on food + 18% on platform fee.
            </p>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between"><span className="text-body">Food Total</span><span className="font-medium text-ink">{formatINR(example.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-body">Platform Fee</span><span className="font-medium text-ink">{formatINR(example.platformFee)}</span></div>
              <div className="flex justify-between"><span className="text-body">GST (5% + 18%)</span><span className="font-medium text-ink">{formatINR(example.gst)}</span></div>
              <div className="border-t border-line pt-2.5 flex justify-between font-heading font-bold text-ink">
                <span>Total</span>
                <span className="text-primary">{formatINR(example.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vendor plans */}
      <section id="vendor-plans" className="mb-16">
        <div className="flex items-center gap-3 mb-8">
          <span className="h-10 w-10 rounded-xl bg-accent/15 text-accentDark flex items-center justify-center">
            <Zap className="h-5 w-5" strokeWidth={1.8} />
          </span>
          <div>
            <h2 className="text-2xl font-heading font-bold text-ink">Vendor Plans</h2>
            <p className="text-sm text-body">Pay less commission and unlock growth tools as you scale.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {VENDOR_PLANS.map((plan) => (
            <div
              key={plan.plan}
              className={`card p-6 flex flex-col card-hover ${plan.plan === 'PRO' ? 'border-2 border-primary' : ''}`}
            >
              <div className="text-3xl mb-3">{plan.emoji}</div>
              <h3 className="font-heading font-bold text-ink text-lg">{plan.displayName}</h3>
              <div className="flex items-end gap-1 my-2">
                <span className="text-2xl font-heading font-bold text-ink">{formatINR(plan.monthlyPrice)}</span>
                <span className="text-xs text-body/70 mb-1">/month</span>
              </div>
              <p className="text-xs font-heading font-medium text-primary mb-4">
                {plan.commissionPercent}% order commission
              </p>
              <div className="flex-1">
                <FeatureList features={plan.features} />
              </div>
              {plan.plan !== 'FREE' && (
                <button
                  onClick={() => handleSubscribeVendorPlan(plan.plan)}
                  disabled={subscribing === 'vendor-' + plan.plan}
                  className={`btn mt-5 btn-block btn-sm ${plan.plan === 'PREMIUM' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  {subscribing === 'vendor-' + plan.plan ? 'Activating...' : 'Choose ' + plan.displayName}
                </button>
              )}
              {plan.plan === 'FREE' && (
                <div className="mt-5 h-9 flex items-center justify-center text-xs text-body/70">
                  Included with every vendor account
                </div>
              )}
            </div>
          ))}
        </div>

        <p className="text-sm text-body/80 mt-6 max-w-3xl mx-auto text-center bg-cream border border-line rounded-card px-5 py-4">
          <Sparkles className="h-4 w-4 inline text-primary mr-1" strokeWidth={2} />
          <strong className="text-ink">Why upgrade?</strong> Every paid plan lowers your order
          commission from 10% down to as little as 5%. On ₹50,000 of monthly orders, upgrading
          from Free to Pro saves you <strong className="text-ink">₹2,000/month</strong> in commissions
          — more than covering the ₹999 plan cost.
        </p>
      </section>

      {/* Featured promotion */}
      <section className="mb-8">
        <div className="flex items-center gap-3 mb-8">
          <span className="h-10 w-10 rounded-xl bg-accent/15 text-accentDark flex items-center justify-center">
            <Crown className="h-5 w-5" strokeWidth={1.8} />
          </span>
          <div>
            <h2 className="text-2xl font-heading font-bold text-ink">Featured Truck Promotion</h2>
            <p className="text-sm text-body">Appear at the top of the Home page, Search Results &amp; Category listings.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {FEATURED_PROMOTIONS.map((promo) => (
            <div key={promo.days} className="card p-6 text-center card-hover">
              <p className="text-xs uppercase tracking-wider text-body/60 font-heading font-semibold">{promo.label}</p>
              <p className="text-3xl font-heading font-bold text-primary mt-2">{formatINR(promo.price)}</p>
              <p className="text-xs text-body/70 mt-3">
                Featured trucks appear first in search results and on the trending list — boosting
                visibility, clicks and sales during your busiest weeks.
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          {role === 'VENDOR' ? (
            <Link to="/vendor" className="btn btn-primary">
              Promote my truck from the dashboard
            </Link>
          ) : (
            <p className="text-sm text-body">
              Vendors can start a promotion from their{' '}
              <Link to="/vendor" className="text-primary font-medium hover:underline">dashboard</Link>.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
