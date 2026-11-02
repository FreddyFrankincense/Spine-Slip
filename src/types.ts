export type BoutiqueLabel =
  | "The Criterion Collection"
  | "Vinegar Syndrome"
  | "Arrow Video"
  | "Second Sight Films"
  | "Shout! Factory"
  | "Severin Films"
  | "Kino Lorber"
  | "A24"
  | "NEON"
  | "Lionsgate Limited"
  | "88 Films"
  | "Radiance Films"
  | "Umbrella Entertainment"
  | "Indicator / Powerhouse"
  | "Deaf Crocodile"
  | "Eureka! Masters of Cinema"
  | "Mondo Macabro"
  | "Terror Vision"
  | "Grindhouse Releasing"
  | "BFI"
  | "DiabolikDVD Exclusive"
  | "OrbitDVD Exclusive";

export type EditionPackaging =
  | "Rigid Box Set"
  | "Limited Slipcover"
  | "Boutique Steelbook"
  | "Archival Digipak"
  | "Standard Edition";

export type DiscFormat = "4K UHD + Blu-ray" | "4K UHD" | "Blu-ray";

export type RegionCode = "Region Free" | "Region A" | "Region B" | "Region A/B/C";

export type HdrFormat = "Dolby Vision / HDR10" | "HDR10" | "SDR (Restored 4K Master)";

export type SlipcoverStatus =
  | "In Stock (With Slip)"
  | "Low Slip Stock (<10%)"
  | "Rigid Box Active"
  | "Standard Only (Slip OOP)"
  | "Near OOP";

export type WishlistPriority = "Critical Grail" | "High Priority" | "Wait for 50% Sale";

export type RetailerCategory = "Boutique Direct" | "Specialty Stockist" | "Major Retailer";

export type OwnedFormat = "DVD" | "Blu-ray" | "4K UHD" | "VHS / LaserDisc";

export type ImportSourceType =
  | "CLZ Movies"
  | "Blu-ray.com CSV"
  | "Letterboxd CSV"
  | "Manual Shelf Entry";

export type UpgradeUrgencyTier =
  | "Critical — Act Immediately"
  | "High — Priority Upgrade"
  | "Moderate — Wait for 50% Sale"
  | "Low — Marginal / Sidegrade";

export interface OwnedDiscItem {
  id: string;
  title: string;
  year: number;
  director?: string;
  ownedFormat: OwnedFormat;
  ownedEdition: string;
  ownedLabel: string;
  barcode?: string;
  conditionNotes?: string;
  importSource: ImportSourceType;
  matchedReleaseId?: string;
  addedAt: string;
}

export interface UpgradeUrgencyAssessment {
  totalScore: number;
  tier: UpgradeUrgencyTier;
  formatLeapLabel: string;
  packagingLeapLabel: string;
  formatPoints: number;
  packagingPoints: number;
  scarcityPoints: number;
  pricePoints: number;
  scarcityReason: string;
  priceReason: string;
  synthesis: string;
}

export interface RetailerOffer {
  retailer: string;
  retailerCategory: RetailerCategory;
  price: number;
  previousPrice?: number;
  inStock: boolean;
  stockNote: string;
  isSale: boolean;
  lastChecked: string;
  url: string;
  listedDiscCount?: string;
  promoBonusStatus?: "Includes Early Promo" | "Disc Only (No Pre-Order Promo)" | "Standard Pressing" | string;
  hasListingDiscrepancy?: boolean;
}

export interface DiscContentsBreakdown {
  discCountSummary: string;
  cutsIncluded: string[];
  commentaries: string[];
  specialFeatures: string[];
  includedPromoMaterials: string[];
}

export interface RetailerDiscrepancyAlert {
  hasDiscrepancy: boolean;
  severity: "Critical SKU Variance" | "Promo / Feelie Variance" | "Verified Uniform Across Stores" | string;
  affectedRetailers: string[];
  summary: string;
  verificationAdvice: string;
}

export interface EarlyPromoPolicy {
  sameEditionNumberWarning: boolean;
  catalogIdentifierNote: string;
  earlyPromoItems: string[];
  laterRunOmissions: string;
  activePromoRetailer: string;
}

export interface GroundingSource {
  uri: string;
  title: string;
}

export interface LiveScanResult {
  reportText: string;
  summary: string;
  slipcoverAlert?: string | null;
  discrepancyNote?: string | null;
  earlyPromoNote?: string | null;
  scrapedDiscContents?: Partial<DiscContentsBreakdown>;
  sources: GroundingSource[];
  checkedAt: string;
}

export interface PriceHistoryPoint {
  dayOffset: number; // -29 to 0 (0 = Today)
  dateLabel: string; // e.g. "Oct 03"
  isoDate: string; // e.g. "2026-10-03"
  price: number;
  retailer: string;
  eventNote?: string;
  isHistoricalLow?: boolean;
}

export interface BoutiqueRelease {
  id: string;
  title: string;
  director: string;
  year: number;
  label: BoutiqueLabel;
  spineNumber: string;
  editionType: EditionPackaging;
  coverImage: string;
  technicalSpecs: {
    format: DiscFormat;
    hdr: HdrFormat;
    region: RegionCode;
    audio: string;
    transferNote: string;
  };
  printRun: {
    limited: boolean;
    totalUnits?: number;
    remainingEstimate?: number;
    slipcoverStatus: SlipcoverStatus;
  };
  wishlist: {
    isWishlisted: boolean;
    priority: WishlistPriority;
    targetPrice: number;
    requireSlipOrBox: boolean;
    notes: string;
  };
  msrp: number;
  releaseStatus: "New Release" | "Recent Restock" | "Flash Sale" | "Low Print Run" | "In Catalog";
  collectorHighlights: string[];
  discContents: DiscContentsBreakdown;
  retailerDiscrepancy: RetailerDiscrepancyAlert;
  earlyPromoPolicy: EarlyPromoPolicy;
  retailerListings: RetailerOffer[];
  priceHistory30d?: PriceHistoryPoint[];
  lastLiveScan?: LiveScanResult;
}

export interface BoutiqueLabelProfile {
  name: BoutiqueLabel;
  category?: "Boutique Label" | "Production Co. / Distributor" | "Specialty Stockist";
  country: string;
  specialty: string;
  signaturePackaging: string;
  typicalSaleSchedule: string;
  directStoreUrl: string;
  activeAlertNote: string;
}

export interface BoutiqueSaleEvent {
  id: string;
  label: string;
  retailerHost: string;
  saleName: string;
  discountSummary: string;
  status: "Active Now" | "Starts in Days" | "Seasonal Anchor";
  dateWindow: string;
  countdownLabel: string;
  description: string;
  collectorTip: string;
  qualifyingLabels: BoutiqueLabel[];
}

export interface PriceDropAlertItem {
  id: string;
  dedupeKey: string;
  releaseId: string;
  title: string;
  label: BoutiqueLabel;
  spineNumber: string;
  editionType: EditionPackaging;
  retailer: string;
  retailerUrl: string;
  offerPrice: number;
  targetPrice: number;
  msrp: number;
  savingsBelowTarget: number;
  discountPctOffMsrp: number;
  slipcoverStatus: SlipcoverStatus;
  triggeredAt: string;
  triggerSource:
    | "Wishlist Threshold Match"
    | "Live Retailer Scan"
    | "Flash Price Drop"
    | "Verified Promo Code"
    | "Test Alert";
  appliedPromoCode?: string;
  isRead: boolean;
}

export type PromoVerificationTier =
  | "Tier 1 — Official Storefront Policy"
  | "Tier 1 — Official Ad / Newsletter Campaign"
  | "Tier 2 — Collector Forum Verified (r/4kbluray · Blu-ray.com)";

export interface VerifiedPromoCode {
  id: string;
  code: string;
  retailer: string;
  discountSummary: string;
  discountType: "Percent Off" | "Flat Dollar Off" | "Free Shipping / Multi-Buy";
  discountPercent?: number;
  discountFlat?: number;
  verificationTier: PromoVerificationTier | string;
  campaignSource: string;
  sourceUrl: string;
  stackingAndExclusions: string;
  excludesLimitedBoxes?: boolean;
  confidenceScore: number; // 0 to 100
  verifiedCount: number;
  lastVerifiedAt: string;
  isActive: boolean;
}

export interface RetailerCouponPolicy {
  retailerOrLabel: string;
  publicCodePolicy: "Active Public Codes" | "Rare / Campaign Only" | "Never Uses Public % Codes";
  standingRuleSummary: string;
  fakeCodeWarning: string;
}
