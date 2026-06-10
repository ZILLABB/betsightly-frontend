import React, { useEffect, useRef, useState } from "react";
import { X, Share2, Download } from "lucide-react";

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

export function PWAInstallPrompt() {
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const [showNative, setShowNative] = useState(false);
  const [showIOS, setShowIOS] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (isStandalone() || wasDismissedRecently()) return;

    if (isIOS()) {
      const timer = setTimeout(() => setShowIOS(true), 4000);
      return () => clearTimeout(timer);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setTimeout(() => setShowNative(true), 4000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, String(Date.now())); } catch {}
    setShowNative(false);
    setShowIOS(false);
  };

  const install = async () => {
    const prompt = deferredPrompt.current;
    if (!prompt) {
      dismiss();
      return;
    }
    setInstalling(true);
    try {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === "accepted") {
        deferredPrompt.current = null;
      }
    } catch {
      // Browser rejected — already installed or not supported
    } finally {
      setInstalling(false);
      deferredPrompt.current = null;
      setShowNative(false);
    }
  };

  const show = showNative || showIOS;
  if (!show) return null;

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
            {showIOS
              ? <>Tap <Share2 size={10} style={{ verticalAlign: "middle" }} /> then <strong>"Add to Home Screen"</strong></>
              : "Get instant access from your home screen"
            }
          </p>
        </div>
        {showNative && (
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
