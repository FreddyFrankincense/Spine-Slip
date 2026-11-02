import React from "react";
import {
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  ExternalLink,
  X,
  CheckCheck,
  Zap,
  Sparkles,
  Trash2,
} from "lucide-react";
import { PriceDropAlertItem } from "../types";

export type BrowserPermissionState =
  | "default"
  | "granted"
  | "denied"
  | "unsupported"
  | "iframe-fallback";

export function getBrowserNotificationStatus(): BrowserPermissionState {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return window.Notification.permission as BrowserPermissionState;
}

export function playArchivalAlertChime() {
  try {
    const AudioCtx =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Two-note warm resonant chord (A5 -> E6)
    const freqs = [880, 1318.5];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.11);

      gain.gain.setValueAtTime(0.0001, now + idx * 0.11);
      gain.gain.exponentialRampToValueAtTime(0.08, now + idx * 0.11 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.11 + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.11);
      osc.stop(now + idx * 0.11 + 0.48);
    });
  } catch {
    // Ignore audio context autoplay restrictions
  }
}

export function dispatchNativeBrowserNotification(
  alertItem: PriceDropAlertItem,
  onInspectRelease: (releaseId: string) => void
): boolean {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }

  if (window.Notification.permission !== "granted") {
    return false;
  }

  try {
    const savingsText =
      alertItem.savingsBelowTarget > 0
        ? `$${alertItem.savingsBelowTarget.toFixed(2)} below your $${alertItem.targetPrice.toFixed(2)} target`
        : `Matched your $${alertItem.targetPrice.toFixed(2)} target price`;

    const notification = new window.Notification(
      `Target Price Met: ${alertItem.title}`,
      {
        body: `$${alertItem.offerPrice.toFixed(2)} at ${alertItem.retailer} (${savingsText} · -${alertItem.discountPctOffMsrp}% vs MSRP). ${alertItem.slipcoverStatus}.`,
        tag: alertItem.dedupeKey,
      }
    );

    notification.onclick = () => {
      window.focus();
      onInspectRelease(alertItem.releaseId);
      notification.close();
    };
    return true;
  } catch {
    return false;
  }
}

interface LiveBrowserAlertStackProps {
  activePopups: PriceDropAlertItem[];
  onDismissPopup: (id: string) => void;
  onDismissAllPopups: () => void;
  onInspectRelease: (releaseId: string) => void;
  onOpenAlertDrawer: () => void;
}

export const LiveBrowserAlertStack: React.FC<LiveBrowserAlertStackProps> = ({
  activePopups,
  onDismissPopup,
  onDismissAllPopups,
  onInspectRelease,
  onOpenAlertDrawer,
}) => {
  if (activePopups.length === 0) return null;

  return (
    <div
      className="fixed top-20 right-6 z-50 w-full max-w-md space-y-3 pointer-events-none"
      role="region"
      aria-label="Live Wishlist Price-Drop Browser Alerts"
    >
      {activePopups.length > 1 && (
        <div className="flex items-center justify-between px-3.5 py-2 bg-[#121216]/95 border border-emerald-500/50 rounded-lg shadow-xl text-xs pointer-events-auto backdrop-blur-md">
          <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
            <BellRing className="w-3.5 h-3.5 animate-bounce" />
            <span>{activePopups.length} Wishlist Target Price Alerts Triggered</span>
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenAlertDrawer}
              className="text-amber-400 hover:underline font-medium"
            >
              View Alert Log
            </button>
            <button
              type="button"
              onClick={onDismissAllPopups}
              className="text-[#9CA3AF] hover:text-white"
            >
              Dismiss All
            </button>
          </div>
        </div>
      )}

      {activePopups.slice(0, 3).map((alertItem) => (
        <div
          key={alertItem.id}
          className="bg-[#121216] border-2 border-emerald-500/70 rounded-xl p-4 shadow-2xl pointer-events-auto transition-all space-y-3"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 text-[11px]">
              <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                <BellRing className="w-3.5 h-3.5" />
                <span>BROWSER PRICE ALERT</span>
              </span>
              <span className="text-[#9CA3AF]">·</span>
              <span className="text-amber-300 font-medium">
                {alertItem.triggerSource}
              </span>
            </div>

            <button
              type="button"
              onClick={() => onDismissPopup(alertItem.id)}
              className="p-1 text-[#9CA3AF] hover:text-white rounded-md hover:bg-[#1A1A22]"
              aria-label="Dismiss price alert"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div>
            <div className="text-[11px] text-[#9CA3AF]">
              <span className="text-amber-400 font-medium">{alertItem.label}</span> ·{" "}
              <span className="font-mono">{alertItem.spineNumber}</span> ·{" "}
              <span>{alertItem.editionType}</span>
            </div>
            <h4 className="font-display text-base font-semibold text-[#F4F4F6] mt-0.5 leading-snug">
              {alertItem.title}
            </h4>
          </div>

          <div className="p-3 bg-[#0A0A0C] border border-[#232329] rounded-lg flex items-baseline justify-between gap-3">
            <div>
              <span className="text-[11px] text-[#9CA3AF] block">
                In-Stock Offer at <strong className="text-[#F4F4F6]">{alertItem.retailer}</strong>
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="font-mono text-xl font-semibold text-emerald-400 tabular-nums">
                  ${alertItem.offerPrice.toFixed(2)}
                </span>
                <span className="font-mono text-xs text-[#9CA3AF] line-through tabular-nums">
                  MSRP ${alertItem.msrp.toFixed(2)}
                </span>
                <span className="font-mono text-xs text-emerald-400 tabular-nums">
                  (-{alertItem.discountPctOffMsrp}%)
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-[#9CA3AF] block">Your Target</span>
              <span className="font-mono text-sm font-semibold text-[#F4F4F6] tabular-nums">
                ${alertItem.targetPrice.toFixed(2)}
              </span>
              <span className="block text-[11px] text-emerald-400 font-medium">
                {alertItem.savingsBelowTarget > 0.005
                  ? `-$${alertItem.savingsBelowTarget.toFixed(2)} below target`
                  : "Exact target match"}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="text-[11px] text-[#9CA3AF] truncate">
              {alertItem.slipcoverStatus}
            </span>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  onInspectRelease(alertItem.releaseId);
                  onDismissPopup(alertItem.id);
                }}
                className="px-3 py-1.5 bg-[#1A1A22] hover:bg-[#23232E] border border-[#232329] rounded-lg text-xs font-medium text-[#F4F4F6]"
              >
                Inspect Dossier
              </button>
              <a
                href={alertItem.retailerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-lg text-xs inline-flex items-center gap-1"
              >
                <span>Buy at {alertItem.retailer}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

interface PriceAlertControlBarProps {
  alerts: PriceDropAlertItem[];
  permissionState: BrowserPermissionState;
  soundEnabled: boolean;
  onRequestBrowserPermission: () => void;
  onToggleSound: () => void;
  onSimulateFlashDrop: () => void;
  onReevaluateAllThresholds: () => void;
  onOpenAlertDrawer: () => void;
}

export const PriceAlertControlBar: React.FC<PriceAlertControlBarProps> = ({
  alerts,
  permissionState,
  soundEnabled,
  onRequestBrowserPermission,
  onToggleSound,
  onSimulateFlashDrop,
  onReevaluateAllThresholds,
  onOpenAlertDrawer,
}) => {
  const unreadCount = alerts.filter((a) => !a.isRead).length;

  const getPermissionLabel = () => {
    if (permissionState === "granted") {
      return "OS + Local Browser Alerts Active";
    }
    if (permissionState === "iframe-fallback") {
      return "Local Browser Alert Engine Active (Preview Mode)";
    }
    if (permissionState === "denied") {
      return "OS Push Blocked · Local Browser Alerts Active";
    }
    return "Local Browser Alerts Ready";
  };

  return (
    <div className="bg-[#121216] border border-[#232329] rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div className="flex items-start sm:items-center gap-3">
        <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 shrink-0">
          <BellRing className="w-4 h-4" />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-[#F4F4F6]">
              Local Wishlist Price-Drop Notification Monitor
            </span>
            <span className="text-[#9CA3AF]">·</span>
            <span className="text-emerald-400 font-medium">{getPermissionLabel()}</span>
          </div>
          <p className="text-xs text-[#9CA3AF] mt-0.5">
            Automatically triggers an instant browser notification &amp; sound chime whenever a
            wishlisted edition meets or drops below your target buy threshold.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 shrink-0">
        {permissionState === "default" && (
          <button
            type="button"
            onClick={onRequestBrowserPermission}
            className="px-3 py-1.5 bg-[#0A0A0C] hover:bg-[#1A1A22] border border-amber-500/50 rounded-lg text-xs font-medium text-amber-300 flex items-center gap-1.5 whitespace-nowrap"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Enable OS Push</span>
          </button>
        )}

        <button
          type="button"
          onClick={onToggleSound}
          className={`px-3 py-1.5 bg-[#0A0A0C] hover:bg-[#1A1A22] border rounded-lg text-xs font-medium flex items-center gap-1.5 whitespace-nowrap ${
            soundEnabled
              ? "border-emerald-500/40 text-emerald-300"
              : "border-[#232329] text-[#9CA3AF]"
          }`}
          title="Toggle archival audio chime when a target price alert triggers"
        >
          {soundEnabled ? (
            <>
              <Volume2 className="w-3.5 h-3.5" />
              <span>Chime: On</span>
            </>
          ) : (
            <>
              <VolumeX className="w-3.5 h-3.5" />
              <span>Chime: Muted</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onReevaluateAllThresholds}
          className="px-3 py-1.5 bg-[#0A0A0C] hover:bg-[#1A1A22] border border-[#232329] rounded-lg text-xs font-medium text-[#E4E4E7] flex items-center gap-1.5 whitespace-nowrap"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Check All Thresholds</span>
        </button>

        <button
          type="button"
          onClick={onSimulateFlashDrop}
          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-lg text-xs flex items-center gap-1.5 whitespace-nowrap"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Simulate Flash Price Drop</span>
        </button>

        <button
          type="button"
          onClick={onOpenAlertDrawer}
          className="px-3 py-1.5 bg-[#1A1A22] hover:bg-[#23232E] border border-[#232329] rounded-lg text-xs font-medium text-[#F4F4F6] flex items-center gap-1.5 whitespace-nowrap"
        >
          <Bell className="w-3.5 h-3.5 text-amber-400" />
          <span>Alert Log ({alerts.length})</span>
          {unreadCount > 0 && (
            <span className="font-mono text-[11px] text-emerald-400 font-semibold">
              · {unreadCount} new
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

interface PriceAlertCenterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: PriceDropAlertItem[];
  permissionState: BrowserPermissionState;
  soundEnabled: boolean;
  onRequestBrowserPermission: () => void;
  onToggleSound: () => void;
  onMarkAllRead: () => void;
  onClearHistory: () => void;
  onSimulateFlashDrop: () => void;
  onInspectRelease: (releaseId: string) => void;
}

export const PriceAlertCenterDrawer: React.FC<PriceAlertCenterDrawerProps> = ({
  isOpen,
  onClose,
  alerts,
  permissionState,
  soundEnabled,
  onRequestBrowserPermission,
  onToggleSound,
  onMarkAllRead,
  onClearHistory,
  onSimulateFlashDrop,
  onInspectRelease,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[#121216] border-l border-[#232329] h-full overflow-y-auto p-6 md:p-8 text-[#F4F4F6] flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 pb-5 border-b border-[#232329]">
            <div>
              <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                <BellRing className="w-3.5 h-3.5" />
                <span>Real-Time Wishlist Target Threshold Monitor</span>
              </div>
              <h2 className="font-display text-2xl font-semibold text-[#F4F4F6] mt-1">
                Browser Price-Drop Alert Center
              </h2>
              <p className="text-xs text-[#9CA3AF] mt-1">
                Every time an edition on your wishlist meets or falls below your target price, a
                local browser notification is dispatched and logged here.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-[#9CA3AF] hover:text-white border border-[#232329] rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Controls */}
          <div className="p-4 bg-[#0A0A0C] border border-[#232329] rounded-lg space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div>
                <span className="text-[#9CA3AF]">Notification Status: </span>
                <strong className="text-emerald-400">
                  {permissionState === "granted"
                    ? "Native Browser Push + In-App Popups Enabled"
                    : "Local Browser Alert Banner + Audio Chime Active"}
                </strong>
              </div>
              {permissionState === "default" && (
                <button
                  type="button"
                  onClick={onRequestBrowserPermission}
                  className="px-2.5 py-1 bg-amber-500 text-black font-semibold rounded-md text-xs"
                >
                  Grant Browser Permission
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#232329]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onToggleSound}
                  className="px-3 py-1.5 bg-[#121216] hover:bg-[#1A1A22] border border-[#232329] rounded-lg text-xs flex items-center gap-1.5"
                >
                  {soundEnabled ? (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Alert Chime: On</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-3.5 h-3.5 text-[#9CA3AF]" />
                      <span>Alert Chime: Muted</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onSimulateFlashDrop}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-lg text-xs flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Simulate Flash Price Drop</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {alerts.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={onMarkAllRead}
                      className="px-2.5 py-1.5 bg-[#121216] hover:bg-[#1A1A22] border border-[#232329] rounded-lg text-xs text-[#E4E4E7] flex items-center gap-1"
                    >
                      <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Mark Read</span>
                    </button>
                    <button
                      type="button"
                      onClick={onClearHistory}
                      className="px-2.5 py-1.5 bg-[#121216] hover:bg-[#1A1A22] border border-[#232329] rounded-lg text-xs text-[#9CA3AF] hover:text-rose-400 flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Triggered Alert Feed */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#F4F4F6]">
                Triggered Target Price Alerts ({alerts.length})
              </span>
              <span className="text-[#9CA3AF]">
                Sorted by most recent price drop
              </span>
            </div>

            {alerts.length === 0 ? (
              <div className="p-8 bg-[#0A0A0C] border border-[#232329] rounded-lg text-center space-y-2">
                <Bell className="w-7 h-7 text-[#9CA3AF] mx-auto" />
                <div className="text-sm font-medium text-[#F4F4F6]">
                  No Unread Price-Drop Alerts Yet
                </div>
                <p className="text-xs text-[#9CA3AF] max-w-sm mx-auto">
                  Lower or raise any target price in your wishlist, run a Live Retailer Scan, or
                  click &ldquo;Simulate Flash Price Drop&rdquo; above to test an immediate alert.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 bg-[#0A0A0C] border rounded-lg space-y-2.5 transition-colors ${
                      item.isRead ? "border-[#232329]" : "border-emerald-500/60"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <div className="flex items-center gap-2">
                        {!item.isRead && (
                          <span className="text-emerald-400 font-semibold">● NEW</span>
                        )}
                        <span className="text-amber-400 font-medium">
                          {item.triggerSource}
                        </span>
                        <span className="text-[#9CA3AF]">·</span>
                        <span className="text-[#9CA3AF]">{item.label}</span>
                      </div>
                      <span className="font-mono text-[#9CA3AF]">
                        {new Date(item.triggeredAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-display text-sm font-semibold text-[#F4F4F6]">
                          {item.title}
                        </h4>
                        <div className="text-xs text-[#9CA3AF] mt-0.5">
                          <span className="text-[#E4E4E7] font-medium">{item.retailer}</span> ·{" "}
                          {item.slipcoverStatus}
                        </div>
                      </div>

                      <div className="text-right font-mono shrink-0 tabular-nums">
                        <div className="text-base font-semibold text-emerald-400">
                          ${item.offerPrice.toFixed(2)}
                        </div>
                        <div className="text-[11px] text-[#9CA3AF]">
                          Target ${item.targetPrice.toFixed(2)} (-{item.discountPctOffMsrp}% vs MSRP)
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#232329] text-xs">
                      <span className="text-emerald-400 font-medium">
                        {item.savingsBelowTarget > 0.005
                          ? `$${item.savingsBelowTarget.toFixed(2)} below your target threshold`
                          : "Matched your exact target threshold"}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onInspectRelease(item.releaseId);
                            onClose();
                          }}
                          className="px-2.5 py-1 bg-[#121216] hover:bg-[#1A1A22] border border-[#232329] rounded-md text-[#E4E4E7]"
                        >
                          Dossier
                        </button>
                        <a
                          href={item.retailerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-md inline-flex items-center gap-1"
                        >
                          <span>Store</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
