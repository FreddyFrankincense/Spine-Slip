import {
  EditionPackaging,
  RetailerCouponPolicy,
  RetailerOffer,
  VerifiedPromoCode,
} from "../types";

export const BLOCKED_COUPON_FARM_DOMAINS = [
  "dealspotr.com",
  "couponbirds.com",
  "wethrift.com",
  "simplycodes.com",
  "retailmenot.com",
  "dontpayfull.com",
  "knoji.com",
  "promocodes.com",
  "coupert.com",
  "couponfollow.com",
  "hotdeals.com",
];

export const INITIAL_VERIFIED_PROMO_CODES: VerifiedPromoCode[] = [
  {
    id: "promo-gruv-signup20",
    code: "SIGNUP20",
    retailer: "Gruv (Gruvi)",
    discountSummary: "20% Off Entire Order (Stacks w/ 4K & Steelbook Sales)",
    discountType: "Percent Off",
    discountPercent: 20,
    verificationTier: "Tier 1 — Official Storefront Policy",
    campaignSource: "Gruv.com Official Site Header Banner & Newsletter Welcome Campaign",
    sourceUrl: "https://www.gruv.com",
    stackingAndExclusions:
      "Stacks with Gruv weekend 4K Steelbook & Boutique markdowns; single-use per registered email address; free US shipping included.",
    excludesLimitedBoxes: false,
    confidenceScore: 99,
    verifiedCount: 148,
    lastVerifiedAt: "Verified 12 mins ago",
    isActive: true,
  },
  {
    id: "promo-orbit-3free",
    code: "3FREE",
    retailer: "OrbitDVD",
    discountSummary: "Free Domestic US Box Shipping on Any 3+ Discs",
    discountType: "Free Shipping / Multi-Buy",
    discountFlat: 5.5,
    verificationTier: "Tier 1 — Official Storefront Policy",
    campaignSource: "OrbitDVD.com Top Announcement Bar & Shipping FAQ",
    sourceUrl: "https://www.orbitdvd.com",
    stackingAndExclusions:
      "Standing official code for free US shipping when 3 or more items (including UK/AU 4K Limited Boxes) are in cart. Saves ~$5.50 shipping cost.",
    excludesLimitedBoxes: false,
    confidenceScore: 100,
    verifiedCount: 312,
    lastVerifiedAt: "Verified 8 mins ago",
    isActive: true,
  },
  {
    id: "promo-arrow-braint10",
    code: "REDDIT10",
    retailer: "Arrow Video Direct",
    discountSummary: "10% Off In-Stock Arrow US/UK Store Editions",
    discountType: "Percent Off",
    discountPercent: 10,
    verificationTier: "Tier 2 — Collector Forum Verified (r/4kbluray · Blu-ray.com)",
    campaignSource: "Arrow Video Influencer / Podcast & r/boutiquebluray Campaign",
    sourceUrl: "https://www.arrowvideo.com",
    stackingAndExclusions:
      "Applies to in-stock catalog and Shocktober sale items; excludes unreleased pre-orders and bundle subscriptions.",
    excludesLimitedBoxes: false,
    confidenceScore: 91,
    verifiedCount: 44,
    lastVerifiedAt: "Verified 35 mins ago",
    isActive: true,
  },
  {
    id: "promo-shout-loyalty10",
    code: "SHOUT10",
    retailer: "Shout! Factory Direct",
    discountSummary: "10% Off Direct Orders (Includes Litho Poster Bundles)",
    discountType: "Percent Off",
    discountPercent: 10,
    verificationTier: "Tier 1 — Official Ad / Newsletter Campaign",
    campaignSource: "Shout! Factory SMS / Newsletter Signup Campaign",
    sourceUrl: "https://shoutfactory.com",
    stackingAndExclusions:
      "Applies to in-stock 4K Steelbooks and Collector's Editions with rolled lithograph posters; excludes SDCC convention exclusives.",
    excludesLimitedBoxes: false,
    confidenceScore: 93,
    verifiedCount: 62,
    lastVerifiedAt: "Verified 1 hr ago",
    isActive: true,
  },
  {
    id: "promo-bn-rewards10",
    code: "BNMEMBER10",
    retailer: "Barnes & Noble",
    discountSummary: "10% Premium Member Stack on In-Store / Eligible 4Ks",
    discountType: "Percent Off",
    discountPercent: 10,
    verificationTier: "Tier 1 — Official Storefront Policy",
    campaignSource: "Barnes & Noble Membership Terms & Blu-ray.com Criterion Thread",
    sourceUrl: "https://www.barnesandnoble.com",
    stackingAndExclusions:
      "Note: Public B&N 15% promo codes explicitly exclude 50% off Criterion Month items, whereas B&N Premium 10% applies to full-price A24 Collector Books & non-Criterion 4Ks.",
    excludesLimitedBoxes: false,
    confidenceScore: 95,
    verifiedCount: 89,
    lastVerifiedAt: "Verified today",
    isActive: true,
  },
  {
    id: "promo-target-circle15",
    code: "CIRCLE15",
    retailer: "Target",
    discountSummary: "15% Off Entertainment / Target Circle Multi-Buy",
    discountType: "Percent Off",
    discountPercent: 15,
    verificationTier: "Tier 1 — Official Ad / Newsletter Campaign",
    campaignSource: "Target Circle Weekly Ad & App Entertainment Coupon",
    sourceUrl: "https://www.target.com",
    stackingAndExclusions:
      "Activated via Target Circle account banner; applies to in-stock & pre-order Shout! Factory Steelbooks and Criterion 4K UHDs.",
    excludesLimitedBoxes: false,
    confidenceScore: 94,
    verifiedCount: 77,
    lastVerifiedAt: "Verified 48 mins ago",
    isActive: true,
  },
];

export const RETAILER_COUPON_POLICIES: RetailerCouponPolicy[] = [
  {
    retailerOrLabel: "Gruv (Gruvi)",
    publicCodePolicy: "Active Public Codes",
    standingRuleSummary:
      "Publishes official 20% welcome code (SIGNUP20) and periodic 10%–15% weekend 4K flash codes directly in the site header banner.",
    fakeCodeWarning:
      "Ignore any coupon-farm code claiming '40%–50% off sitewide'—Gruv discounts above 20% are always automatic multi-buy cart promotions (e.g., 2-for-$24).",
  },
  {
    retailerOrLabel: "OrbitDVD",
    publicCodePolicy: "Active Public Codes",
    standingRuleSummary:
      "Maintains standing code 3FREE for free domestic US shipping when purchasing 3 or more items.",
    fakeCodeWarning:
      "OrbitDVD prices imports near wholesale and never issues 20%–30% off coupon codes—any percent-off code listed on Dealspotr/CouponBirds is fake.",
  },
  {
    retailerOrLabel: "DiabolikDVD",
    publicCodePolicy: "Never Uses Public % Codes",
    standingRuleSummary:
      "DiabolikDVD never issues public alphanumeric percent-off promo codes. Discounts occur solely via their 'Clearance / Dinged Corner' section.",
    fakeCodeWarning:
      "100% Fake Alert: Any website claiming a '15% or 20% off DiabolikDVD coupon code' is an automated SEO click-farm.",
  },
  {
    retailerOrLabel: "The Criterion Collection",
    publicCodePolicy: "Never Uses Public % Codes",
    standingRuleSummary:
      "Criterion's 50% off Flash Sales (Feb/Oct) apply automatically in cart. Only single-use $10 loyalty/Channel subscriber certificates use codes.",
    fakeCodeWarning:
      "100% Fake Alert: Criterion never releases public reusable alphanumeric promo codes like 'CRITERION20' or 'SPINE50'.",
  },
  {
    retailerOrLabel: "Vinegar Syndrome",
    publicCodePolicy: "Rare / Campaign Only",
    standingRuleSummary:
      "Uses single-use VSMC loyalty point codes ($5–$20 off) and Subscriber Week codes tied to specific user accounts.",
    fakeCodeWarning:
      "Public coupon aggregators frequently list expired Halfway/Black Friday referral codes that no longer validate at checkout.",
  },
  {
    retailerOrLabel: "Arrow Video & Shout! Factory",
    publicCodePolicy: "Active Public Codes",
    standingRuleSummary:
      "Sponsor horror podcasts (e.g., Colors of the Dark, Dead Meat) and run 10% newsletter/referral codes that stack on in-stock catalog titles.",
    fakeCodeWarning:
      "Verify exclusions: most 10% Arrow/Shout codes exclude pre-orders and direct-exclusive rigid box bundles.",
  },
];

export interface EffectiveOfferPricing {
  originalPrice: number;
  netPrice: number;
  savingsAmount: number;
  appliedPromo: VerifiedPromoCode | null;
}

export function computeEffectiveOfferWithPromo(
  offer: RetailerOffer,
  editionType: EditionPackaging,
  promoCodes: VerifiedPromoCode[],
  applyPromoMath: boolean
): EffectiveOfferPricing {
  if (!applyPromoMath || !offer.inStock) {
    return {
      originalPrice: offer.price,
      netPrice: offer.price,
      savingsAmount: 0,
      appliedPromo: null,
    };
  }

  const normalizedRetailer = offer.retailer.toLowerCase();

  // Find active verified percentage or flat-dollar promo codes matching this retailer
  const matchingCodes = promoCodes.filter((p) => {
    if (!p.isActive) return false;
    if (p.excludesLimitedBoxes && editionType === "Rigid Box Set") return false;
    // Only apply direct price reduction for Percent Off (not 3-item free shipping unless user checks shipping)
    if (p.discountType !== "Percent Off" && p.discountType !== "Flat Dollar Off") {
      return false;
    }

    const codeRetailer = p.retailer.toLowerCase();
    return (
      normalizedRetailer.includes(codeRetailer) ||
      codeRetailer.includes(normalizedRetailer) ||
      (normalizedRetailer.includes("gruv") && codeRetailer.includes("gruv")) ||
      (normalizedRetailer.includes("arrow") && codeRetailer.includes("arrow")) ||
      (normalizedRetailer.includes("shout") && codeRetailer.includes("shout")) ||
      (normalizedRetailer.includes("barnes") && codeRetailer.includes("barnes")) ||
      (normalizedRetailer.includes("target") && codeRetailer.includes("target"))
    );
  });

  if (matchingCodes.length === 0) {
    return {
      originalPrice: offer.price,
      netPrice: offer.price,
      savingsAmount: 0,
      appliedPromo: null,
    };
  }

  // Pick the promo code that yields the lowest net price
  let bestNetPrice = offer.price;
  let bestPromo: VerifiedPromoCode | null = null;

  matchingCodes.forEach((promo) => {
    let candidateNet = offer.price;
    if (promo.discountType === "Percent Off" && promo.discountPercent) {
      candidateNet = Number(
        (offer.price * (1 - promo.discountPercent / 100)).toFixed(2)
      );
    } else if (promo.discountType === "Flat Dollar Off" && promo.discountFlat) {
      candidateNet = Math.max(5, Number((offer.price - promo.discountFlat).toFixed(2)));
    }

    if (candidateNet < bestNetPrice) {
      bestNetPrice = candidateNet;
      bestPromo = promo;
    }
  });

  const savingsAmount = Math.max(0, Number((offer.price - bestNetPrice).toFixed(2)));

  return {
    originalPrice: offer.price,
    netPrice: bestNetPrice,
    savingsAmount,
    appliedPromo: bestPromo,
  };
}
