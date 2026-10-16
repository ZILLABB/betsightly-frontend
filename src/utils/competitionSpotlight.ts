/** Context for the homepage, derived ONLY from the current 7-day fixture board.
 *
 * Never infer a tournament from the calendar date alone: schedules change,
 * postponed matches happen, and World Cup seasons are not annual. A missing
 * or stale provider board returns null, retaining the standard product hero.
 */
export interface FixtureLeague {
  slug?: string;
  name?: string;
  count?: number;
}

export interface CompetitionSpotlight {
  label: string;
  headline: string;
  description: string;
  fixtureCount: number;
}

const COMPETITIONS: ReadonlyArray<{
  matches: RegExp;
  label: string;
  headline: string;
  description: string;
}> = [
  {
    matches: /(?:fifa[\s._-]*)?world[\s._-]*cup|(?:^|\W)worldcup(?:$|\W)/i,
    label: "International spotlight",
    headline: "World Cup fixtures ahead",
    description: "World Cup fixtures are on the upcoming football calendar.",
  },
  {
    matches: /africa[\s._-]*cup[\s._-]*of[\s._-]*nations|(?:^|\W)afcon(?:$|\W)/i,
    label: "International spotlight",
    headline: "Africa Cup of Nations ahead",
    description: "AFCON fixtures are on the upcoming football calendar.",
  },
  {
    matches: /champions[\s._-]*league|(?:^|\W)(?:uefa[\s._-]*)?ucl(?:$|\W)/i,
    label: "European football",
    headline: "Champions League week",
    description: "Champions League fixtures are coming up in the next seven days.",
  },
  {
    matches: /europa[\s._-]*league|(?:^|\W)uel(?:$|\W)/i,
    label: "European football",
    headline: "Europa League fixtures ahead",
    description: "Europa League fixtures are on this week's calendar.",
  },
  {
    matches: /conference[\s._-]*league|(?:^|\W)uecl(?:$|\W)/i,
    label: "European football",
    headline: "Conference League fixtures ahead",
    description: "Conference League fixtures are on this week's calendar.",
  },
  {
    matches: /premier[\s._-]*league|(?:^|\W)eng[._-]1(?:$|\W)/i,
    label: "League spotlight",
    headline: "Premier League football ahead",
    description: "Premier League matches are on the upcoming fixture calendar.",
  },
  {
    matches: /(?:^|\W)la[\s._-]*liga(?:$|\W)|(?:^|\W)esp[._-]1(?:$|\W)/i,
    label: "League spotlight",
    headline: "LaLiga fixtures ahead",
    description: "LaLiga matches are on the upcoming fixture calendar.",
  },
  {
    matches: /(?:^|\W)bundesliga(?:$|\W)|(?:^|\W)ger[._-]1(?:$|\W)/i,
    label: "League spotlight",
    headline: "Bundesliga fixtures ahead",
    description: "Bundesliga matches are on the upcoming fixture calendar.",
  },
];

export function competitionSpotlight(
  leagues: FixtureLeague[] | undefined | null,
): CompetitionSpotlight | null {
  if (!Array.isArray(leagues)) return null;
  for (const event of COMPETITIONS) {
    const match = leagues.find(league =>
      league &&
      Number.isFinite(Number(league.count)) &&
      Number(league.count) > 0 &&
      event.matches.test(`${league.slug ?? ""} ${league.name ?? ""}`),
    );
    if (match) {
      return {
        label: event.label,
        headline: event.headline,
        description: event.description,
        fixtureCount: Number(match.count),
      };
    }
  }
  return null;
}
