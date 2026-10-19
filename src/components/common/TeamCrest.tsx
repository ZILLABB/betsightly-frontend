import { useEffect, useState } from "react";
import { getTeamFlag, isWcNation, teamInitials } from "../../data/wcFlags";

type Size = "sm" | "md" | "lg";

/**
 * Displays the verified fixture/team crest already delivered by our feed.
 * Club names are not unique worldwide, so NEVER guess an ESPN/CDN team ID
 * from a string. Missing/failed assets fall back to a flag only for a known
 * national side, then a neutral monogram.
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
  const flag = national !== false && isWcNation(team)
    ? getTeamFlag(team, null, size === "sm" ? 40 : 80)
    : null;

  const source = supplied && !failedSources.includes(supplied)
    ? supplied
    : flag && !failedSources.includes(flag)
      ? flag
      : null;
  const initials = teamInitials(team);

  return (
    <span className={`team-crest team-crest--${size}${source ? " team-crest--image" : " team-crest--fallback"}`}
      aria-hidden="true" title={source ? team : `${team} · crest unavailable`}>
      {source
        ? <img src={source} alt="" loading="lazy" decoding="async"
            onError={() => setFailedSources(previous => previous.includes(source)
              ? previous : [...previous, source])}/>
        : <span className="team-crest__letters">{initials}</span>}
    </span>
  );
}
