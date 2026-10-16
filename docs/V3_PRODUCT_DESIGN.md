# BetSightly V3 — product experience contract

## Identity

BetSightly is a modern, trustworthy **football intelligence and publishing**
platform. Use the established deep-green background, restrained mint highlight,
existing typography, clearly differentiated result statuses, and simple
editorial hierarchy; no visual claims of guaranteed wins.

The V3 presentation lives in `src/styles/experience-v3.css`, scoped under
`v3-page` and individual page classes. It intentionally loads after the
historic stylesheet and retains the existing prediction, booking, and results
logic. No heavy 3D, imported graphics, or third-party tournament assets.

## Four essential screens

- **Matchday / Home**: Date, competition context if actually scheduled,
  clear path to the published picks/code, a real fixture preview from a
  selected category, and bookmaker pricing only if the corresponding code is
  actionable and verified. A thin card falls back to noncommittal copy.
- **Predictions**: Clear editorial introduction, entry to published tiers,
  a route to Builder and to transparent Results. Only real selectable
  categories and prices; never a forced 0.00x placeholder.
- **Build Slip**: Choose target and markets, build qualified selections,
  verify the bookmaker code. The three-step strip reflects the actual
  `displayedBooking` state, including edits and stale codes.
- **Results**: Official performance, the separate manually curated slip
  track, rollover chains and leg-level evidence in a consistent visual
  language. Manual outcomes never enter model metrics or calibration.

## Core responsive checks

- 320, 375, 390, 430, 768, 1024, 1440 px; both dark and light modes.
- No horizontal overflow, no off-screen bookmaker-code panel, at least
  44-pixel touch targets, keyboard focus rings, sensible line wrapping.
- Loading, unavailable fixture, unverified booking, suspended/started code,
  empty card, verified code, manual unscored card, settled won/lost/void.
- A competition campaign never implies fixtures are available, and stale
  or unreviewed campaigns expire and fall back to current fixture evidence.
- Reduced motion never obstructs navigation.
- Test exact link destinations and mobile thumb navigation to Results.

## Nonnegotiable product contracts

Do **not** modify established model-calibration denominators, manual settlement
boundaries, bookmaker fingerprint/read-back verification, venue/risk rules,
the betslip's immutable published record, or user consent/age notices as a
design side effect. 'Viewed/copied' is not 'bet placed'. The official results
retain wins and losses, with no deleted or hidden negatives.

## Deployment proof

Unit test + production build, then Vercel commit and deployment state. A real
browser visual inspection remains separately required, because green CI alone
cannot prove pixel-perfect layouts on all physical devices.
