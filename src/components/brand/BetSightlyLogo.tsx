/** The official BetSightly identity: the clean, geometric B selected from the second reference image.
 * An inline vector stays sharp at mobile-header and footer sizes, without chart bars or arrows. */
export function BetSightlyLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`bs-brand bs-brand--new${compact ? " bs-brand--compact" : ""}`} aria-hidden="true">
      <svg className="bs-brand__symbol" viewBox="0 0 329 467" role="presentation" fill="none" focusable="false">
        <path d="M221 18 C207 8 187 0 169 0 H0 V375 L278 99 C273 66 255 38 221 18 Z M34 35 H162 C197 35 225 53 237 88 L34 291 Z" fill="#37E58C" fillRule="evenodd"/>
        <path d="M214 214 L0 428 V467 H210 C280 467 329 417 329 353 C329 283 280 230 214 214 Z M227 251 C269 263 293 302 293 346 C293 395 256 432 211 432 H49 Z" fill="#37E58C" fillRule="evenodd"/>
      </svg>
      <span className="bs-brand__words">
        <span className="bs-brand__name"><span>BET</span><span>SIGHTLY</span></span>
        <span className="bs-brand__tagline">PREDICT · ANALYZE · TRACK</span>
      </span>
    </span>
  );
}
