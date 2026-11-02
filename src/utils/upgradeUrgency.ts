import {
  BoutiqueRelease,
  ImportSourceType,
  OwnedDiscItem,
  OwnedFormat,
  UpgradeUrgencyAssessment,
  UpgradeUrgencyTier,
} from "../types";

export const INITIAL_OWNED_COLLECTION: OwnedDiscItem[] = [
  {
    id: "owned-hitcher-dvd",
    title: "The Hitcher",
    year: 1986,
    director: "Robert Harmon",
    ownedFormat: "DVD",
    ownedEdition: "Non-Anamorphic Letterbox Snap-Case DVD",
    ownedLabel: "HBO Home Video (1999)",
    barcode: "026359167829",
    conditionNotes: "4:3 non-anamorphic transfer; severe edge enhancement; zero archival book supplements",
    importSource: "CLZ Movies",
    matchedReleaseId: "ss-the-hitcher-4k-le",
    addedAt: "2026-10-28T14:20:00Z",
  },
  {
    id: "owned-existenz-dvd",
    title: "eXistenZ",
    year: 1999,
    director: "David Cronenberg",
    ownedFormat: "DVD",
    ownedEdition: "Standard Amaray Keepcase DVD",
    ownedLabel: "Dimension Home Video (2000)",
    barcode: "717951004536",
    conditionNotes: "Early MPEG-2 DVD master; audio commentary missing",
    importSource: "CLZ Movies",
    matchedReleaseId: "vs-existenz-4k-le",
    addedAt: "2026-10-28T14:20:00Z",
  },
  {
    id: "owned-they-live-bd",
    title: "They Live",
    year: 1988,
    director: "John Carpenter",
    ownedFormat: "Blu-ray",
    ownedEdition: "2012 Collector's Edition (No Slipcover)",
    ownedLabel: "Scream Factory (First Blu-ray)",
    barcode: "826663136678",
    conditionNotes: "Older 1080p HD master without Dolby Vision or Dolby Atmos remix; slipcover missing",
    importSource: "CLZ Movies",
    matchedReleaseId: "shout-they-live-4k-steelbook",
    addedAt: "2026-10-28T14:20:00Z",
  },
  {
    id: "owned-live-die-la-dvd",
    title: "To Live and Die in L.A.",
    year: 1985,
    director: "William Friedkin",
    ownedFormat: "DVD",
    ownedEdition: "Special Edition Keepcase DVD",
    ownedLabel: "MGM Home Entertainment (2003)",
    barcode: "027616885425",
    conditionNotes: "480i SD transfer with outdated magenta color timing prior to Friedkin's 4K supervision",
    importSource: "CLZ Movies",
    matchedReleaseId: "kino-to-live-and-die-in-la-4k",
    addedAt: "2026-10-28T14:20:00Z",
  },
  {
    id: "owned-paris-texas-bd",
    title: "Paris, Texas",
    year: 1984,
    director: "Wim Wenders",
    ownedFormat: "Blu-ray",
    ownedEdition: "2010 First Blu-ray Pressing",
    ownedLabel: "The Criterion Collection (Spine #501 BD)",
    barcode: "715515055413",
    conditionNotes: "2010 2K transfer; lacks the 40th Anniversary 4K Dolby Vision restoration",
    importSource: "Blu-ray.com CSV",
    matchedReleaseId: "cc-paris-texas-4k",
    addedAt: "2026-10-29T09:15:00Z",
  },
  {
    id: "owned-seven-samurai-4k-sdr",
    title: "Seven Samurai",
    year: 1954,
    director: "Akira Kurosawa",
    ownedFormat: "Blu-ray",
    ownedEdition: "2010 3-Disc Blu-ray Digipak",
    ownedLabel: "The Criterion Collection (Spine #2)",
    barcode: "715515060325",
    conditionNotes: "Older 1080p high-definition transfer; looking to upgrade to BFI's Dolby Vision + HDR10+ 4K rigid box",
    importSource: "Blu-ray.com CSV",
    matchedReleaseId: "bfi-seven-samurai-4k-box",
    addedAt: "2026-10-29T09:15:00Z",
  },
  {
    id: "owned-beyond-dvd",
    title: "The Beyond",
    year: 1981,
    director: "Lucio Fulci",
    ownedFormat: "DVD",
    ownedEdition: "Limited Tin Box DVD (2000)",
    ownedLabel: "Anchor Bay Entertainment",
    barcode: "013131127898",
    conditionNotes: "Classic Anchor Bay tin, but video master is 25-year-old standard definition",
    importSource: "CLZ Movies",
    matchedReleaseId: "grindhouse-the-beyond-4k-deluxe",
    addedAt: "2026-10-29T09:15:00Z",
  },
  {
    id: "owned-crimson-peak-bd",
    title: "Crimson Peak",
    year: 2015,
    director: "Guillermo del Toro",
    ownedFormat: "Blu-ray",
    ownedEdition: "Standard Retail Eco-Case Blu-ray",
    ownedLabel: "Universal Pictures Home Entertainment",
    barcode: "025192268458",
    conditionNotes: "Barebones studio eco-case; missing Arrow's 80-page Guy Davis book and 4K Dolby Vision transfer",
    importSource: "CLZ Movies",
    matchedReleaseId: "arrow-crimson-peak-4k-box",
    addedAt: "2026-10-29T09:15:00Z",
  },
  {
    id: "owned-midsommar-retail-bd",
    title: "Midsommar",
    year: 2019,
    director: "Ari Aster",
    ownedFormat: "Blu-ray",
    ownedEdition: "148-Min Theatrical Cut Retail Keepcase Blu-ray",
    ownedLabel: "Lionsgate Home Entertainment",
    barcode: "031398309024",
    conditionNotes: "1080p SDR Theatrical Cut only; missing Ari Aster's 171-min Director's Cut and A24's 4K Dolby Vision Clothbound Book",
    importSource: "CLZ Movies",
    matchedReleaseId: "a24-midsommar-directors-cut-4k",
    addedAt: "2026-10-30T12:00:00Z",
  },
  {
    id: "owned-possession-dvd-unmatched",
    title: "Possession",
    year: 1981,
    director: "Andrzej Żuławski",
    ownedFormat: "DVD",
    ownedEdition: "Standard US Cut DVD",
    ownedLabel: "Anchor Bay Entertainment",
    barcode: "013131109290",
    conditionNotes: "Heavily cut 81-minute US theatrical edit on SD DVD — desperately needs uncut 4K boutique upgrade",
    importSource: "CLZ Movies",
    matchedReleaseId: undefined,
    addedAt: "2026-10-30T18:00:00Z",
  },
];

export const CLZ_SAMPLE_CSV_EXPORT = `Title,Release Year,Director,Format,Edition,Label,Barcode,Notes
"The Hitcher",1986,"Robert Harmon","DVD","Snap-Case Letterbox DVD","HBO Home Video","026359167829","Non-anamorphic 4:3 letterbox transfer"
"eXistenZ",1999,"David Cronenberg","DVD","Standard Amaray DVD","Dimension Home Video","717951004536","Early MPEG-2 SD transfer"
"They Live",1988,"John Carpenter","Blu-ray","2012 Collector's Edition (No Slip)","Scream Factory","826663136678","Older 1080p scan without Dolby Vision"
"To Live and Die in L.A.",1985,"William Friedkin","DVD","Special Edition DVD","MGM","027616885425","Old SD color timing before Friedkin 4K restoration"
"Paris, Texas",1984,"Wim Wenders","Blu-ray","2010 Blu-ray Digipak","Criterion Collection","715515055413","Older 2K restoration"
"Opera",1987,"Dario Argento","DVD","Limited Edition 2-Disc DVD","Anchor Bay","013131144291","Standard definition master with cut English track"
"Police Story",1985,"Jackie Chan","DVD","Dragon Dynasty DVD","Weinstein / Dragon Dynasty","796019801997","480i transfer with dubbed English mono"
"The Beyond",1981,"Lucio Fulci","DVD","Anchor Bay Tin Box DVD","Anchor Bay","013131127898","Legacy SD transfer"
"Dog Soldiers",2002,"Neil Marshall","DVD","Widescreen Keepcase DVD","Artisan Entertainment","012236133476","Soft NTSC DVD transfer — needs Second Sight 4K"`;

export function normalizeFilmTitle(rawTitle: string): string {
  return rawTitle
    .toLowerCase()
    .replace(/\(\d{4}(?:–\d{4})?\)/g, "")
    .replace(/—.*$/g, "")
    .replace(/-.*limited.*$/i, "")
    .replace(/the\s+/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

export function findMatchingCatalogRelease(
  ownedTitle: string,
  catalog: BoutiqueRelease[]
): BoutiqueRelease | undefined {
  const normOwned = normalizeFilmTitle(ownedTitle);
  if (!normOwned) return undefined;

  return catalog.find((release) => {
    const normRelease = normalizeFilmTitle(release.title);
    return (
      normRelease === normOwned ||
      normRelease.includes(normOwned) ||
      normOwned.includes(normRelease)
    );
  });
}

export function assessUpgradeUrgency(
  owned: OwnedDiscItem,
  targetRelease: BoutiqueRelease
): UpgradeUrgencyAssessment {
  const targetFormat = targetRelease.technicalSpecs.format;
  const targetHdr = targetRelease.technicalSpecs.hdr;

  // 1. Format & A/V Transfer Leap (Max 35 points)
  let formatPoints = 10;
  let formatLeapLabel = `${owned.ownedFormat} → ${targetFormat}`;

  if (owned.ownedFormat === "VHS / LaserDisc" || owned.ownedFormat === "DVD") {
    if (targetFormat.includes("4K UHD")) {
      formatPoints = 35;
      formatLeapLabel = `${owned.ownedFormat} (480i SD) → 4K UHD (${
        targetHdr.includes("Dolby Vision") ? "Dolby Vision" : "HDR10"
      })`;
    } else {
      formatPoints = 26;
      formatLeapLabel = `${owned.ownedFormat} (480i SD) → 1080p Restored Blu-ray`;
    }
  } else if (owned.ownedFormat === "Blu-ray") {
    if (targetFormat.includes("4K UHD")) {
      if (targetHdr.includes("Dolby Vision")) {
        formatPoints = 25;
        formatLeapLabel = `1080p SDR Blu-ray → 4K UHD Dolby Vision`;
      } else {
        formatPoints = 21;
        formatLeapLabel = `1080p SDR Blu-ray → 4K UHD HDR10`;
      }
    } else {
      formatPoints = 12;
      formatLeapLabel = `Standard Blu-ray → Boutique Restored Blu-ray`;
    }
  } else if (owned.ownedFormat === "4K UHD") {
    if (targetHdr.includes("Dolby Vision")) {
      formatPoints = 16;
      formatLeapLabel = `4K SDR / Standard → 4K Dolby Vision Reference Master`;
    } else {
      formatPoints = 10;
      formatLeapLabel = `4K Standard → Boutique Collector Edition`;
    }
  }

  // 2. Packaging & Archival Supplement Leap (Max 20 points)
  let packagingPoints = 10;
  let packagingLeapLabel = `${owned.ownedEdition} → ${targetRelease.editionType}`;

  if (targetRelease.editionType === "Rigid Box Set") {
    packagingPoints = 20;
    packagingLeapLabel = `${owned.ownedEdition} → Deluxe Rigid Slipcase + Hardback Book`;
  } else if (targetRelease.editionType === "Boutique Steelbook") {
    packagingPoints = 16;
    packagingLeapLabel = `${owned.ownedEdition} → Debossed Boutique 4K Steelbook`;
  } else if (
    targetRelease.editionType === "Limited Slipcover" ||
    targetRelease.editionType === "Archival Digipak"
  ) {
    packagingPoints = 15;
    packagingLeapLabel = `${owned.ownedEdition} → ${targetRelease.editionType}`;
  }

  // 3. Print-Run Scarcity & OOP Risk (Max 25 points)
  let scarcityPoints = 8;
  let scarcityReason = "In-print catalog edition";

  const slipStatus = targetRelease.printRun.slipcoverStatus;
  const remaining = targetRelease.printRun.remainingEstimate ?? 9999;
  const total = targetRelease.printRun.totalUnits ?? 10000;

  if (
    slipStatus.includes("Low") ||
    slipStatus.includes("Near OOP") ||
    remaining <= 250
  ) {
    scarcityPoints = 25;
    scarcityReason = `${slipStatus} (${remaining.toLocaleString()} / ${total.toLocaleString()} left before OOP)`;
  } else if (remaining <= 650 || targetRelease.releaseStatus === "Recent Restock") {
    scarcityPoints = 18;
    scarcityReason = `Limited Print Run (${remaining.toLocaleString()} units left · ${targetRelease.releaseStatus})`;
  } else if (targetRelease.printRun.limited) {
    scarcityPoints = 12;
    scarcityReason = `Limited Pressing (${remaining.toLocaleString()} / ${total.toLocaleString()} est.)`;
  }

  // 4. Live Retailer Pricing & Target Arbitrage (Max 20 points)
  let pricePoints = 5;
  let priceReason = "Currently above target buy threshold";

  const inStockOffers = targetRelease.retailerListings.filter((o) => o.inStock);
  const bestOffer =
    inStockOffers.length > 0
      ? inStockOffers.reduce((min, o) => (o.price < min.price ? o : min), inStockOffers[0])
      : targetRelease.retailerListings[0];

  if (bestOffer && bestOffer.inStock) {
    const discountPct = Math.round(
      ((targetRelease.msrp - bestOffer.price) / targetRelease.msrp) * 100
    );
    if (bestOffer.price <= targetRelease.wishlist.targetPrice) {
      pricePoints = 20;
      priceReason = `$${bestOffer.price.toFixed(2)} at ${
        bestOffer.retailer
      } (-${discountPct}% vs MSRP) — Below your $${targetRelease.wishlist.targetPrice.toFixed(
        2
      )} target`;
    } else if (bestOffer.isSale || discountPct >= 30) {
      pricePoints = 14;
      priceReason = `Active Sale: $${bestOffer.price.toFixed(2)} at ${bestOffer.retailer} (-${discountPct}% off MSRP)`;
    } else {
      pricePoints = 8;
      priceReason = `Best in-stock price: $${bestOffer.price.toFixed(2)} at ${bestOffer.retailer}`;
    }
  }

  const totalScore = Math.min(
    100,
    formatPoints + packagingPoints + scarcityPoints + pricePoints
  );

  let tier: UpgradeUrgencyTier = "Low — Marginal / Sidegrade";
  if (totalScore >= 78) {
    tier = "Critical — Act Immediately";
  } else if (totalScore >= 58) {
    tier = "High — Priority Upgrade";
  } else if (totalScore >= 38) {
    tier = "Moderate — Wait for 50% Sale";
  }

  const synthesis = `${
    owned.ownedFormat === "DVD"
      ? "Generational A/V leap from 480i DVD"
      : "Significant transfer & packaging upgrade"
  } to ${targetRelease.label}'s ${targetRelease.editionType}. ${scarcityReason}. ${priceReason}.`;

  return {
    totalScore,
    tier,
    formatLeapLabel,
    packagingLeapLabel,
    formatPoints,
    packagingPoints,
    scarcityPoints,
    pricePoints,
    scarcityReason,
    priceReason,
    synthesis,
  };
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if ((ch === "," || ch === "\t") && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function normalizeOwnedFormat(raw: string): OwnedFormat {
  const upper = raw.toUpperCase();
  if (upper.includes("4K") || upper.includes("UHD")) return "4K UHD";
  if (upper.includes("BLU") || upper.includes("BD")) return "Blu-ray";
  if (upper.includes("VHS") || upper.includes("LASER") || upper.includes("LD"))
    return "VHS / LaserDisc";
  return "DVD";
}

export function parseCollectionImportText(
  rawText: string,
  sourceType: ImportSourceType,
  catalog: BoutiqueRelease[]
): OwnedDiscItem[] {
  const trimmed = rawText.trim();
  if (!trimmed) return [];

  // Support XML from CLZ Movies export if pasted/uploaded
  if (trimmed.startsWith("<")) {
    const movieBlocks = trimmed.match(/<movie[\s\S]*?<\/movie>/gi) || [];
    return movieBlocks.map((block, idx) => {
      const getTag = (tag: string) => {
        const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
        return m ? m[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim() : "";
      };
      const title = getTag("title") || getTag("maintitle") || `Imported Film #${idx + 1}`;
      const year = parseInt(getTag("releaseyear") || getTag("year") || "1985", 10) || 1985;
      const format = normalizeOwnedFormat(getTag("format") || "DVD");
      const edition = getTag("edition") || getTag("packaging") || "Standard Edition";
      const label = getTag("label") || getTag("studio") || "Studio Home Video";
      const barcode = getTag("barcode") || getTag("upc") || undefined;
      const notes = getTag("notes") || "Imported from CLZ Movies XML";
      const matched = findMatchingCatalogRelease(title, catalog);

      return {
        id: `clz-xml-${Date.now()}-${idx}`,
        title,
        year,
        director: getTag("director") || matched?.director,
        ownedFormat: format,
        ownedEdition: edition,
        ownedLabel: label,
        barcode,
        conditionNotes: notes,
        importSource: "CLZ Movies",
        matchedReleaseId: matched?.id,
        addedAt: new Date().toISOString(),
      };
    });
  }

  // Standard CSV / TSV parsing (CLZ Movies, Blu-ray.com, Letterboxd)
  const lines = trimmed
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  const firstRow = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const hasHeader =
    firstRow.some((h) => h.includes("title") || h.includes("name") || h.includes("movie")) ||
    firstRow.some((h) => h.includes("format") || h.includes("year"));

  const headerMap = {
    title: firstRow.findIndex(
      (h) => h === "title" || h === "name" || h === "movie title" || h === "sort title"
    ),
    year: firstRow.findIndex(
      (h) => h.includes("year") || h === "released" || h === "production year"
    ),
    director: firstRow.findIndex((h) => h.includes("director")),
    format: firstRow.findIndex((h) => h.includes("format") || h.includes("media")),
    edition: firstRow.findIndex(
      (h) => h.includes("edition") || h.includes("packaging") || h.includes("case")
    ),
    label: firstRow.findIndex(
      (h) =>
        h.includes("label") ||
        h.includes("studio") ||
        h.includes("publisher") ||
        h.includes("distributor")
    ),
    barcode: firstRow.findIndex((h) => h.includes("barcode") || h.includes("upc") || h.includes("ean")),
    notes: firstRow.findIndex(
      (h) => h.includes("note") || h.includes("comment") || h.includes("condition")
    ),
  };

  const dataLines = hasHeader ? lines.slice(1) : lines;
  const parsedItems: OwnedDiscItem[] = [];

  dataLines.forEach((line, idx) => {
    const cols = parseCsvLine(line);
    if (cols.length === 0 || !cols[0]) return;

    const getCol = (mappedIdx: number, fallbackIdx: number) => {
      if (hasHeader && mappedIdx >= 0 && cols[mappedIdx] !== undefined) {
        return cols[mappedIdx];
      }
      if (!hasHeader && cols[fallbackIdx] !== undefined) {
        return cols[fallbackIdx];
      }
      return "";
    };

    const rawTitle = getCol(headerMap.title, 0);
    if (!rawTitle) return;

    const matched = findMatchingCatalogRelease(rawTitle, catalog);
    const rawYear = getCol(headerMap.year, 1);
    const year = parseInt(rawYear, 10) || matched?.year || 1985;
    const director = getCol(headerMap.director, 2) || matched?.director || "Archival";
    const rawFormat = getCol(headerMap.format, 3) || "DVD";
    const ownedFormat = normalizeOwnedFormat(rawFormat);
    const ownedEdition =
      getCol(headerMap.edition, 4) || `Standard ${ownedFormat} Case`;
    const ownedLabel =
      getCol(headerMap.label, 5) || "Studio Home Video Release";
    const barcode = getCol(headerMap.barcode, 6) || undefined;
    const conditionNotes =
      getCol(headerMap.notes, 7) ||
      `Imported via ${sourceType} — ready for upgrade urgency evaluation`;

    parsedItems.push({
      id: `import-${Date.now()}-${idx}`,
      title: rawTitle,
      year,
      director,
      ownedFormat,
      ownedEdition,
      ownedLabel,
      barcode,
      conditionNotes,
      importSource: sourceType,
      matchedReleaseId: matched?.id,
      addedAt: new Date().toISOString(),
    });
  });

  return parsedItems;
}
