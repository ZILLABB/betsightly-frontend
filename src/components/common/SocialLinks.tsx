import React from "react";
import { Send, Twitter, Instagram, Youtube, MessageSquare } from "lucide-react";
import {
  TELEGRAM_GROUP_URL,
  TWITTER_URL,
  INSTAGRAM_URL,
  WHATSAPP_CHANNEL_URL,
  YOUTUBE_URL,
} from "../../config/socials";

interface Props {
  size?: number;
}

/**
 * Renders icon links for every social platform with a URL configured.
 * Empty URLs are skipped — so Twitter etc. only show up when you set them.
 */
export function SocialLinks({ size = 16 }: Props) {
  const links = [
    { url: TELEGRAM_GROUP_URL, icon: <Send size={size} />, label: "Telegram", brand: "#229ED9" },
    { url: WHATSAPP_CHANNEL_URL, icon: <MessageSquare size={size} />, label: "WhatsApp", brand: "#25D366" },
    { url: TWITTER_URL, icon: <Twitter size={size} />, label: "Twitter / X", brand: "#1DA1F2" },
    { url: INSTAGRAM_URL, icon: <Instagram size={size} />, label: "Instagram", brand: "#E4405F" },
    { url: YOUTUBE_URL, icon: <Youtube size={size} />, label: "YouTube", brand: "#FF0000" },
  ].filter(l => !!l.url);

  if (!links.length) return null;

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      {links.map(l => (
        <a
          key={l.label}
          href={l.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={l.label}
          title={l.label}
          style={{
            width: 34, height: 34, borderRadius: 8,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            background: "var(--surface-2)", border: "1px solid var(--border)",
            color: "var(--text-2)", textDecoration: "none",
            transition: "all 150ms ease",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.color = l.brand;
            (e.currentTarget as HTMLElement).style.borderColor = `${l.brand}55`;
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.color = "var(--text-2)";
            (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
          }}
        >
          {l.icon}
        </a>
      ))}
    </div>
  );
}
