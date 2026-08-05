import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Crown, Zap, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getMembership, getVendorPlan } from '../api/userApi';
import { useToast } from '../components/Toast';
import { MEMBERSHIP_TIERS, VENDOR_PLANS, FEATURED_PROMOTIONS, formatINR } from '../utils/pricing';

function FeatureList({ features }) {
  if (!features || features.length === 0) {
    return (
      <p className="text-sm text-body/70">
        No member discounts apply.
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
  const { token, role, user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [currentPlan, setCurrentPlan] = useState(null);

  // Reflect the logged-in user's active plan on the pricing cards.
  useEffect(() => {
    if (!token || !user?.id) return;
    let cancelled = false;
    const load = async () => {
      try {
        if (role === 'CUSTOMER') {
          const res = await getMembership(user.id);
          if (!cancelled) setCurrentPlan(res.data);
        } else if (role === 'VENDOR') {
          const res = await getVendorPlan(user.id);
          if (!cancelled) setCurrentPlan(res.data);
        }
      } catch {
        // Plan lookup is best-effort; cards just render without a badge.
      }
    };
    load();
    return () => { cancelled = true; };
  }, [token, role, user]);
  const requireAuth = () => {
    if (!token) {
      addToast('Sign in to subscribe', 'warning');
      navigate('/login', { state: { from: 'pricing' } });
      return false;
    }
    return true;
  };

  // Open the plan's payment page
  const choosePlan = (kind, planKey) => {
    if (!requireAuth()) return;
    navigate(kind === 'membership' ? `/pay/membership/${planKey}` : `/pay/vendor/${planKey}`);
  };

  // Role-based visibility: customers see customer pricing, vendors see vendor pricing.
  const isVendorView = role === 'VENDOR';
  const showCustomerPricing = !token || role === 'CUSTOMER' || role === 'ADMIN';
  const showVendorPricing = isVendorView || role === 'ADMIN';

  return (
    <div className="min-h-[80vh]">
      <div className="text-center mb-12">
        <span className="section-eyebrow">Pricing &amp; Plans</span>
        <h1 className="text-3xl sm:text-4xl font-heading font-bold text-ink mt-2">
          Simple, transparent <span className="text-primary">pricing</span>
        </h1>
        <p className="text-body mt-3 max-w-2xl mx-auto">
          {isVendorView
            ? 'Pay less commission and unlock growth tools as you scale. No hidden charges — pick the plan that fits your truck.'
            : 'Save on every order with a membership — discounts, free coupons & more.'}
        </p>
      </div>

      {/* Customer membership */}
      {showCustomerPricing && (
      <section id="customer-plans" className="mb-16">
        <div className="flex items-center gap-3 mb-8">
          <span className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Crown className="h-5 w-5" strokeWidth={1.8} />
          </span>
          <div>
            <h2 className="text-2xl font-heading font-bold text-ink">Customer Membership</h2>
            <p className="text-sm text-body">Save on every order — earn discounts, free coupons &amp; more.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {MEMBERSHIP_TIERS.map((tier) => {
            const isCurrent = currentPlan?.active && currentPlan.tier === tier.tier;
            return (
            <div
              key={tier.tier}
              className={`card p-7 flex flex-col card-hover ${tier.tier === 'GOLD' ? 'border-2 border-accent shadow-glow-brand relative' : ''}`}
            >
              {tier.tier === 'GOLD' && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-ink text-[11px] font-heading font-bold uppercase tracking-wide px-3 py-1 rounded-full shadow-sm">
                  Most Popular
                </span>
              )}
              {isCurrent && (
                <span className="absolute -top-3 right-4 bg-success text-white text-[11px] font-heading font-bold uppercase tracking-wide px-3 py-1 rounded-full shadow-sm">
                  ✓ Current Plan
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
              {isCurrent ? (
                <button disabled className="btn mt-6 btn-block bg-success/15 text-success border-2 border-success/30 cursor-default">
                  ✓ You're subscribed
                </button>
              ) : (
                <button
                  onClick={() => choosePlan('membership', tier.tier)}
                  className={`btn mt-6 btn-block ${tier.tier === 'GOLD' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  Subscribe
                </button>
              )}
            </div>
            );
          })}
        </div>

        <p className="text-sm text-body/80 mt-6 max-w-3xl mx-auto text-center bg-cream border border-line rounded-card px-5 py-4">
          <Sparkles className="h-4 w-4 inline text-primary mr-1" strokeWidth={2} />
          <strong className="text-ink">Why subscribe?</strong> Every membership tier gives you a
          discount on every order — 3% on Silver, 5% on Gold and 8% on Platinum — plus free
          drink &amp; dessert coupons each month. Gold &amp; Platinum members also get
          <strong className="text-ink"> priority order processing</strong>.
        </p>
      </section>
      )}

      {/* Vendor plans */}
      {showVendorPricing && (
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
          {VENDOR_PLANS.map((plan) => {
            const isCurrent = currentPlan?.active && currentPlan.plan === plan.plan;
            return (
            <div
              key={plan.plan}
              className={`card p-6 flex flex-col card-hover relative ${plan.plan === 'PRO' ? 'border-2 border-primary' : ''}`}
            >
              {isCurrent && (
                <span className="absolute -top-3 right-4 bg-success text-white text-[11px] font-heading font-bold uppercase tracking-wide px-3 py-1 rounded-full shadow-sm">
                  ✓ Current Plan
                </span>
              )}
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
              {isCurrent ? (
                <button disabled className="btn mt-5 btn-block btn-sm bg-success/15 text-success border-2 border-success/30 cursor-default">
                  ✓ You're subscribed
                </button>
              ) : plan.plan !== 'FREE' ? (
                <button
                  onClick={() => choosePlan('vendor', plan.plan)}
                  className={`btn mt-5 btn-block btn-sm ${plan.plan === 'PREMIUM' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  Choose {plan.displayName}
                </button>
              ) : (
                <div className="mt-5 h-9 flex items-center justify-center text-xs text-body/70">
                  Included with every vendor account
                </div>
              )}
            </div>
            );
          })}
        </div>

        <p className="text-sm text-body/80 mt-6 max-w-3xl mx-auto text-center bg-cream border border-line rounded-card px-5 py-4">
          <Sparkles className="h-4 w-4 inline text-primary mr-1" strokeWidth={2} />
          <strong className="text-ink">Why upgrade?</strong> Every paid plan lowers your order
          commission from 10% down to as little as 5%. On ₹50,000 of monthly orders, upgrading
          from Free to Pro saves you <strong className="text-ink">₹2,000/month</strong> in commissions
          — more than covering the ₹999 plan cost.
        </p>
      </section>
      )}

      {/* Featured promotion */}
      {showVendorPricing && (
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
      )}
    </div>
  );
}
