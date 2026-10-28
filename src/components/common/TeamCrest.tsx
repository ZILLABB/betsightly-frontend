import { useEffect, useState } from "react";
import { getTeamFlag, isWcNation, teamInitials } from "../../data/wcFlags";
import { verifiedClubCrest } from "../../data/verifiedClubCrests";

type Size = "sm" | "md" | "lg";

/**
 * Prefer the image supplied by the verified fixture feed. Manual publication
 * sometimes loses that field; a small exact-identity registry can recover
 * genuinely verified crests without guessing a provider ID from a team name.
 * The source is tried only once per team/URL. Broken images fall through to
 * the next verified source, then a national flag or a readable monogram.
 */
export function TeamCrest({
  team, logo, national, size = "md",
}: {
  team: string;
  logo?: string | null;
  national?: boolean;
  size?: Size;
}) {
  const [failedSources, setFailedSources] = useState<string[]>([]);

  useEffect(() => { setFailedSources([]); }, [team, logo, national]);

  const supplied = typeof logo === "string" && /^https:\/\//i.test(logo.trim())
    ? logo.trim()
    : null;
  const verified = verifiedClubCrest(team);
  const flag = national !== false && isWcNation(team)
    ? getTeamFlag(team, null, size === "sm" ? 40 : 80)
    : null;

  // Deduplicate identical URLs so an image that fails does not keep retrying.
  const candidates = [...new Set([supplied, verified, flag].filter(
    (url): url is string => typeof url === "string" && /^https:\/\//i.test(url),
  ))];
  const source = candidates.find(url => !failedSources.includes(url)) ?? null;

  return (
    <span className={`team-crest team-crest--${size}${source ? " team-crest--image" : " team-crest--fallback"}`}
      aria-hidden="true" title={source ? team : `${team} · crest unavailable`}>
      {source
        ? <img src={source} alt="" loading="lazy" decoding="async"
            onError={() => setFailedSources(previous => previous.includes(source)
              ? previous : [...previous, source])}/>
        : <span className="team-crest__letters">{teamInitials(team)}</span>}
    </span>
  );
}
