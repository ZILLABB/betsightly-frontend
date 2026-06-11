import React, { useEffect, useRef, useState } from "react";
import { X, Share2, Download, MoreVertical } from "lucide-react";

const STORAGE_KEY = "bs_pwa_dismissed_at_v2";
const REPROMPT_AFTER_MS = 14 * 24 * 60 * 60 * 1000;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.userAgent.includes("Mac") && "ontouchend" in document);
}

function isStandalone() {
  return typeof window !== "undefined" && (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

function wasDismissedRecently(): boolean {
  try {
    const dismissedAt = localStorage.getItem(STORAGE_KEY);
    return !!dismissedAt && Date.now() - parseInt(dismissedAt) < REPROMPT_AFTER_MS;
  } catch {
    return false;
  }
}

/**
 * Install prompt with three modes, because browsers differ:
 *  - "native":  Chrome/Edge on Android + desktop — beforeinstallprompt fired,
 *               the Install button triggers the real OS dialog.
 *  - "ios":     iOS Safari/Chrome — Apple never fires beforeinstallprompt;
 *               show Share → Add to Home Screen instructions instead.
 *  - "manual":  Android Firefox / Samsung Internet / Opera, or Chrome when it
 *               withholds the event (recently dismissed native prompt, install
 *               criteria pending) — show browser-menu instructions so the card
 *               is never a dead button.
 */
export function PWAInstallPrompt() {
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const [mode, setMode] = useState<"native" | "ios" | "manual" | null>(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (isStandalone() || wasDismissedRecently()) return;

    if (isIOS()) {
      const timer = setTimeout(() => setMode("ios"), 4000);
      return () => clearTimeout(timer);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setMode(m => (m === null || m === "manual" ? "native" : m));
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Only nag mobile users with manual instructions — desktop browsers
    // without the event (Safari/Firefox) get nothing rather than noise.
    const isMobile = /Android|Mobile/i.test(navigator.userAgent);
    const fallback = setTimeout(() => {
      if (!deferredPrompt.current && isMobile) setMode(m => m ?? "manual");
    }, 8000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(fallback);
    };
  }, []);

  const dismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, String(Date.now())); } catch {}
    setMode(null);
  };

  const install = async () => {
    const prompt = deferredPrompt.current;
    if (!prompt) {
      // Chrome gave us nothing to call — fall back to instructions
      // instead of a button that silently does nothing.
      setMode("manual");
      return;
    }
    setInstalling(true);
    try {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      deferredPrompt.current = null;
      if (outcome === "accepted") {
        setMode(null);
      } else {
        dismiss(); // user said no in the OS dialog — don't re-nag for 14 days
      }
    } catch {
      // prompt() already consumed earlier, or browser refused — show the
      // manual path rather than dead-ending.
      deferredPrompt.current = null;
      setMode("manual");
    } finally {
      setInstalling(false);
    }
  };

  if (!mode) return null;

  const subtitle =
    mode === "ios" ? (
      <>Tap <Share2 size={10} style={{ verticalAlign: "middle" }} /> then <strong>"Add to Home Screen"</strong></>
    ) : mode === "manual" ? (
      <>Open the browser menu <MoreVertical size={10} style={{ verticalAlign: "middle" }} /> and tap <strong>"Add to Home Screen"</strong></>
    ) : (
      "Get instant access from your home screen"
    );

  return (
    <>
      <div className="pwa-install-prompt animate-fade-up" style={{
        position: "fixed", left: 16, right: 16,
        bottom: "calc(72px + max(16px, env(safe-area-inset-bottom)))",
        zIndex: 60, maxWidth: 420, margin: "0 auto",
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 16, padding: "16px 18px",
        boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <div style={{
          width: 42, height: 42, borderRadius: 11, flexShrink: 0,
          background: "var(--brand-faint)", border: "1px solid var(--border-brand)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Download size={18} color="var(--brand)" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>
            Install BetSightly
          </p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
            {subtitle}
          </p>
        </div>
        {mode === "native" && (
          <button
            onClick={install}
            disabled={installing}
            style={{
              padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer",
              background: "var(--brand)", color: "#fff",
              fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 700,
              whiteSpace: "nowrap", opacity: installing ? 0.7 : 1,
              transition: "opacity 150ms ease",
            }}
          >
            {installing ? "..." : "Install"}
          </button>
        )}
        <button onClick={dismiss} aria-label="Dismiss" style={{
          width: 28, height: 28, borderRadius: 8, border: "1px solid var(--border)",
          background: "transparent", color: "var(--text-3)", cursor: "pointer",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <X size={13} />
        </button>
      </div>
      <style>{`
        @media (min-width: 768px) {
          .pwa-install-prompt {
            bottom: auto !important;
            top: 80px !important;
            right: 16px !important;
            left: auto !important;
          }
        }
      `}</style>
    </>
  );
}
