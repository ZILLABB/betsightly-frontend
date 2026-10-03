export interface HeroCampaign { id: string; priority: number; eyebrow: string; headline: string; subheadline: string; ctaLabel: string; ctaRoute: string; secondaryCtaLabel?: string; secondaryCtaRoute?: string; competitionKeywords?: string[]; }
export interface HeroCampaignContext { now: Date; activeCompetitions?: string[]; fixtureCount?: number; }
const make = (id: string, priority: number, eyebrow: string, headline: string, subheadline: string, competitionKeywords: string[] = []): HeroCampaign => ({ id, priority, eyebrow, headline, subheadline, competitionKeywords, ctaLabel: "Explore verified picks", ctaRoute: "/predictions", secondaryCtaLabel: "Build a slip", secondaryCtaRoute: "/build-slip" });
export const HERO_CAMPAIGNS = [
  make("world-cup",100,"World Cup football","The world stage.\nSmart picks.","Follow the board with evidence-led selection, not tournament hype.",["world cup"]),
  make("afcon",90,"AFCON matchday","Africa’s biggest stage.\nMeasured picks.","Competition context is included where the verified board provides it.",["afcon","africa cup"]),
  make("euros",90,"European Championship","Tournament football.\nClearer signals.","Review every match and market before you bet.",["euro 202","uefa european"]),
  make("continental",80,"European nights","Knockout football.\nEvidence first.","Strong opinions only when the available market evidence supports them.",["champions league","europa league","conference league"]),
  make("qualifiers",105,"International qualifiers","Qualification pressure.\nSame standards.","International fixtures remain subject to the same selection and booking checks.",["qualifier","nations league"]),
  make("afcon-qualifiers",76,"AFCON qualifiers","Qualification football.\nMeasured picks.","The current board—not old reputation—drives the available selections.",["afcon qualifier"]),
  make("euro-qualifiers",76,"Euro qualifiers","Qualification football.\nSame standards.","Review the market and current price before you decide.",["euro qualifier"]),
  make("europa-league",82,"Europa League","European nights.\nEvidence first.","Only approved markets enter the published card.",["europa league"]),
  make("conference-league",81,"Conference League","European football.\nQuality first.","BetSightly will not force a ticket just to reach a target.",["conference league"]),
  make("club-world-cup",74,"Club World Cup","Global clubs.\nGrounded selections.","Use the current verified board, not headline narratives.",["club world cup"]),
  make("womens-international",73,"Women’s international football","Big stage.\nCareful selection.","Only approved, evidence-backed markets reach the card.",["women","feminine"]),
  make("premier-league",65,"Premier League weekend","England’s big fixtures.\nClearer decisions.","See the day’s published card or build around your own structure.",["premier league"]),
  make("la-liga",64,"La Liga matchday","Spanish football.\nMeasured picks.","Every published result is tracked transparently.",["la liga","laliga"]),
  make("serie-a",64,"Serie A matchday","Italian football.\nQuality first.","BetSightly stops rather than forcing a lower-quality combination.",["serie a"]),
  make("bundesliga",64,"Bundesliga matchday","German football.\nSmarter structure.","Choose a product, then review the exact market and price.",["bundesliga"]),
  make("ligue-1",64,"Ligue 1 matchday","French football.\nVerified options.","Use current bookmaker availability—not stale assumptions.",["ligue 1"]),
  make("domestic-cup",58,"Cup football","Knockout stakes.\nNo shortcuts.","Cup context can change quickly; review the match yourself too.",["fa cup","copa","cup","dfb"]),
];
const fallback = (id: string, eyebrow: string, headline: string, subheadline: string) => make(id,0,eyebrow,headline,subheadline);
export function resolveHeroCampaign({ now, activeCompetitions = [], fixtureCount }: HeroCampaignContext): HeroCampaign {
  const names = activeCompetitions.join(" ").toLowerCase();
  const selected = HERO_CAMPAIGNS.filter((item) => item.competitionKeywords?.some((key) => names.includes(key))).sort((a,b) => b.priority-a.priority)[0];
  if (selected) return selected;
  if (typeof fixtureCount === "number" && fixtureCount < 3) return fallback("quiet-board","Smaller board","Smaller board.\nSame standards.","A thinner fixture list does not lower the quality bar.");
  const day = now.getUTCDay();
  if (day === 0 || day === 6) return fallback("weekend","Weekend football","Weekend football.\nSmart picks.","Explore the verified card or build around the structure you prefer.");
  if (day >= 1 && day <= 4) return fallback("midweek","Midweek football","Midweek football.\nSame standards.","Evidence, availability and transparent results remain the priority.");
  return fallback("default","BetSightly","Football picks.\nClearly explained.","Explore verified selections, then decide what fits your own approach.");
}
