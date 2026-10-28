/**
 * Explicitly verified club identities for fallbacks when a manual publication
 * omits the original fixture's logo URL.
 *
 * These URLs are *not* inferred from names, abbreviated IDs, or a bookmaker's
 * fixture number. Every club below was checked against the source institution
 * or its ESPN team profile, and aliases are exact and deliberately limited.
 *
 * New clubs should normally come from the backend's fixture asset snapshot,
 * not from adding unverified name guesses to this registry.
 */
const VERIFIED_CLUB_CRESTS: Readonly<Record<string, string>> = {
  "CD Covadonga": "https://cdcovadonga.com/wp-content/uploads/2023/06/escudo-cd-covadonga-ok.webp",
  "Valladolid": "https://a.espncdn.com/i/teamlogos/soccer/500/95.png",
  "Real Valladolid": "https://a.espncdn.com/i/teamlogos/soccer/500/95.png",
  "Dynamo Dresden": "https://a.espncdn.com/i/teamlogos/soccer/500/7017.png",
  "Schalke": "https://a.espncdn.com/i/teamlogos/soccer/500/133.png",
  "Schalke 04": "https://a.espncdn.com/i/teamlogos/soccer/500/133.png",
};

export function verifiedClubCrest(team: string): string | null {
  return VERIFIED_CLUB_CRESTS[team.trim()] ?? null;
}
