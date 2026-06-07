import React, { useEffect, useRef, useState } from "react";
import { X, Share2 } from "lucide-react";

const STORAGE_KEY = "bs_pwa_dismissed_at_v1";
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

  useEffect(() => {
    if (isStandalone() || wasDismissedRecently()) return;

    if (isIOS()) {
      setTimeout(() => setShowIOS(true), 4000);
      return;
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
    if (!prompt) return;
    deferredPrompt.current = null;
    try {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === "accepted") {
        setShowNative(false);
      }
    } catch {
      // Browser rejected the prompt — already installed or not supported
    }
    setShowNative(false);
  };

  const show = showNative || showIOS;
  if (!show) return null;

  return (
    <>
      <div className="pwa-install-prompt" style={{
        position: "fixed", left: 16, right: 16,
        bottom: "calc(72px + max(16px, env(safe-area-inset-bottom)))",
        zIndex: 60, maxWidth: 480, margin: "0 auto",
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 14, padding: "14px 16px",
        boxShadow: "var(--shadow-lg)",
        display: "flex", alignItems: "center", gap: 12,
        animation: "pwa-slide-up 280ms ease-out",
      }}>
        <img
          src="/pwa-192x192.png"
          alt="BetSightly"
          style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            objectFit: "cover",
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>
            Install BetSightly
          </p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
            {showIOS
              ? <>Tap <Share2 size={10} style={{ verticalAlign: "middle" }} /> then <strong>"Add to Home Screen"</strong></>
              : "Add to your home screen for instant access."
            }
          </p>
        </div>
        {showNative && (
          <button onClick={install} style={{
            padding: "8px 14px", borderRadius: 8, border: "none", cursor: "pointer",
            background: "var(--brand)", color: "#fff",
            fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 700,
            whiteSpace: "nowrap",
          }}>
            Install
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
        @keyframes pwa-slide-up {
          from { transform: translateY(40px); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
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
