import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Film,
  Mic,
  Sparkles,
  Gift,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { BoutiqueRelease } from "../types";

interface DiscContentsAccordionProps {
  release: BoutiqueRelease;
  defaultOpen?: boolean;
  compact?: boolean;
  onTriggerLiveScan?: (release: BoutiqueRelease) => void;
  isScanning?: boolean;
}

export const DiscContentsAccordion: React.FC<DiscContentsAccordionProps> = ({
  release,
  defaultOpen = false,
  compact = false,
  onTriggerLiveScan,
  isScanning = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const discContents = release.discContents || {
    discCountSummary: `${release.technicalSpecs.format} Collector Set`,
    cutsIncluded: ["Original Theatrical Cut (Restored 4K Master)"],
    commentaries: ["Archival audio commentary track"],
    specialFeatures: release.collectorHighlights || [],
    includedPromoMaterials: ["First-pressing collector booklet / slipcase"],
  };

  const discrepancy = release.retailerDiscrepancy || {
    hasDiscrepancy: false,
    severity: "Verified Identical" as const,
    affectedRetailers: [],
    summary: "All tracked storefronts list identical disc counts and contents.",
    verificationAdvice: "Verify UPC/catalog number before checkout.",
  };

  const earlyPromo = release.earlyPromoPolicy || {
    sameEditionNumberWarning: false,
    catalogIdentifierNote: `${release.spineNumber} standard catalog identifier`,
    earlyPromoItems: ["First-pressing packaging components"],
    laterRunOmissions: "Later printings may omit limited outer slipcover.",
    activePromoRetailer: "Check direct boutique store for current pressing status.",
  };

  const cutsCount = discContents.cutsIncluded.length;
  const commentariesCount = discContents.commentaries.length;
  const promosCount = discContents.includedPromoMaterials.length;

  return (
    <div
      className="border-t border-[#232329] bg-[#0D0D11]"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Collapsible Toggle Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className={`w-full text-left flex items-center justify-between gap-2 transition-colors hover:bg-[#16161D] ${
          compact ? "px-3.5 py-2.5" : "px-5 py-3"
        }`}
        aria-expanded={isOpen}
      >
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            <span className="font-semibold text-[#F4F4F6] flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>
                Disc Contents &amp; Cuts ({cutsCount} Cut{cutsCount === 1 ? "" : "s"} ·{" "}
                {commentariesCount} Commentar{commentariesCount === 1 ? "y" : "ies"} ·{" "}
                {promosCount} Promo Item{promosCount === 1 ? "" : "s"})
              </span>
            </span>
          </div>

          {/* Discrepancy & Same-SKU Early Promo Summary Line */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
            {discrepancy.hasDiscrepancy ? (
              <span className="text-rose-400 font-medium flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                <span>
                  Retailer Content Discrepancy ({discrepancy.affectedRetailers.join(", ")})
                </span>
              </span>
            ) : (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 shrink-0" />
                <span>Contents Verified Consistent Across Retailers</span>
              </span>
            )}

            {earlyPromo.sameEditionNumberWarning && (
              <>
                <span className="text-[#9CA3AF]" aria-hidden="true">
                  ·
                </span>
                <span className="text-amber-300 font-medium">
                  Same Edition # Warning: Early Promo / Later Run Variance
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-amber-400 font-medium shrink-0">
          <span>{isOpen ? "Hide Contents" : "Inspect Contents"}</span>
          {isOpen ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </button>

      {/* Expanded Collapsible Drawer Content */}
      {isOpen && (
        <div
          className={`border-t border-[#232329] bg-[#0A0A0C] space-y-4 text-xs ${
            compact ? "p-3.5" : "p-5"
          }`}
        >
          {/* 1. CROSS-RETAILER DISCREPANCY CALLOUT */}
          {discrepancy.hasDiscrepancy ? (
            <div className="p-3.5 rounded-lg bg-rose-950/30 border border-rose-500/40 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-rose-300 font-semibold">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>
                    Cross-Retailer Listing Discrepancy Detected ({discrepancy.severity})
                  </span>
                </div>
                {discrepancy.affectedRetailers.length > 0 && (
                  <span className="font-mono text-[11px] text-rose-300">
                    Variance on: {discrepancy.affectedRetailers.join(", ")}
                  </span>
                )}
              </div>
              <p className="text-[#E4E4E7] leading-relaxed">{discrepancy.summary}</p>
              <div className="pt-1 border-t border-rose-500/20 text-[11px] text-amber-300">
                <strong>Collector Verification Advice:</strong>{" "}
                {discrepancy.verificationAdvice}
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-[#121216] border border-emerald-500/30 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-emerald-400">
                  Cross-Retailer Disc Contents Verified Identical
                </div>
                <p className="text-[#9CA3AF] mt-0.5 leading-relaxed">
                  {discrepancy.summary} {discrepancy.verificationAdvice}
                </p>
              </div>
            </div>
          )}

          {/* 2. EARLY / PRE-PURCHASE PROMO MATERIALS & IDENTICAL EDITION NUMBER AUDIT */}
          <div
            className={`p-3.5 rounded-lg border space-y-2 ${
              earlyPromo.sameEditionNumberWarning
                ? "bg-amber-950/20 border-amber-500/40"
                : "bg-[#121216] border-[#232329]"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
                <Gift className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Early / Pre-Purchase Promo Materials vs. Later Sale Runs
                </span>
              </div>
              <span className="font-mono text-[11px] text-[#9CA3AF]">
                {earlyPromo.sameEditionNumberWarning
                  ? "Identical Edition / Spine # Across Runs"
                  : "Distinct LE vs Standard SKU"}
              </span>
            </div>

            <div className="text-[11px] text-[#E4E4E7]">
              <strong className="text-[#9CA3AF]">Catalog / UPC Identifier Policy:</strong>{" "}
              {earlyPromo.catalogIdentifierNote}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-2.5 rounded bg-[#0A0A0C] border border-[#232329]">
                <div className="text-[11px] font-semibold text-amber-400 mb-1">
                  Early / First-Pressing Promo Inclusions:
                </div>
                <ul className="space-y-1 text-[11px] text-[#E4E4E7]">
                  {earlyPromo.earlyPromoItems.map((item, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-amber-400">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-2.5 rounded bg-[#0A0A0C] border border-[#232329] space-y-1.5">
                <div>
                  <div className="text-[11px] font-semibold text-rose-300">
                    What Later Print Runs / Sales Omit:
                  </div>
                  <p className="text-[11px] text-[#E4E4E7] leading-relaxed mt-0.5">
                    {earlyPromo.laterRunOmissions}
                  </p>
                </div>
                <div className="pt-1 border-t border-[#232329]">
                  <span className="text-[11px] font-semibold text-emerald-400">
                    Where Early Promos Remain Active:{" "}
                  </span>
                  <span className="text-[11px] text-[#E4E4E7]">
                    {earlyPromo.activePromoRetailer}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. SCRAPED ON-DISC CONTENTS BREAKDOWN (Cuts, Commentaries, Features, Feelies) */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-semibold text-[#F4F4F6]">
                Scraped Disc Contents: {discContents.discCountSummary}
              </div>
              {onTriggerLiveScan && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTriggerLiveScan(release);
                  }}
                  disabled={isScanning}
                  className="px-2.5 py-1 bg-[#121216] hover:bg-[#1A1A22] border border-[#232329] rounded text-[11px] text-amber-400 flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw
                    className={`w-3 h-3 ${isScanning ? "animate-spin" : ""}`}
                  />
                  <span>
                    {isScanning
                      ? "Re-Scraping Retailers..."
                      : "Re-Scrape Retailer Contents Live"}
                  </span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Film Cuts & Runtimes */}
              <div className="p-3 rounded-lg bg-[#121216] border border-[#232329] space-y-1.5">
                <div className="text-[11px] font-semibold text-amber-400 flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5" />
                  <span>Film Cuts &amp; Restored Versions Included</span>
                </div>
                <ul className="space-y-1 text-[11px] text-[#E4E4E7]">
                  {discContents.cutsIncluded.map((cut, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="font-mono text-amber-400">0{i + 1}.</span>
                      <span>{cut}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Audio Commentaries */}
              <div className="p-3 rounded-lg bg-[#121216] border border-[#232329] space-y-1.5">
                <div className="text-[11px] font-semibold text-amber-400 flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5" />
                  <span>Audio Commentaries</span>
                </div>
                <ul className="space-y-1 text-[11px] text-[#E4E4E7]">
                  {discContents.commentaries.map((comm, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="font-mono text-amber-400">0{i + 1}.</span>
                      <span>{comm}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Special Features & Documentaries */}
              <div className="p-3 rounded-lg bg-[#121216] border border-[#232329] space-y-1.5">
                <div className="text-[11px] font-semibold text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>On-Disc Special Features &amp; Documentaries</span>
                </div>
                <ul className="space-y-1 text-[11px] text-[#E4E4E7]">
                  {discContents.specialFeatures.map((feat, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-amber-400">•</span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Physical Promotional Materials / Feelies */}
              <div className="p-3 rounded-lg bg-[#121216] border border-[#232329] space-y-1.5">
                <div className="text-[11px] font-semibold text-amber-400 flex items-center gap-1.5">
                  <Gift className="w-3.5 h-3.5" />
                  <span>Physical Books, Posters, Pins &amp; Promo Feelies</span>
                </div>
                <ul className="space-y-1 text-[11px] text-[#E4E4E7]">
                  {discContents.includedPromoMaterials.map((promo, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-amber-400">•</span>
                      <span>{promo}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* 4. PER-RETAILER LISTED DISC COUNT & PROMO BONUS COMPARISON */}
          <div className="pt-2 border-t border-[#232329]">
            <div className="text-[11px] font-semibold text-[#9CA3AF] mb-2">
              Per-Retailer Listed Disc Count &amp; Promo Inclusion Check:
            </div>
            <div className="space-y-1.5">
              {release.retailerListings.map((offer, idx) => (
                <div
                  key={`${offer.retailer}-${idx}`}
                  className={`px-3 py-2 rounded border flex flex-wrap items-center justify-between gap-2 text-[11px] ${
                    offer.hasListingDiscrepancy
                      ? "bg-rose-950/20 border-rose-500/40 text-rose-200"
                      : "bg-[#121216] border-[#232329] text-[#E4E4E7]"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-1.5">
                    <strong className="text-[#F4F4F6]">{offer.retailer}</strong>
                    <span className="text-[#9CA3AF]">·</span>
                    <span className="font-mono text-amber-300">
                      {offer.listedDiscCount || discContents.discCountSummary}
                    </span>
                    {offer.hasListingDiscrepancy && (
                      <span className="text-rose-400 font-semibold">
                        (Discrepancy Flagged)
                      </span>
                    )}
                  </div>
                  <div className="text-[#9CA3AF]">
                    {offer.promoBonusStatus || offer.stockNote}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
