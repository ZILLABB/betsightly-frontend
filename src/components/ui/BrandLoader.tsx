import type { ReactNode } from "react";
import { BetSightlyLogo } from "../brand/BetSightlyLogo";

interface Props {
  message?: string;
  /** Optional skeleton content below the branded loading indicator. */
  children?: ReactNode;
}

/**
 * One source of truth for the loading logo: exactly the same vector component
 * used in the Header and Footer, instead of legacy /logo.png.
 *
 * The indicator is indeterminate, not a fabricated completion percentage.
 */
export function BrandLoader({ message = "Loading…", children }: Props) {
  return (
    <div className="brand-loader-layout">
      <div className="brand-loader brand-loader--editorial" role="status" aria-live="polite" aria-atomic="true">
        <span className="brand-loader__identity">
          <BetSightlyLogo compact />
        </span>
        <span className="brand-loader-track" aria-hidden="true">
          <span className="brand-loader-track__indicator"/>
        </span>
        <span className="brand-loader-msg">{message}</span>
      </div>
      {children}
    </div>
  );
}
