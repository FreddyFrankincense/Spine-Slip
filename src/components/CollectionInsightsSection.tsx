import React, { useState, useMemo } from "react";
import * as d3 from "d3";
import { Disc, Bookmark, ArrowUpRight, Layers, CheckCircle2 } from "lucide-react";
import { BoutiqueRelease, OwnedDiscItem } from "../types";
import { assessUpgradeUrgency } from "../utils/upgradeUrgency";

interface CollectionInsightsSectionProps {
  catalog: BoutiqueRelease[];
  ownedDiscs: OwnedDiscItem[];
  ownedByReleaseId: Map<string, OwnedDiscItem>;
  onNavigateToWishlist: () => void;
  onNavigateToUpgrades: () => void;
  onFilterRadarBelowTarget: () => void;
}

interface DonutDatum {
  id: string;
  label: string;
  shortLabel: string;
  value: number;
  color: string;
  hoverColor: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}

export const CollectionInsightsSection: React.FC<CollectionInsightsSectionProps> = ({
  catalog,
  ownedDiscs,
  ownedByReleaseId,
  onNavigateToWishlist,
  onNavigateToUpgrades,
  onFilterRadarBelowTarget,
}) => {
  const [breakdownMode, setBreakdownMode] = useState<"strict" | "detailed">("strict");
  const [hoveredSegmentId, setHoveredSegmentId] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const metrics = useMemo(() => {
    const wishlisted = catalog.filter((r) => r.wishlist.isWishlisted);
    const ownedTotal = ownedDiscs.length;
    const wishlistTotal = wishlisted.length;
    const combinedTotal = ownedTotal + wishlistTotal;

    // Wishlisted sub-metrics
    let wishlistTargetMet = 0;
    let wishlistTotalTargetSpend = 0;
    let wishlistTotalBestSpend = 0;
    let wishlistTotalMsrp = 0;

    wishlisted.forEach((item) => {
      const inStock = item.retailerListings.filter((o) => o.inStock);
      const best =
        inStock.length > 0
          ? inStock.reduce((min, o) => (o.price < min.price ? o : min), inStock[0])
          : item.retailerListings[0];

      const bestPrice = best ? best.price : item.msrp;
      if (best && best.inStock && best.price <= item.wishlist.targetPrice) {
        wishlistTargetMet += 1;
      }
      wishlistTotalTargetSpend += item.wishlist.targetPrice;
      wishlistTotalBestSpend += bestPrice;
      wishlistTotalMsrp += item.msrp;
    });

    const wishlistAboveTarget = Math.max(0, wishlistTotal - wishlistTargetMet);

    // Owned sub-metrics
    const ownedDvdCount = ownedDiscs.filter((d) => d.ownedFormat === "DVD").length;
    const ownedBlurayCount = ownedDiscs.filter((d) => d.ownedFormat === "Blu-ray").length;
    const owned4kCount = ownedDiscs.filter((d) => d.ownedFormat === "4K UHD").length;

    // Overlap: Owned discs that also have a matched boutique upgrade in the catalog
    let matchedUpgradesCount = 0;
    let criticalUpgradesCount = 0;
    catalog.forEach((r) => {
      const owned = ownedByReleaseId.get(r.id);
      if (owned) {
        matchedUpgradesCount += 1;
        const urgency = assessUpgradeUrgency(owned, r);
        if (urgency.totalScore >= 78) {
          criticalUpgradesCount += 1;
        }
      }
    });

    const standaloneOwnedCount = Math.max(0, ownedTotal - matchedUpgradesCount);

    // Wishlist packaging distribution
    const rigidBoxWishlist = wishlisted.filter(
      (r) => r.editionType === "Rigid Box Set"
    ).length;
    const slipcoverWishlist = wishlisted.filter(
      (r) => r.editionType === "Limited Slipcover"
    ).length;
    const steelbookWishlist = wishlisted.filter(
      (r) => r.editionType === "Boutique Steelbook"
    ).length;
    const digipakWishlist = wishlisted.filter(
      (r) => r.editionType === "Archival Digipak"
    ).length;

    return {
      ownedTotal,
      wishlistTotal,
      combinedTotal,
      wishlistTargetMet,
      wishlistAboveTarget,
      wishlistTotalTargetSpend,
      wishlistTotalBestSpend,
      wishlistTotalMsrp,
      ownedDvdCount,
      ownedBlurayCount,
      owned4kCount,
      matchedUpgradesCount,
      criticalUpgradesCount,
      standaloneOwnedCount,
      rigidBoxWishlist,
      slipcoverWishlist,
      steelbookWishlist,
      digipakWishlist,
    };
  }, [catalog, ownedDiscs, ownedByReleaseId]);

  const chartData: DonutDatum[] = useMemo(() => {
    if (breakdownMode === "strict") {
      return [
        {
          id: "owned-total",
          label: "Owned Shelf Discs (CLZ / CSV)",
          shortLabel: "Owned Discs",
          value: metrics.ownedTotal,
          color: "#F59E0B", // Archival Amber
          hoverColor: "#FBBF24",
          description: `${metrics.ownedDvdCount} DVDs & ${metrics.ownedBlurayCount} Blu-rays logged (${metrics.matchedUpgradesCount} queued for 4K boutique upgrade)`,
          actionLabel: "Open Upgrade Shelf",
          onAction: onNavigateToUpgrades,
        },
        {
          id: "wishlist-total",
          label: "Wishlisted Boutique Editions",
          shortLabel: "Wishlisted",
          value: metrics.wishlistTotal,
          color: "#10B981", // Collector Emerald
          hoverColor: "#34D399",
          description: `${metrics.wishlistTargetMet} ready to buy at/below target · ${metrics.wishlistAboveTarget} monitoring price drops`,
          actionLabel: "Open Wishlist Matrix",
          onAction: onNavigateToWishlist,
        },
      ];
    }

    return [
      {
        id: "owned-upgrade-candidates",
        label: "Owned — Queued for 4K Upgrade",
        shortLabel: "Upgrade Queue",
        value: metrics.matchedUpgradesCount,
        color: "#F59E0B", // Amber
        hoverColor: "#FBBF24",
        description: `${metrics.criticalUpgradesCount} critical urgency upgrades from legacy DVD/Blu-ray`,
        actionLabel: "Triage Upgrades",
        onAction: onNavigateToUpgrades,
      },
      {
        id: "owned-unmatched",
        label: "Owned — Unmatched / Standalone",
        shortLabel: "Owned Shelf",
        value: metrics.standaloneOwnedCount,
        color: "#6366F1", // Indigo
        hoverColor: "#818CF8",
        description: "Owned physical discs awaiting live boutique upgrade discovery",
        actionLabel: "View Owned Shelf",
        onAction: onNavigateToUpgrades,
      },
      {
        id: "wishlist-ready",
        label: "Wishlisted — Below Target Price",
        shortLabel: "Ready to Buy",
        value: metrics.wishlistTargetMet,
        color: "#10B981", // Emerald
        hoverColor: "#34D399",
        description: "Wishlisted grails currently at or below your target buy price",
        actionLabel: "Filter Ready Deals",
        onAction: onFilterRadarBelowTarget,
      },
      {
        id: "wishlist-monitoring",
        label: "Wishlisted — Monitoring Target",
        shortLabel: "Watching Price",
        value: metrics.wishlistAboveTarget,
        color: "#0EA5E9", // Sky
        hoverColor: "#38BDF8",
        description: "Wishlisted editions tracked for 50% label sales or restock drops",
        actionLabel: "Manage Targets",
        onAction: onNavigateToWishlist,
      },
    ].filter((d) => d.value > 0);
  }, [
    breakdownMode,
    metrics,
    onNavigateToUpgrades,
    onNavigateToWishlist,
    onFilterRadarBelowTarget,
  ]);

  // D3 Pie & Arc Generators
  const size = 240;
  const outerRadius = 104;
  const innerRadius = 68;

  const pieArcs = useMemo(() => {
    const pieGenerator = d3
      .pie<DonutDatum>()
      .value((d) => d.value)
      .sort(null)
      .padAngle(0.028);

    return pieGenerator(chartData);
  }, [chartData]);

  const baseArcGenerator = useMemo(
    () =>
      d3
        .arc<d3.PieArcDatum<DonutDatum>>()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius)
        .cornerRadius(4),
    []
  );

  const hoverArcGenerator = useMemo(
    () =>
      d3
        .arc<d3.PieArcDatum<DonutDatum>>()
        .innerRadius(innerRadius - 2)
        .outerRadius(outerRadius + 6)
        .cornerRadius(4),
    []
  );

  const activeDatum = useMemo(
    () => chartData.find((d) => d.id === hoveredSegmentId) || null,
    [chartData, hoveredSegmentId]
  );

  const ownedSharePct =
    metrics.combinedTotal > 0
      ? Math.round((metrics.ownedTotal / metrics.combinedTotal) * 100)
      : 0;
  const wishlistSharePct =
    metrics.combinedTotal > 0 ? 100 - ownedSharePct : 0;

  return (
    <section
      aria-label="Collection Insights — Owned vs. Wishlisted Donut Gauge"
      className="bg-[#121216] border border-[#232329] rounded-xl overflow-hidden"
    >
      {/* Top Header Bar */}
      <div className="px-6 py-4 border-b border-[#232329] flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs text-amber-400 font-semibold flex items-center gap-2">
            <Layers className="w-3.5 h-3.5" />
            <span>Collection Insights · D3 Portfolio Telemetry</span>
          </div>
          <h2 className="font-display text-xl font-semibold text-[#F4F4F6] mt-0.5">
            Owned Shelf vs. Priority Wishlist Composition
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isCollapsed && (
            <div className="flex items-center gap-1 p-1 bg-[#0A0A0C] border border-[#232329] rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setBreakdownMode("strict")}
                className={`px-3 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
                  breakdownMode === "strict"
                    ? "bg-amber-500 text-black font-semibold"
                    : "text-[#9CA3AF] hover:text-[#F4F4F6]"
                }`}
              >
                Owned vs. Wishlisted
              </button>
              <button
                type="button"
                onClick={() => setBreakdownMode("detailed")}
                className={`px-3 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
                  breakdownMode === "detailed"
                    ? "bg-amber-500 text-black font-semibold"
                    : "text-[#9CA3AF] hover:text-[#F4F4F6]"
                }`}
              >
                4-Tier Upgrade &amp; Target Split
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="px-3 py-1.5 bg-[#0A0A0C] hover:bg-[#1A1A22] border border-[#232329] rounded-lg text-xs text-[#9CA3AF] hover:text-[#F4F4F6]"
          >
            {isCollapsed ? "Expand Insights" : "Collapse"}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column (5 Cols): Interactive D3 SVG Donut Gauge */}
          <div className="lg:col-span-5 flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center justify-center gap-6 bg-[#0A0A0C] border border-[#232329] rounded-xl p-5">
            <div className="relative shrink-0" style={{ width: size, height: size }}>
              <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                className="overflow-visible"
                role="img"
                aria-label={`Donut chart showing ${metrics.ownedTotal} owned items and ${metrics.wishlistTotal} wishlisted items`}
              >
                <g transform={`translate(${size / 2}, ${size / 2})`}>
                  {/* Subtle Outer Reference Ring */}
                  <circle
                    r={outerRadius + 9}
                    fill="none"
                    stroke="#232329"
                    strokeWidth="1"
                    strokeDasharray="2 4"
                  />

                  {pieArcs.map((arcDatum) => {
                    const isHovered = hoveredSegmentId === arcDatum.data.id;
                    const pathData =
                      (isHovered
                        ? hoverArcGenerator(arcDatum)
                        : baseArcGenerator(arcDatum)) || "";

                    return (
                      <path
                        key={arcDatum.data.id}
                        d={pathData}
                        fill={
                          isHovered
                            ? arcDatum.data.hoverColor
                            : arcDatum.data.color
                        }
                        stroke="#0A0A0C"
                        strokeWidth={2}
                        className="cursor-pointer transition-all duration-150"
                        onMouseEnter={() => setHoveredSegmentId(arcDatum.data.id)}
                        onMouseLeave={() => setHoveredSegmentId(null)}
                        onClick={arcDatum.data.onAction}
                      />
                    );
                  })}
                </g>
              </svg>

              {/* Center Donut Hole Readout */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-6">
                {activeDatum ? (
                  <>
                    <span className="text-[11px] font-medium text-[#9CA3AF] truncate max-w-[120px]">
                      {activeDatum.shortLabel}
                    </span>
                    <span className="font-mono text-2xl font-semibold text-[#F4F4F6] tabular-nums mt-0.5">
                      {activeDatum.value}
                    </span>
                    <span className="font-mono text-xs text-amber-400 tabular-nums">
                      {metrics.combinedTotal > 0
                        ? `${Math.round(
                            (activeDatum.value / metrics.combinedTotal) * 100
                          )}% of vault`
                        : "0%"}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-[11px] text-[#9CA3AF]">
                      Total Tracked
                    </span>
                    <span className="font-mono text-3xl font-semibold text-[#F4F4F6] tabular-nums leading-tight">
                      {metrics.combinedTotal}
                    </span>
                    <span className="font-mono text-[11px] text-[#9CA3AF] tabular-nums mt-0.5">
                      <strong className="text-amber-400">{ownedSharePct}%</strong> Owned ·{" "}
                      <strong className="text-emerald-400">{wishlistSharePct}%</strong> Wish
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Interactive Legend List Next to Donut */}
            <div className="flex-1 w-full space-y-2.5">
              <div className="text-xs font-semibold text-[#F4F4F6] pb-1 border-b border-[#232329]">
                Interactive Segment Breakdown
              </div>
              {chartData.map((segment) => {
                const pct =
                  metrics.combinedTotal > 0
                    ? Math.round((segment.value / metrics.combinedTotal) * 100)
                    : 0;
                const isHovered = hoveredSegmentId === segment.id;

                return (
                  <button
                    key={segment.id}
                    type="button"
                    onMouseEnter={() => setHoveredSegmentId(segment.id)}
                    onMouseLeave={() => setHoveredSegmentId(null)}
                    onClick={segment.onAction}
                    className={`w-full text-left p-2.5 rounded-lg border transition-colors ${
                      isHovered
                        ? "bg-[#16161D] border-amber-500/50"
                        : "bg-[#121216] border-[#232329] hover:border-[#32323C]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-xs shrink-0"
                          style={{ backgroundColor: segment.color }}
                        />
                        <span className="font-medium text-[#F4F4F6] truncate">
                          {segment.label}
                        </span>
                      </div>
                      <span className="font-mono font-semibold text-[#F4F4F6] shrink-0 tabular-nums">
                        {segment.value}{" "}
                        <span className="text-[#9CA3AF] font-normal">({pct}%)</span>
                      </span>
                    </div>
                    <p className="text-[11px] text-[#9CA3AF] mt-1 line-clamp-1">
                      {segment.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column (7 Cols): Owned vs. Wishlisted Deep-Dive Cards & Format Bar */}
          <div className="lg:col-span-7 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Owned Collection Card */}
              <div className="p-4 bg-[#0A0A0C] border border-[#232329] rounded-xl flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-amber-400 font-semibold flex items-center gap-1.5">
                      <Disc className="w-3.5 h-3.5" />
                      <span>Owned Physical Discs</span>
                    </span>
                    <span className="font-mono text-xs text-[#9CA3AF] tabular-nums">
                      {ownedSharePct}% of Portfolio
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <span className="font-mono text-2xl font-semibold text-[#F4F4F6] tabular-nums">
                      {metrics.ownedTotal} Discs
                    </span>
                    <span className="text-xs text-amber-300 font-mono tabular-nums">
                      {metrics.matchedUpgradesCount} Upgrade Matches
                    </span>
                  </div>

                  <div className="text-xs text-[#9CA3AF] pt-1 border-t border-[#232329]">
                    Shelf Format Mix:{" "}
                    <strong className="text-[#E4E4E7] font-mono">
                      {metrics.ownedDvdCount} DVD
                    </strong>{" "}
                    ·{" "}
                    <strong className="text-[#E4E4E7] font-mono">
                      {metrics.ownedBlurayCount} Blu-ray
                    </strong>
                    {metrics.owned4kCount > 0 && (
                      <>
                        {" "}
                        ·{" "}
                        <strong className="text-[#E4E4E7] font-mono">
                          {metrics.owned4kCount} 4K
                        </strong>
                      </>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onNavigateToUpgrades}
                  className="w-full py-2 px-3 bg-[#121216] hover:bg-[#1A1A22] border border-[#232329] rounded-lg text-xs font-medium text-[#E4E4E7] flex items-center justify-between transition-colors"
                >
                  <span>Inspect CLZ / CSV Upgrade Shelf</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
                </button>
              </div>

              {/* Wishlisted Editions Card */}
              <div className="p-4 bg-[#0A0A0C] border border-[#232329] rounded-xl flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>Wishlisted Boutique Editions</span>
                    </span>
                    <span className="font-mono text-xs text-[#9CA3AF] tabular-nums">
                      {wishlistSharePct}% of Portfolio
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <span className="font-mono text-2xl font-semibold text-[#F4F4F6] tabular-nums">
                      {metrics.wishlistTotal} Editions
                    </span>
                    <span className="text-xs text-emerald-400 font-mono tabular-nums flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{metrics.wishlistTargetMet} Below Target</span>
                    </span>
                  </div>

                  <div className="text-xs text-[#9CA3AF] pt-1 border-t border-[#232329]">
                    Best In-Stock Total:{" "}
                    <strong className="text-emerald-400 font-mono tabular-nums">
                      ${metrics.wishlistTotalBestSpend.toFixed(0)}
                    </strong>{" "}
                    vs{" "}
                    <span className="line-through font-mono tabular-nums">
                      ${metrics.wishlistTotalMsrp.toFixed(0)} MSRP
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onNavigateToWishlist}
                  className="w-full py-2 px-3 bg-[#121216] hover:bg-[#1A1A22] border border-[#232329] rounded-lg text-xs font-medium text-[#E4E4E7] flex items-center justify-between transition-colors"
                >
                  <span>Open Wishlist Priority Matrix</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                </button>
              </div>
            </div>

            {/* Proportional Owned vs. Wishlisted Packaging & Upgrade Bar */}
            <div className="p-4 bg-[#0A0A0C] border border-[#232329] rounded-xl space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-[#F4F4F6]">
                  Wishlist Special Edition Packaging Breakdown ({metrics.wishlistTotal} Wishlisted)
                </span>
                <span className="font-mono text-[11px] text-[#9CA3AF] tabular-nums">
                  {metrics.rigidBoxWishlist} Rigid Boxes · {metrics.slipcoverWishlist} Limited
                  Slips · {metrics.steelbookWishlist} Steelbooks · {metrics.digipakWishlist}{" "}
                  Digipaks
                </span>
              </div>

              {/* Segmented Horizontal Distribution Bar */}
              <div className="w-full h-2.5 bg-[#121216] rounded-full overflow-hidden flex border border-[#232329]">
                {metrics.wishlistTotal > 0 && (
                  <>
                    <div
                      style={{
                        width: `${(metrics.rigidBoxWishlist / metrics.wishlistTotal) * 100}%`,
                      }}
                      className="h-full bg-amber-500"
                      title={`Rigid Box Sets: ${metrics.rigidBoxWishlist}`}
                    />
                    <div
                      style={{
                        width: `${(metrics.slipcoverWishlist / metrics.wishlistTotal) * 100}%`,
                      }}
                      className="h-full bg-emerald-500"
                      title={`Limited Slipcovers: ${metrics.slipcoverWishlist}`}
                    />
                    <div
                      style={{
                        width: `${(metrics.steelbookWishlist / metrics.wishlistTotal) * 100}%`,
                      }}
                      className="h-full bg-sky-500"
                      title={`Boutique Steelbooks: ${metrics.steelbookWishlist}`}
                    />
                    <div
                      style={{
                        width: `${(metrics.digipakWishlist / metrics.wishlistTotal) * 100}%`,
                      }}
                      className="h-full bg-indigo-500"
                      title={`Archival Digipaks: ${metrics.digipakWishlist}`}
                    />
                  </>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#9CA3AF]">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-xs bg-amber-500" />
                    <span>Rigid Box Sets ({metrics.rigidBoxWishlist})</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-xs bg-emerald-500" />
                    <span>Limited Slipcovers ({metrics.slipcoverWishlist})</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-xs bg-sky-500" />
                    <span>Boutique Steelbooks ({metrics.steelbookWishlist})</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-xs bg-indigo-500" />
                    <span>Archival Digipaks ({metrics.digipakWishlist})</span>
                  </span>
                </div>

                <span className="font-mono text-[#E4E4E7] tabular-nums">
                  {metrics.criticalUpgradesCount} Critical Shelf Upgrades Active
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
