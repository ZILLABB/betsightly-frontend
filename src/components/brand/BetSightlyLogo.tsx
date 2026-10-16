/** Option B identity: original generated "rising-B" concept redrawn as a
 * crisp responsive vector. The dark BET text in the concept becomes readable
 * off-white on our dark UI; the monogram stays recognisable at 36px.
 *
 * No bitmap background, filter glow, sport-team marks or clip-path text.
 */
export function BetSightlyLogo({ compact = false }: { compact?: boolean }) {
  const gradientId = compact ? "bs-b-gradient-footer" : "bs-b-gradient-header";

  return (
    <span className={`bs-brand bs-brand--new${compact ? " bs-brand--compact" : ""}`} aria-hidden="true">
      <svg className="bs-brand__symbol" viewBox="0 0 72 76" role="presentation" fill="none">
        <defs>
          <linearGradient id={gradientId} x1="8" y1="69" x2="64" y2="5" gradientUnits="userSpaceOnUse">
            <stop stopColor="#008856" />
            <stop offset=".55" stopColor="#0FC982" />
            <stop offset="1" stopColor="#42F4AB" />
          </linearGradient>
        </defs>
        {/* The distinctive broad B from the approved generated identity. */}
        <path d="M19 7H43C59 7 68 15 68 27c0 8-4 14-11 18 7 4 10 10 10 18 0 13-10 20-26 20H18l9-10h14c10 0 15-4 15-11 0-8-6-12-17-12h-7l9-10h2c9 0 15-4 15-11 0-8-5-12-15-12H27L19 7Z"
          fill={`url(#${gradientId})`} transform="translate(0 -8) scale(1 .89)" />
        {/* Bookmaker data bars running beneath the forward stroke. */}
        <path d="M14 54h9v17h-9zM28 44h9v27h-9zM42 34h9v37h-9z"
          fill={`url(#${gradientId})`} />
        {/* Rising diagonal is integral to the mark, not a separate generic arrow. */}
        <path d="M7 66 24 48 37 34 44 40 61 19"
          stroke="#46F6AB" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M54 18 63 16 62 26" stroke="#46F6AB" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span className="bs-brand__words">
        <span className="bs-brand__name"><span>BET</span><span>SIGHTLY</span></span>
        <span className="bs-brand__tagline">PREDICT · ANALYZE · TRACK</span>
      </span>
    </span>
  );
}
