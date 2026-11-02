import React, { useState, useMemo, useRef } from "react";
import {
  Upload,
  FileSpreadsheet,
  Disc,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Bookmark,
  Plus,
  Trash2,
  Download,
  X,
  Check,
  Search,
} from "lucide-react";
import {
  BoutiqueRelease,
  ImportSourceType,
  OwnedDiscItem,
  OwnedFormat,
  WishlistPriority,
} from "../types";
import {
  assessUpgradeUrgency,
  CLZ_SAMPLE_CSV_EXPORT,
  findMatchingCatalogRelease,
  parseCollectionImportText,
} from "../utils/upgradeUrgency";
import { DiscContentsAccordion } from "./DiscContentsAccordion";

interface UpgradeShelfViewProps {
  ownedDiscs: OwnedDiscItem[];
  catalog: BoutiqueRelease[];
  onImportDiscs: (newDiscs: OwnedDiscItem[], replaceAll?: boolean) => void;
  onRemoveOwnedDisc: (id: string) => void;
  onInspectRelease: (releaseId: string) => void;
  onPromoteToWishlist: (
    releaseId: string,
    priority: WishlistPriority,
    ownedItem: OwnedDiscItem
  ) => void;
  onDiscoverBoutiqueUpgrade: (ownedItem: OwnedDiscItem) => Promise<void>;
  discoveringOwnedId: string | null;
}

type UpgradeFilterMode =
  | "all"
  | "critical"
  | "dvd-to-4k"
  | "bd-to-4k"
  | "unmatched";

export const UpgradeShelfView: React.FC<UpgradeShelfViewProps> = ({
  ownedDiscs,
  catalog,
  onImportDiscs,
  onRemoveOwnedDisc,
  onInspectRelease,
  onPromoteToWishlist,
  onDiscoverBoutiqueUpgrade,
  discoveringOwnedId,
}) => {
  const [filterMode, setFilterMode] = useState<UpgradeFilterMode>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importTab, setImportTab] = useState<"clz-csv" | "manual">("clz-csv");
  const [importSource, setImportSource] = useState<ImportSourceType>("CLZ Movies");
  const [rawImportText, setRawImportText] = useState("");
  const [replaceExisting, setReplaceExisting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Manual Owned Disc Form State
  const [manualTitle, setManualTitle] = useState("");
  const [manualYear, setManualYear] = useState("1985");
  const [manualDirector, setManualDirector] = useState("");
  const [manualFormat, setManualFormat] = useState<OwnedFormat>("DVD");
  const [manualEdition, setManualEdition] = useState("Standard Keepcase DVD");
  const [manualLabel, setManualLabel] = useState("Studio Home Video");
  const [manualBarcode, setManualBarcode] = useState("");
  const [manualNotes, setManualNotes] = useState(
    "Older standard definition transfer; looking for 4K boutique upgrade"
  );

  // Enrich owned discs with matched boutique release and Upgrade Urgency Assessment
  const enrichedOwnedList = useMemo(() => {
    return ownedDiscs
      .map((owned) => {
        const matchedRelease =
          (owned.matchedReleaseId
            ? catalog.find((r) => r.id === owned.matchedReleaseId)
            : undefined) || findMatchingCatalogRelease(owned.title, catalog);

        const assessment = matchedRelease
          ? assessUpgradeUrgency(owned, matchedRelease)
          : undefined;

        return {
          owned,
          matchedRelease,
          assessment,
        };
      })
      .sort((a, b) => {
        const scoreA = a.assessment?.totalScore ?? -1;
        const scoreB = b.assessment?.totalScore ?? -1;
        return scoreB - scoreA;
      });
  }, [ownedDiscs, catalog]);

  // Summary Metrics
  const summaryStats = useMemo(() => {
    const totalOwned = enrichedOwnedList.length;
    const dvdCount = enrichedOwnedList.filter(
      (i) => i.owned.ownedFormat === "DVD" || i.owned.ownedFormat === "VHS / LaserDisc"
    ).length;
    const criticalCount = enrichedOwnedList.filter(
      (i) => i.assessment && i.assessment.totalScore >= 78
    ).length;
    const dvdTo4kCount = enrichedOwnedList.filter(
      (i) =>
        (i.owned.ownedFormat === "DVD" || i.owned.ownedFormat === "VHS / LaserDisc") &&
        i.matchedRelease?.technicalSpecs.format.includes("4K")
    ).length;
    const unmatchedCount = enrichedOwnedList.filter(
      (i) => !i.matchedRelease
    ).length;

    return {
      totalOwned,
      dvdCount,
      criticalCount,
      dvdTo4kCount,
      unmatchedCount,
    };
  }, [enrichedOwnedList]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return enrichedOwnedList.filter(({ owned, matchedRelease, assessment }) => {
      if (filterMode === "critical") {
        if (!assessment || assessment.totalScore < 78) return false;
      } else if (filterMode === "dvd-to-4k") {
        if (
          owned.ownedFormat !== "DVD" &&
          owned.ownedFormat !== "VHS / LaserDisc"
        )
          return false;
      } else if (filterMode === "bd-to-4k") {
        if (owned.ownedFormat !== "Blu-ray" && owned.ownedFormat !== "4K UHD")
          return false;
      } else if (filterMode === "unmatched") {
        if (matchedRelease) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = owned.title.toLowerCase().includes(q);
        const matchLabel = owned.ownedLabel.toLowerCase().includes(q);
        const matchTargetLabel =
          matchedRelease?.label.toLowerCase().includes(q) || false;
        if (!matchTitle && !matchLabel && !matchTargetLabel) return false;
      }

      return true;
    });
  }, [enrichedOwnedList, filterMode, searchQuery]);

  // Preview parsed count inside import modal
  const previewParsedItems = useMemo(() => {
    if (!rawImportText.trim()) return [];
    return parseCollectionImportText(rawImportText, importSource, catalog);
  }, [rawImportText, importSource, catalog]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.toLowerCase().includes("clz") || file.name.endsWith(".xml")) {
      setImportSource("CLZ Movies");
    } else if (file.name.toLowerCase().includes("letterboxd")) {
      setImportSource("Letterboxd CSV");
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = String(event.target?.result || "");
      setRawImportText(content);
    };
    reader.readAsText(file);
  };

  const handleConfirmCsvImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (previewParsedItems.length === 0) return;
    onImportDiscs(previewParsedItems, replaceExisting);
    setRawImportText("");
    setIsImportModalOpen(false);
  };

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim()) return;

    const matched = findMatchingCatalogRelease(manualTitle.trim(), catalog);
    const newItem: OwnedDiscItem = {
      id: `owned-manual-${Date.now()}`,
      title: manualTitle.trim(),
      year: parseInt(manualYear, 10) || matched?.year || 1985,
      director: manualDirector.trim() || matched?.director || "Archival",
      ownedFormat: manualFormat,
      ownedEdition: manualEdition.trim() || `Standard ${manualFormat}`,
      ownedLabel: manualLabel.trim() || "Studio Home Video",
      barcode: manualBarcode.trim() || undefined,
      conditionNotes: manualNotes.trim(),
      importSource: "Manual Shelf Entry",
      matchedReleaseId: matched?.id,
      addedAt: new Date().toISOString(),
    };

    onImportDiscs([newItem], false);
    setManualTitle("");
    setManualDirector("");
    setManualBarcode("");
    setIsImportModalOpen(false);
  };

  const handleExportUpgradeCsv = () => {
    const headers = [
      "Owned Title",
      "Year",
      "Owned Format",
      "Owned Edition",
      "Owned Label",
      "Import Source",
      "Target Boutique Label",
      "Target Edition",
      "Format Leap",
      "Urgency Score (0-100)",
      "Urgency Tier",
      "Scarcity Factor",
      "Price Factor",
    ];
    const rows = enrichedOwnedList.map(({ owned, matchedRelease, assessment }) => [
      `"${owned.title.replace(/"/g, '""')}"`,
      owned.year,
      `"${owned.ownedFormat}"`,
      `"${owned.ownedEdition.replace(/"/g, '""')}"`,
      `"${owned.ownedLabel.replace(/"/g, '""')}"`,
      `"${owned.importSource}"`,
      `"${matchedRelease?.label || "Needs Boutique Recon"}"`,
      `"${matchedRelease?.editionType || "N/A"}"`,
      `"${assessment?.formatLeapLabel || "N/A"}"`,
      assessment?.totalScore ?? 0,
      `"${assessment?.tier || "Unmatched"}"`,
      `"${(assessment?.scarcityReason || "").replace(/"/g, '""')}"`,
      `"${(assessment?.priceReason || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "spine_and_slip_upgrade_urgency_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section className="space-y-6">
      {/* Header & Action Controls */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-4 border-b border-[#232329]">
        <div>
          <div className="text-xs text-amber-400 font-medium">
            CLZ Movies &amp; CSV Collection Sync · DVD / Blu-ray → 4K Boutique Upgrade Triage
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-semibold text-[#F4F4F6] mt-1">
            Owned Disc Shelf &amp; Upgrade Urgency Assessor
          </h1>
          <p className="text-xs text-[#9CA3AF] mt-1 max-w-3xl leading-relaxed">
            Import your owned discs from CLZ Movies, Blu-ray.com, or CSV to identify which legacy
            DVDs and standard Blu-rays have superior 4K UHD / Limited Rigid Box editions available—and
            rank upgrade urgency by A/V generational leap, print-run OOP risk, and live sale pricing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleExportUpgradeCsv}
            className="px-3.5 py-2 bg-[#121216] hover:bg-[#1A1A22] border border-[#232329] rounded-lg text-xs font-medium text-[#E4E4E7] flex items-center gap-2 whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-[#9CA3AF]" />
            <span>Export Upgrade CSV</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setImportTab("manual");
              setIsImportModalOpen(true);
            }}
            className="px-3.5 py-2 bg-[#121216] hover:bg-[#1A1A22] border border-[#232329] rounded-lg text-xs font-medium text-amber-400 flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Owned Disc</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setImportTab("clz-csv");
              setIsImportModalOpen(true);
            }}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg text-xs flex items-center gap-2 whitespace-nowrap shrink-0"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import CLZ / CSV Collection</span>
          </button>
        </div>
      </div>

      {/* 4-Column Upgrade Telemetry Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => setFilterMode("all")}
          className="text-left bg-[#121216] hover:bg-[#17171D] border border-[#232329] rounded-xl p-5 transition-colors"
        >
          <span className="text-xs text-[#9CA3AF] block">
            Owned Collection Imported
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-mono text-2xl font-semibold text-[#F4F4F6] tabular-nums">
              {summaryStats.totalOwned} Discs
            </span>
            <span className="text-xs text-amber-400 font-mono tabular-nums">
              {summaryStats.dvdCount} Legacy SD DVDs
            </span>
          </div>
          <span className="text-xs text-[#9CA3AF] mt-1.5 block">
            Synced via CLZ Movies &amp; CSV shelf exports
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilterMode("critical")}
          className="text-left bg-[#121216] hover:bg-[#17171D] border border-[#232329] rounded-xl p-5 transition-colors"
        >
          <span className="text-xs text-[#9CA3AF] block">
            Critical Urgency Upgrades (Score ≥ 78)
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-mono text-2xl font-semibold text-rose-400 tabular-nums">
              {summaryStats.criticalCount} Act Now
            </span>
            <span className="text-xs text-[#E4E4E7]">
              Low Stock + Deal Active
            </span>
          </div>
          <span className="text-xs text-[#9CA3AF] mt-1.5 block">
            High OOP print-run risk or active target-price drop
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilterMode("dvd-to-4k")}
          className="text-left bg-[#121216] hover:bg-[#17171D] border border-[#232329] rounded-xl p-5 transition-colors"
        >
          <span className="text-xs text-[#9CA3AF] block">
            DVD (480i) → 4K UHD HDR Leaps
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-mono text-2xl font-semibold text-emerald-400 tabular-nums">
              {summaryStats.dvdTo4kCount} Major Leaps
            </span>
            <span className="text-xs text-[#9CA3AF]">
              Max A/V Gain (+35 pts)
            </span>
          </div>
          <span className="text-xs text-[#9CA3AF] mt-1.5 block">
            Replace non-anamorphic / SD masters with 4K Dolby Vision
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilterMode("unmatched")}
          className="text-left bg-[#121216] hover:bg-[#17171D] border border-[#232329] rounded-xl p-5 transition-colors"
        >
          <span className="text-xs text-[#9CA3AF] block">
            Unmatched Shelf Titles
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-mono text-2xl font-semibold text-[#F4F4F6] tabular-nums">
              {summaryStats.unmatchedCount} Awaiting Recon
            </span>
            <span className="text-xs text-amber-400">
              1-Click Live Search
            </span>
          </div>
          <span className="text-xs text-[#9CA3AF] mt-1.5 block">
            Scan live boutique stores to find superior 4K editions
          </span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#121216] border border-[#232329] rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search owned discs by title, legacy label (e.g. Anchor Bay, HBO, MGM), or target boutique label..."
            className="w-full bg-[#0A0A0C] border border-[#232329] rounded-lg pl-10 pr-4 py-2 text-xs text-[#F4F4F6] placeholder-[#9CA3AF] focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1 p-1 bg-[#0A0A0C] border border-[#232329] rounded-lg">
          {[
            { id: "all", label: "All Owned Discs" },
            { id: "critical", label: "Critical Urgency (≥78)" },
            { id: "dvd-to-4k", label: "DVD → 4K UHD Leap" },
            { id: "bd-to-4k", label: "Blu-ray → 4K / Rigid Box" },
            { id: "unmatched", label: "Needs Boutique Recon" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterMode(tab.id as UpgradeFilterMode)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                filterMode === tab.id
                  ? "bg-amber-500 text-black font-semibold"
                  : "text-[#9CA3AF] hover:text-[#F4F4F6]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Upgrade Urgency Assessment Table */}
      <div className="bg-[#121216] border border-[#232329] rounded-xl overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1040px]">
          <thead>
            <tr className="bg-[#0A0A0C] border-b border-[#232329] text-[11px] text-[#9CA3AF]">
              <th className="py-3.5 px-4 font-medium">
                Currently Owned Disc (CLZ / CSV Shelf)
              </th>
              <th className="py-3.5 px-4 font-medium">
                Target Boutique Edition &amp; Format Leap
              </th>
              <th className="py-3.5 px-4 font-medium">
                Upgrade Urgency Assessment (4-Factor Breakdown)
              </th>
              <th className="py-3.5 px-4 font-medium text-right">
                Best Offer vs Target
              </th>
              <th className="py-3.5 px-4 font-medium text-right">
                Upgrade Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#232329] text-xs">
            {filteredRows.map(({ owned, matchedRelease, assessment }) => {
              const isDiscovering = discoveringOwnedId === owned.id;
              const inStockOffers =
                matchedRelease?.retailerListings.filter((o) => o.inStock) || [];
              const bestOffer =
                inStockOffers.length > 0
                  ? inStockOffers.reduce(
                      (min, o) => (o.price < min.price ? o : min),
                      inStockOffers[0]
                    )
                  : matchedRelease?.retailerListings[0];

              return (
                <React.Fragment key={owned.id}>
                  <tr className="hover:bg-[#181820] transition-colors align-top">
                    {/* Column 1: Currently Owned Physical Disc */}
                    <td className="py-4 px-4 max-w-xs">
                      <div className="font-semibold text-[#F4F4F6] text-sm">
                        {owned.title} ({owned.year})
                      </div>
                      <div className="text-[#E4E4E7] mt-1">
                        <span
                          className={
                            owned.ownedFormat === "DVD" ||
                            owned.ownedFormat === "VHS / LaserDisc"
                              ? "text-amber-400 font-mono font-semibold"
                              : "text-[#E4E4E7] font-mono"
                          }
                        >
                          Owned: {owned.ownedFormat}
                        </span>
                        <span className="mx-1.5 text-[#9CA3AF]">·</span>
                        <span>{owned.ownedEdition}</span>
                      </div>
                      <div className="text-[11px] text-[#9CA3AF] mt-0.5">
                        {owned.ownedLabel}
                        {owned.barcode ? ` · UPC ${owned.barcode}` : ""} ·{" "}
                        <span>{owned.importSource}</span>
                      </div>
                      {owned.conditionNotes && (
                        <p className="text-[11px] text-[#9CA3AF] mt-1.5 leading-relaxed">
                          {owned.conditionNotes}
                        </p>
                      )}
                    </td>

                    {/* Column 2: Target Boutique Release & Leap */}
                    <td className="py-4 px-4 max-w-xs">
                      {matchedRelease && assessment ? (
                        <div className="space-y-1.5">
                          <div className="text-amber-400 font-medium">
                            {matchedRelease.label} ·{" "}
                            <span className="font-mono">
                              {matchedRelease.spineNumber}
                            </span>{" "}
                            · {matchedRelease.editionType}
                          </div>
                          <div className="font-medium text-[#F4F4F6]">
                            {matchedRelease.title}
                          </div>
                          <div className="text-[11px] text-emerald-400 font-medium">
                            {assessment.formatLeapLabel}
                          </div>
                          <div className="text-[11px] text-[#9CA3AF]">
                            {matchedRelease.technicalSpecs.hdr} ·{" "}
                            {matchedRelease.technicalSpecs.region} ·{" "}
                            {matchedRelease.technicalSpecs.audio}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <span className="text-[#9CA3AF] block">
                            No boutique edition linked in local vault yet.
                          </span>
                          <p className="text-[11px] text-[#9CA3AF]">
                            Run a live search across all 19 boutique labels to find the
                            definitive 4K UHD or Limited Box upgrade for{" "}
                            <strong className="text-[#E4E4E7]">{owned.title}</strong>.
                          </p>
                        </div>
                      )}
                    </td>

                    {/* Column 3: Upgrade Urgency Assessment */}
                    <td className="py-4 px-4 max-w-sm">
                      {assessment ? (
                        <div className="space-y-2">
                          <div className="flex items-baseline justify-between gap-2">
                            <span
                              className={`font-semibold ${
                                assessment.totalScore >= 78
                                  ? "text-rose-400"
                                  : assessment.totalScore >= 58
                                  ? "text-amber-400"
                                  : "text-[#E4E4E7]"
                              }`}
                            >
                              {assessment.tier}
                            </span>
                            <span className="font-mono text-sm font-semibold text-[#F4F4F6] tabular-nums">
                              Urgency {assessment.totalScore}/100
                            </span>
                          </div>

                          {/* Progress Bar */}
                          <div className="w-full h-1.5 bg-[#0A0A0C] rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                assessment.totalScore >= 78
                                  ? "bg-rose-500"
                                  : assessment.totalScore >= 58
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                              }`}
                              style={{ width: `${assessment.totalScore}%` }}
                            />
                          </div>

                          {/* Transparent 4-Factor Point Breakdown */}
                          <div className="font-mono text-[11px] text-[#9CA3AF] tabular-nums">
                            A/V +{assessment.formatPoints} · Pack +
                            {assessment.packagingPoints} · OOP Risk +
                            {assessment.scarcityPoints} · Price +
                            {assessment.pricePoints}
                          </div>

                          <p className="text-[11px] text-[#E4E4E7] leading-relaxed">
                            {assessment.synthesis}
                          </p>
                        </div>
                      ) : (
                        <span className="text-[#9CA3AF]">
                          Awaiting live boutique edition match
                        </span>
                      )}
                    </td>

                    {/* Column 4: Best Offer vs Target */}
                    <td className="py-4 px-4 text-right font-mono tabular-nums">
                      {matchedRelease && bestOffer ? (
                        <div>
                          <span
                            className={`text-sm font-semibold ${
                              bestOffer.price <= matchedRelease.wishlist.targetPrice
                                ? "text-emerald-400"
                                : "text-[#F4F4F6]"
                            }`}
                          >
                            ${bestOffer.price.toFixed(2)}
                          </span>
                          <span className="block text-[11px] text-[#9CA3AF] line-through">
                            MSRP ${matchedRelease.msrp.toFixed(2)}
                          </span>
                          <span className="block text-[11px] font-sans text-[#9CA3AF] mt-0.5">
                            via {bestOffer.retailer}
                          </span>
                          <span className="block text-[11px] font-sans text-amber-400 mt-0.5">
                            Target: ${matchedRelease.wishlist.targetPrice.toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[#9CA3AF]">—</span>
                      )}
                    </td>

                    {/* Column 5: Actions */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex flex-col items-end gap-2">
                        {matchedRelease ? (
                          <>
                            <button
                              type="button"
                              onClick={() => onInspectRelease(matchedRelease.id)}
                              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-md text-xs whitespace-nowrap shrink-0"
                            >
                              Inspect Upgrade Dossier
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                onPromoteToWishlist(
                                  matchedRelease.id,
                                  assessment && assessment.totalScore >= 78
                                    ? "Critical Grail"
                                    : "High Priority",
                                  owned
                                )
                              }
                              className={`px-3 py-1.5 rounded-md text-xs font-medium border flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors ${
                                matchedRelease.wishlist.isWishlisted
                                  ? "bg-[#0A0A0C] border-emerald-500/40 text-emerald-400"
                                  : "bg-[#0A0A0C] border-[#232329] text-[#F4F4F6] hover:border-amber-500/50"
                              }`}
                            >
                              <Bookmark className="w-3 h-3" />
                              <span>
                                {matchedRelease.wishlist.isWishlisted
                                  ? `Wishlisted (${matchedRelease.wishlist.priority})`
                                  : "Prioritize Upgrade on Wishlist"}
                              </span>
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onDiscoverBoutiqueUpgrade(owned)}
                            disabled={isDiscovering}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold rounded-md text-xs flex items-center gap-1.5 whitespace-nowrap shrink-0"
                          >
                            <RefreshCw
                              className={`w-3.5 h-3.5 ${
                                isDiscovering ? "animate-spin" : ""
                              }`}
                            />
                            <span>
                              {isDiscovering
                                ? "Scanning Boutiques..."
                                : "Find 4K Upgrade (Live)"}
                            </span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => onRemoveOwnedDisc(owned.id)}
                          className="text-[11px] text-[#9CA3AF] hover:text-rose-400 flex items-center gap-1 mt-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remove from Shelf</span>
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Collapsible Disc Contents, Cuts, Early Promo & Discrepancy Row under Upgrade Product */}
                  {matchedRelease && (
                    <tr>
                      <td colSpan={5} className="p-0">
                        <DiscContentsAccordion
                          release={matchedRelease}
                          compact={true}
                        />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* CLZ MOVIES / CSV COLLECTION IMPORT MODAL */}
      {isImportModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
          onClick={() => setIsImportModalOpen(false)}
        >
          <div
            className="w-full max-w-2xl bg-[#121216] border border-[#232329] rounded-xl overflow-hidden max-h-[90vh] flex flex-col text-[#F4F4F6]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#232329]">
              <div>
                <h2 className="font-display text-xl font-semibold text-[#F4F4F6]">
                  Import Owned Physical Discs (CLZ Movies / CSV)
                </h2>
                <p className="text-xs text-[#9CA3AF] mt-0.5">
                  Sync your existing DVD, Blu-ray, and 4K shelf to automatically calculate
                  boutique upgrade urgency
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="p-1.5 text-[#9CA3AF] hover:text-white border border-[#232329] rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="px-6 pt-4 pb-3 border-b border-[#232329] flex items-center gap-2">
              <button
                type="button"
                onClick={() => setImportTab("clz-csv")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  importTab === "clz-csv"
                    ? "bg-amber-500 text-black font-semibold"
                    : "bg-[#0A0A0C] text-[#9CA3AF] hover:text-white border border-[#232329]"
                }`}
              >
                CLZ Movies / CSV / XML Batch Import
              </button>
              <button
                type="button"
                onClick={() => setImportTab("manual")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  importTab === "manual"
                    ? "bg-amber-500 text-black font-semibold"
                    : "bg-[#0A0A0C] text-[#9CA3AF] hover:text-white border border-[#232329]"
                }`}
              >
                Single Owned Disc Entry
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {importTab === "clz-csv" ? (
                <form onSubmit={handleConfirmCsvImport} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[#9CA3AF] mb-1.5">
                        Collection App / Export Format
                      </label>
                      <select
                        value={importSource}
                        onChange={(e) =>
                          setImportSource(e.target.value as ImportSourceType)
                        }
                        className="w-full bg-[#0A0A0C] border border-[#232329] rounded-lg px-3 py-2 text-[#F4F4F6]"
                      >
                        <option value="CLZ Movies">
                          CLZ Movies (CSV / Text / XML Export)
                        </option>
                        <option value="Blu-ray.com CSV">
                          Blu-ray.com / My Movies CSV Export
                        </option>
                        <option value="Letterboxd CSV">
                          Letterboxd Physical Shelf CSV
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[#9CA3AF] mb-1.5">
                        Upload Export File (.csv, .txt, .xml)
                      </label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,.txt,.tsv,.xml"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full px-3 py-2 bg-[#0A0A0C] hover:bg-[#1A1A22] border border-[#232329] rounded-lg text-[#F4F4F6] flex items-center justify-center gap-2 transition-colors"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-amber-400" />
                        <span>Choose CSV / CLZ File from Device</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[#9CA3AF]">
                        Or Paste CLZ Movies / CSV Rows Below
                      </label>
                      <button
                        type="button"
                        onClick={() => setRawImportText(CLZ_SAMPLE_CSV_EXPORT)}
                        className="text-amber-400 hover:underline font-medium"
                      >
                        Load Sample CLZ Movies Export (9 Legacy Discs)
                      </button>
                    </div>
                    <textarea
                      rows={7}
                      value={rawImportText}
                      onChange={(e) => setRawImportText(e.target.value)}
                      placeholder={`Title,Release Year,Director,Format,Edition,Label,Barcode,Notes\n"The Hitcher",1986,"Robert Harmon","DVD","Snap-Case DVD","HBO Home Video","026359167829","Non-anamorphic letterbox"`}
                      className="w-full bg-[#0A0A0C] border border-[#232329] rounded-lg p-3 font-mono text-xs text-[#F4F4F6] focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Live Parse Preview */}
                  {previewParsedItems.length > 0 && (
                    <div className="p-3.5 bg-[#0A0A0C] border border-emerald-500/40 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-emerald-400 font-semibold">
                          Ready to Import {previewParsedItems.length} Owned Discs
                        </span>
                        <span className="font-mono text-[#9CA3AF]">
                          {
                            previewParsedItems.filter((i) => i.matchedReleaseId)
                              .length
                          }{" "}
                          auto-matched to Vault editions
                        </span>
                      </div>
                      <div className="max-h-32 overflow-y-auto divide-y divide-[#232329]">
                        {previewParsedItems.map((item, idx) => (
                          <div
                            key={idx}
                            className="py-1.5 flex items-center justify-between text-[11px]"
                          >
                            <span className="text-[#F4F4F6] font-medium">
                              {item.title} ({item.year}) ·{" "}
                              <span className="text-amber-400 font-mono">
                                {item.ownedFormat}
                              </span>{" "}
                              ({item.ownedLabel})
                            </span>
                            <span
                              className={
                                item.matchedReleaseId
                                  ? "text-emerald-400"
                                  : "text-[#9CA3AF]"
                              }
                            >
                              {item.matchedReleaseId
                                ? "Matched to 4K/Boutique Edition"
                                : "Ready for Live Recon"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <label className="flex items-center gap-2 text-[#9CA3AF] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={replaceExisting}
                        onChange={(e) => setReplaceExisting(e.target.checked)}
                        className="rounded border-[#232329] bg-[#0A0A0C]"
                      />
                      <span>Replace existing shelf instead of merging</span>
                    </label>

                    <button
                      type="submit"
                      disabled={previewParsedItems.length === 0}
                      className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold rounded-lg flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>
                        Import &amp; Assess {previewParsedItems.length} Discs
                      </span>
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleManualAdd} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[#9CA3AF] mb-1">
                        Film Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={manualTitle}
                        onChange={(e) => setManualTitle(e.target.value)}
                        placeholder="e.g., Opera, Police Story, Possession, Touch of Evil..."
                        className="w-full bg-[#0A0A0C] border border-[#232329] rounded-lg px-3 py-2 text-[#F4F4F6]"
                      />
                    </div>
                    <div>
                      <label className="block text-[#9CA3AF] mb-1">
                        Release Year
                      </label>
                      <input
                        type="number"
                        value={manualYear}
                        onChange={(e) => setManualYear(e.target.value)}
                        className="w-full bg-[#0A0A0C] border border-[#232329] rounded-lg px-3 py-2 font-mono text-[#F4F4F6]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[#9CA3AF] mb-1">
                        Owned Disc Format
                      </label>
                      <select
                        value={manualFormat}
                        onChange={(e) =>
                          setManualFormat(e.target.value as OwnedFormat)
                        }
                        className="w-full bg-[#0A0A0C] border border-[#232329] rounded-lg px-3 py-2 text-[#F4F4F6]"
                      >
                        <option value="DVD">DVD (480i Standard Def)</option>
                        <option value="Blu-ray">Blu-ray (1080p HD)</option>
                        <option value="4K UHD">
                          4K UHD (Standard / SDR Pressing)
                        </option>
                        <option value="VHS / LaserDisc">VHS / LaserDisc</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[#9CA3AF] mb-1">
                        Owned Packaging / Edition
                      </label>
                      <input
                        type="text"
                        value={manualEdition}
                        onChange={(e) => setManualEdition(e.target.value)}
                        placeholder="e.g., Snap-Case DVD / Eco-Case BD"
                        className="w-full bg-[#0A0A0C] border border-[#232329] rounded-lg px-3 py-2 text-[#F4F4F6]"
                      />
                    </div>
                    <div>
                      <label className="block text-[#9CA3AF] mb-1">
                        Owned Studio / Label
                      </label>
                      <input
                        type="text"
                        value={manualLabel}
                        onChange={(e) => setManualLabel(e.target.value)}
                        placeholder="e.g., Anchor Bay / MGM / Universal"
                        className="w-full bg-[#0A0A0C] border border-[#232329] rounded-lg px-3 py-2 text-[#F4F4F6]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[#9CA3AF] mb-1">
                        Director (Optional)
                      </label>
                      <input
                        type="text"
                        value={manualDirector}
                        onChange={(e) => setManualDirector(e.target.value)}
                        placeholder="e.g., Dario Argento"
                        className="w-full bg-[#0A0A0C] border border-[#232329] rounded-lg px-3 py-2 text-[#F4F4F6]"
                      />
                    </div>
                    <div>
                      <label className="block text-[#9CA3AF] mb-1">
                        Barcode / UPC (Optional)
                      </label>
                      <input
                        type="text"
                        value={manualBarcode}
                        onChange={(e) => setManualBarcode(e.target.value)}
                        placeholder="e.g., 013131144291"
                        className="w-full bg-[#0A0A0C] border border-[#232329] rounded-lg px-3 py-2 font-mono text-[#F4F4F6]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#9CA3AF] mb-1">
                      Reason for Upgrade / Transfer Flaw Notes
                    </label>
                    <input
                      type="text"
                      value={manualNotes}
                      onChange={(e) => setManualNotes(e.target.value)}
                      className="w-full bg-[#0A0A0C] border border-[#232329] rounded-lg px-3 py-2 text-[#F4F4F6]"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add to Owned Shelf &amp; Compute Urgency</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
