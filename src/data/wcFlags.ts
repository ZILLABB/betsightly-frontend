/**
 * World Cup 2026 — Team → ISO country code mapping
 * Used to fetch reliable flag images from flagcdn.com
 */

export const WC_TEAM_CODES: Record<string, string> = {
  "Algeria": "dz",
  "Argentina": "ar",
  "Australia": "au",
  "Austria": "at",
  "Belgium": "be",
  "Bosnia & Herzegovina": "ba",
  "Bosnia and Herzegovina": "ba",
  "Brazil": "br",
  "Canada": "ca",
  "Cape Verde": "cv",
  "Cape Verde Islands": "cv",
  "Colombia": "co",
  "Croatia": "hr",
  "Curaçao": "cw",
  "Curacao": "cw",
  "Czech Republic": "cz",
  "DR Congo": "cd",
  "Congo DR": "cd",
  "Ecuador": "ec",
  "Egypt": "eg",
  "England": "gb-eng",
  "France": "fr",
  "Germany": "de",
  "Ghana": "gh",
  "Haiti": "ht",
  "Iran": "ir",
  "Iraq": "iq",
  "Ivory Coast": "ci",
  "Japan": "jp",
  "Jordan": "jo",
  "Mexico": "mx",
  "Morocco": "ma",
  "Netherlands": "nl",
  "New Zealand": "nz",
  "Norway": "no",
  "Panama": "pa",
  "Paraguay": "py",
  "Portugal": "pt",
  "Qatar": "qa",
  "Saudi Arabia": "sa",
  "Scotland": "gb-sct",
  "Senegal": "sn",
  "South Africa": "za",
  "South Korea": "kr",
  "Korea Republic": "kr",
  "Spain": "es",
  "Sweden": "se",
  "Switzerland": "ch",
  "Tunisia": "tn",
  "Turkey": "tr",
  "Uruguay": "uy",
  "USA": "us",
  "Uzbekistan": "uz",
};

/**
 * Get a reliable flag URL for a team.
 * Falls back to the originalLogo URL if no country code is mapped.
 */
export function getTeamFlag(teamName: string | undefined, originalLogo?: string | null, size: 40 | 80 | 160 = 80): string | undefined {
  if (!teamName) return originalLogo ?? undefined;
  const code = WC_TEAM_CODES[teamName];
  if (code) {
    // flagcdn.com supports both PNG (h{size}) and SVG. PNG is more compatible.
    return `https://flagcdn.com/h${size}/${code}.png`;
  }
  return originalLogo ?? undefined;
}

/**
 * True if team is recognized as a WC nation.
 * Use for choosing flag vs initials-badge rendering.
 */
export function isWcNation(teamName: string | undefined): boolean {
  return !!(teamName && WC_TEAM_CODES[teamName]);
}

/**
 * 2-letter team initials for non-WC clubs.
 * "CD Castellón" → "CC", "FC Inter Turku" → "IT", "Real Madrid" → "RM"
 */
export function teamInitials(teamName: string | undefined): string {
  if (!teamName) return "?";
  const cleaned = teamName.replace(/\b(FC|CD|CF|SC|AC|AS|SS|RC|UD|CA|CD|St|Saint)\b\.?/gi, "").trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  if (words.length === 1 && words[0].length >= 2) return words[0].slice(0, 2).toUpperCase();
  return (teamName[0] || "?").toUpperCase();
}

/**
 * Deterministic color for a non-WC team (consistent across renders).
 * Returns an HSL string.
 */
export function teamColor(teamName: string | undefined): string {
  if (!teamName) return "hsl(220, 30%, 40%)";
  let h = 0;
  for (let i = 0; i < teamName.length; i++) h = (h * 31 + teamName.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return `hsl(${hue}, 45%, 38%)`;
}
