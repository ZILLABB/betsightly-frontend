import React from "react";

interface Props {
  message?: string;
  /** Optional skeleton content rendered below the loader (e.g. card grid placeholders) */
  children?: React.ReactNode;
}

/** Branded loading state — pulsing BetSightly logo + indeterminate progress track. */
export function BrandLoader({ message = "Loading...", children }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div className="brand-loader" role="status" aria-live="polite">
        <img src="/logo.png" alt="" aria-hidden="true" />
        <div className="brand-loader-track" />
        <span className="brand-loader-msg">{message}</span>
      </div>
      {children}
    </div>
  );
}
