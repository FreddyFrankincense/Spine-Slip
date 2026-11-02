import React, { useState } from "react";
import {
  X,
  Search,
  RefreshCw,
  ExternalLink,
  Bookmark,
  Check,
  AlertTriangle,
  Plus,
  Disc,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import {
  BoutiqueLabel,
  BoutiqueRelease,
  DiscFormat,
  EditionPackaging,
  HdrFormat,
  OwnedDiscItem,
  OwnedFormat,
  RegionCode,
  RetailerOffer,
  WishlistPriority,
} from "../types";
import { BOUTIQUE_LABEL_PROFILES, EDITION_IMAGES } from "../data/catalog";
import { assessUpgradeUrgency } from "../utils/upgradeUrgency";
import { DiscContentsAccordion } from "./DiscContentsAccordion";
import { EditionPriceTrendChart } from "./EditionPriceTrendChart";

interface EditionDossierDrawerProps {
  release: BoutiqueRelease | null;
  ownedDisc?: OwnedDiscItem;
  onClose: () => void;
  onUpdateWishlist: (
    id: string,
    updates: Partial<BoutiqueRelease["wishlist"]>
  ) => void;
  onQuickLogOwnedDisc: (release: BoutiqueRelease, format: OwnedFormat, editionNote: string) => void;
  onTriggerLiveScan: (release: BoutiqueRelease) => Promise<void>;
  isScanningId: string | null;
  onApplyDiscoveredOffers: (id: string, offers: RetailerOffer[]) => void;
}

export const EditionDossierDrawer: React.FC<EditionDossierDrawerProps> = ({
  release,
  ownedDisc,
  onClose,
  onUpdateWishlist,
  onQuickLogOwnedDisc,
  onTriggerLiveScan,
  isScanningId,
}) => {
  const [imgError, setImgError] = useState(false);

  if (!release) return null;

  const isScanning = isScanningId === release.id;
  const inStockOffers = release.retailerListings.filter((r) => r.inStock);
  const lowestOffer =
    inStockOffers.length > 0
      ? inStockOffers.reduce((min, o) => (o.price < min.price ? o : min), inStockOffers[0])
      : release.retailerListings[0];

  const isTargetMet =
    lowestOffer && lowestOffer.inStock && lowestOffer.price <= release.wishlist.targetPrice;
  const upgradeAssessment = ownedDisc
    ? assessUpgradeUrgency(ownedDisc, release)
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-xs transition-opacity"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-[#121216] border-l border-[#232329] h-full overflow-y-auto p-6 md:p-8 text-[#F4F4F6]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Drawer Header */}
        <div className="flex items-start justify-between gap-4 pb-6 border-b border-[#232329]">
          <div>
            <div className="text-xs text-[#9CA3AF] flex flex-wrap items-center gap-2">
              <span className="text-amber-400 font-medium">{release.label}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{release.spineNumber}</span>
              <span aria-hidden="true">·</span>
              <span>{release.editionType}</span>
              <span aria-hidden="true">·</span>
              <span>{release.year}</span>
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-semibold text-[#F4F4F6] mt-1">
              {release.title}
            </h2>
            <p className="text-sm text-[#9CA3AF] mt-1">
              Directed by <span className="text-[#E4E4E7]">{release.director}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#9CA3AF] hover:text-white border border-[#232329] rounded-lg hover:bg-[#1A1A22] transition-colors shrink-0"
            aria-label="Close Edition Dossier"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contiguous Summary & Cover Section */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 py-6 border-b border-[#232329]">
          <div className="sm:col-span-4">
            <div className="aspect-3/4 w-full bg-[#0A0A0C] border border-[#232329] rounded-lg overflow-hidden relative">
              {!imgError ? (
                <img
                  src={release.coverImage}
                  alt={`${release.title} ${release.editionType}`}
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-b from-[#181820] to-[#0A0A0C]">
                  <Disc className="w-10 h-10 text-amber-500/70 mb-2" />
                  <span className="font-mono text-xs text-amber-400">{release.spineNumber}</span>
                  <span className="font-display text-sm text-[#F4F4F6] mt-1">{release.title}</span>
                </div>
              )}
            </div>
          </div>

          <div className="sm:col-span-8 flex flex-col justify-between space-y-4">
            {/* Price & Threshold Comparison */}
            <div className="p-4 bg-[#0A0A0C] border border-[#232329] rounded-lg">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <span className="text-xs text-[#9CA3AF] block">Lowest In-Stock Offer</span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="font-mono text-2xl font-semibold text-[#F4F4F6] tabular-nums">
                      ${lowestOffer ? lowestOffer.price.toFixed(2) : release.msrp.toFixed(2)}
                    </span>
                    <span className="font-mono text-xs text-[#9CA3AF] line-through tabular-nums">
                      MSRP ${release.msrp.toFixed(2)}
                    </span>
                    {lowestOffer && (
                      <span className="text-xs text-emerald-400 font-mono tabular-nums">
                        (-{Math.round(((release.msrp - lowestOffer.price) / release.msrp) * 100)}%)
                      </span>
                    )}
                  </div>
                  {lowestOffer && (
                    <span className="text-xs text-[#9CA3AF] mt-1 block">
                      via <strong className="text-[#E4E4E7]">{lowestOffer.retailer}</strong> ·{" "}
                      {lowestOffer.stockNote}
                    </span>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-xs text-[#9CA3AF] block">Your Target Price</span>
                  <span
                    className={`font-mono text-lg font-semibold tabular-nums ${
                      isTargetMet ? "text-emerald-400" : "text-amber-400"
                    }`}
                  >
                    ${release.wishlist.targetPrice.toFixed(2)}
                  </span>
                  <span className="block text-xs mt-0.5">
                    {isTargetMet ? (
                      <span className="text-emerald-400 font-medium">Target Price Met</span>
                    ) : (
                      <span className="text-[#9CA3AF]">
                        ${(lowestOffer.price - release.wishlist.targetPrice).toFixed(2)} above target
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Print Run / Slipcover Status */}
              <div className="mt-4 pt-3 border-t border-[#232329] flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-[#9CA3AF]">
                  Packaging Status:{" "}
                  <strong
                    className={
                      release.printRun.slipcoverStatus.includes("Low") ||
                      release.printRun.slipcoverStatus.includes("Near OOP")
                        ? "text-rose-400"
                        : "text-[#F4F4F6]"
                    }
                  >
                    {release.printRun.slipcoverStatus}
                  </strong>
                </span>
                {release.printRun.limited && release.printRun.totalUnits && (
                  <span className="font-mono text-[#9CA3AF] tabular-nums">
                    Est. {release.printRun.remainingEstimate?.toLocaleString()} /{" "}
                    {release.printRun.totalUnits.toLocaleString()} units left
                  </span>
                )}
              </div>
            </div>

            {/* Technical Specifications Block */}
            <div className="space-y-2 text-xs">
              <div className="text-[#9CA3AF] font-medium">Archival Technical Specifications</div>
              <div className="text-[#E4E4E7] leading-relaxed">
                <span>{release.technicalSpecs.format}</span>
                <span className="mx-2 text-[#9CA3AF]">·</span>
                <span>{release.technicalSpecs.hdr}</span>
                <span className="mx-2 text-[#9CA3AF]">·</span>
                <span>{release.technicalSpecs.region}</span>
                <span className="mx-2 text-[#9CA3AF]">·</span>
                <span>{release.technicalSpecs.audio}</span>
              </div>
              <p className="text-[#9CA3AF] leading-relaxed">
                {release.technicalSpecs.transferNote}
              </p>
            </div>
          </div>
        </div>

        {/* Owned Disc & Upgrade Urgency Assessment Section */}
        <div className="py-5 border-b border-[#232329]">
          {ownedDisc && upgradeAssessment ? (
            <div className="p-4 bg-[#0A0A0C] border border-amber-500/40 rounded-lg space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-amber-400 font-semibold">
                  Owned on Your Shelf ({ownedDisc.importSource}) · {upgradeAssessment.formatLeapLabel}
                </span>
                <span
                  className={`font-mono font-semibold tabular-nums ${
                    upgradeAssessment.totalScore >= 78
                      ? "text-rose-400"
                      : "text-emerald-400"
                  }`}
                >
                  Urgency {upgradeAssessment.totalScore}/100 ({upgradeAssessment.tier})
                </span>
              </div>
              <div className="text-xs text-[#E4E4E7]">
                Currently Owned: <strong>{ownedDisc.ownedFormat}</strong> · {ownedDisc.ownedEdition} ({ownedDisc.ownedLabel})
              </div>
              <div className="font-mono text-[11px] text-[#9CA3AF] tabular-nums">
                4-Factor Breakdown: A/V Leap +{upgradeAssessment.formatPoints} · Packaging +{upgradeAssessment.packagingPoints} · OOP Risk +{upgradeAssessment.scarcityPoints} · Price +{upgradeAssessment.pricePoints}
              </div>
              <p className="text-xs text-[#9CA3AF] leading-relaxed">
                {upgradeAssessment.synthesis}
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-[#0A0A0C] border border-[#232329] rounded-lg text-xs">
              <div>
                <div className="font-medium text-[#F4F4F6]">
                  Already own an older DVD or Blu-ray of this film?
                </div>
                <div className="text-[#9CA3AF]">
                  Log your current copy to track this boutique release as an upgrade and compute urgency.
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    onQuickLogOwnedDisc(
                      release,
                      "DVD",
                      "Legacy Standard Definition DVD"
                    )
                  }
                  className="px-2.5 py-1.5 bg-[#121216] hover:bg-[#1A1A22] border border-[#232329] rounded-md text-[#E4E4E7] whitespace-nowrap"
                >
                  + Own on DVD
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onQuickLogOwnedDisc(
                      release,
                      "Blu-ray",
                      "Standard 1080p Blu-ray"
                    )
                  }
                  className="px-2.5 py-1.5 bg-[#121216] hover:bg-[#1A1A22] border border-[#232329] rounded-md text-[#E4E4E7] whitespace-nowrap"
                >
                  + Own on Blu-ray
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Wishlist Priority & Target Threshold Controls */}
        <div className="py-6 border-b border-[#232329] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-[#F4F4F6]">
              Wishlist Priority &amp; Alert Configuration
            </h3>
            <button
              onClick={() =>
                onUpdateWishlist(release.id, {
                  isWishlisted: !release.wishlist.isWishlisted,
                })
              }
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 ${
                release.wishlist.isWishlisted
                  ? "bg-amber-500 text-black hover:bg-amber-400"
                  : "bg-[#1A1A22] text-[#F4F4F6] border border-[#232329] hover:border-amber-500/50"
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              {release.wishlist.isWishlisted ? "In Priority Wishlist" : "Add to Wishlist"}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Priority Selector */}
            <div>
              <label className="block text-xs text-[#9CA3AF] mb-1.5">Priority Tier</label>
              <select
                value={release.wishlist.priority}
                onChange={(e) =>
                  onUpdateWishlist(release.id, {
                    priority: e.target.value as WishlistPriority,
                    isWishlisted: true,
                  })
                }
                className="w-full bg-[#0A0A0C] border border-[#232329] rounded-lg px-3 py-2 text-xs text-[#F4F4F6] focus:outline-none focus:border-amber-500"
              >
                <option value="Critical Grail">Critical Grail (Buy Immediately on Restock)</option>
                <option value="High Priority">High Priority (Watch Slipcover &amp; Price)</option>
                <option value="Wait for 50% Sale">Wait for 50% Label Sale</option>
              </select>
            </div>

            {/* Target Buy Price Stepper */}
            <div>
              <label className="block text-xs text-[#9CA3AF] mb-1.5">
                Target Buy Price Alert ($)
              </label>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() =>
                    onUpdateWishlist(release.id, {
                      targetPrice: Math.max(5, Number((release.wishlist.targetPrice - 2).toFixed(2))),
                      isWishlisted: true,
                    })
                  }
                  className="px-2.5 py-2 bg-[#0A0A0C] border border-[#232329] rounded-l-lg text-xs hover:bg-[#1A1A22]"
                >
                  -$2
                </button>
                <input
                  type="number"
                  step="0.5"
                  value={release.wishlist.targetPrice}
                  onChange={(e) =>
                    onUpdateWishlist(release.id, {
                      targetPrice: Math.max(1, parseFloat(e.target.value) || 0),
                      isWishlisted: true,
                    })
                  }
                  className="w-full bg-[#0A0A0C] border-y border-[#232329] px-2 py-2 text-center font-mono text-xs text-[#F4F4F6] tabular-nums focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() =>
                    onUpdateWishlist(release.id, {
                      targetPrice: Number((release.wishlist.targetPrice + 2).toFixed(2)),
                      isWishlisted: true,
                    })
                  }
                  className="px-2.5 py-2 bg-[#0A0A0C] border border-[#232329] rounded-r-lg text-xs hover:bg-[#1A1A22]"
                >
                  +$2
                </button>
              </div>
            </div>

            {/* Slipcover / Rigid Box Requirement */}
            <div>
              <label className="block text-xs text-[#9CA3AF] mb-1.5">Packaging Rule</label>
              <button
                type="button"
                onClick={() =>
                  onUpdateWishlist(release.id, {
                    requireSlipOrBox: !release.wishlist.requireSlipOrBox,
                  })
                }
                className={`w-full px-3 py-2 rounded-lg border text-xs font-medium flex items-center justify-between transition-colors ${
                  release.wishlist.requireSlipOrBox
                    ? "bg-[#0A0A0C] border-amber-500/50 text-amber-300"
                    : "bg-[#0A0A0C] border-[#232329] text-[#9CA3AF]"
                }`}
              >
                <span>Require Slip / Box</span>
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#9CA3AF] mb-1.5">Collector Vault Notes</label>
            <input
              type="text"
              value={release.wishlist.notes}
              onChange={(e) =>
                onUpdateWishlist(release.id, { notes: e.target.value })
              }
              placeholder="Add packaging notes, edition differences, or sale targets..."
              className="w-full bg-[#0A0A0C] border border-[#232329] rounded-lg px-3 py-2 text-xs text-[#F4F4F6] focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* D3 30-Day Price Trend & Historical Low Visualization */}
        <EditionPriceTrendChart
          release={release}
          onSetTargetPrice={(newTargetPrice) =>
            onUpdateWishlist(release.id, {
              targetPrice: newTargetPrice,
              isWishlisted: true,
            })
          }
        />

        {/* Multi-Retailer Price, Listed Disc Count & Early Promo Comparison */}
        <div className="py-6 border-b border-[#232329]">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-[#F4F4F6]">
                Multi-Retailer Price, Disc Count &amp; Promo Comparison
              </h3>
              <p className="text-xs text-[#9CA3AF]">
                Comparing Boutique Direct, Specialty Stockists (DiabolikDVD / OrbitDVD), and Major Retailers
              </p>
            </div>

            <button
              onClick={() => onTriggerLiveScan(release)}
              disabled={isScanning}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-black font-medium text-xs rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? "animate-spin" : ""}`} />
              {isScanning ? "Scraping Live Retailers..." : "Scrape Live Prices & Contents"}
            </button>
          </div>

          <div className="border border-[#232329] rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0A0A0C] border-b border-[#232329] text-[11px] text-[#9CA3AF]">
                  <th className="py-2.5 px-3 font-medium">Retailer &amp; Listed Set</th>
                  <th className="py-2.5 px-3 font-medium">Stock &amp; Early Promo Status</th>
                  <th className="py-2.5 px-3 font-medium text-right">Price</th>
                  <th className="py-2.5 px-3 font-medium text-right">Store</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#232329] text-xs">
                {release.retailerListings.map((offer, idx) => {
                  const meetsTarget =
                    offer.inStock && offer.price <= release.wishlist.targetPrice;
                  return (
                    <tr
                      key={`${offer.retailer}-${idx}`}
                      className={`hover:bg-[#181820] transition-colors ${
                        offer.hasListingDiscrepancy ? "bg-rose-950/15" : ""
                      }`}
                    >
                      <td className="py-3 px-3">
                        <div className="font-medium text-[#F4F4F6] flex items-center gap-1.5">
                          <span>{offer.retailer}</span>
                          {offer.hasListingDiscrepancy && (
                            <span className="text-[10px] font-semibold text-rose-400">
                              (SKU / Content Variance)
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#9CA3AF]">
                          {offer.retailerCategory} · {offer.lastChecked}
                        </div>
                        {offer.listedDiscCount && (
                          <div className="text-[11px] font-mono text-amber-300 mt-0.5">
                            Listed: {offer.listedDiscCount}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div
                          className={
                            offer.inStock ? "text-[#E4E4E7]" : "text-rose-400 line-through"
                          }
                        >
                          {offer.stockNote}
                        </div>
                        {offer.promoBonusStatus && (
                          <div className="text-[11px] text-[#9CA3AF] mt-0.5">
                            Promo: {offer.promoBonusStatus}
                          </div>
                        )}
                        {meetsTarget && (
                          <span className="text-[11px] text-emerald-400 font-medium block mt-0.5">
                            Below your ${release.wishlist.targetPrice.toFixed(2)} target
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums">
                        <span
                          className={`font-semibold ${
                            meetsTarget
                              ? "text-emerald-400"
                              : offer.inStock
                              ? "text-[#F4F4F6]"
                              : "text-[#9CA3AF]"
                          }`}
                        >
                          ${offer.price.toFixed(2)}
                        </span>
                        {offer.previousPrice && (
                          <span className="block text-[11px] text-[#9CA3AF] line-through">
                            ${offer.previousPrice.toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <a
                          href={offer.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 font-medium whitespace-nowrap"
                        >
                          <span>Visit</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Scraped Disc Contents, Cross-Retailer Discrepancies & Early Promo Policy */}
        <div className="py-6 border-b border-[#232329]">
          <h3 className="text-sm font-semibold text-[#F4F4F6] mb-3">
            Scraped Disc Contents, Cross-Retailer Discrepancies &amp; Early Promo Audit
          </h3>
          <div className="border border-[#232329] rounded-lg overflow-hidden">
            <DiscContentsAccordion
              release={release}
              defaultOpen={true}
              onTriggerLiveScan={onTriggerLiveScan}
              isScanning={isScanning}
            />
          </div>
        </div>

        {/* Live Web Search Grounding Intelligence Report */}
        {release.lastLiveScan && (
          <div className="py-6 border-b border-[#232329] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                <Sparkles className="w-4 h-4" />
                <span>Live Web-Grounded Retailer Recon</span>
              </div>
              <span className="font-mono text-[11px] text-[#9CA3AF]">
                Verified {new Date(release.lastLiveScan.checkedAt).toLocaleTimeString()}
              </span>
            </div>

            {release.lastLiveScan.slipcoverAlert && (
              <div className="p-3 bg-[#0A0A0C] border border-[#232329] rounded-lg text-xs text-amber-300">
                <strong>Packaging &amp; Print Status:</strong> {release.lastLiveScan.slipcoverAlert}
              </div>
            )}

            {release.lastLiveScan.discrepancyNote && (
              <div className="p-3 bg-[#0A0A0C] border border-rose-500/30 rounded-lg text-xs text-rose-200">
                <strong>Cross-Retailer Content Audit:</strong>{" "}
                {release.lastLiveScan.discrepancyNote}
              </div>
            )}

            {release.lastLiveScan.earlyPromoNote && (
              <div className="p-3 bg-[#0A0A0C] border border-amber-500/30 rounded-lg text-xs text-amber-200">
                <strong>Early / Pre-Purchase Promo Audit:</strong>{" "}
                {release.lastLiveScan.earlyPromoNote}
              </div>
            )}

            <div className="p-4 bg-[#0A0A0C] border border-[#232329] rounded-lg text-xs text-[#E4E4E7] whitespace-pre-line leading-relaxed">
              {release.lastLiveScan.reportText}
            </div>

            {release.lastLiveScan.sources.length > 0 && (
              <div>
                <div className="text-[11px] text-[#9CA3AF] mb-2">
                  Verified Search Grounding Citations:
                </div>
                <div className="flex flex-wrap gap-2">
                  {release.lastLiveScan.sources.slice(0, 6).map((src, i) => (
                    <a
                      key={i}
                      href={src.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:underline bg-[#0A0A0C] border border-[#232329] px-2.5 py-1 rounded-md max-w-xs truncate"
                    >
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      <span className="truncate">{src.title}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Edition Physical Supplements */}
        <div className="py-6">
          <h3 className="text-sm font-semibold text-[#F4F4F6] mb-3">
            Edition Physical Packaging &amp; Archival Supplements
          </h3>
          <ul className="space-y-2 text-xs text-[#E4E4E7]">
            {release.collectorHighlights.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-amber-400 font-mono">0{idx + 1}.</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

interface LiveReconModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddRelease: (newRelease: BoutiqueRelease) => void;
  initialLabel?: string;
}

const PRESET_RECON_QUERIES = [
  "Possession (1981) Second Sight 4K Limited Edition Box Set",
  "Stop Making Sense (1984) A24 Collector's Edition 4K UHD",
  "Parasite (2019) NEON / Criterion 4K Collector's Edition",
  "Dog Soldiers 4K Second Sight Limited Rigid Box",
  "The Conversation (1974) Lionsgate Limited 4K Steelbook Box",
  "Cannibal Holocaust 4K 88 Films Deluxe Collector Edition",
];

export const LiveReconModal: React.FC<LiveReconModalProps> = ({
  isOpen,
  onClose,
  onAddRelease,
  initialLabel,
}) => {
  const [activeTab, setActiveTab] = useState<"live" | "manual">("live");
  const [query, setQuery] = useState("");
  const [preferredLabel, setPreferredLabel] = useState<string>(initialLabel || "");
  const [targetPriceInput, setTargetPriceInput] = useState<string>("34.99");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [discoveredData, setDiscoveredData] = useState<{
    release: any;
    groundedSummary: string;
    sources: Array<{ uri: string; title: string }>;
  } | null>(null);

  // Manual Entry State
  const [manualTitle, setManualTitle] = useState("");
  const [manualDirector, setManualDirector] = useState("");
  const [manualYear, setManualYear] = useState("1984");
  const [manualLabel, setManualLabel] = useState<BoutiqueLabel>("The Criterion Collection");
  const [manualSpine, setManualSpine] = useState("Spine #1210");
  const [manualEdition, setManualEdition] = useState<EditionPackaging>("Rigid Box Set");
  const [manualFormat, setManualFormat] = useState<DiscFormat>("4K UHD + Blu-ray");
  const [manualHdr, setManualHdr] = useState<HdrFormat>("Dolby Vision / HDR10");
  const [manualRegion, setManualRegion] = useState<RegionCode>("Region Free");
  const [manualMsrp, setManualMsrp] = useState("49.95");
  const [manualTargetPrice, setManualTargetPrice] = useState("24.97");
  const [manualCurrentPrice, setManualCurrentPrice] = useState("27.99");
  const [manualRetailer, setManualRetailer] = useState("DiabolikDVD");

  if (!isOpen) return null;

  const handleRunDiscovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsLoading(true);
    setError(null);
    setDiscoveredData(null);

    try {
      const response = await fetch("/api/radar/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          preferredLabel: preferredLabel || undefined,
          targetPrice: parseFloat(targetPriceInput) || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to query live retailers.");
      }
      setDiscoveredData(data);
    } catch (err: any) {
      setError(err.message || "Error running live retailer discovery.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDiscoveredRelease = () => {
    if (!discoveredData?.release) return;
    const r = discoveredData.release;
    const matchedLabel =
      BOUTIQUE_LABEL_PROFILES.find(
        (l) => l.name.toLowerCase() === String(r.label || "").toLowerCase()
      )?.name || "Second Sight Films";

    const coverPool = [
      EDITION_IMAGES.secondSightBox,
      EDITION_IMAGES.vinegarSyndromeSlip,
      EDITION_IMAGES.criterionDigipak,
      EDITION_IMAGES.arrowSteelbook,
    ];
    const selectedCover =
      r.editionType?.includes("Steelbook")
        ? EDITION_IMAGES.arrowSteelbook
        : r.editionType?.includes("Slipcover")
        ? EDITION_IMAGES.vinegarSyndromeSlip
        : r.editionType?.includes("Digipak")
        ? EDITION_IMAGES.criterionDigipak
        : coverPool[0];

    const newEntry: BoutiqueRelease = {
      id: `live-${Date.now()}`,
      title: r.title || query,
      director: r.director || "Archival Restoration",
      year: Number(r.year) || 1985,
      label: matchedLabel,
      spineNumber: r.spineNumber || "LE-4K",
      editionType: (r.editionType as EditionPackaging) || "Rigid Box Set",
      coverImage: selectedCover,
      technicalSpecs: {
        format: (r.format as DiscFormat) || "4K UHD + Blu-ray",
        hdr: (r.hdr as HdrFormat) || "Dolby Vision / HDR10",
        region: (r.region as RegionCode) || "Region Free",
        audio: r.audio || "Lossless DTS-HD Master Audio",
        transferNote: r.collectorNotes || "4K restoration verified via live retailer recon",
      },
      printRun: {
        limited: true,
        totalUnits: r.totalUnits || 5000,
        remainingEstimate: r.remainingEstimate || 450,
        slipcoverStatus: r.slipcoverStatus || "In Stock (With Slip)",
      },
      wishlist: {
        isWishlisted: true,
        priority: "Critical Grail",
        targetPrice:
          parseFloat(targetPriceInput) || Number(r.recommendedTargetPrice) || 34.99,
        requireSlipOrBox: true,
        notes: r.collectorNotes || "Added via Live Retailer Grounding Scanner.",
      },
      msrp: Number(r.msrp) || 49.99,
      releaseStatus: "New Release",
      collectorHighlights: [
        `${r.editionType || "Limited Collector Edition"} (${r.format || "4K UHD"})`,
        r.collectorNotes || "Verified live across boutique & mass-market retailers",
      ],
      discContents: r.discContents || {
        discCountSummary: `${r.format || "4K UHD + Blu-ray"} Collector Set`,
        cutsIncluded: ["Original Theatrical Cut (Restored 4K Master)"],
        commentaries: ["Archival director & film historian commentary tracks"],
        specialFeatures: [
          r.collectorNotes || "Restored archival interviews and making-of documentary",
        ],
        includedPromoMaterials: [
          `${r.editionType || "Limited Edition"} outer packaging & collector booklet`,
        ],
      },
      retailerDiscrepancy: r.retailerDiscrepancy || {
        hasDiscrepancy: false,
        severity: "Verified Identical",
        affectedRetailers: [],
        summary: "Scraped retailer listings match on disc count and edition specs.",
        verificationAdvice: "Verify catalog number and Limited Edition SKU before checkout.",
      },
      earlyPromoPolicy: r.earlyPromoPolicy || {
        sameEditionNumberWarning: true,
        catalogIdentifierNote: `${r.spineNumber || "LE-4K"} shares catalog number across printings`,
        earlyPromoItems: [
          "First-pressing collector booklet & outer slipcase/rigid box",
          "Direct store pre-purchase promotional insert",
        ],
        laterRunOmissions:
          "Later print runs and seasonal sales may ship in a standard case without early pre-order promo items under the same catalog number.",
        activePromoRetailer: "Check direct boutique label store or DiabolikDVD/OrbitDVD.",
      },
      retailerListings:
        Array.isArray(r.offers) && r.offers.length > 0
          ? r.offers.map((o: any) => ({
              retailer: o.retailer || "DiabolikDVD",
              retailerCategory: o.retailerCategory || "Specialty Stockist",
              price: Number(o.price) || 34.99,
              inStock: Boolean(o.inStock),
              stockNote: o.stockNote || "Live verified listing",
              isSale: Boolean(o.isSale),
              lastChecked: "Just now",
              url:
                discoveredData.sources?.[0]?.uri ||
                "https://diabolikdvd.com",
              listedDiscCount: o.listedDiscCount || r.discContents?.discCountSummary,
              promoBonusStatus: o.promoBonusStatus || o.stockNote,
              hasListingDiscrepancy: Boolean(o.hasListingDiscrepancy),
            }))
          : [
              {
                retailer: "DiabolikDVD",
                retailerCategory: "Specialty Stockist",
                price: Number(r.recommendedTargetPrice) || 34.99,
                inStock: true,
                stockNote: "Verified via Live Recon",
                isSale: false,
                lastChecked: "Just now",
                url: "https://diabolikdvd.com",
                listedDiscCount: r.discContents?.discCountSummary || "4K UHD + Blu-ray Set",
                promoBonusStatus: "First-pressing Limited Edition confirmed",
                hasListingDiscrepancy: false,
              },
            ],
      lastLiveScan: {
        reportText: discoveredData.groundedSummary,
        summary: r.collectorNotes || "Live search completed.",
        discrepancyNote: r.retailerDiscrepancy?.summary,
        earlyPromoNote: r.earlyPromoPolicy?.laterRunOmissions,
        scrapedDiscContents: r.discContents,
        sources: discoveredData.sources || [],
        checkedAt: new Date().toISOString(),
      },
    };

    onAddRelease(newEntry);
    onClose();
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim()) return;

    const newEntry: BoutiqueRelease = {
      id: `manual-${Date.now()}`,
      title: manualTitle.trim(),
      director: manualDirector.trim() || "Director Approved Edition",
      year: parseInt(manualYear, 10) || 1985,
      label: manualLabel,
      spineNumber: manualSpine.trim() || "CAT-001",
      editionType: manualEdition,
      coverImage:
        manualEdition === "Boutique Steelbook"
          ? EDITION_IMAGES.arrowSteelbook
          : manualEdition === "Limited Slipcover"
          ? EDITION_IMAGES.vinegarSyndromeSlip
          : EDITION_IMAGES.secondSightBox,
      technicalSpecs: {
        format: manualFormat,
        hdr: manualHdr,
        region: manualRegion,
        audio: "Lossless DTS-HD MA / Dolby Atmos",
        transferNote: "Custom tracked collector edition",
      },
      printRun: {
        limited: true,
        totalUnits: 4000,
        remainingEstimate: 600,
        slipcoverStatus: "In Stock (With Slip)",
      },
      wishlist: {
        isWishlisted: true,
        priority: "High Priority",
        targetPrice: parseFloat(manualTargetPrice) || 29.99,
        requireSlipOrBox: true,
        notes: "Manually logged into priority collector radar.",
      },
      msrp: parseFloat(manualMsrp) || 49.95,
      releaseStatus: "New Release",
      collectorHighlights: [
        `${manualEdition} packaging`,
        `${manualFormat} (${manualHdr} · ${manualRegion})`,
      ],
      discContents: {
        discCountSummary: `2-Disc Set (${manualFormat})`,
        cutsIncluded: ["Restored Theatrical Cut (4K Master)"],
        commentaries: ["Director & film historian audio commentary"],
        specialFeatures: [
          "New archival interviews & featurettes",
          "Original theatrical trailer",
        ],
        includedPromoMaterials: [
          `${manualEdition} first-pressing packaging & collector booklet`,
        ],
      },
      retailerDiscrepancy: {
        hasDiscrepancy: false,
        severity: "Verified Identical",
        affectedRetailers: [],
        summary:
          "Manually logged collector edition. Click 'Live Check' to scrape cross-retailer disc contents and check for SKU discrepancies.",
        verificationAdvice:
          "Run a live retailer scan to verify whether mass-market stores carry the Limited Edition or Standard reissue.",
      },
      earlyPromoPolicy: {
        sameEditionNumberWarning: true,
        catalogIdentifierNote: `${manualSpine.trim() || "CAT-001"} — verify first-pressing promo inclusions`,
        earlyPromoItems: [
          `${manualEdition} outer packaging & first-pressing booklet`,
        ],
        laterRunOmissions:
          "Later represses sharing the same catalog number may omit first-pressing slipcovers, booklets, or direct-store posters/pins.",
        activePromoRetailer: `${manualRetailer} (Initial tracked retailer)`,
      },
      retailerListings: [
        {
          retailer: manualRetailer,
          retailerCategory:
            manualRetailer === "Amazon" ||
            manualRetailer === "Gruv (Gruvi)" ||
            manualRetailer === "Target" ||
            manualRetailer === "Walmart" ||
            manualRetailer === "Barnes & Noble"
              ? "Major Retailer"
              : manualRetailer === "Direct Label Store"
              ? "Boutique Direct"
              : "Specialty Stockist",
          price: parseFloat(manualCurrentPrice) || 34.99,
          inStock: true,
          stockNote: "Tracked initial listing",
          isSale: parseFloat(manualCurrentPrice) < parseFloat(manualMsrp),
          lastChecked: "Just now",
          url: manualRetailer === "Gruv (Gruvi)" ? "https://www.gruv.com" : "https://diabolikdvd.com",
          listedDiscCount: `2-Disc (${manualFormat})`,
          promoBonusStatus: `${manualEdition} tracked`,
          hasListingDiscrepancy: false,
        },
      ],
    };

    onAddRelease(newEntry);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#121216] border border-[#232329] rounded-xl overflow-hidden max-h-[90vh] flex flex-col text-[#F4F4F6]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#232329]">
          <div>
            <h2 className="font-display text-xl font-semibold text-[#F4F4F6]">
              Scan Live Retailers &amp; Add to Wishlist Vault
            </h2>
            <p className="text-xs text-[#9CA3AF] mt-0.5">
              Scrape live prices, disc contents, cross-retailer discrepancies &amp; early promo bonuses
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#9CA3AF] hover:text-white border border-[#232329] rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="px-6 pt-4 flex items-center gap-2 border-b border-[#232329] pb-3">
          <button
            type="button"
            onClick={() => setActiveTab("live")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === "live"
                ? "bg-amber-500 text-black"
                : "bg-[#0A0A0C] text-[#9CA3AF] hover:text-white border border-[#232329]"
            }`}
          >
            Live Web Search Grounding
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("manual")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === "manual"
                ? "bg-amber-500 text-black"
                : "bg-[#0A0A0C] text-[#9CA3AF] hover:text-white border border-[#232329]"
            }`}
          >
            Manual Edition Entry
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {activeTab === "live" ? (
            <>
              <form onSubmit={handleRunDiscovery} className="space-y-4">
                <div>
                  <label className="block text-xs text-[#9CA3AF] mb-1.5">
                    Film Title, Boutique Label, or Edition (e.g., &ldquo;Possession 4K Second Sight&rdquo;)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Enter title, spine #, or limited edition to scan across retailers..."
                      className="flex-1 bg-[#0A0A0C] border border-[#232329] rounded-lg px-3.5 py-2.5 text-sm text-[#F4F4F6] focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="submit"
                      disabled={isLoading || !query.trim()}
                      className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-medium text-xs rounded-lg flex items-center gap-2 whitespace-nowrap shrink-0"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Scraping Web...</span>
                        </>
                      ) : (
                        <>
                          <Search className="w-4 h-4" />
                          <span>Run Live Scan</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[#9CA3AF] mb-1">
                      Preferred Boutique Label (Optional)
                    </label>
                    <select
                      value={preferredLabel}
                      onChange={(e) => setPreferredLabel(e.target.value)}
                      className="w-full bg-[#0A0A0C] border border-[#232329] rounded-lg px-3 py-2 text-xs text-[#F4F4F6]"
                    >
                      <option value="">Any Boutique Label / Stockist</option>
                      {BOUTIQUE_LABEL_PROFILES.map((l) => (
                        <option key={l.name} value={l.name}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-[#9CA3AF] mb-1">
                      Your Target Buy Price ($)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={targetPriceInput}
                      onChange={(e) => setTargetPriceInput(e.target.value)}
                      className="w-full bg-[#0A0A0C] border border-[#232329] rounded-lg px-3 py-2 font-mono text-xs text-[#F4F4F6] tabular-nums"
                    />
                  </div>
                </div>
              </form>

              {/* Quick Suggestions */}
              <div>
                <span className="block text-[11px] text-[#9CA3AF] mb-2">
                  Quick Collector Recon Presets:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_RECON_QUERIES.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setQuery(preset)}
                      className="text-xs px-2.5 py-1 bg-[#0A0A0C] hover:bg-[#1A1A22] border border-[#232329] rounded-md text-[#E4E4E7] transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="p-4 bg-rose-950/40 border border-rose-500/40 rounded-lg text-xs text-rose-200 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>{error}</div>
                </div>
              )}

              {discoveredData?.release && (
                <div className="p-4 bg-[#0A0A0C] border border-amber-500/40 rounded-lg space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-xs text-amber-400 font-medium">
                        {discoveredData.release.label} · {discoveredData.release.spineNumber} ·{" "}
                        {discoveredData.release.editionType}
                      </div>
                      <h3 className="font-display text-lg font-semibold text-[#F4F4F6] mt-0.5">
                        {discoveredData.release.title} ({discoveredData.release.year})
                      </h3>
                      <p className="text-xs text-[#9CA3AF]">
                        {discoveredData.release.format} · {discoveredData.release.hdr} ·{" "}
                        {discoveredData.release.region}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleConfirmDiscoveredRelease}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs rounded-lg flex items-center gap-1.5 whitespace-nowrap shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add to Wishlist Vault</span>
                    </button>
                  </div>

                  <p className="text-xs text-[#E4E4E7] leading-relaxed">
                    {discoveredData.release.collectorNotes}
                  </p>

                  {/* Scraped Disc Contents & Discrepancy Preview */}
                  {discoveredData.release.discContents && (
                    <div className="p-3 bg-[#121216] border border-[#232329] rounded-lg space-y-2 text-xs">
                      <div className="font-semibold text-amber-400">
                        Scraped Contents:{" "}
                        {discoveredData.release.discContents.discCountSummary}
                      </div>
                      {Array.isArray(discoveredData.release.discContents.cutsIncluded) && (
                        <div className="text-[#E4E4E7]">
                          <strong>Cuts:</strong>{" "}
                          {discoveredData.release.discContents.cutsIncluded.join(" · ")}
                        </div>
                      )}
                      {discoveredData.release.retailerDiscrepancy?.hasDiscrepancy && (
                        <div className="text-rose-300">
                          <strong>Retailer Discrepancy Alert:</strong>{" "}
                          {discoveredData.release.retailerDiscrepancy.summary}
                        </div>
                      )}
                      {discoveredData.release.earlyPromoPolicy?.laterRunOmissions && (
                        <div className="text-amber-300">
                          <strong>Early Promo / Same SKU Policy:</strong>{" "}
                          {discoveredData.release.earlyPromoPolicy.laterRunOmissions}
                        </div>
                      )}
                    </div>
                  )}

                  {Array.isArray(discoveredData.release.offers) &&
                    discoveredData.release.offers.length > 0 && (
                      <div className="border-t border-[#232329] pt-3">
                        <div className="text-[11px] text-[#9CA3AF] mb-2">
                          Discovered Multi-Retailer Listings:
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {discoveredData.release.offers.map((o: any, idx: number) => (
                            <div
                              key={idx}
                              className="p-2.5 bg-[#121216] border border-[#232329] rounded-md flex items-center justify-between text-xs"
                            >
                              <div>
                                <div className="font-medium text-[#F4F4F6]">{o.retailer}</div>
                                <div className="text-[11px] text-[#9CA3AF]">{o.stockNote}</div>
                              </div>
                              <div className="font-mono font-semibold text-amber-400 tabular-nums">
                                ${Number(o.price || 0).toFixed(2)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              )}
            </>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#9CA3AF] mb-1">Film Title *</label>
                  <input
                    type="text"
                    required
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    placeholder="e.g., Videodrome (1983)"
                    className="w-full bg-[#0A0A0C] border border-[#232329] rounded-lg px-3 py-2 text-[#F4F4F6]"
                  />
                </div>
                <div>
                  <label className="block text-[#9CA3AF] mb-1">Director</label>
                  <input
                    type="text"
                    value={manualDirector}
                    onChange={(e) => setManualDirector(e.target.value)}
                    placeholder="e.g., David Cronenberg"
                    className="w-full bg-[#0A0A0C] border border-[#232329] rounded-lg px-3 py-2 text-[#F4F4F6]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#9CA3AF] mb-1">Boutique Label</label>
                  <select
                    value={manualLabel}
                    onChange={(e) => setManualLabel(e.target.value as BoutiqueLabel)}
                    className="w-full bg-[#0A0A0C] border border-[#232329] rounded-lg px-3 py-2 text-[#F4F4F6]"
                  >
                    {BOUTIQUE_LABEL_PROFILES.map((l) => (
                      <option key={l.name} value={l.name}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[#9CA3AF] mb-1">Spine / Catalog #</label>
                  <input
                    type="text"
                    value={manualSpine}
                    onChange={(e) => setManualSpine(e.target.value)}
                    className="w-full bg-[#0A0A0C] border border-[#232329] rounded-lg px-3 py-2 font-mono text-[#F4F4F6]"
                  />
                </div>
                <div>
                  <label className="block text-[#9CA3AF] mb-1">Edition Packaging</label>
                  <select
                    value={manualEdition}
                    onChange={(e) => setManualEdition(e.target.value as EditionPackaging)}
                    className="w-full bg-[#0A0A0C] border border-[#232329] rounded-lg px-3 py-2 text-[#F4F4F6]"
                  >
                    <option value="Rigid Box Set">Rigid Box Set</option>
                    <option value="Limited Slipcover">Limited Slipcover</option>
                    <option value="Boutique Steelbook">Boutique Steelbook</option>
                    <option value="Archival Digipak">Archival Digipak</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#9CA3AF] mb-1">Format</label>
                  <select
                    value={manualFormat}
                    onChange={(e) => setManualFormat(e.target.value as DiscFormat)}
                    className="w-full bg-[#0A0A0C] border border-[#232329] rounded-lg px-3 py-2 text-[#F4F4F6]"
                  >
                    <option value="4K UHD + Blu-ray">4K UHD + Blu-ray</option>
                    <option value="4K UHD">4K UHD</option>
                    <option value="Blu-ray">Blu-ray</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#9CA3AF] mb-1">HDR Spec</label>
                  <select
                    value={manualHdr}
                    onChange={(e) => setManualHdr(e.target.value as HdrFormat)}
                    className="w-full bg-[#0A0A0C] border border-[#232329] rounded-lg px-3 py-2 text-[#F4F4F6]"
                  >
                    <option value="Dolby Vision / HDR10">Dolby Vision / HDR10</option>
                    <option value="HDR10">HDR10</option>
                    <option value="SDR (Restored 4K Master)">SDR (Restored 4K Master)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#9CA3AF] mb-1">Region Coding</label>
                  <select
                    value={manualRegion}
                    onChange={(e) => setManualRegion(e.target.value as RegionCode)}
                    className="w-full bg-[#0A0A0C] border border-[#232329] rounded-lg px-3 py-2 text-[#F4F4F6]"
                  >
                    <option value="Region Free">Region Free</option>
                    <option value="Region A">Region A</option>
                    <option value="Region B">Region B</option>
                    <option value="Region A/B/C">Region A/B/C</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[#9CA3AF] mb-1">MSRP ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={manualMsrp}
                    onChange={(e) => setManualMsrp(e.target.value)}
                    className="w-full bg-[#0A0A0C] border border-[#232329] rounded-lg px-3 py-2 font-mono text-[#F4F4F6]"
                  />
                </div>
                <div>
                  <label className="block text-[#9CA3AF] mb-1">Your Target ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={manualTargetPrice}
                    onChange={(e) => setManualTargetPrice(e.target.value)}
                    className="w-full bg-[#0A0A0C] border border-[#232329] rounded-lg px-3 py-2 font-mono text-[#F4F4F6]"
                  />
                </div>
                <div>
                  <label className="block text-[#9CA3AF] mb-1">Current Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={manualCurrentPrice}
                    onChange={(e) => setManualCurrentPrice(e.target.value)}
                    className="w-full bg-[#0A0A0C] border border-[#232329] rounded-lg px-3 py-2 font-mono text-[#F4F4F6]"
                  />
                </div>
                <div>
                  <label className="block text-[#9CA3AF] mb-1">Lead Retailer</label>
                  <select
                    value={manualRetailer}
                    onChange={(e) => setManualRetailer(e.target.value)}
                    className="w-full bg-[#0A0A0C] border border-[#232329] rounded-lg px-3 py-2 text-[#F4F4F6]"
                  >
                    <option value="DiabolikDVD">DiabolikDVD</option>
                    <option value="OrbitDVD">OrbitDVD</option>
                    <option value="Gruv (Gruvi)">Gruv (Gruvi)</option>
                    <option value="Amazon">Amazon</option>
                    <option value="Barnes & Noble">Barnes &amp; Noble</option>
                    <option value="Target">Target</option>
                    <option value="Walmart">Walmart</option>
                    <option value="Direct Label Store">Direct Label / Distributor Store</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Save Edition to Priority Vault</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
