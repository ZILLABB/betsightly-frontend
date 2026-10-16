/** BetSightly branded vector mark. Designed for a tiny phone header and
 * desktop without bitmap cropping, glow-only legibility or football IP. */
export function BetSightlyLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`bs-brand${compact ? " bs-brand--compact" : ""}`} aria-hidden="true">
      <svg className="bs-brand__symbol" viewBox="0 0 50 50" fill="none" role="presentation">
        <defs>
          <linearGradient id="bsMark" x1="4" y1="45" x2="42" y2="4" gradientUnits="userSpaceOnUse">
            <stop stopColor="#06985C" />
            <stop offset="1" stopColor="#36F5A0" />
          </linearGradient>
        </defs>
        <path d="M12 6h16c9 0 14 5 14 12 0 5-3 8-7 10 5 1 8 5 8 10 0 8-6 12-16 12H12V6Z"
          fill="url(#bsMark)" fillOpacity=".14" />
        <path d="M13 7h14c9 0 14 4 14 11 0 4-3 8-7 9 6 2 9 5 9 10 0 7-5 11-15 11H13"
          stroke="url(#bsMark)" strokeWidth="5.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15 26h18M15 38h14" stroke="url(#bsMark)" strokeWidth="5" strokeLinecap="round" />
        <path d="m5 44 15-18 8 5L44 9" stroke="#5BF4A6" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="m34 9 10-2 1 11" stroke="#5BF4A6" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="bs-brand__words">
        <span className="bs-brand__name"><span>BET</span><span>SIGHTLY</span></span>
        <span className="bs-brand__tagline">PREDICT · ANALYZE · TRACK</span>
      </span>
    </span>
  );
}
