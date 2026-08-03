/**
 * Revenue model constants and helpers (mirror the backend rules in
 * user-service, order-service and truck-service).
 * All money values are in INR (₹).
 */

export const NON_MEMBER = {
  tier: 'NONE',
  displayName: 'Non-Member',
  monthlyPrice: 0,
  platformFeePerOrder: 15,
  discountPercent: 0,
  freeCouponsPerMonth: 0,
  priorityProcessing: false,
  emoji: '👤',
  color: 'bg-line/60 text-body',
  features: [],
};

export const MEMBERSHIP_TIERS = [
  {
    tier: 'SILVER',
    displayName: 'Silver',
    monthlyPrice: 49,
    platformFeePerOrder: 5,
    discountPercent: 3,
    freeCouponsPerMonth: 1,
    priorityProcessing: false,
    emoji: '🥈',
    color: 'bg-slate-200 text-slate-700',
    features: [
      'Platform Fee: ₹5/order',
      '3% Member Discount',
      '1 Free Drink/Dessert Coupon / month',
      'Silver Membership Badge',
    ],
  },
  {
    tier: 'GOLD',
    displayName: 'Gold',
    monthlyPrice: 99,
    platformFeePerOrder: 0,
    discountPercent: 5,
    freeCouponsPerMonth: 2,
    priorityProcessing: true,
    emoji: '🥇',
    color: 'bg-amber-300 text-amber-900',
    features: [
      'Platform Fee: Free',
      '5% Member Discount',
      '2 Free Drink/Dessert Coupons / month',
      'Priority Order Processing',
      'Gold Membership Badge',
    ],
  },
  {
    tier: 'PLATINUM',
    displayName: 'Platinum',
    monthlyPrice: 149,
    platformFeePerOrder: 0,
    discountPercent: 8,
    freeCouponsPerMonth: 4,
    priorityProcessing: true,
    emoji: '💎',
    color: 'bg-slate-400 text-white',
    features: [
      'Platform Fee: Free',
      '8% Member Discount',
      '4 Free Drink/Dessert Coupons / month',
      'Priority Order Processing',
      'Platinum Membership Badge',
    ],
  },
];

export const FREE_VENDOR_PLAN = {
  plan: 'FREE',
  displayName: 'Free',
  monthlyPrice: 0,
  commissionPercent: 10,
  emoji: '🆓',
  features: ['Basic listing'],
};

export const VENDOR_PLANS = [
  FREE_VENDOR_PLAN,
  {
    plan: 'STARTER',
    displayName: 'Starter',
    monthlyPrice: 499,
    commissionPercent: 8,
    emoji: '🚚',
    features: ['Unlimited menu updates', 'Order Management'],
  },
  {
    plan: 'PRO',
    displayName: 'Pro',
    monthlyPrice: 999,
    commissionPercent: 6,
    emoji: '📈',
    features: ['Analytics', 'Priority Support', 'Promotions'],
  },
  {
    plan: 'PREMIUM',
    displayName: 'Premium',
    monthlyPrice: 1499,
    commissionPercent: 5,
    emoji: '👑',
    features: ['Featured Listing', 'Advanced Analytics', 'Premium Support'],
  },
];

export const FEATURED_PROMOTIONS = [
  { days: 7, price: 299, label: '7 Days' },
  { days: 15, price: 499, label: '15 Days' },
  { days: 30, price: 799, label: '30 Days' },
];

/** GST: 5% on food, 18% on platform fee (Indian tax regulations). */
export const GST_RATES = { food: 0.05, platformFee: 0.18 };

export const formatINR = (value) => `₹${Number(value).toFixed(2)}`;

/** Integer paise (hundredths), matching the backend's 2-dp HALF_UP rounding. */
const toPaise = (value) => Math.round((Number(value) + Number.EPSILON) * 100);

export const membershipByTier = (tier) =>
  MEMBERSHIP_TIERS.find((m) => m.tier === tier) || NON_MEMBER;

export const vendorPlanByPlan = (plan) =>
  VENDOR_PLANS.find((p) => p.plan === plan) || FREE_VENDOR_PLAN;

/**
 * Estimate the order price breakdown for a subtotal and membership object.
 * Mirrors the backend calculation in order-service exactly: the discount and
 * each GST component (5% food, 18% platform fee) are rounded to 2 dp
 * individually before summing, using integer paise math to avoid float drift.
 * @returns {{ subtotal: number, discount: number, platformFee: number, gst: number, total: number }}
 */
export const estimatePricing = (subtotal, membership = NON_MEMBER) => {
  const subtotalNum = Number(subtotal) || 0;
  const discountPct = membership?.discountPercent || 0;
  const platformFee = Number(membership?.platformFeePerOrder ?? NON_MEMBER.platformFeePerOrder);

  const discount = toPaise(subtotalNum * (discountPct / 100)) / 100;
  const gst =
    (toPaise(subtotalNum * GST_RATES.food) +
      toPaise(platformFee * GST_RATES.platformFee)) /
    100;
  const total = toPaise(subtotalNum - discount + platformFee + gst) / 100;
  return { subtotal: subtotalNum, discount, platformFee, gst, total };
};

/**
 * Estimate pricing across multiple trucks. The platform fee and GST are
 * charged per order (per truck), so the totals must be summed per truck.
 */
export const estimateCartPricing = (truckIds, itemsByTruck, membership = NON_MEMBER) => {
  return truckIds.reduce(
    (acc, truckId) => {
      const truckItems = itemsByTruck[truckId] || [];
      const sub = truckItems.reduce((s, i) => s + Number(i.price) * Number(i.quantity), 0);
      const p = estimatePricing(sub, membership);
      return {
        subtotal: acc.subtotal + p.subtotal,
        discount: acc.discount + p.discount,
        platformFee: acc.platformFee + p.platformFee,
        gst: acc.gst + p.gst,
        total: acc.total + p.total,
      };
    },
    { subtotal: 0, discount: 0, platformFee: 0, gst: 0, total: 0 }
  );
};
