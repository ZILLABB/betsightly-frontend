import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { BarChart3, ChevronRight, CircleHelp, Home, Menu, Radio, RefreshCw, Settings, SlidersHorizontal, Target, Users, X } from "lucide-react";

const PRIMARY = [
  { path: "/", label: "Home", icon: Home },
  { path: "/predictions", label: "Picks", icon: Target },
  { path: "/build-slip", label: "Build", icon: SlidersHorizontal, featured: true },
  { path: "/results", label: "Results", icon: BarChart3 },
] as const;

const MORE = [
  { path: "/live", label: "Live scores", note: "Matchday scoreboard", icon: Radio },
  { path: "/rollover", label: "Rollover", note: "Follow the daily chain", icon: RefreshCw },
  { path: "/punters", label: "Punters", note: "Community selections", icon: Users },
  { path: "/settings", label: "Settings", note: "Display preferences", icon: Settings },
  { path: "/about", label: "About BetSightly", note: "How our predictions work", icon: CircleHelp },
] as const;

export function BottomNav() {
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const isActive = (path: string) => path === "/"
    ? location.pathname === "/"
    : location.pathname === path || location.pathname.startsWith(`${path}/`);
  const secondaryActive = MORE.some(({ path }) => isActive(path));

  useEffect(() => { setMoreOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (!moreOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMoreOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [moreOpen]);

  return (
    <>
      {moreOpen && (
        <div className="mobile-dock__scrim" onClick={() => setMoreOpen(false)}
          aria-hidden="true" data-testid="mobile-more-backdrop" />
      )}
      <section id="mobile-dock-more" className="mobile-dock__sheet"
        role="dialog" aria-modal={moreOpen ? "true" : undefined}
        aria-label="More BetSightly pages" hidden={!moreOpen}>
        <div className="mobile-dock__sheet-head">
          <div><span>EXPLORE</span><h2>More from BetSightly</h2></div>
          <button type="button" onClick={() => setMoreOpen(false)} aria-label="Close more menu"><X size={20}/></button>
        </div>
        <nav aria-label="More navigation">
          {MORE.map(({ path, label, note, icon: Icon }) => (
            <Link key={path} to={path} onClick={() => setMoreOpen(false)}
              aria-current={isActive(path) ? "page" : undefined}
              className="mobile-dock__sheet-link">
              <span className="mobile-dock__sheet-icon"><Icon size={20} aria-hidden="true"/></span>
              <span><strong>{label}</strong><small>{note}</small></span>
              <ChevronRight size={17} aria-hidden="true"/>
            </Link>
          ))}
        </nav>
      </section>
      <nav className="mobile-dock" aria-label="Quick navigation">
        <div className="mobile-dock__surface">
          {PRIMARY.map(({ path, label, icon: Icon }) => {
            const active = isActive(path);
            const featured = path === "/build-slip";
            return (
              <Link key={path} to={path}
                className={`mobile-dock__item${featured ? " mobile-dock__item--build" : ""}`}
                aria-current={active ? "page" : undefined} data-active={active}>
                <span className="mobile-dock__icon"><Icon size={featured ? 22 : 20} strokeWidth={active ? 2.4 : 1.9} aria-hidden="true"/></span>
                <span className="mobile-dock__label">{label}</span>
              </Link>
            );
          })}
          <button type="button" className="mobile-dock__item mobile-dock__more"
            aria-label={moreOpen ? "Close more pages" : "More pages"}
            aria-expanded={moreOpen} aria-controls="mobile-dock-more"
            data-active={secondaryActive || moreOpen}
            onClick={() => setMoreOpen(v => !v)}>
            <span className="mobile-dock__icon">{moreOpen ? <X size={20}/> : <Menu size={20}/>}</span>
            <span className="mobile-dock__label">More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
