import React, { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

const STORAGE_KEY = "bs_pwa_dismissed_at_v1";
// Re-prompt after 14 days if user dismissed
const REPROMPT_AFTER_MS = 14 * 24 * 60 * 60 * 1000;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * Custom "Add to Home Screen" prompt.
 * - Listens for the beforeinstallprompt event (Chrome / Edge on mobile + desktop)
 * - Shows a non-intrusive bottom-sheet on mobile when available
 * - Dismissal stored in localStorage; re-prompts after 14 days
 * - Silently absent on iOS (Apple blocks beforeinstallprompt) — users add via Safari menu
 */
export function PWAInstallPrompt() {
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Don't even register if standalone (already installed)
    if (typeof window !== "undefined" && window.matchMedia("(display-mode: standalone)").matches) {
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      const bipe = e as BeforeInstallPromptEvent;

      // Respect dismissal
      try {
        const dismissedAt = localStorage.getItem(STORAGE_KEY);
        if (dismissedAt && Date.now() - parseInt(dismissedAt) < REPROMPT_AFTER_MS) {
          return;
        }
      } catch { /* noop */ }

      setEvt(bipe);
      // Delay showing so the user sees the page first
      setTimeout(() => setShow(true), 4000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, String(Date.now())); } catch { /* noop */ }
    setShow(false);
  };

  const install = async () => {
    if (!evt) return;
    try {
      await evt.prompt();
      await evt.userChoice;
    } catch { /* noop */ }
    setShow(false);
    setEvt(null);
  };

  if (!show || !evt) return null;

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
        <div style={{
          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
          background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.22)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Download size={18} color="var(--brand)" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>
            Install BetSightly
          </p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
            Adds the app to your home screen. Loads instantly.
          </p>
        </div>
        <button onClick={install} style={{
          padding: "8px 14px", borderRadius: 8, border: "none", cursor: "pointer",
          background: "var(--brand)", color: "#fff",
          fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 700,
        }}>
          Install
        </button>
        <button onClick={dismiss} aria-label="Dismiss" style={{
          width: 28, height: 28, borderRadius: 8, border: "1px solid var(--border)",
          background: "transparent", color: "var(--text-3)", cursor: "pointer",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
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
          /* On desktop float top-right instead of bottom */
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
