import React, { useState } from "react";
import { Share2, Check } from "lucide-react";

interface Props {
  text: string;          // What to share (becomes copied + WhatsApp/Twitter text)
  url?: string;          // Defaults to window.location.href
  label?: string;        // Button label override
  compact?: boolean;     // Icon-only mode
}

/**
 * Cross-platform share button.
 * - Mobile: uses native share sheet (navigator.share) when available
 * - Desktop: copies a "text + URL" string to clipboard
 */
export function ShareButton({ text, url, label = "Share", compact = false }: Props) {
  const [copied, setCopied] = useState(false);
  const finalUrl = url ?? (typeof window !== "undefined" ? window.location.href : "");

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const fullText = `${text}\n\n${finalUrl}`;

    // Native share (mobile / supported desktops)
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({ title: "BetSightly Pick", text, url: finalUrl });
        return;
      } catch {
        // user cancelled — fall through to clipboard
      }
    }

    // Clipboard fallback
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Ignore — older browsers without clipboard API
    }
  };

  return (
    <button
      onClick={handleShare}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: compact ? "5px 8px" : "6px 12px",
        borderRadius: 6, border: "1px solid var(--border)",
        background: copied ? "rgba(34,197,94,0.10)" : "transparent",
        color: copied ? "var(--green)" : "var(--text-3)",
        fontFamily: "var(--font-body)", fontSize: compact ? 11 : 12, fontWeight: 600,
        cursor: "pointer", transition: "all 150ms ease",
      }}
      title={copied ? "Copied!" : "Share this pick"}
      aria-label="Share pick"
    >
      {copied ? <Check size={12} /> : <Share2 size={12} />}
      {!compact && (copied ? "Copied" : label)}
    </button>
  );
}
