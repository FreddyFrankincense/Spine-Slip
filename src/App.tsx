import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Search,
  RefreshCw,
  Bookmark,
  ExternalLink,
  Disc,
  CheckCircle2,
} from "lucide-react";
import {
  BoutiqueLabel,
  BoutiqueRelease,
  DiscFormat,
  EditionPackaging,
  HdrFormat,
  OwnedDiscItem,
  OwnedFormat,
  PriceDropAlertItem,
  RegionCode,
  RetailerOffer,
  VerifiedPromoCode,
  WishlistPriority,
} from "./types";
import {
  BOUTIQUE_LABEL_PROFILES,
  BOUTIQUE_SALE_EVENTS,
  EDITION_IMAGES,
  HERO_VAULT_IMAGE,
  INITIAL_BOUTIQUE_CATALOG,
} from "./data/catalog";
import {
  computeEffectiveOfferWithPromo,
  INITIAL_VERIFIED_PROMO_CODES,
} from "./data/promoCodes";
import { EditionDossierDrawer, LiveReconModal } from "./components/VaultModals";
import { UpgradeShelfView } from "./components/UpgradeShelfView";
import { DiscContentsAccordion } from "./components/DiscContentsAccordion";
import {
  BrowserPermissionState,
  dispatchNativeBrowserNotification,
  getBrowserNotificationStatus,
  LiveBrowserAlertStack,
  playArchivalAlertChime,
  PriceAlertCenterDrawer,
  PriceAlertControlBar,
} from "./components/PriceDropAlertSystem";
import { CollectionInsightsSection } from "./components/CollectionInsightsSection";
import { PromoCodeTrackerPanel } from "./components/PromoCodeTrackerPanel";
import {
  assessUpgradeUrgency,
  findMatchingCatalogRelease,
  INITIAL_OWNED_COLLECTION,
} from "./utils/upgradeUrgency";

type ActiveView = "radar" | "wishlist" | "upgrades" | "labels" | "calendar";
type RadarQuickFilter =
  | "all"
  | "upgrades"
  | "below-target"
  | "low-stock"
  | "restock"
  | "big-box-deals"
  | "discrepancy-alerts";

const STORAGE_KEY = "spine_and_slip_vault_v3";
const OWNED_STORAGE_KEY = "spine_and_slip_owned_shelf_v2";
const ALERTS_STORAGE_KEY = "spine_and_slip_price_alerts_v1";
const PROMOS_STORAGE_KEY = "spine_and_slip_promo_codes_v1";

function getBestInStockOffer(release: BoutiqueRelease): RetailerOffer {
  const inStock = release.retailerListings.filter((r) => r.inStock);
  if (inStock.length > 0) {
    return inStock.reduce((min, o) => (o.price < min.price ? o : min), inStock[0]);
  }
  return release.retailerListings[0];
}

function getBestOfferByCategory(
  release: BoutiqueRelease,
  category: RetailerOffer["retailerCategory"]
): RetailerOffer | undefined {
  const matches = release.retailerListings.filter(
    (r) => r.retailerCategory === category && r.inStock
  );
  if (matches.length === 0) {
    return release.retailerListings.find((r) => r.retailerCategory === category);
  }
  return matches.reduce((min, o) => (o.price < min.price ? o : min), matches[0]);
}

const ReleaseCoverImage: React.FC<{
  src: string;
  alt: string;
  spine: string;
  title: string;
}> = ({ src, alt, spine, title }) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-5 text-center bg-gradient-to-b from-[#1A1A22] to-[#0A0A0C]">
        <Disc className="w-9 h-9 text-amber-500/80 mb-2" />
        <span className="font-mono text-xs text-amber-400">{spine}</span>
        <span className="font-display text-sm text-[#F4F4F6] mt-1 line-clamp-2">
          {title}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="w-full h-full object-cover transition-transform duration-150 group-hover:scale-[1.02]"
    />
  );
};

export default function App() {
  const [catalog, setCatalog] = useState<BoutiqueRelease[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback to curated catalog
    }
    return INITIAL_BOUTIQUE_CATALOG;
  });

  const [ownedDiscs, setOwnedDiscs] = useState<OwnedDiscItem[]>(() => {
    try {
      const saved = localStorage.getItem(OWNED_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback to initial owned shelf
    }
    return INITIAL_OWNED_COLLECTION;
  });

  const [activeView, setActiveView] = useState<ActiveView>("radar");
  const [searchQuery, setSearchQuery] = useState("");
  const [quickFilter, setQuickFilter] = useState<RadarQuickFilter>("all");
  const [selectedLabel, setSelectedLabel] = useState<string>("All Labels");
  const [selectedPackaging, setSelectedPackaging] = useState<string>("All Packaging");
  const [selectedSpecFilter, setSelectedSpecFilter] = useState<string>("All Specs");
  const [wishlistPriorityFilter, setWishlistPriorityFilter] = useState<string>("All");
  const [wishlistSortByUrgency, setWishlistSortByUrgency] = useState<boolean>(true);

  const [selectedReleaseId, setSelectedReleaseId] = useState<string | null>(null);
  const [isReconModalOpen, setIsReconModalOpen] = useState(false);
  const [reconModalInitialLabel, setReconModalInitialLabel] = useState<string>("");
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [discoveringOwnedId, setDiscoveringOwnedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [spotlightId, setSpotlightId] = useState<string>("ss-the-hitcher-4k-le");

  // Local Wishlist Price-Drop Notification System State
  const [priceAlerts, setPriceAlerts] = useState<PriceDropAlertItem[]>(() => {
    try {
      const saved = localStorage.getItem(ALERTS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore storage error
    }
    return [];
  });
  const [activeAlertPopups, setActiveAlertPopups] = useState<PriceDropAlertItem[]>([]);
  const [isAlertDrawerOpen, setIsAlertDrawerOpen] = useState(false);
  const [browserPermission, setBrowserPermission] = useState<BrowserPermissionState>(() =>
    getBrowserNotificationStatus()
  );
  const [alertSoundEnabled, setAlertSoundEnabled] = useState<boolean>(true);
  const pendingTriggerSourceRef = useRef<PriceDropAlertItem["triggerSource"]>(
    "Wishlist Threshold Match"
  );
  const hasInitializedAlertsRef = useRef<boolean>(false);

  // Verified Promo & Ad Campaign Code Tracker State
  const [promoCodes, setPromoCodes] = useState<VerifiedPromoCode[]>(() => {
    try {
      const saved = localStorage.getItem(PROMOS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Ignore storage error
    }
    return INITIAL_VERIFIED_PROMO_CODES;
  });
  const [applyPromoMath, setApplyPromoMath] = useState<boolean>(true);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(catalog));
    } catch {
      // Ignore storage quota errors
    }
  }, [catalog]);

  useEffect(() => {
    try {
      localStorage.setItem(OWNED_STORAGE_KEY, JSON.stringify(ownedDiscs));
    } catch {
      // Ignore storage quota errors
    }
  }, [ownedDiscs]);

  useEffect(() => {
    try {
      localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(priceAlerts));
    } catch {
      // Ignore storage quota errors
    }
  }, [priceAlerts]);

  useEffect(() => {
    try {
      localStorage.setItem(PROMOS_STORAGE_KEY, JSON.stringify(promoCodes));
    } catch {
      // Ignore storage quota errors
    }
  }, [promoCodes]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  // Automatic Local Price-Drop Watcher: Fires whenever a wishlisted item meets or drops below its target price (including After-Code Net Prices)
  useEffect(() => {
    const knownKeys = new Set(priceAlerts.map((a) => a.dedupeKey));
    const newlyTriggered: PriceDropAlertItem[] = [];
    const currentSource = pendingTriggerSourceRef.current;

    catalog.forEach((item) => {
      if (!item.wishlist.isWishlisted) return;
      const inStockOffers = item.retailerListings.filter((r) => r.inStock);
      if (inStockOffers.length === 0) return;

      // Find the offer with the lowest effective net price (accounting for verified promo codes when enabled)
      let bestOffer = inStockOffers[0];
      let bestEffectivePrice = bestOffer.price;
      let bestAppliedCode: string | undefined;

      inStockOffers.forEach((offer) => {
        const eff = computeEffectiveOfferWithPromo(
          offer,
          item.editionType,
          promoCodes,
          applyPromoMath
        );
        if (eff.netPrice < bestEffectivePrice) {
          bestEffectivePrice = eff.netPrice;
          bestOffer = offer;
          bestAppliedCode = eff.appliedPromo?.code;
        }
      });

      if (bestEffectivePrice <= item.wishlist.targetPrice) {
        const dedupeKey = `${item.id}-${bestOffer.retailer}-${bestEffectivePrice.toFixed(
          2
        )}-${item.wishlist.targetPrice.toFixed(2)}-${bestAppliedCode || "base"}`;

        if (!knownKeys.has(dedupeKey)) {
          const savingsBelowTarget = Math.max(
            0,
            Number((item.wishlist.targetPrice - bestEffectivePrice).toFixed(2))
          );
          const discountPctOffMsrp = Math.max(
            0,
            Math.round(((item.msrp - bestEffectivePrice) / item.msrp) * 100)
          );

          newlyTriggered.push({
            id: `alert-${item.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            dedupeKey,
            releaseId: item.id,
            title: item.title,
            label: item.label,
            spineNumber: item.spineNumber,
            editionType: item.editionType,
            retailer: bestAppliedCode
              ? `${bestOffer.retailer} (w/ ${bestAppliedCode})`
              : bestOffer.retailer,
            retailerUrl: bestOffer.url,
            offerPrice: bestEffectivePrice,
            targetPrice: item.wishlist.targetPrice,
            msrp: item.msrp,
            savingsBelowTarget,
            discountPctOffMsrp,
            slipcoverStatus: item.printRun.slipcoverStatus,
            triggeredAt: new Date().toISOString(),
            triggerSource: bestAppliedCode ? "Verified Promo Code" : currentSource,
            appliedPromoCode: bestAppliedCode,
            isRead: false,
          });
        }
      }
    });

    pendingTriggerSourceRef.current = "Wishlist Threshold Match";

    if (newlyTriggered.length > 0) {
      setPriceAlerts((prev) => [...newlyTriggered, ...prev]);

      const popupsToShow = !hasInitializedAlertsRef.current
        ? newlyTriggered.slice(0, 1)
        : newlyTriggered;

      setActiveAlertPopups((prev) => [...popupsToShow, ...prev].slice(0, 4));

      if (hasInitializedAlertsRef.current && alertSoundEnabled) {
        playArchivalAlertChime();
      }

      popupsToShow.forEach((alertItem) => {
        dispatchNativeBrowserNotification(alertItem, (releaseId) => {
          setSelectedReleaseId(releaseId);
        });
      });
    }

    hasInitializedAlertsRef.current = true;
  }, [catalog, priceAlerts, alertSoundEnabled, promoCodes, applyPromoMath]);

  const handleTogglePromoCodeActive = (id: string) => {
    setPromoCodes((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p))
    );
    showToast("Updated verified promo code status and recalculated net prices.");
  };

  const handleVerifyCodeWorked = (id: string) => {
    setPromoCodes((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              isActive: true,
              verifiedCount: p.verifiedCount + 1,
              lastVerifiedAt: "Verified just now",
            }
          : p
      )
    );
    showToast("Logged checkout confirmation for promo code.");
  };

  const handleAddDiscoveredCodes = (newCodes: VerifiedPromoCode[]) => {
    setPromoCodes((prev) => {
      const existingCodes = new Set(
        prev.map((p) => `${p.retailer.toLowerCase()}-${p.code.toUpperCase()}`)
      );
      const unique = newCodes.filter(
        (c) => !existingCodes.has(`${c.retailer.toLowerCase()}-${c.code.toUpperCase()}`)
      );
      return [...unique, ...prev];
    });
    showToast(
      `Verified ${newCodes.length} promo campaign code${
        newCodes.length === 1 ? "" : "s"
      } from allowlisted sources.`
    );
  };

  const handleRequestBrowserPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setBrowserPermission("unsupported");
      showToast("Native Push unsupported in this browser — Local Alert Popups active.");
      return;
    }

    try {
      const result = await window.Notification.requestPermission();
      if (result === "granted") {
        setBrowserPermission("granted");
        if (alertSoundEnabled) playArchivalAlertChime();
        showToast("Browser Push Notifications enabled for Wishlist Target Prices!");
      } else {
        setBrowserPermission("iframe-fallback");
        showToast("Preview iframe restricted OS Push — Local Browser Alert Banner & Chime active!");
      }
    } catch {
      setBrowserPermission("iframe-fallback");
      showToast("Local Browser Alert Banner & Audio Chime enabled!");
    }
  };

  const handleSimulateFlashPriceDrop = () => {
    // Pick a wishlisted item currently above target price, or fallback to the first wishlisted item
    const aboveTargetCandidates = catalog.filter((r) => {
      if (!r.wishlist.isWishlisted) return false;
      const best = getBestInStockOffer(r);
      return best && best.price > r.wishlist.targetPrice;
    });

    const targetItem =
      aboveTargetCandidates[0] ||
      catalog.find((r) => r.wishlist.isWishlisted) ||
      catalog[0];

    if (!targetItem) return;

    const currentBest = getBestInStockOffer(targetItem);
    const newFlashPrice = Math.max(
      14.99,
      Number((targetItem.wishlist.targetPrice - 2.5).toFixed(2))
    );

    pendingTriggerSourceRef.current = "Flash Price Drop";

    setCatalog((prev) =>
      prev.map((item) => {
        if (item.id !== targetItem.id) return item;
        const updatedOffers = item.retailerListings.map((offer, idx) => {
          if (offer.retailer === currentBest.retailer || idx === 0) {
            return {
              ...offer,
              previousPrice: offer.price,
              price: newFlashPrice,
              inStock: true,
              isSale: true,
              lastChecked: "Just now (Flash Drop)",
              stockNote: `FLASH PRICE DROP! Now $${newFlashPrice.toFixed(
                2
              )} (Below your $${item.wishlist.targetPrice.toFixed(2)} target)`,
            };
          }
          return offer;
        });

        return {
          ...item,
          releaseStatus: "Flash Sale",
          wishlist: {
            ...item.wishlist,
            isWishlisted: true,
          },
          retailerListings: updatedOffers,
        };
      })
    );
  };

  const handleReevaluateAllThresholds = () => {
    const qualifying = catalog.filter((r) => {
      if (!r.wishlist.isWishlisted) return false;
      const best = getBestInStockOffer(r);
      return best && best.inStock && best.price <= r.wishlist.targetPrice;
    });

    if (qualifying.length === 0) {
      showToast("No wishlisted items are currently at or below target price.");
      return;
    }

    const topMatch = qualifying[0];
    const bestOffer = getBestInStockOffer(topMatch);
    const savingsBelowTarget = Math.max(
      0,
      Number((topMatch.wishlist.targetPrice - bestOffer.price).toFixed(2))
    );
    const discountPctOffMsrp = Math.max(
      0,
      Math.round(((topMatch.msrp - bestOffer.price) / topMatch.msrp) * 100)
    );

    const testAlert: PriceDropAlertItem = {
      id: `manual-check-${topMatch.id}-${Date.now()}`,
      dedupeKey: `${topMatch.id}-${bestOffer.retailer}-${bestOffer.price.toFixed(
        2
      )}-check-${Date.now()}`,
      releaseId: topMatch.id,
      title: topMatch.title,
      label: topMatch.label,
      spineNumber: topMatch.spineNumber,
      editionType: topMatch.editionType,
      retailer: bestOffer.retailer,
      retailerUrl: bestOffer.url,
      offerPrice: bestOffer.price,
      targetPrice: topMatch.wishlist.targetPrice,
      msrp: topMatch.msrp,
      savingsBelowTarget,
      discountPctOffMsrp,
      slipcoverStatus: topMatch.printRun.slipcoverStatus,
      triggeredAt: new Date().toISOString(),
      triggerSource: "Wishlist Threshold Match",
      isRead: false,
    };

    setActiveAlertPopups((prev) => [testAlert, ...prev].slice(0, 4));
    if (alertSoundEnabled) {
      playArchivalAlertChime();
    }
    dispatchNativeBrowserNotification(testAlert, (releaseId) => {
      setSelectedReleaseId(releaseId);
    });
    showToast(
      `Verified ${qualifying.length} wishlist edition${
        qualifying.length === 1 ? "" : "s"
      } currently at or below target price!`
    );
  };

  // Map releaseId -> OwnedDiscItem for fast lookup across Radar, Wishlist, and Dossier
  const ownedByReleaseId = useMemo(() => {
    const map = new Map<string, OwnedDiscItem>();
    ownedDiscs.forEach((owned) => {
      if (owned.matchedReleaseId) {
        map.set(owned.matchedReleaseId, owned);
      } else {
        const matched = findMatchingCatalogRelease(owned.title, catalog);
        if (matched) {
          map.set(matched.id, owned);
        }
      }
    });
    return map;
  }, [ownedDiscs, catalog]);

  const selectedRelease = useMemo(
    () => catalog.find((r) => r.id === selectedReleaseId) || null,
    [catalog, selectedReleaseId]
  );

  const spotlightRelease = useMemo(
    () => catalog.find((r) => r.id === spotlightId) || catalog[0],
    [catalog, spotlightId]
  );

  // Portfolio & Radar KPI Metrics
  const kpiStats = useMemo(() => {
    const wishlisted = catalog.filter((r) => r.wishlist.isWishlisted);
    const grailsCount = wishlisted.filter(
      (r) => r.wishlist.priority === "Critical Grail"
    ).length;

    let targetMetCount = 0;
    let totalWishlistSavingsVsMsrp = 0;

    wishlisted.forEach((r) => {
      const best = getBestInStockOffer(r);
      if (best && best.inStock) {
        if (best.price <= r.wishlist.targetPrice) {
          targetMetCount += 1;
        }
        if (r.msrp > best.price) {
          totalWishlistSavingsVsMsrp += r.msrp - best.price;
        }
      }
    });

    const lowPrintRunCount = catalog.filter(
      (r) =>
        r.printRun.slipcoverStatus.includes("Low") ||
        r.printRun.slipcoverStatus.includes("Near OOP")
    ).length;

    const discrepancyCount = catalog.filter(
      (r) => r.retailerDiscrepancy?.hasDiscrepancy
    ).length;

    let criticalUpgradesCount = 0;
    catalog.forEach((r) => {
      const owned = ownedByReleaseId.get(r.id);
      if (owned) {
        const assessment = assessUpgradeUrgency(owned, r);
        if (assessment.totalScore >= 78) {
          criticalUpgradesCount += 1;
        }
      }
    });

    return {
      wishlistTotal: wishlisted.length,
      grailsCount,
      targetMetCount,
      totalWishlistSavingsVsMsrp,
      lowPrintRunCount,
      discrepancyCount,
      ownedTotal: ownedDiscs.length,
      criticalUpgradesCount,
    };
  }, [catalog, ownedDiscs, ownedByReleaseId]);

  // Filtered Releases for Vault Radar
  const filteredCatalog = useMemo(() => {
    return catalog.filter((item) => {
      const best = getBestInStockOffer(item);
      const isTargetMet =
        best && best.inStock && best.price <= item.wishlist.targetPrice;
      const isLowStock =
        item.printRun.slipcoverStatus.includes("Low") ||
        item.printRun.slipcoverStatus.includes("Near OOP");
      const hasBigBoxDeal = item.retailerListings.some(
        (o) => o.retailerCategory === "Major Retailer" && o.isSale && o.inStock
      );
      const isOwnedUpgrade = ownedByReleaseId.has(item.id);
      const hasDiscrepancyAlert = Boolean(item.retailerDiscrepancy?.hasDiscrepancy);

      if (quickFilter === "upgrades" && !isOwnedUpgrade) return false;
      if (quickFilter === "below-target" && !isTargetMet) return false;
      if (quickFilter === "low-stock" && !isLowStock) return false;
      if (quickFilter === "restock" && item.releaseStatus !== "Recent Restock")
        return false;
      if (quickFilter === "big-box-deals" && !hasBigBoxDeal) return false;
      if (quickFilter === "discrepancy-alerts" && !hasDiscrepancyAlert) return false;

      if (selectedLabel !== "All Labels" && item.label !== selectedLabel)
        return false;

      if (
        selectedPackaging !== "All Packaging" &&
        item.editionType !== selectedPackaging
      )
        return false;

      if (selectedSpecFilter === "4K UHD" && !item.technicalSpecs.format.includes("4K"))
        return false;
      if (
        selectedSpecFilter === "Dolby Vision" &&
        !item.technicalSpecs.hdr.includes("Dolby Vision")
      )
        return false;
      if (
        selectedSpecFilter === "Region Free" &&
        item.technicalSpecs.region !== "Region Free" &&
        item.technicalSpecs.region !== "Region A/B/C"
      )
        return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchDirector = item.director.toLowerCase().includes(q);
        const matchLabel = item.label.toLowerCase().includes(q);
        const matchSpine = item.spineNumber.toLowerCase().includes(q);
        const matchRetailer = item.retailerListings.some((r) =>
          r.retailer.toLowerCase().includes(q)
        );
        const matchCuts = item.discContents?.cutsIncluded.some((c) =>
          c.toLowerCase().includes(q)
        );
        if (
          !matchTitle &&
          !matchDirector &&
          !matchLabel &&
          !matchSpine &&
          !matchRetailer &&
          !matchCuts
        ) {
          return false;
        }
      }

      return true;
    });
  }, [
    catalog,
    quickFilter,
    selectedLabel,
    selectedPackaging,
    selectedSpecFilter,
    searchQuery,
    ownedByReleaseId,
  ]);

  // Wishlisted Items sorted by Upgrade Urgency or Priority Tier
  const wishlistedItems = useMemo(() => {
    const priorityRank: Record<WishlistPriority, number> = {
      "Critical Grail": 1,
      "High Priority": 2,
      "Wait for 50% Sale": 3,
    };
    return catalog
      .filter((r) => {
        if (!r.wishlist.isWishlisted) return false;
        if (
          wishlistPriorityFilter !== "All" &&
          r.wishlist.priority !== wishlistPriorityFilter
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (wishlistSortByUrgency) {
          const ownedA = ownedByReleaseId.get(a.id);
          const ownedB = ownedByReleaseId.get(b.id);
          const scoreA = ownedA ? assessUpgradeUrgency(ownedA, a).totalScore : -1;
          const scoreB = ownedB ? assessUpgradeUrgency(ownedB, b).totalScore : -1;
          if (scoreA !== scoreB) return scoreB - scoreA;
        }
        const rankDiff =
          priorityRank[a.wishlist.priority] - priorityRank[b.wishlist.priority];
        if (rankDiff !== 0) return rankDiff;
        const aBest = getBestInStockOffer(a).price - a.wishlist.targetPrice;
        const bBest = getBestInStockOffer(b).price - b.wishlist.targetPrice;
        return aBest - bBest;
      });
  }, [catalog, wishlistPriorityFilter, wishlistSortByUrgency, ownedByReleaseId]);

  const handleUpdateWishlist = (
    id: string,
    updates: Partial<BoutiqueRelease["wishlist"]>
  ) => {
    setCatalog((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          wishlist: {
            ...item.wishlist,
            ...updates,
          },
        };
      })
    );
    showToast("Updated wishlist settings in collector vault.");
  };

  const handleImportDiscs = (newDiscs: OwnedDiscItem[], replaceAll = false) => {
    setOwnedDiscs((prev) => {
      if (replaceAll) return newDiscs;
      const existingTitles = new Set(
        prev.map((p) => `${p.title.toLowerCase()}-${p.ownedFormat}`)
      );
      const uniqueNew = newDiscs.filter(
        (d) => !existingTitles.has(`${d.title.toLowerCase()}-${d.ownedFormat}`)
      );
      return [...uniqueNew, ...prev];
    });
    showToast(
      `Synced ${newDiscs.length} owned disc${
        newDiscs.length === 1 ? "" : "s"
      } and recalculated upgrade urgency.`
    );
  };

  const handleRemoveOwnedDisc = (id: string) => {
    setOwnedDiscs((prev) => prev.filter((item) => item.id !== id));
    showToast("Removed disc from owned shelf.");
  };

  const handleQuickLogOwnedDisc = (
    release: BoutiqueRelease,
    format: OwnedFormat,
    editionNote: string
  ) => {
    const newOwned: OwnedDiscItem = {
      id: `owned-quick-${Date.now()}`,
      title: release.title.split(" (")[0],
      year: release.year,
      director: release.director,
      ownedFormat: format,
      ownedEdition: editionNote,
      ownedLabel: "Legacy Home Video Release",
      conditionNotes: `Logged from Dossier to track upgrade to ${release.label} ${release.editionType}`,
      importSource: "Manual Shelf Entry",
      matchedReleaseId: release.id,
      addedAt: new Date().toISOString(),
    };
    setOwnedDiscs((prev) => [newOwned, ...prev]);
    handleUpdateWishlist(release.id, {
      isWishlisted: true,
      priority: format === "DVD" ? "Critical Grail" : "High Priority",
    });
    showToast(
      `Logged owned ${format} of "${newOwned.title}" and calculated upgrade urgency.`
    );
  };

  const handlePromoteUpgradeToWishlist = (
    releaseId: string,
    priority: WishlistPriority,
    ownedItem: OwnedDiscItem
  ) => {
    handleUpdateWishlist(releaseId, {
      isWishlisted: true,
      priority,
      notes: `Upgrading from owned ${ownedItem.ownedFormat} (${ownedItem.ownedLabel} - ${ownedItem.ownedEdition}).`,
    });
    showToast(
      `Prioritized "${ownedItem.title}" upgrade as ${priority} on your wishlist.`
    );
  };

  const handleDiscoverBoutiqueUpgrade = async (ownedItem: OwnedDiscItem) => {
    setDiscoveringOwnedId(ownedItem.id);
    try {
      const response = await fetch("/api/radar/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `${ownedItem.title} (${ownedItem.year}) 4K UHD Limited Edition Boutique Blu-ray`,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.release) {
        throw new Error(
          data.error || "Could not locate boutique upgrade via live search."
        );
      }

      const r = data.release;
      const matchedLabel =
        BOUTIQUE_LABEL_PROFILES.find(
          (l) => l.name.toLowerCase() === String(r.label || "").toLowerCase()
        )?.name || "Second Sight Films";

      const newReleaseId = `upgrade-live-${Date.now()}`;
      const newRelease: BoutiqueRelease = {
        id: newReleaseId,
        title: r.title || `${ownedItem.title} (${ownedItem.year}) — 4K Collector's Edition`,
        director: r.director || ownedItem.director || "Archival Restoration",
        year: Number(r.year) || ownedItem.year,
        label: matchedLabel,
        spineNumber: r.spineNumber || "LE-4K",
        editionType: (r.editionType as EditionPackaging) || "Rigid Box Set",
        coverImage: r.editionType?.includes("Steelbook")
          ? EDITION_IMAGES.arrowSteelbook
          : EDITION_IMAGES.secondSightBox,
        technicalSpecs: {
          format: (r.format as DiscFormat) || "4K UHD + Blu-ray",
          hdr: (r.hdr as HdrFormat) || "Dolby Vision / HDR10",
          region: (r.region as RegionCode) || "Region Free",
          audio: r.audio || "Lossless DTS-HD Master Audio",
          transferNote:
            r.collectorNotes ||
            `Definitive boutique upgrade from ${ownedItem.ownedFormat}`,
        },
        printRun: {
          limited: true,
          totalUnits: r.totalUnits || 5000,
          remainingEstimate: r.remainingEstimate || 320,
          slipcoverStatus: r.slipcoverStatus || "Low Slip Stock (<10%)",
        },
        wishlist: {
          isWishlisted: true,
          priority: "Critical Grail",
          targetPrice: Number(r.recommendedTargetPrice) || 39.99,
          requireSlipOrBox: true,
          notes: `Upgrading owned ${ownedItem.ownedFormat} (${ownedItem.ownedLabel}). ${
            r.collectorNotes || ""
          }`,
        },
        msrp: Number(r.msrp) || 54.99,
        releaseStatus: "Recent Restock",
        collectorHighlights: [
          `Direct upgrade from owned ${ownedItem.ownedFormat} (${ownedItem.ownedEdition})`,
          r.collectorNotes || "Verified via Live Search Grounding",
        ],
        discContents: r.discContents || {
          discCountSummary: `${r.format || "4K UHD + Blu-ray"} Collector Set`,
          cutsIncluded: ["Restored 4K Theatrical Cut"],
          commentaries: ["Archival director & historian commentaries"],
          specialFeatures: [
            r.collectorNotes || "Archival interviews and making-of documentary",
          ],
          includedPromoMaterials: [
            `${r.editionType || "Limited Edition"} outer packaging & collector booklet`,
          ],
        },
        retailerDiscrepancy: r.retailerDiscrepancy || {
          hasDiscrepancy: false,
          severity: "Verified Identical",
          affectedRetailers: [],
          summary: "Scraped retailer listings match on disc count and cuts.",
          verificationAdvice: "Verify catalog number and Limited Edition SKU before checkout.",
        },
        earlyPromoPolicy: r.earlyPromoPolicy || {
          sameEditionNumberWarning: true,
          catalogIdentifierNote: `${r.spineNumber || "LE-4K"} shares catalog number across printings`,
          earlyPromoItems: [
            "First-pressing collector booklet & outer slipcase/rigid box",
          ],
          laterRunOmissions:
            "Later print runs and seasonal sales may omit first-pressing slipcovers, booklets, or direct-store posters/pins under the same catalog number.",
          activePromoRetailer: "Check direct boutique label store or DiabolikDVD/OrbitDVD.",
        },
        retailerListings:
          Array.isArray(r.offers) && r.offers.length > 0
            ? r.offers.map((o: any) => ({
                retailer: o.retailer || "DiabolikDVD",
                retailerCategory: o.retailerCategory || "Specialty Stockist",
                price: Number(o.price) || 39.99,
                inStock: Boolean(o.inStock),
                stockNote: o.stockNote || "Live verified listing",
                isSale: Boolean(o.isSale),
                lastChecked: "Just now (Live)",
                url: data.sources?.[0]?.uri || "https://diabolikdvd.com",
                listedDiscCount: o.listedDiscCount || r.discContents?.discCountSummary,
                promoBonusStatus: o.promoBonusStatus || o.stockNote,
                hasListingDiscrepancy: Boolean(o.hasListingDiscrepancy),
              }))
            : [
                {
                  retailer: "DiabolikDVD",
                  retailerCategory: "Specialty Stockist",
                  price: Number(r.recommendedTargetPrice) || 39.99,
                  inStock: true,
                  stockNote: "Verified via Live Upgrade Recon",
                  isSale: true,
                  lastChecked: "Just now",
                  url: "https://diabolikdvd.com",
                  listedDiscCount: r.discContents?.discCountSummary || "4K UHD + Blu-ray Set",
                  promoBonusStatus: "First-pressing Limited Edition confirmed",
                  hasListingDiscrepancy: false,
                },
              ],
        lastLiveScan: {
          reportText: data.groundedSummary,
          summary: r.collectorNotes || "Live upgrade recon completed.",
          discrepancyNote: r.retailerDiscrepancy?.summary,
          earlyPromoNote: r.earlyPromoPolicy?.laterRunOmissions,
          scrapedDiscContents: r.discContents,
          sources: data.sources || [],
          checkedAt: new Date().toISOString(),
        },
      };

      setCatalog((prev) => [newRelease, ...prev]);
      setOwnedDiscs((prev) =>
        prev.map((item) =>
          item.id === ownedItem.id
            ? { ...item, matchedReleaseId: newReleaseId }
            : item
        )
      );
      showToast(
        `Matched "${ownedItem.title}" to ${newRelease.label} ${newRelease.editionType} and computed urgency!`
      );
    } catch (err: any) {
      showToast(err.message || "Could not complete live upgrade discovery.");
    } finally {
      setDiscoveringOwnedId(null);
    }
  };

  const handleTriggerLiveScan = async (release: BoutiqueRelease) => {
    setScanningId(release.id);
    try {
      const response = await fetch("/api/radar/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: release.title,
          label: release.label,
          spineNumber: release.spineNumber,
          editionType: release.editionType,
          format: release.technicalSpecs.format,
          msrp: release.msrp,
          targetPrice: release.wishlist.targetPrice,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Live scan failed.");
      }

      pendingTriggerSourceRef.current = "Live Retailer Scan";

      setCatalog((prev) =>
        prev.map((item) => {
          if (item.id !== release.id) return item;

          let updatedListings = [...item.retailerListings];
          if (Array.isArray(data.offers) && data.offers.length > 0) {
            data.offers.forEach((liveOffer: any) => {
              const existingIdx = updatedListings.findIndex(
                (o) =>
                  o.retailer.toLowerCase() ===
                  String(liveOffer.retailer || "").toLowerCase()
              );
              const formattedOffer: RetailerOffer = {
                retailer: liveOffer.retailer || "Verified Retailer",
                retailerCategory:
                  liveOffer.retailerCategory || "Specialty Stockist",
                price: Number(liveOffer.price) || item.msrp,
                inStock: Boolean(liveOffer.inStock),
                stockNote:
                  liveOffer.stockNote || "Verified via Live Search Grounding",
                isSale: Boolean(liveOffer.isSale),
                lastChecked: "Just now (Live)",
                url:
                  data.sources?.[0]?.uri ||
                  updatedListings[0]?.url ||
                  "https://diabolikdvd.com",
                listedDiscCount:
                  liveOffer.listedDiscCount ||
                  updatedListings[existingIdx]?.listedDiscCount ||
                  item.discContents?.discCountSummary,
                promoBonusStatus:
                  liveOffer.promoBonusStatus ||
                  updatedListings[existingIdx]?.promoBonusStatus ||
                  liveOffer.stockNote,
                hasListingDiscrepancy:
                  typeof liveOffer.hasListingDiscrepancy === "boolean"
                    ? liveOffer.hasListingDiscrepancy
                    : updatedListings[existingIdx]?.hasListingDiscrepancy,
              };
              if (existingIdx >= 0) {
                updatedListings[existingIdx] = {
                  ...updatedListings[existingIdx],
                  ...formattedOffer,
                  previousPrice: updatedListings[existingIdx].price,
                };
              } else {
                updatedListings.unshift(formattedOffer);
              }
            });
          } else {
            updatedListings = updatedListings.map((o) => ({
              ...o,
              lastChecked: "Verified just now",
            }));
          }

          const mergedDiscContents = data.scrapedDiscContents
            ? {
                discCountSummary:
                  data.scrapedDiscContents.discCountSummary ||
                  item.discContents.discCountSummary,
                cutsIncluded:
                  Array.isArray(data.scrapedDiscContents.cutsIncluded) &&
                  data.scrapedDiscContents.cutsIncluded.length > 0
                    ? data.scrapedDiscContents.cutsIncluded
                    : item.discContents.cutsIncluded,
                commentaries:
                  Array.isArray(data.scrapedDiscContents.commentaries) &&
                  data.scrapedDiscContents.commentaries.length > 0
                    ? data.scrapedDiscContents.commentaries
                    : item.discContents.commentaries,
                specialFeatures:
                  Array.isArray(data.scrapedDiscContents.specialFeatures) &&
                  data.scrapedDiscContents.specialFeatures.length > 0
                    ? data.scrapedDiscContents.specialFeatures
                    : item.discContents.specialFeatures,
                includedPromoMaterials:
                  Array.isArray(data.scrapedDiscContents.includedPromoMaterials) &&
                  data.scrapedDiscContents.includedPromoMaterials.length > 0
                    ? data.scrapedDiscContents.includedPromoMaterials
                    : item.discContents.includedPromoMaterials,
              }
            : item.discContents;

          return {
            ...item,
            discContents: mergedDiscContents,
            retailerListings: updatedListings,
            lastLiveScan: {
              reportText: data.reportText,
              summary: data.summary,
              slipcoverAlert: data.slipcoverAlert,
              discrepancyNote: data.discrepancyNote,
              earlyPromoNote: data.earlyPromoNote,
              scrapedDiscContents: data.scrapedDiscContents,
              sources: data.sources || [],
              checkedAt: data.checkedAt || new Date().toISOString(),
            },
          };
        })
      );

      showToast(
        `Scraped live retailer prices, disc contents & promo status for "${release.title}".`
      );
    } catch (err: any) {
      showToast(err.message || "Could not complete live retailer check.");
    } finally {
      setScanningId(null);
    }
  };

  const handleAddRelease = (newRelease: BoutiqueRelease) => {
    setCatalog((prev) => [newRelease, ...prev]);
    setSelectedReleaseId(newRelease.id);
    showToast(`Added "${newRelease.title}" to your Priority Vault.`);
  };

  const handleApplyDiscoveredOffers = (id: string, offers: RetailerOffer[]) => {
    setCatalog((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, retailerListings: offers } : item
      )
    );
    showToast("Applied live retailer pricing to edition.");
  };

  const handleSelectLabelFromDirectory = (labelName: BoutiqueLabel) => {
    setSelectedLabel(labelName);
    setQuickFilter("all");
    setActiveView("radar");
  };

  const spotlightBestOffer = getBestInStockOffer(spotlightRelease);
  const spotlightMeetsTarget =
    spotlightBestOffer &&
    spotlightBestOffer.inStock &&
    spotlightBestOffer.price <= spotlightRelease.wishlist.targetPrice;

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-[#F4F4F6] flex flex-col">
      {/* STRICT 3-ZONE TOP BAR CONTRACT (1-line Brand · 5 single-line nav links · 1 primary CTA) */}
      <header className="sticky top-0 z-40 bg-[#0A0A0C]/95 backdrop-blur-md border-b border-[#232329]">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-8 px-6 py-4">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#vault-radar"
            onClick={(e) => {
              e.preventDefault();
              setActiveView("radar");
            }}
            className="font-display text-xl font-semibold tracking-tight text-[#F4F4F6] whitespace-nowrap shrink-0"
          >
            Spine &amp; Slip
          </a>

          {/* Zone 2: 5 concise single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#9CA3AF]">
            <a
              href="#radar"
              onClick={(e) => {
                e.preventDefault();
                setActiveView("radar");
              }}
              className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                activeView === "radar"
                  ? "text-[#F4F4F6] border-amber-500"
                  : "border-transparent hover:text-[#F4F4F6]"
              }`}
            >
              Vault Radar
            </a>
            <a
              href="#wishlist"
              onClick={(e) => {
                e.preventDefault();
                setActiveView("wishlist");
              }}
              className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                activeView === "wishlist"
                  ? "text-[#F4F4F6] border-amber-500"
                  : "border-transparent hover:text-[#F4F4F6]"
              }`}
            >
              Wishlist Priority
            </a>
            <a
              href="#upgrades"
              onClick={(e) => {
                e.preventDefault();
                setActiveView("upgrades");
              }}
              className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                activeView === "upgrades"
                  ? "text-[#F4F4F6] border-amber-500"
                  : "border-transparent hover:text-[#F4F4F6]"
              }`}
            >
              Upgrade Shelf
            </a>
            <a
              href="#labels"
              onClick={(e) => {
                e.preventDefault();
                setActiveView("labels");
              }}
              className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                activeView === "labels"
                  ? "text-[#F4F4F6] border-amber-500"
                  : "border-transparent hover:text-[#F4F4F6]"
              }`}
            >
              Boutique Labels
            </a>
            <a
              href="#calendar"
              onClick={(e) => {
                e.preventDefault();
                setActiveView("calendar");
              }}
              className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                activeView === "calendar"
                  ? "text-[#F4F4F6] border-amber-500"
                  : "border-transparent hover:text-[#F4F4F6]"
              }`}
            >
              Sale Calendar
            </a>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                setReconModalInitialLabel("");
                setIsReconModalOpen(true);
              }}
              className="px-4 py-2 text-xs font-semibold text-black bg-amber-500 rounded-lg hover:bg-amber-400 transition-colors whitespace-nowrap shrink-0"
            >
              Scan Live Retailers
            </button>
          </div>
        </div>

        {/* Mobile Secondary View Switcher */}
        <div className="flex md:hidden items-center justify-around border-t border-[#232329] px-3 py-2 text-xs font-medium text-[#9CA3AF] overflow-x-auto">
          <button
            onClick={() => setActiveView("radar")}
            className={`whitespace-nowrap shrink-0 py-1 ${
              activeView === "radar" ? "text-amber-400 font-semibold" : ""
            }`}
          >
            Vault Radar
          </button>
          <button
            onClick={() => setActiveView("wishlist")}
            className={`whitespace-nowrap shrink-0 py-1 ${
              activeView === "wishlist" ? "text-amber-400 font-semibold" : ""
            }`}
          >
            Wishlist
          </button>
          <button
            onClick={() => setActiveView("upgrades")}
            className={`whitespace-nowrap shrink-0 py-1 ${
              activeView === "upgrades" ? "text-amber-400 font-semibold" : ""
            }`}
          >
            Upgrade Shelf
          </button>
          <button
            onClick={() => setActiveView("labels")}
            className={`whitespace-nowrap shrink-0 py-1 ${
              activeView === "labels" ? "text-amber-400 font-semibold" : ""
            }`}
          >
            Labels
          </button>
          <button
            onClick={() => setActiveView("calendar")}
            className={`whitespace-nowrap shrink-0 py-1 ${
              activeView === "calendar" ? "text-amber-400 font-semibold" : ""
            }`}
          >
            Calendar
          </button>
        </div>
      </header>

      {/* LIVE BROWSER PRICE-DROP NOTIFICATION POPUP STACK */}
      <LiveBrowserAlertStack
        activePopups={activeAlertPopups}
        onDismissPopup={(id) =>
          setActiveAlertPopups((prev) => prev.filter((p) => p.id !== id))
        }
        onDismissAllPopups={() => setActiveAlertPopups([])}
        onInspectRelease={(releaseId) => setSelectedReleaseId(releaseId)}
        onOpenAlertDrawer={() => setIsAlertDrawerOpen(true)}
      />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#121216] border border-amber-500/60 text-[#F4F4F6] px-4 py-3 rounded-lg shadow-xl flex items-center gap-2.5 text-xs">
          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* MAIN WORKSPACE CONTENT */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-6 py-8 space-y-10">
        {/* HERO SPOTLIGHT & 4-COLUMN COLLECTOR KPI STRIP (Shown on Radar) */}
        {activeView === "radar" && (
          <section className="space-y-6">
            {/* 2-Column Split Spotlight with items-stretch */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Left Column: Active Grail Alert & Edition Briefing */}
              <div className="lg:col-span-7 bg-[#121216] border border-[#232329] rounded-xl p-6 md:p-8 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="text-xs text-[#9CA3AF] flex flex-wrap items-center gap-2">
                    <span className="text-amber-400 font-semibold">
                      Priority Restock &amp; Upgrade Spotlight
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{spotlightRelease.label}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono">{spotlightRelease.spineNumber}</span>
                    <span aria-hidden="true">·</span>
                    <span>{spotlightRelease.editionType}</span>
                  </div>

                  <h1 className="font-display text-3xl md:text-4xl font-semibold text-[#F4F4F6] tracking-tight leading-tight">
                    {spotlightRelease.title}
                  </h1>

                  <p className="text-sm text-[#9CA3AF] max-w-2xl leading-relaxed">
                    {spotlightRelease.technicalSpecs.transferNote}. Tracked across{" "}
                    {BOUTIQUE_LABEL_PROFILES.length} boutique video labels, production
                    company/distributor direct stores (A24, NEON, Lionsgate Limited),
                    DiabolikDVD, OrbitDVD, and major retailers (Gruv / Gruvi, Amazon, B&amp;N,
                    Target) with scraped disc contents, cross-retailer discrepancy alerts, and
                    early promo audits.
                  </p>

                  {/* Clean Zero-Pill Technical Metadata Line */}
                  <div className="pt-1 text-xs text-[#E4E4E7] flex flex-wrap items-center gap-2">
                    <span>{spotlightRelease.technicalSpecs.format}</span>
                    <span aria-hidden="true" className="text-[#9CA3AF]">
                      ·
                    </span>
                    <span>{spotlightRelease.technicalSpecs.hdr}</span>
                    <span aria-hidden="true" className="text-[#9CA3AF]">
                      ·
                    </span>
                    <span>{spotlightRelease.technicalSpecs.region}</span>
                    <span aria-hidden="true" className="text-[#9CA3AF]">
                      ·
                    </span>
                    <span className="text-rose-400 font-medium">
                      {spotlightRelease.printRun.slipcoverStatus} (
                      {spotlightRelease.printRun.remainingEstimate?.toLocaleString()} /{" "}
                      {spotlightRelease.printRun.totalUnits?.toLocaleString()} left)
                    </span>
                  </div>
                </div>

                {/* Price Spread & Action Controls */}
                <div className="mt-8 pt-6 border-t border-[#232329] flex flex-wrap items-end justify-between gap-6">
                  <div className="flex flex-wrap items-center gap-6">
                    <div>
                      <span className="block text-xs text-[#9CA3AF]">
                        Lowest Verified Offer ({spotlightBestOffer.retailer})
                      </span>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="font-mono text-2xl md:text-3xl font-semibold text-emerald-400 tabular-nums">
                          ${spotlightBestOffer.price.toFixed(2)}
                        </span>
                        <span className="font-mono text-xs text-[#9CA3AF] line-through tabular-nums">
                          MSRP ${spotlightRelease.msrp.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="pl-6 border-l border-[#232329]">
                      <span className="block text-xs text-[#9CA3AF]">
                        Your Target Buy Threshold
                      </span>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="font-mono text-xl font-semibold text-[#F4F4F6] tabular-nums">
                          ${spotlightRelease.wishlist.targetPrice.toFixed(2)}
                        </span>
                        <span
                          className={`text-xs font-medium ${
                            spotlightMeetsTarget ? "text-emerald-400" : "text-amber-400"
                          }`}
                        >
                          {spotlightMeetsTarget
                            ? "Below Target — Buy Triggered"
                            : "Monitoring Drop"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedReleaseId(spotlightRelease.id)}
                      className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs rounded-lg transition-colors whitespace-nowrap shrink-0"
                    >
                      Inspect Edition Dossier
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTriggerLiveScan(spotlightRelease)}
                      disabled={scanningId === spotlightRelease.id}
                      className="px-4 py-2.5 bg-[#0A0A0C] hover:bg-[#1A1A22] text-[#F4F4F6] border border-[#232329] font-medium text-xs rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${
                          scanningId === spotlightRelease.id ? "animate-spin text-amber-400" : ""
                        }`}
                      />
                      <span>
                        {scanningId === spotlightRelease.id
                          ? "Scraping Live..."
                          : "Verify Live Prices & Contents"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Archival Collector Box Showcase */}
              <div className="lg:col-span-5 bg-[#121216] border border-[#232329] rounded-xl overflow-hidden relative min-h-[280px]">
                {!heroImgFailed ? (
                  <img
                    src={HERO_VAULT_IMAGE}
                    alt="Limited Edition 4K UHD Rigid Slipcase Box Set"
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgFailed(true)}
                    className="w-full h-full lg:h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-[#181820] to-[#0A0A0C]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent flex flex-col justify-end p-6">
                  <div className="text-xs text-amber-300 font-medium">
                    Quick Spotlight Switcher
                  </div>
                  <p className="text-xs text-[#E4E4E7] mt-0.5 mb-3">
                    Cycle priority grails with active restock or price-drop alerts:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {catalog.slice(0, 4).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSpotlightId(item.id)}
                        className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                          spotlightRelease.id === item.id
                            ? "bg-amber-500 text-black"
                            : "bg-black/70 text-[#F4F4F6] border border-white/15 hover:bg-black"
                        }`}
                      >
                        {item.title.split(" (")[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Full-Width 4-Column Collector KPI Strip Below Hero Split */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                type="button"
                onClick={() => setActiveView("wishlist")}
                className="text-left bg-[#121216] hover:bg-[#17171D] border border-[#232329] rounded-xl p-5 transition-colors"
              >
                <span className="text-xs text-[#9CA3AF] block">
                  Priority Wishlist Vault
                </span>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="font-mono text-2xl font-semibold text-[#F4F4F6] tabular-nums">
                    {kpiStats.wishlistTotal} Editions
                  </span>
                  <span className="text-xs text-amber-400 font-mono tabular-nums">
                    {kpiStats.grailsCount} Critical Grails
                  </span>
                </div>
                <span className="text-xs text-[#9CA3AF] mt-1.5 block">
                  Click to manage target buy thresholds &amp; priority tiers
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setQuickFilter("below-target");
                  setActiveView("radar");
                }}
                className="text-left bg-[#121216] hover:bg-[#17171D] border border-[#232329] rounded-xl p-5 transition-colors"
              >
                <span className="text-xs text-[#9CA3AF] block">
                  Target Price Matches Active
                </span>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="font-mono text-2xl font-semibold text-emerald-400 tabular-nums">
                    {kpiStats.targetMetCount} Ready to Buy
                  </span>
                  <span className="text-xs text-[#E4E4E7] font-mono tabular-nums">
                    -${kpiStats.totalWishlistSavingsVsMsrp.toFixed(0)} vs MSRP
                  </span>
                </div>
                <span className="text-xs text-[#9CA3AF] mt-1.5 block">
                  Editions currently at or below your target price
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveView("upgrades")}
                className="text-left bg-[#121216] hover:bg-[#17171D] border border-[#232329] rounded-xl p-5 transition-colors"
              >
                <span className="text-xs text-[#9CA3AF] block">
                  CLZ / CSV Owned Disc Upgrades
                </span>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="font-mono text-2xl font-semibold text-amber-400 tabular-nums">
                    {kpiStats.criticalUpgradesCount} Urgent Upgrades
                  </span>
                  <span className="text-xs text-[#E4E4E7] font-mono tabular-nums">
                    {kpiStats.ownedTotal} Owned
                  </span>
                </div>
                <span className="text-xs text-[#9CA3AF] mt-1.5 block">
                  DVD / Blu-ray → 4K UHD &amp; Rigid Box urgency triage
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setQuickFilter("discrepancy-alerts");
                  setActiveView("radar");
                }}
                className="text-left bg-[#121216] hover:bg-[#17171D] border border-[#232329] rounded-xl p-5 transition-colors"
              >
                <span className="text-xs text-[#9CA3AF] block">
                  Retailer Discrepancy &amp; Early Promo Alerts
                </span>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="font-mono text-2xl font-semibold text-rose-400 tabular-nums">
                    {kpiStats.discrepancyCount} SKU Variances
                  </span>
                  <span className="text-xs text-amber-300 font-mono tabular-nums">
                    {kpiStats.lowPrintRunCount} Near OOP
                  </span>
                </div>
                <span className="text-xs text-[#9CA3AF] mt-1.5 block">
                  Cross-retailer disc variances &amp; same-SKU early promo cuts
                </span>
              </button>
            </div>

            {/* Local Wishlist Price-Drop Notification Control Bar */}
            <PriceAlertControlBar
              alerts={priceAlerts}
              permissionState={browserPermission}
              soundEnabled={alertSoundEnabled}
              onRequestBrowserPermission={handleRequestBrowserPermission}
              onToggleSound={() => setAlertSoundEnabled((prev) => !prev)}
              onSimulateFlashDrop={handleSimulateFlashPriceDrop}
              onReevaluateAllThresholds={handleReevaluateAllThresholds}
              onOpenAlertDrawer={() => setIsAlertDrawerOpen(true)}
            />

            {/* Collection Insights: D3 Owned vs. Wishlisted Donut Gauge & Packaging Breakdown */}
            <CollectionInsightsSection
              catalog={catalog}
              ownedDiscs={ownedDiscs}
              ownedByReleaseId={ownedByReleaseId}
              onNavigateToWishlist={() => setActiveView("wishlist")}
              onNavigateToUpgrades={() => setActiveView("upgrades")}
              onFilterRadarBelowTarget={() => {
                setQuickFilter("below-target");
                setActiveView("radar");
              }}
            />
          </section>
        )}

        {/* VIEW 1: VAULT RADAR & EDITION CATALOG */}
        {activeView === "radar" && (
          <section id="vault-radar" className="space-y-6">
            {/* Multi-Facet Filter & Search Control Bar */}
            <div className="bg-[#121216] border border-[#232329] rounded-xl p-5 space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter by title, director, label (A24, NEON, Criterion...), cut, or retailer (Gruv/Gruvi, DiabolikDVD, Amazon)..."
                    className="w-full bg-[#0A0A0C] border border-[#232329] rounded-lg pl-10 pr-4 py-2.5 text-xs text-[#F4F4F6] placeholder-[#9CA3AF] focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Segmented Quick Radar Mode Buttons */}
                <div className="flex flex-wrap items-center gap-1 p-1 bg-[#0A0A0C] border border-[#232329] rounded-lg">
                  {[
                    { id: "all", label: "All Tracked" },
                    { id: "upgrades", label: "Owned Shelf Upgrades" },
                    { id: "below-target", label: "Below Target Price" },
                    { id: "discrepancy-alerts", label: "Retailer Discrepancies" },
                    { id: "low-stock", label: "Low Slip / Box Stock" },
                    { id: "restock", label: "Recent Restocks" },
                    { id: "big-box-deals", label: "Big-Box & Gruv Deals" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setQuickFilter(tab.id as RadarQuickFilter)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                        quickFilter === tab.id
                          ? "bg-amber-500 text-black font-semibold"
                          : "text-[#9CA3AF] hover:text-[#F4F4F6]"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Secondary Dropdown Filters: 22 Labels/Distributors, Edition Packaging, Technical Specs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-[#232329]">
                <div>
                  <label className="block text-[11px] text-[#9CA3AF] mb-1">
                    Boutique Label / Distributor / Stockist ({BOUTIQUE_LABEL_PROFILES.length} Tracked)
                  </label>
                  <select
                    value={selectedLabel}
                    onChange={(e) => setSelectedLabel(e.target.value)}
                    className="w-full bg-[#0A0A0C] border border-[#232329] rounded-lg px-3 py-2 text-xs text-[#F4F4F6] focus:outline-none focus:border-amber-500"
                  >
                    <option value="All Labels">
                      All {BOUTIQUE_LABEL_PROFILES.length} Labels, Distributors &amp; Stockists
                    </option>
                    {BOUTIQUE_LABEL_PROFILES.map((l) => (
                      <option key={l.name} value={l.name}>
                        {l.name}
                        {l.category === "Production Co. / Distributor" ? " (Distributor Direct)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-[#9CA3AF] mb-1">
                    Edition Packaging Focus
                  </label>
                  <select
                    value={selectedPackaging}
                    onChange={(e) => setSelectedPackaging(e.target.value)}
                    className="w-full bg-[#0A0A0C] border border-[#232329] rounded-lg px-3 py-2 text-xs text-[#F4F4F6] focus:outline-none focus:border-amber-500"
                  >
                    <option value="All Packaging">All Special Editions &amp; Packaging</option>
                    <option value="Rigid Box Set">Rigid Box Sets Only</option>
                    <option value="Limited Slipcover">Limited Foil / O-Card Slipcovers</option>
                    <option value="Boutique Steelbook">Boutique Label Steelbooks</option>
                    <option value="Archival Digipak">Archival Digipaks</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-[#9CA3AF] mb-1">
                    Format, HDR &amp; Region Spec
                  </label>
                  <select
                    value={selectedSpecFilter}
                    onChange={(e) => setSelectedSpecFilter(e.target.value)}
                    className="w-full bg-[#0A0A0C] border border-[#232329] rounded-lg px-3 py-2 text-xs text-[#F4F4F6] focus:outline-none focus:border-amber-500"
                  >
                    <option value="All Specs">All Formats &amp; Regions</option>
                    <option value="4K UHD">4K Ultra HD Releases</option>
                    <option value="Dolby Vision">Dolby Vision HDR Masters</option>
                    <option value="Region Free">Region Free / Region A/B/C</option>
                  </select>
                </div>

                <div className="flex items-end justify-between gap-2">
                  <div className="text-xs text-[#9CA3AF] py-2">
                    Showing{" "}
                    <strong className="font-mono text-[#F4F4F6] tabular-nums">
                      {filteredCatalog.length}
                    </strong>{" "}
                    of {catalog.length} editions
                  </div>
                  {(quickFilter !== "all" ||
                    selectedLabel !== "All Labels" ||
                    selectedPackaging !== "All Packaging" ||
                    selectedSpecFilter !== "All Specs" ||
                    searchQuery !== "") && (
                    <button
                      type="button"
                      onClick={() => {
                        setQuickFilter("all");
                        setSelectedLabel("All Labels");
                        setSelectedPackaging("All Packaging");
                        setSelectedSpecFilter("All Specs");
                        setSearchQuery("");
                      }}
                      className="px-3 py-2 text-xs text-amber-400 hover:text-amber-300 border border-[#232329] rounded-lg bg-[#0A0A0C] whitespace-nowrap shrink-0"
                    >
                      Reset Filters
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Release Grid (3 Columns Desktop, Uniform Height & Field Order + Collapsible Disc Contents Under Each Product) */}
            {filteredCatalog.length === 0 ? (
              <div className="bg-[#121216] border border-[#232329] rounded-xl p-12 text-center space-y-3">
                <Disc className="w-10 h-10 text-amber-500/60 mx-auto" />
                <h3 className="font-display text-lg font-semibold text-[#F4F4F6]">
                  No Matching Collector Editions in Local Filter
                </h3>
                <p className="text-xs text-[#9CA3AF] max-w-md mx-auto">
                  Try clearing your active packaging or label filter, or launch a live web-grounded
                  search across boutique and mass-market retailers for any film title.
                </p>
                <div className="pt-2 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setQuickFilter("all");
                      setSelectedLabel("All Labels");
                      setSelectedPackaging("All Packaging");
                      setSelectedSpecFilter("All Specs");
                      setSearchQuery("");
                    }}
                    className="px-4 py-2 bg-[#1A1A22] border border-[#232329] rounded-lg text-xs text-[#F4F4F6]"
                  >
                    Reset All Filters
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsReconModalOpen(true)}
                    className="px-4 py-2 bg-amber-500 text-black font-semibold rounded-lg text-xs"
                  >
                    Scan Live Retailers for New Title
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                {filteredCatalog.map((release) => {
                  const bestOffer = getBestInStockOffer(release);
                  const meetsTarget =
                    bestOffer &&
                    bestOffer.inStock &&
                    bestOffer.price <= release.wishlist.targetPrice;
                  const isScanning = scanningId === release.id;
                  const ownedItem = ownedByReleaseId.get(release.id);
                  const upgradeAssessment = ownedItem
                    ? assessUpgradeUrgency(ownedItem, release)
                    : null;

                  const printPct =
                    release.printRun.limited &&
                    release.printRun.totalUnits &&
                    release.printRun.remainingEstimate
                      ? Math.max(
                          4,
                          Math.min(
                            100,
                            Math.round(
                              (release.printRun.remainingEstimate /
                                release.printRun.totalUnits) *
                                100
                            )
                          )
                        )
                      : null;

                  return (
                    <article
                      key={release.id}
                      onClick={() => setSelectedReleaseId(release.id)}
                      className="group bg-[#121216] border border-[#232329] hover:border-amber-500/50 rounded-xl overflow-hidden flex flex-col justify-between transition-all duration-150 cursor-pointer"
                    >
                      <div>
                        {/* Card Top Media Area */}
                        <div className="aspect-4/3 w-full bg-[#0A0A0C] border-b border-[#232329] overflow-hidden relative">
                          <ReleaseCoverImage
                            src={release.coverImage}
                            alt={`${release.title} ${release.editionType}`}
                            spine={release.spineNumber}
                            title={release.title}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#121216] via-transparent to-black/40" />

                          {/* Top Row Overlay: Quiet Single Status Line + Wishlist Button */}
                          <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2">
                            <span className="text-[11px] font-medium text-[#F4F4F6] bg-black/75 backdrop-blur-xs px-2.5 py-1 rounded-md border border-white/10">
                              {release.releaseStatus} · {release.editionType}
                            </span>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateWishlist(release.id, {
                                  isWishlisted: !release.wishlist.isWishlisted,
                                });
                              }}
                              aria-label="Toggle Wishlist"
                              className={`p-2 rounded-md border transition-colors ${
                                release.wishlist.isWishlisted
                                  ? "bg-amber-500 text-black border-amber-400"
                                  : "bg-black/75 text-[#E4E4E7] border-white/15 hover:text-white"
                              }`}
                            >
                              <Bookmark className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Bottom Media Scrim: Label & Spine */}
                          <div className="absolute bottom-2.5 inset-x-4 flex items-center justify-between text-xs">
                            <span className="text-amber-400 font-medium truncate">
                              {release.label}
                            </span>
                            <span className="font-mono text-[#E4E4E7] tabular-nums shrink-0">
                              {release.spineNumber}
                            </span>
                          </div>
                        </div>

                        {/* Card Body: Clean Unboxed Metadata & Title */}
                        <div className="p-5 space-y-3">
                          <div>
                            <h3 className="font-display text-lg font-semibold text-[#F4F4F6] group-hover:text-amber-300 transition-colors line-clamp-1">
                              {release.title}
                            </h3>
                            <p className="text-xs text-[#9CA3AF] mt-0.5">
                              {release.director} · {release.year}
                            </p>
                          </div>

                          {/* Zero-Pill Technical Specs Line */}
                          <div className="text-xs text-[#E4E4E7] leading-relaxed">
                            <span>{release.technicalSpecs.format}</span>
                            <span aria-hidden="true" className="mx-1.5 text-[#9CA3AF]">
                              ·
                            </span>
                            <span>{release.technicalSpecs.hdr}</span>
                            <span aria-hidden="true" className="mx-1.5 text-[#9CA3AF]">
                              ·
                            </span>
                            <span>{release.technicalSpecs.region}</span>
                          </div>

                          {/* Owned Shelf Upgrade Callout (Clean Unboxed Line) */}
                          {ownedItem && upgradeAssessment && (
                            <div className="pt-1 border-t border-[#232329] text-xs flex items-center justify-between gap-2">
                              <span className="text-amber-300 truncate">
                                Owned {ownedItem.ownedFormat} →{" "}
                                {release.technicalSpecs.format.split(" ")[0]}
                              </span>
                              <span
                                className={`font-mono font-semibold shrink-0 tabular-nums ${
                                  upgradeAssessment.totalScore >= 78
                                    ? "text-rose-400"
                                    : "text-emerald-400"
                                }`}
                              >
                                Urgency {upgradeAssessment.totalScore}/100
                              </span>
                            </div>
                          )}

                          {/* Print Run & Slipcover Status Bar */}
                          <div className="pt-1 space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span
                                className={
                                  release.printRun.slipcoverStatus.includes("Low")
                                    ? "text-rose-400 font-medium"
                                    : "text-[#9CA3AF]"
                                }
                              >
                                {release.printRun.slipcoverStatus}
                              </span>
                              {release.printRun.limited &&
                                release.printRun.totalUnits && (
                                  <span className="font-mono text-[11px] text-[#9CA3AF] tabular-nums">
                                    {release.printRun.remainingEstimate?.toLocaleString()} /{" "}
                                    {release.printRun.totalUnits.toLocaleString()} left
                                  </span>
                                )}
                            </div>
                            {printPct !== null && (
                              <div className="w-full h-1 bg-[#0A0A0C] rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${
                                    printPct <= 10 ? "bg-rose-500" : "bg-amber-500"
                                  }`}
                                  style={{ width: `${printPct}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        {/* Card Footer: Price Comparison & Live Scan Trigger */}
                        <div className="px-5 py-4 bg-[#0A0A0C]/60 border-t border-[#232329] space-y-3">
                          <div className="flex items-baseline justify-between gap-2">
                            <div>
                              <span className="text-[11px] text-[#9CA3AF] block">
                                Best Offer ({bestOffer.retailer})
                              </span>
                              <div className="flex items-baseline gap-2 mt-0.5">
                                <span
                                  className={`font-mono text-lg font-semibold tabular-nums ${
                                    meetsTarget ? "text-emerald-400" : "text-[#F4F4F6]"
                                  }`}
                                >
                                  ${bestOffer.price.toFixed(2)}
                                </span>
                                <span className="font-mono text-xs text-[#9CA3AF] line-through tabular-nums">
                                  ${release.msrp.toFixed(2)}
                                </span>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="text-[11px] text-[#9CA3AF] block">
                                Target Threshold
                              </span>
                              <span className="font-mono text-sm font-medium text-[#E4E4E7] tabular-nums">
                                ${release.wishlist.targetPrice.toFixed(2)}
                              </span>
                              <span
                                className={`block text-[11px] ${
                                  meetsTarget ? "text-emerald-400 font-medium" : "text-[#9CA3AF]"
                                }`}
                              >
                                {meetsTarget
                                  ? "Target Met"
                                  : `${release.retailerListings.length} stores tracked`}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#232329]">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedReleaseId(release.id);
                              }}
                              className="text-xs font-medium text-[#E4E4E7] hover:text-amber-400 transition-colors whitespace-nowrap shrink-0"
                            >
                              Compare {release.retailerListings.length} Retailers →
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTriggerLiveScan(release);
                              }}
                              disabled={isScanning}
                              className="px-2.5 py-1 bg-[#121216] hover:bg-[#1A1A22] border border-[#232329] rounded-md text-[11px] font-medium text-amber-400 flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                            >
                              <RefreshCw
                                className={`w-3 h-3 ${isScanning ? "animate-spin" : ""}`}
                              />
                              <span>{isScanning ? "Scraping..." : "Live Check"}</span>
                            </button>
                          </div>
                        </div>

                        {/* COLLAPSIBLE DISC CONTENTS, CUTS, EARLY PROMOS & RETAILER DISCREPANCY TOGGLE UNDER EACH PRODUCT */}
                        <DiscContentsAccordion
                          release={release}
                          compact={true}
                          onTriggerLiveScan={handleTriggerLiveScan}
                          isScanning={isScanning}
                        />
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* VIEW 2: WISHLIST PRIORITY & MULTI-RETAILER PRICE MATRIX */}
        {activeView === "wishlist" && (
          <section className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#232329]">
              <div>
                <div className="text-xs text-amber-400 font-medium">
                  Collector Priority Queue, Upgrade Urgency &amp; Cross-Retailer Arbitrage
                </div>
                <h1 className="font-display text-2xl md:text-3xl font-semibold text-[#F4F4F6] mt-1">
                  Wishlist Priority &amp; Price-Drop Matrix
                </h1>
                <p className="text-xs text-[#9CA3AF] mt-1">
                  Adjust target buy prices inline, inspect scraped disc contents &amp; cross-retailer
                  discrepancies below each item, and compare Boutique Direct vs. Stockists vs. Major Retailers.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setApplyPromoMath((prev) => !prev)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    applyPromoMath
                      ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-300"
                      : "bg-[#121216] border-[#232329] text-[#9CA3AF]"
                  }`}
                >
                  {applyPromoMath
                    ? `After-Code Net Prices: ON (${promoCodes.filter((p) => p.isActive).length} Codes)`
                    : "After-Code Net Prices: OFF"}
                </button>

                <button
                  type="button"
                  onClick={() => setWishlistSortByUrgency(!wishlistSortByUrgency)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    wishlistSortByUrgency
                      ? "bg-[#121216] border-amber-500/60 text-amber-300"
                      : "bg-[#121216] border-[#232329] text-[#9CA3AF]"
                  }`}
                >
                  {wishlistSortByUrgency
                    ? "Sorted by: Upgrade Urgency First"
                    : "Sorted by: Priority Tier"}
                </button>

                <div className="flex items-center gap-1 p-1 bg-[#121216] border border-[#232329] rounded-lg">
                  {["All", "Critical Grail", "High Priority", "Wait for 50% Sale"].map(
                    (tier) => (
                      <button
                        key={tier}
                        type="button"
                        onClick={() => setWishlistPriorityFilter(tier)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                          wishlistPriorityFilter === tier
                            ? "bg-amber-500 text-black font-semibold"
                            : "text-[#9CA3AF] hover:text-[#F4F4F6]"
                        }`}
                      >
                        {tier}
                      </button>
                    )
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsReconModalOpen(true)}
                  className="px-3.5 py-2 bg-[#121216] hover:bg-[#1A1A22] border border-[#232329] rounded-lg text-xs font-medium text-amber-400 whitespace-nowrap shrink-0"
                >
                  + Add Title to Wishlist
                </button>
              </div>
            </div>

            {/* Local Wishlist Price-Drop Notification Control Bar */}
            <PriceAlertControlBar
              alerts={priceAlerts}
              permissionState={browserPermission}
              soundEnabled={alertSoundEnabled}
              onRequestBrowserPermission={handleRequestBrowserPermission}
              onToggleSound={() => setAlertSoundEnabled((prev) => !prev)}
              onSimulateFlashDrop={handleSimulateFlashPriceDrop}
              onReevaluateAllThresholds={handleReevaluateAllThresholds}
              onOpenAlertDrawer={() => setIsAlertDrawerOpen(true)}
            />

            {wishlistedItems.length === 0 ? (
              <div className="bg-[#121216] border border-[#232329] rounded-xl p-12 text-center space-y-3">
                <Bookmark className="w-8 h-8 text-amber-400 mx-auto" />
                <h3 className="font-display text-lg font-semibold text-[#F4F4F6]">
                  No Editions in Selected Priority Tier
                </h3>
                <p className="text-xs text-[#9CA3AF] max-w-md mx-auto">
                  Switch priority filter to &ldquo;All&rdquo; or add releases from the Vault Radar.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setWishlistPriorityFilter("All");
                    setActiveView("radar");
                  }}
                  className="px-4 py-2 bg-amber-500 text-black font-semibold text-xs rounded-lg"
                >
                  Browse Vault Radar
                </button>
              </div>
            ) : (
              <div className="bg-[#121216] border border-[#232329] rounded-xl overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1060px]">
                  <thead>
                    <tr className="bg-[#0A0A0C] border-b border-[#232329] text-[11px] text-[#9CA3AF]">
                      <th className="py-3.5 px-4 font-medium">Edition &amp; Specs</th>
                      <th className="py-3.5 px-4 font-medium">
                        Owned Disc &amp; Upgrade Urgency
                      </th>
                      <th className="py-3.5 px-4 font-medium">Priority Tier</th>
                      <th className="py-3.5 px-4 font-medium">Packaging &amp; Stock Risk</th>
                      <th className="py-3.5 px-4 font-medium text-right">
                        Boutique Direct
                      </th>
                      <th className="py-3.5 px-4 font-medium text-right">
                        Stockists (Diabolik / Orbit)
                      </th>
                      <th className="py-3.5 px-4 font-medium text-right">
                        Major Retailers (AMZ / Gruv / B&amp;N / TGT)
                      </th>
                      <th className="py-3.5 px-4 font-medium text-right">
                        Your Target Price
                      </th>
                      <th className="py-3.5 px-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#232329] text-xs">
                    {wishlistedItems.map((item) => {
                      const directOffer = getBestOfferByCategory(item, "Boutique Direct");
                      const stockistOffer = getBestOfferByCategory(
                        item,
                        "Specialty Stockist"
                      );
                      const majorOffer = getBestOfferByCategory(item, "Major Retailer");

                      const directEff = directOffer
                        ? computeEffectiveOfferWithPromo(
                            directOffer,
                            item.editionType,
                            promoCodes,
                            applyPromoMath
                          )
                        : null;
                      const stockistEff = stockistOffer
                        ? computeEffectiveOfferWithPromo(
                            stockistOffer,
                            item.editionType,
                            promoCodes,
                            applyPromoMath
                          )
                        : null;
                      const majorEff = majorOffer
                        ? computeEffectiveOfferWithPromo(
                            majorOffer,
                            item.editionType,
                            promoCodes,
                            applyPromoMath
                          )
                        : null;

                      const bestOverall = getBestInStockOffer(item);
                      const bestOverallEff = computeEffectiveOfferWithPromo(
                        bestOverall,
                        item.editionType,
                        promoCodes,
                        applyPromoMath
                      );
                      const lowestEffectivePrice = Math.min(
                        bestOverallEff.netPrice,
                        directEff?.netPrice ?? 9999,
                        stockistEff?.netPrice ?? 9999,
                        majorEff?.netPrice ?? 9999
                      );

                      const targetMet =
                        bestOverall &&
                        bestOverall.inStock &&
                        lowestEffectivePrice <= item.wishlist.targetPrice;
                      const isScanning = scanningId === item.id;
                      const ownedItem = ownedByReleaseId.get(item.id);
                      const upgradeAssessment = ownedItem
                        ? assessUpgradeUrgency(ownedItem, item)
                        : null;

                      return (
                        <React.Fragment key={item.id}>
                          <tr
                            onClick={() => setSelectedReleaseId(item.id)}
                            className="hover:bg-[#181820] transition-colors cursor-pointer"
                          >
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-[#F4F4F6] hover:text-amber-300">
                                {item.title}
                              </div>
                              <div className="text-[11px] text-[#9CA3AF] mt-0.5">
                                <span className="text-amber-400">{item.label}</span> ·{" "}
                                <span className="font-mono">{item.spineNumber}</span> ·{" "}
                                {item.technicalSpecs.format} · {item.technicalSpecs.region}
                              </div>
                            </td>

                            {/* Owned Disc & Upgrade Urgency Column */}
                            <td className="py-3.5 px-4">
                              {ownedItem && upgradeAssessment ? (
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`font-mono font-semibold tabular-nums ${
                                        upgradeAssessment.totalScore >= 78
                                          ? "text-rose-400"
                                          : "text-amber-400"
                                      }`}
                                    >
                                      Urgency {upgradeAssessment.totalScore}/100
                                    </span>
                                    <span className="text-[11px] text-[#9CA3AF]">
                                      ({upgradeAssessment.tier.split(" — ")[0]})
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-[#E4E4E7] mt-0.5">
                                    Owned {ownedItem.ownedFormat} →{" "}
                                    {item.technicalSpecs.format.split(" ")[0]} (
                                    {item.editionType})
                                  </div>
                                </div>
                              ) : (
                                <span className="text-[11px] text-[#9CA3AF]">
                                  New Acquisition (Not Owned)
                                </span>
                              )}
                            </td>

                            <td
                              className="py-3.5 px-4"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <select
                                value={item.wishlist.priority}
                                onChange={(e) =>
                                  handleUpdateWishlist(item.id, {
                                    priority: e.target.value as WishlistPriority,
                                  })
                                }
                                className="bg-[#0A0A0C] border border-[#232329] rounded-md px-2.5 py-1.5 text-xs text-[#F4F4F6] focus:outline-none focus:border-amber-500"
                              >
                                <option value="Critical Grail">Critical Grail</option>
                                <option value="High Priority">High Priority</option>
                                <option value="Wait for 50% Sale">Wait for 50% Sale</option>
                              </select>
                            </td>

                            <td className="py-3.5 px-4">
                              <div
                                className={
                                  item.printRun.slipcoverStatus.includes("Low")
                                    ? "text-rose-400 font-medium"
                                    : "text-[#E4E4E7]"
                                }
                              >
                                {item.printRun.slipcoverStatus}
                              </div>
                              {item.printRun.limited && item.printRun.totalUnits && (
                                <div className="font-mono text-[11px] text-[#9CA3AF] tabular-nums">
                                  {item.printRun.remainingEstimate?.toLocaleString()} /{" "}
                                  {item.printRun.totalUnits.toLocaleString()} units
                                </div>
                              )}
                            </td>

                            {/* Boutique Direct Column */}
                            <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                              {directOffer && directEff ? (
                                <>
                                  <span
                                    className={
                                      directOffer.inStock
                                        ? directEff.netPrice <= lowestEffectivePrice
                                          ? "text-emerald-400 font-semibold"
                                          : "text-[#F4F4F6] font-medium"
                                        : "text-[#9CA3AF] line-through"
                                    }
                                  >
                                    ${directEff.netPrice.toFixed(2)}
                                  </span>
                                  {directEff.appliedPromo && (
                                    <span className="block text-[10px] text-amber-300 font-mono">
                                      w/ {directEff.appliedPromo.code} (was $
                                      {directOffer.price.toFixed(2)})
                                    </span>
                                  )}
                                  <span className="block text-[10px] font-sans text-[#9CA3AF]">
                                    {directOffer.retailer}
                                  </span>
                                </>
                              ) : (
                                <span className="text-[#9CA3AF]">—</span>
                              )}
                            </td>

                            {/* Specialty Stockists Column */}
                            <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                              {stockistOffer && stockistEff ? (
                                <>
                                  <span
                                    className={
                                      stockistEff.netPrice <= lowestEffectivePrice
                                        ? "text-emerald-400 font-semibold"
                                        : "text-[#F4F4F6]"
                                    }
                                  >
                                    ${stockistEff.netPrice.toFixed(2)}
                                  </span>
                                  {stockistOffer.retailer === "OrbitDVD" && (
                                    <span className="block text-[10px] text-amber-300 font-mono">
                                      Code 3FREE (3+ Ships Free)
                                    </span>
                                  )}
                                  <span className="block text-[10px] font-sans text-[#9CA3AF]">
                                    {stockistOffer.retailer}
                                  </span>
                                </>
                              ) : (
                                <span className="text-[#9CA3AF]">—</span>
                              )}
                            </td>

                            {/* Major Retailers Column */}
                            <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                              {majorOffer && majorEff ? (
                                <>
                                  <span
                                    className={
                                      majorEff.netPrice <= lowestEffectivePrice
                                        ? "text-emerald-400 font-semibold"
                                        : "text-[#F4F4F6]"
                                    }
                                  >
                                    ${majorEff.netPrice.toFixed(2)}
                                  </span>
                                  {majorEff.appliedPromo && (
                                    <span className="block text-[10px] text-amber-300 font-mono">
                                      w/ {majorEff.appliedPromo.code} (was $
                                      {majorOffer.price.toFixed(2)})
                                    </span>
                                  )}
                                  <span className="block text-[10px] font-sans text-[#9CA3AF]">
                                    {majorOffer.retailer}
                                  </span>
                                </>
                              ) : (
                                <span className="text-[11px] font-sans text-[#9CA3AF]">
                                  Boutique Exclusive
                                </span>
                              )}
                            </td>

                            {/* Target Price Inline Editor */}
                            <td
                              className="py-3.5 px-4 text-right"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="inline-flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateWishlist(item.id, {
                                      targetPrice: Math.max(
                                        5,
                                        Number((item.wishlist.targetPrice - 2).toFixed(2))
                                      ),
                                    })
                                  }
                                  className="px-1.5 py-1 bg-[#0A0A0C] border border-[#232329] rounded text-[11px] hover:bg-[#1A1A22]"
                                >
                                  -
                                </button>
                                <span
                                  className={`font-mono font-semibold px-2 tabular-nums ${
                                    targetMet ? "text-emerald-400" : "text-amber-400"
                                  }`}
                                >
                                  ${item.wishlist.targetPrice.toFixed(2)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateWishlist(item.id, {
                                      targetPrice: Number(
                                        (item.wishlist.targetPrice + 2).toFixed(2)
                                      ),
                                    })
                                  }
                                  className="px-1.5 py-1 bg-[#0A0A0C] border border-[#232329] rounded text-[11px] hover:bg-[#1A1A22]"
                                >
                                  +
                                </button>
                              </div>
                              <span className="block text-[10px] mt-0.5">
                                {targetMet ? (
                                  <span className="text-emerald-400 font-medium">
                                    Target Met (${lowestEffectivePrice.toFixed(2)})
                                  </span>
                                ) : (
                                  <span className="text-[#9CA3AF]">
                                    MSRP ${item.msrp.toFixed(2)}
                                  </span>
                                )}
                              </span>
                            </td>

                            {/* Actions */}
                            <td
                              className="py-3.5 px-4 text-right"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="inline-flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleTriggerLiveScan(item)}
                                  disabled={isScanning}
                                  className="px-2.5 py-1.5 bg-[#0A0A0C] hover:bg-[#1A1A22] border border-[#232329] rounded-md text-[11px] text-amber-400 flex items-center gap-1 whitespace-nowrap shrink-0"
                                >
                                  <RefreshCw
                                    className={`w-3 h-3 ${isScanning ? "animate-spin" : ""}`}
                                  />
                                  <span>{isScanning ? "Scraping" : "Scan"}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSelectedReleaseId(item.id)}
                                  className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-md text-[11px] whitespace-nowrap shrink-0"
                                >
                                  Dossier
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Collapsible Disc Contents, Cuts, Early Promo & Discrepancy Row under each Wishlist Product */}
                          <tr>
                            <td colSpan={9} className="p-0">
                              <DiscContentsAccordion
                                release={item}
                                compact={true}
                                onTriggerLiveScan={handleTriggerLiveScan}
                                isScanning={isScanning}
                              />
                            </td>
                          </tr>
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* VIEW 3: OWNED DISC SHELF & UPGRADE URGENCY ASSESSOR (CLZ / CSV) */}
        {activeView === "upgrades" && (
          <UpgradeShelfView
            ownedDiscs={ownedDiscs}
            catalog={catalog}
            onImportDiscs={handleImportDiscs}
            onRemoveOwnedDisc={handleRemoveOwnedDisc}
            onInspectRelease={(releaseId) => setSelectedReleaseId(releaseId)}
            onPromoteToWishlist={handlePromoteUpgradeToWishlist}
            onDiscoverBoutiqueUpgrade={handleDiscoverBoutiqueUpgrade}
            discoveringOwnedId={discoveringOwnedId}
          />
        )}

        {/* VIEW 4: 22 BOUTIQUE LABELS, PRODUCTION CO. / DISTRIBUTORS & SPECIALTY STOCKISTS DIRECTORY */}
        {activeView === "labels" && (
          <section className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#232329]">
              <div>
                <div className="text-xs text-amber-400 font-medium">
                  Archival Label, Production Co. / Distributor &amp; Stockist Intelligence
                </div>
                <h1 className="font-display text-2xl md:text-3xl font-semibold text-[#F4F4F6] mt-1">
                  {BOUTIQUE_LABEL_PROFILES.length} Tracked Boutique Labels, Distributors &amp; Specialty Stockists
                </h1>
                <p className="text-xs text-[#9CA3AF] mt-1">
                  Tracking independent boutique video labels alongside production companies &amp;
                  distributors that release their own special editions (A24, NEON, Lionsgate
                  Limited) and specialty stockists (DiabolikDVD, OrbitDVD).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {BOUTIQUE_LABEL_PROFILES.map((label) => {
                const trackedCount = catalog.filter(
                  (r) => r.label === label.name
                ).length;

                return (
                  <div
                    key={label.name}
                    className="bg-[#121216] border border-[#232329] rounded-xl p-5 flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[11px] text-[#9CA3AF] block">
                            {label.category || "Boutique Label"} · {label.country} ·{" "}
                            <span className="font-mono text-amber-400">
                              {trackedCount} in vault
                            </span>
                          </span>
                          <h3 className="font-display text-lg font-semibold text-[#F4F4F6]">
                            {label.name}
                          </h3>
                        </div>
                        <a
                          href={label.directStoreUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#9CA3AF] hover:text-amber-400 flex items-center gap-1 shrink-0"
                        >
                          <span>Store</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      <p className="text-xs text-[#E4E4E7] leading-relaxed">
                        {label.specialty}
                      </p>

                      <div className="text-xs text-[#9CA3AF] space-y-1 pt-1">
                        <div>
                          <strong className="text-[#E4E4E7]">Packaging:</strong>{" "}
                          {label.signaturePackaging}
                        </div>
                        <div>
                          <strong className="text-[#E4E4E7]">Sale Cadence:</strong>{" "}
                          {label.typicalSaleSchedule}
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#232329] space-y-3">
                      <div className="text-xs text-amber-300/90 leading-relaxed">
                        {label.activeAlertNote}
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => handleSelectLabelFromDirectory(label.name)}
                          className="px-3 py-1.5 bg-[#0A0A0C] hover:bg-[#1A1A22] border border-[#232329] rounded-lg text-xs font-medium text-[#F4F4F6] transition-colors whitespace-nowrap shrink-0"
                        >
                          Filter Vault ({trackedCount})
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setReconModalInitialLabel(label.name);
                            setIsReconModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 rounded-lg text-xs font-medium text-amber-300 transition-colors whitespace-nowrap shrink-0"
                        >
                          Scan Live Store
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* VIEW 5: SEASONAL BOUTIQUE SALE CALENDAR & VERIFIED PROMO CODE TRACKER */}
        {activeView === "calendar" && (
          <section className="space-y-8">
            <PromoCodeTrackerPanel
              promoCodes={promoCodes}
              applyPromoMath={applyPromoMath}
              onToggleApplyPromoMath={() => setApplyPromoMath((prev) => !prev)}
              onTogglePromoCodeActive={handleTogglePromoCodeActive}
              onVerifyCodeWorked={handleVerifyCodeWorked}
              onAddDiscoveredCodes={handleAddDiscoveredCodes}
            />

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#232329]">
              <div>
                <div className="text-xs text-amber-400 font-medium">
                  Annual Flash Sales, Halfway Events &amp; 50% Off Retail Windows
                </div>
                <h1 className="font-display text-2xl md:text-3xl font-semibold text-[#F4F4F6] mt-1">
                  Seasonal Boutique Label Sale Calendar
                </h1>
                <p className="text-xs text-[#9CA3AF] mt-1">
                  Automatically cross-referenced with your Priority Wishlist so you never pay
                  full MSRP right before a 50% label sale.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {BOUTIQUE_SALE_EVENTS.map((sale) => {
                const matchingWishlistItems = catalog.filter(
                  (r) =>
                    r.wishlist.isWishlisted &&
                    sale.qualifyingLabels.includes(r.label)
                );

                return (
                  <div
                    key={sale.id}
                    className="bg-[#121216] border border-[#232329] rounded-xl p-6 flex flex-col justify-between space-y-5"
                  >
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span
                          className={`font-semibold ${
                            sale.status === "Active Now"
                              ? "text-emerald-400"
                              : "text-amber-400"
                          }`}
                        >
                          {sale.status} · {sale.countdownLabel}
                        </span>
                        <span className="font-mono text-[#9CA3AF] tabular-nums">
                          {sale.dateWindow}
                        </span>
                      </div>

                      <div>
                        <div className="text-xs text-[#9CA3AF]">
                          {sale.label} · Hosted via {sale.retailerHost}
                        </div>
                        <h3 className="font-display text-xl font-semibold text-[#F4F4F6] mt-0.5">
                          {sale.saleName}
                        </h3>
                        <div className="text-xs font-mono text-amber-400 mt-1">
                          {sale.discountSummary}
                        </div>
                      </div>

                      <p className="text-xs text-[#E4E4E7] leading-relaxed">
                        {sale.description}
                      </p>

                      <div className="p-3 bg-[#0A0A0C] border border-[#232329] rounded-lg text-xs text-[#9CA3AF]">
                        <strong className="text-[#F4F4F6]">Collector Strategy:</strong>{" "}
                        {sale.collectorTip}
                      </div>
                    </div>

                    {/* Cross-Referenced Wishlist Editions */}
                    <div className="pt-4 border-t border-[#232329] space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-[#F4F4F6]">
                          Qualifying Wishlist Editions ({matchingWishlistItems.length})
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (sale.qualifyingLabels[0]) {
                              handleSelectLabelFromDirectory(sale.qualifyingLabels[0]);
                            }
                          }}
                          className="text-xs text-amber-400 hover:underline"
                        >
                          View All {sale.label} →
                        </button>
                      </div>

                      {matchingWishlistItems.length > 0 ? (
                        <div className="space-y-1.5">
                          {matchingWishlistItems.map((item) => {
                            const best = getBestInStockOffer(item);
                            return (
                              <div
                                key={item.id}
                                onClick={() => setSelectedReleaseId(item.id)}
                                className="p-2.5 bg-[#0A0A0C] hover:bg-[#181820] border border-[#232329] rounded-lg flex items-center justify-between text-xs cursor-pointer transition-colors"
                              >
                                <div className="truncate pr-3">
                                  <span className="font-medium text-[#F4F4F6]">
                                    {item.title}
                                  </span>
                                  <span className="text-[#9CA3AF] ml-2">
                                    ({item.editionType})
                                  </span>
                                </div>
                                <div className="font-mono text-emerald-400 shrink-0 tabular-nums">
                                  ${best.price.toFixed(2)}{" "}
                                  <span className="text-[#9CA3AF] text-[11px]">
                                    / Target ${item.wishlist.targetPrice.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-[#9CA3AF]">
                          No wishlisted titles currently tagged for this label.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>

      {/* QUIET ARCHIVAL FOOTER */}
      <footer className="border-t border-[#232329] bg-[#0A0A0C] mt-16">
        <div className="max-w-[1440px] mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#9CA3AF]">
          <div>
            Spine &amp; Slip — Archival Physical Media Collector Radar · Tracking{" "}
            {BOUTIQUE_LABEL_PROFILES.length} Boutique Labels &amp; Distributors (A24, NEON),
            CLZ / CSV Shelf Upgrades &amp; Major Retailers (Gruv / Gruvi, Amazon, B&amp;N, Target)
          </div>
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => setActiveView("radar")}
              className="hover:text-[#F4F4F6] transition-colors"
            >
              Vault Radar
            </button>
            <button
              type="button"
              onClick={() => setActiveView("upgrades")}
              className="hover:text-[#F4F4F6] transition-colors"
            >
              Upgrade Shelf
            </button>
            <button
              type="button"
              onClick={() => setActiveView("wishlist")}
              className="hover:text-[#F4F4F6] transition-colors"
            >
              Wishlist Matrix
            </button>
            <button
              type="button"
              onClick={() => setIsReconModalOpen(true)}
              className="hover:text-amber-400 transition-colors"
            >
              Live Retailer Scanner
            </button>
          </div>
        </div>
      </footer>

      {/* CONTIGUOUS EDITION DOSSIER DRAWER */}
      <EditionDossierDrawer
        release={selectedRelease}
        ownedDisc={
          selectedRelease ? ownedByReleaseId.get(selectedRelease.id) : undefined
        }
        onClose={() => setSelectedReleaseId(null)}
        onUpdateWishlist={handleUpdateWishlist}
        onQuickLogOwnedDisc={handleQuickLogOwnedDisc}
        onTriggerLiveScan={handleTriggerLiveScan}
        isScanningId={scanningId}
        onApplyDiscoveredOffers={handleApplyDiscoveredOffers}
      />

      {/* LIVE RETAILER RECON & ADD RELEASE MODAL */}
      <LiveReconModal
        isOpen={isReconModalOpen}
        onClose={() => setIsReconModalOpen(false)}
        onAddRelease={handleAddRelease}
        initialLabel={reconModalInitialLabel}
      />

      {/* BROWSER PRICE-DROP ALERT HISTORY & SETTINGS DRAWER */}
      <PriceAlertCenterDrawer
        isOpen={isAlertDrawerOpen}
        onClose={() => setIsAlertDrawerOpen(false)}
        alerts={priceAlerts}
        permissionState={browserPermission}
        soundEnabled={alertSoundEnabled}
        onRequestBrowserPermission={handleRequestBrowserPermission}
        onToggleSound={() => setAlertSoundEnabled((prev) => !prev)}
        onMarkAllRead={() =>
          setPriceAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })))
        }
        onClearHistory={() => {
          setPriceAlerts([]);
          setActiveAlertPopups([]);
          showToast("Cleared price-drop alert log.");
        }}
        onSimulateFlashDrop={handleSimulateFlashPriceDrop}
        onInspectRelease={(releaseId) => setSelectedReleaseId(releaseId)}
      />
    </div>
  );
}
