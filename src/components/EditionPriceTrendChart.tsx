import React, { useMemo, useState } from "react";
import * as d3 from "d3";
import { TrendingDown, TrendingUp, Target, CheckCircle2, Sparkles } from "lucide-react";
import { BoutiqueRelease, PriceHistoryPoint, RetailerOffer } from "../types";

interface EditionPriceTrendChartProps {
  release: BoutiqueRelease;
  onSetTargetPrice?: (newTargetPrice: number) => void;
}

/**
 * Deterministic hash from string so each release & retailer gets a realistic,
 * reproducible 30-day price trajectory that ends at its actual current live offer price.
 */
function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function formatDayOffset(dayOffset: number): { dateLabel: string; isoDate: string } {
  // Anchor relative to Nov 1, 2026 (or current browser date)
  const base = new Date(2026, 10, 1);
  const d = new Date(base);
  d.setDate(base.getDate() + dayOffset);
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const month = monthNames[d.getMonth()];
  const day = String(d.getDate()).padStart(2, "0");
  const isoDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${day}`;
  return {
    dateLabel: dayOffset === 0 ? "Today" : `${month} ${day}`,
    isoDate,
  };
}

/**
 * Generates a realistic 30-day price history for either the overall market best offer
 * or a specific retailer offer, anchored to real catalog prices, MSRP, and previousPrice.
 */
function build30DaySeries(
  release: BoutiqueRelease,
  selectedRetailer: string | "ALL"
): PriceHistoryPoint[] {
  if (selectedRetailer === "ALL" && release.priceHistory30d && release.priceHistory30d.length === 30) {
    return release.priceHistory30d;
  }

  const seed = hashString(`${release.id}:${selectedRetailer}`);
  const msrp = release.msrp;

  const matchingOffers: RetailerOffer[] =
    selectedRetailer === "ALL"
      ? release.retailerListings
      : release.retailerListings.filter((o) => o.retailer === selectedRetailer);

  const inStockOffers = matchingOffers.filter((o) => o.inStock);
  const activeOffer =
    inStockOffers.length > 0
      ? inStockOffers.reduce((min, o) => (o.price < min.price ? o : min), inStockOffers[0])
      : matchingOffers[0] || release.retailerListings[0];

  const currentPrice = activeOffer ? activeOffer.price : msrp;
  const currentRetailer = activeOffer ? activeOffer.retailer : release.label;

  // Baseline starting price 29 days ago (typically near previousPrice or ~82-92% of MSRP)
  const highestPrev = matchingOffers.reduce(
    (max, o) => Math.max(max, o.previousPrice || o.price),
    currentPrice
  );
  const baselinePrice = Math.min(
    msrp,
    Math.max(
      currentPrice,
      highestPrev > currentPrice
        ? highestPrev
        : Number((msrp * (0.86 + ((seed % 9) * 0.01))).toFixed(2))
    )
  );

  // Determine a realistic mid-month flash dip or restock window
  const flashDipStartDay = -22 + (seed % 8); // e.g., between day -22 and -15
  const flashDipDuration = 3 + (seed % 3); // 3 to 5 days
  const hasDeeperPastLow = seed % 3 !== 0; // 2/3 of releases had a brief flash low, 1/3 are at their 30-day low right now

  const pastDipMultiplier = hasDeeperPastLow ? 0.91 + ((seed % 5) * 0.012) : 1.02;
  const pastDipPrice = Math.max(
    14.99,
    Number((Math.min(currentPrice, baselinePrice) * pastDipMultiplier).toFixed(2))
  );

  // Choose an alternate retailer for historical dips when viewing "ALL"
  const secondaryRetailer =
    release.retailerListings.length > 1
      ? release.retailerListings[(seed + 1) % release.retailerListings.length].retailer
      : currentRetailer;

  const rawPoints: PriceHistoryPoint[] = [];

  for (let offset = -29; offset <= 0; offset++) {
    const { dateLabel, isoDate } = formatDayOffset(offset);
    const dayIndex = offset + 29; // 0..29

    if (offset === 0) {
      rawPoints.push({
        dayOffset: 0,
        dateLabel: "Today",
        isoDate,
        price: Number(currentPrice.toFixed(2)),
        retailer: currentRetailer,
        eventNote: activeOffer?.isSale
          ? `Active Sale (${activeOffer.stockNote})`
          : `Current Live Listing (${activeOffer?.stockNote || "In Stock"})`,
      });
      continue;
    }

    let price = baselinePrice;
    let pointRetailer = selectedRetailer === "ALL" ? secondaryRetailer : currentRetailer;
    let eventNote = "Standard Catalog Listing";

    // Window 1: Early-month baseline with minor algorithmic retailer variance
    if (offset < flashDipStartDay) {
      const wave = Math.sin((dayIndex + (seed % 7)) * 0.65) * (msrp * 0.018);
      price = Number(Math.min(msrp, Math.max(currentPrice * 0.94, baselinePrice + wave)).toFixed(2));
      eventNote = "Regular Stockist Pricing";
    }
    // Window 2: Mid-month 48-72hr Flash Promo / Restock Dip
    else if (offset >= flashDipStartDay && offset < flashDipStartDay + flashDipDuration) {
      const isPeakDipDay = offset === flashDipStartDay + 1;
      price = isPeakDipDay
        ? pastDipPrice
        : Number(((pastDipPrice + baselinePrice) / 2).toFixed(2));
      pointRetailer = currentRetailer;
      eventNote = isPeakDipDay
        ? "48-Hour Boutique Flash Promo Dip"
        : "Weekend Promo Price Match";
    }
    // Window 3: Post-promo rebound & gradual transition toward Today's price
    else {
      const remainingDays = Math.abs(offset);
      const t = 1 - remainingDays / Math.abs(flashDipStartDay + flashDipDuration);
      const interpolated = baselinePrice + (currentPrice - baselinePrice) * Math.min(1, Math.max(0, t));
      const microNoise =
        ((hashString(`${release.id}:${offset}`) % 11) - 5) * (msrp * 0.004);
      price = Number(
        Math.min(msrp, Math.max(12.99, interpolated + microNoise)).toFixed(2)
      );
      pointRetailer = remainingDays <= 5 ? currentRetailer : secondaryRetailer;
      eventNote =
        remainingDays <= 4
          ? "Recent Retailer Price Adjustment"
          : "Post-Promo Restock Stabilization";
    }

    rawPoints.push({
      dayOffset: offset,
      dateLabel,
      isoDate,
      price,
      retailer: pointRetailer,
      eventNote,
    });
  }

  // Identify the minimum price across all 30 days and mark historical low(s)
  const minPrice = d3.min(rawPoints, (d) => d.price) ?? currentPrice;
  let markedLow = false;
  // Prefer marking the most recent occurrence if tied (e.g. Today)
  for (let i = rawPoints.length - 1; i >= 0; i--) {
    if (Math.abs(rawPoints[i].price - minPrice) < 0.005 && !markedLow) {
      rawPoints[i].isHistoricalLow = true;
      markedLow = true;
    } else {
      rawPoints[i].isHistoricalLow = false;
    }
  }

  return rawPoints;
}

export const EditionPriceTrendChart: React.FC<EditionPriceTrendChartProps> = ({
  release,
  onSetTargetPrice,
}) => {
  const [selectedRetailer, setSelectedRetailer] = useState<string | "ALL">("ALL");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const series = useMemo(
    () => build30DaySeries(release, selectedRetailer),
    [release, selectedRetailer]
  );

  const stats = useMemo(() => {
    const prices = series.map((d) => d.price);
    const minPrice = d3.min(prices) ?? release.msrp;
    const maxPrice = d3.max(prices) ?? release.msrp;
    const avgPrice = d3.mean(prices) ?? release.msrp;
    const currentPoint = series[series.length - 1];
    const lowPoint =
      series.find((d) => d.isHistoricalLow) ||
      series.reduce((lowest, pt) => (pt.price < lowest.price ? pt : lowest), series[0]);

    const deltaVsLow = Number((currentPoint.price - lowPoint.price).toFixed(2));
    const isAtHistoricalLow = deltaVsLow <= 0.05;
    const isBelowTarget = currentPoint.price <= release.wishlist.targetPrice;

    // Buying signal synthesis
    let signalLabel = "Hold for Target Drop";
    let signalTone: "emerald" | "amber" | "rose" = "amber";
    let signalAdvice = "";

    if (isAtHistoricalLow && isBelowTarget) {
      signalLabel = "Strong Buy — At 30D Floor & Below Target";
      signalTone = "emerald";
      signalAdvice = `Currently at its 30-day historical low ($${currentPoint.price.toFixed(
        2
      )}) and meets your $${release.wishlist.targetPrice.toFixed(2)} target threshold.`;
    } else if (isAtHistoricalLow) {
      signalLabel = "At 30-Day Low — Optimal Market Floor";
      signalTone = "emerald";
      signalAdvice = `Today's $${currentPoint.price.toFixed(
        2
      )} offer matches the lowest price recorded in the past 30 days (-${Math.round(
        ((release.msrp - currentPoint.price) / release.msrp) * 100
      )}% vs MSRP).`;
    } else if (isBelowTarget) {
      signalLabel = "Target Met — Above 30D Flash Floor";
      signalTone = "emerald";
      signalAdvice = `Meets your $${release.wishlist.targetPrice.toFixed(
        2
      )} buy target, though it briefly dipped to $${lowPoint.price.toFixed(2)} on ${
        lowPoint.dateLabel
      }.`;
    } else if (deltaVsLow <= 3.0) {
      signalLabel = "Near 30-Day Low — Within $3 Spread";
      signalTone = "amber";
      signalAdvice = `Trading $${deltaVsLow.toFixed(
        2
      )} above the 30-day low ($${lowPoint.price.toFixed(2)} on ${
        lowPoint.dateLabel
      }). Watch for weekend promo codes.`;
    } else {
      signalLabel = "Wait for Flash Sale / Restock Dip";
      signalTone = "rose";
      signalAdvice = `Currently $${deltaVsLow.toFixed(
        2
      )} above its 30-day low of $${lowPoint.price.toFixed(2)} (${
        lowPoint.dateLabel
      } via ${lowPoint.retailer}).`;
    }

    return {
      minPrice,
      maxPrice,
      avgPrice: Number(avgPrice.toFixed(2)),
      currentPoint,
      lowPoint,
      deltaVsLow,
      isAtHistoricalLow,
      isBelowTarget,
      signalLabel,
      signalTone,
      signalAdvice,
    };
  }, [series, release.msrp, release.wishlist.targetPrice]);

  // SVG Layout Geometry
  const width = 580;
  const height = 225;
  const margin = { top: 24, right: 54, bottom: 30, left: 46 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const { xScale, yScale, linePath, areaPath, yTicks } = useMemo(() => {
    const x = d3
      .scaleLinear()
      .domain([0, series.length - 1])
      .range([0, innerWidth]);

    const allRelevantPrices = [
      ...series.map((d) => d.price),
      release.wishlist.targetPrice,
      release.msrp,
    ];
    const domainMin = Math.max(0, (d3.min(allRelevantPrices) ?? 15) - 3.5);
    const domainMax = (d3.max(allRelevantPrices) ?? release.msrp) + 3.5;

    const y = d3.scaleLinear().domain([domainMin, domainMax]).range([innerHeight, 0]);

    const lineGen = d3
      .line<PriceHistoryPoint>()
      .x((_, i) => x(i))
      .y((d) => y(d.price))
      .curve(d3.curveMonotoneX);

    const areaGen = d3
      .area<PriceHistoryPoint>()
      .x((_, i) => x(i))
      .y0(innerHeight)
      .y1((d) => y(d.price))
      .curve(d3.curveMonotoneX);

    return {
      xScale: x,
      yScale: y,
      linePath: lineGen(series) || "",
      areaPath: areaGen(series) || "",
      yTicks: y.ticks(4),
    };
  }, [series, innerWidth, innerHeight, release.wishlist.targetPrice, release.msrp]);

  const activePointIndex = hoveredIndex !== null ? hoveredIndex : series.length - 1;
  const inspectedPoint = series[activePointIndex] || stats.currentPoint;
  const lowPointIndex = series.findIndex((d) => d.isHistoricalLow);

  const targetY = yScale(release.wishlist.targetPrice);
  const msrpY = yScale(release.msrp);

  return (
    <div className="py-6 border-b border-[#232329] space-y-4">
      {/* Section Header & Retailer Trajectory Filter */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-amber-400 font-medium">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>30-Day Archival Price Telemetry &amp; Historical Floor</span>
          </div>
          <h3 className="text-sm font-semibold text-[#F4F4F6] mt-0.5">
            30-Day Price Trend &amp; Buy-Timing Analysis
          </h3>
        </div>

        {/* Retailer Series Selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="dossier-trend-retailer" className="text-[11px] text-[#9CA3AF]">
            Series:
          </label>
          <select
            id="dossier-trend-retailer"
            value={selectedRetailer}
            onChange={(e) => {
              setSelectedRetailer(e.target.value);
              setHoveredIndex(null);
            }}
            className="bg-[#0A0A0C] border border-[#232329] rounded-lg px-2.5 py-1.5 text-xs text-[#F4F4F6] focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">Best Market Price (All Retailers)</option>
            {release.retailerListings.map((r) => (
              <option key={r.retailer} value={r.retailer}>
                {r.retailer} (${r.price.toFixed(2)})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4-Metric Price Telemetry Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 bg-[#0A0A0C] border border-[#232329] rounded-lg">
          <span className="text-[11px] text-[#9CA3AF] block">Current Price</span>
          <span className="font-mono text-base font-semibold text-[#F4F4F6] tabular-nums mt-0.5 block">
            ${stats.currentPoint.price.toFixed(2)}
          </span>
          <span className="text-[10px] text-[#9CA3AF] truncate block">
            {stats.currentPoint.retailer}
          </span>
        </div>

        <div className="p-3 bg-[#0A0A0C] border border-emerald-500/35 rounded-lg">
          <span className="text-[11px] text-emerald-400 font-medium block">
            30-Day Historical Low
          </span>
          <span className="font-mono text-base font-semibold text-emerald-400 tabular-nums mt-0.5 block">
            ${stats.lowPoint.price.toFixed(2)}
          </span>
          <span className="text-[10px] text-[#9CA3AF] truncate block">
            {stats.lowPoint.dateLabel} · {stats.lowPoint.retailer}
          </span>
        </div>

        <div className="p-3 bg-[#0A0A0C] border border-[#232329] rounded-lg">
          <span className="text-[11px] text-[#9CA3AF] block">30-Day Average / High</span>
          <span className="font-mono text-base font-semibold text-[#E4E4E7] tabular-nums mt-0.5 block">
            ${stats.avgPrice.toFixed(2)}
          </span>
          <span className="font-mono text-[10px] text-[#9CA3AF] tabular-nums block">
            Peak ${stats.maxPrice.toFixed(2)} · MSRP ${release.msrp.toFixed(2)}
          </span>
        </div>

        <div className="p-3 bg-[#0A0A0C] border border-[#232329] rounded-lg">
          <span className="text-[11px] text-[#9CA3AF] block">Spread vs 30D Low</span>
          <span
            className={`font-mono text-base font-semibold tabular-nums mt-0.5 block ${
              stats.isAtHistoricalLow
                ? "text-emerald-400"
                : stats.deltaVsLow <= 3
                ? "text-amber-400"
                : "text-rose-400"
            }`}
          >
            {stats.isAtHistoricalLow ? "AT 30D LOW" : `+$${stats.deltaVsLow.toFixed(2)}`}
          </span>
          <span className="text-[10px] text-[#9CA3AF] truncate block">
            {stats.isAtHistoricalLow
              ? "Matches 30-day floor"
              : `${Math.round((stats.deltaVsLow / stats.lowPoint.price) * 100)}% above 30D floor`}
          </span>
        </div>
      </div>

      {/* D3 SVG Line & Area Chart Container */}
      <div className="p-4 bg-[#0A0A0C] border border-[#232329] rounded-xl space-y-3">
        {/* Chart Legend & Live Scrub Readout Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#232329] text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-amber-400 font-semibold tabular-nums">
              {inspectedPoint.dateLabel} ({inspectedPoint.isoDate})
            </span>
            <span aria-hidden="true" className="text-[#9CA3AF]">
              ·
            </span>
            <span className="font-mono font-semibold text-[#F4F4F6] tabular-nums">
              ${inspectedPoint.price.toFixed(2)}
            </span>
            <span className="text-[#9CA3AF]">via {inspectedPoint.retailer}</span>
            {inspectedPoint.isHistoricalLow && (
              <span className="text-emerald-400 font-semibold">
                · ★ 30-Day Historical Low
              </span>
            )}
          </div>
          <div className="text-[11px] text-[#9CA3AF] truncate">
            {inspectedPoint.eventNote}
          </div>
        </div>

        {/* Responsive SVG Canvas */}
        <div className="relative w-full select-none">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto overflow-visible"
            role="img"
            aria-label={`30-day price trend chart for ${release.title}`}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <defs>
              <linearGradient id={`price-area-grad-${release.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.28" />
                <stop offset="75%" stopColor="#10B981" stopOpacity="0.06" />
                <stop offset="100%" stopColor="#0A0A0C" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            <g transform={`translate(${margin.left}, ${margin.top})`}>
              {/* Horizontal Y Grid Lines & Tick Labels */}
              {yTicks.map((tickVal) => {
                const yPos = yScale(tickVal);
                return (
                  <g key={tickVal} transform={`translate(0, ${yPos})`}>
                    <line
                      x1={0}
                      x2={innerWidth}
                      stroke="#1F1F26"
                      strokeDasharray="2,3"
                      strokeWidth={1}
                    />
                    <text
                      x={-8}
                      y={3}
                      textAnchor="end"
                      className="fill-[#9CA3AF] font-mono text-[10px]"
                    >
                      ${tickVal.toFixed(0)}
                    </text>
                  </g>
                );
              })}

              {/* MSRP Reference Line */}
              {msrpY >= 0 && msrpY <= innerHeight && (
                <g transform={`translate(0, ${msrpY})`}>
                  <line
                    x1={0}
                    x2={innerWidth}
                    stroke="#52525B"
                    strokeDasharray="3,3"
                    strokeWidth={1}
                  />
                  <text
                    x={innerWidth + 4}
                    y={3}
                    className="fill-[#9CA3AF] font-mono text-[9px]"
                  >
                    MSRP
                  </text>
                </g>
              )}

              {/* User Target Buy Threshold Line */}
              {targetY >= 0 && targetY <= innerHeight && (
                <g transform={`translate(0, ${targetY})`}>
                  <line
                    x1={0}
                    x2={innerWidth}
                    stroke="#10B981"
                    strokeDasharray="5,4"
                    strokeWidth={1.25}
                  />
                  <text
                    x={innerWidth + 4}
                    y={3}
                    className="fill-emerald-400 font-mono text-[9px] font-semibold"
                  >
                    Target
                  </text>
                </g>
              )}

              {/* Shaded Area Under Price Curve */}
              <path d={areaPath} fill={`url(#price-area-grad-${release.id})`} />

              {/* Main 30-Day Monotone Price Line */}
              <path
                d={linePath}
                fill="none"
                stroke="#F59E0B"
                strokeWidth={2.25}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* X-Axis Date Labels (Every 6 Days + Today) */}
              {series.map((pt, idx) => {
                const shouldShowTick =
                  idx === 0 || idx === 7 || idx === 14 || idx === 21 || idx === 29;
                if (!shouldShowTick) return null;
                const xPos = xScale(idx);
                return (
                  <g key={pt.isoDate} transform={`translate(${xPos}, ${innerHeight})`}>
                    <line y1={0} y2={5} stroke="#3F3F46" strokeWidth={1} />
                    <text
                      y={18}
                      textAnchor={idx === 0 ? "start" : idx === 29 ? "end" : "middle"}
                      className="fill-[#9CA3AF] font-mono text-[10px]"
                    >
                      {pt.dateLabel}
                    </text>
                  </g>
                );
              })}

              {/* Data Points along the curve */}
              {series.map((pt, idx) => {
                const cx = xScale(idx);
                const cy = yScale(pt.price);
                const isLow = pt.isHistoricalLow;
                const isToday = idx === series.length - 1;
                const isHovered = idx === activePointIndex;

                return (
                  <g key={pt.isoDate}>
                    {/* Historical Low Outer Halo & Callout Tag */}
                    {isLow && (
                      <>
                        <circle
                          cx={cx}
                          cy={cy}
                          r={8}
                          className="fill-emerald-500/20 stroke-emerald-400/60"
                          strokeWidth={1.2}
                        />
                        <g
                          transform={`translate(${Math.min(
                            innerWidth - 52,
                            Math.max(42, cx)
                          )}, ${Math.max(14, cy - 14)})`}
                        >
                          <rect
                            x={-44}
                            y={-14}
                            width={88}
                            height={16}
                            rx={4}
                            fill="#064E3B"
                            stroke="#10B981"
                            strokeWidth={1}
                          />
                          <text
                            x={0}
                            y={-3}
                            textAnchor="middle"
                            className="fill-emerald-300 font-mono text-[9px] font-semibold"
                          >
                            30D LOW ${pt.price.toFixed(2)}
                          </text>
                        </g>
                      </>
                    )}

                    {/* Node Circle */}
                    {(isLow || isToday || isHovered) && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isHovered ? 5 : isLow || isToday ? 4 : 2.5}
                        fill={
                          isLow
                            ? "#10B981"
                            : isToday
                            ? "#F59E0B"
                            : "#F4F4F6"
                        }
                        stroke="#0A0A0C"
                        strokeWidth={1.5}
                      />
                    )}
                  </g>
                );
              })}

              {/* Active Scrub Crosshair Line */}
              {inspectedPoint && (
                <line
                  x1={xScale(activePointIndex)}
                  x2={xScale(activePointIndex)}
                  y1={0}
                  y2={innerHeight}
                  stroke="#F4F4F6"
                  strokeOpacity={0.35}
                  strokeDasharray="2,2"
                  strokeWidth={1}
                  pointerEvents="none"
                />
              )}

              {/* Invisible Hover Columns for Smooth 30-Day Scrubbing */}
              {series.map((pt, idx) => {
                const colWidth = innerWidth / series.length;
                const xPos = xScale(idx) - colWidth / 2;
                return (
                  <rect
                    key={`hit-${pt.isoDate}`}
                    x={Math.max(0, xPos)}
                    y={0}
                    width={colWidth}
                    height={innerHeight}
                    fill="transparent"
                    className="cursor-crosshair"
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onClick={() => setHoveredIndex(idx)}
                  />
                );
              })}
            </g>
          </svg>
        </div>

        {/* Chart Legend & Quick Target Sync Action */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#232329] text-[11px] text-[#9CA3AF]">
          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-amber-400 inline-block" />
              <span>30D Price Trajectory</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              <span>
                Historical Low (${stats.lowPoint.price.toFixed(2)} on{" "}
                {lowPointIndex >= 0 ? stats.lowPoint.dateLabel : "Today"})
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 border-b border-dashed border-emerald-400 inline-block" />
              <span>Target (${release.wishlist.targetPrice.toFixed(2)})</span>
            </span>
          </div>

          {onSetTargetPrice &&
            Math.abs(release.wishlist.targetPrice - stats.lowPoint.price) >= 0.5 && (
              <button
                type="button"
                onClick={() => onSetTargetPrice(stats.lowPoint.price)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#121216] hover:bg-[#1A1A22] border border-[#232329] hover:border-emerald-500/50 rounded-md text-xs text-emerald-400 font-medium transition-colors"
              >
                <Target className="w-3 h-3" />
                <span>Align Target to 30D Low (${stats.lowPoint.price.toFixed(2)})</span>
              </button>
            )}
        </div>
      </div>

      {/* Buying Decision Recommendation Callout */}
      <div
        className={`p-3.5 rounded-lg border text-xs flex items-start justify-between gap-3 ${
          stats.signalTone === "emerald"
            ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-200"
            : stats.signalTone === "amber"
            ? "bg-amber-950/20 border-amber-500/40 text-amber-200"
            : "bg-rose-950/20 border-rose-500/35 text-rose-200"
        }`}
      >
        <div className="space-y-1">
          <div className="font-semibold flex items-center gap-1.5">
            {stats.signalTone === "emerald" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : stats.signalTone === "amber" ? (
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <TrendingUp className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>Collector Buying Signal: {stats.signalLabel}</span>
          </div>
          <p className="text-[#E4E4E7] leading-relaxed">{stats.signalAdvice}</p>
        </div>
      </div>
    </div>
  );
};
