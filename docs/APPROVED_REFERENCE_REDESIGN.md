# BetSightly — five-screen reference redesign

## Design source of truth

Implements the user-approved dark-emerald, stadium-led five-screen reference,
with the SAME real product logic and no mock scores, fake bookmaker codes,
made-up crest assets or guaranteed-win claims.

- Header/footer: replace old yellow bitmap crop with a scalable emerald
  BetSightly wordmark and simplified chart-growth B mark.
- Home: atmospheric stadium masthead, date and competition context from
  existing verified fixture/campaign feeds, verified code spotlight with
  real SportyBet booked prices only, record overview and tier navigation.
- Predictions: strong masthead and green-accent match cards tied to the real
  selected category, official fixture market, kickoff and booking response.
- Builder: original Choose → Build → Verify workflow, odds and code logic;
  no high-odds guarantees or changing the existing selected target.
- Results: live backend won/lost/settled/strike-rate summary sourced from
  **official model accumulator totals**; manual results still separately
  labelled and cannot enter model hit rates.
- Rollover: the actual scheduled three-day status and individual day results,
  never prefilled winnings, without modifying settlement rules.
- Responsive: 320, 375, 390, 430, 768, 1024, 1440 desktop; keyboard focus,
  44px touch targets, reduced-motion fallbacks and dark/light theme.

## Image provenance and fallback

The stadium in the hero is the historical *Well lit soccer stadium* photo
by Mario Klassen, available from Wikimedia Commons / original Unsplash
publication (2017) under the Creative Commons CC0 1.0 public-domain dedication:
https://commons.wikimedia.org/wiki/File:Well_lit_soccer_stadium_(Unsplash).jpg

The photographic treatment is atmospheric, does **not** purport to depict
the currently featured fixture or event. CSS gradients remain as an offline
fallback. Avoid downloading team crests without rights verification.

## Verification

Full frontend CI unit tests + TypeScript/Vite production build, Vercel READY
commit; real mobile-browser screenshot review still needed, including
installed PWA home-screen raster icons which remain the former artwork until
a reviewed multi-size icon export is made.
