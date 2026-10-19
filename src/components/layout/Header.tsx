import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, ChevronDown, Menu, X, Home, Target, BarChart2, RefreshCw, Settings, Users, Sliders, Radio } from "lucide-react";
import { BetSightlyLogo } from "../brand/BetSightlyLogo";

const PRIMARY = [
  { path: "/", label: "Home", icon: Home },
  { path: "/predictions", label: "Predictions", icon: Target },
  { path: "/results", label: "Results", icon: BarChart2 },
  { path: "/live", label: "Live Scores", icon: Radio },
];
const SECONDARY = [
  { path: "/rollover", label: "Rollover", icon: RefreshCw },
  { path: "/punters", label: "Punters", icon: Users },
  { path: "/settings", label: "Settings", icon: Settings },
];

export function Header() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const isActive = (path: string) => path === "/"
    ? location.pathname === "/"
    : location.pathname === path || location.pathname.startsWith(`${path}/`);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", escape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", escape);
    };
  }, [menuOpen]);

  return (
    <>
      <header className="editorial-header">
        <div className="editorial-header__utility">
          <span>FOOTBALL INTELLIGENCE / DAILY PUBLICATION</span>
          <Link to="/results">Every result on record <ArrowRight size={12} aria-hidden="true"/></Link>
        </div>
        <div className="editorial-header__main">
          <Link to="/" className="editorial-header__brand brand-lockup bs-brand-link" aria-label="BetSightly home">
            <BetSightlyLogo/>
          </Link>
          <nav className="editorial-header__nav" aria-label="Primary navigation">
            {PRIMARY.map(({ path, label }) => (
              <Link key={path} to={path} aria-current={isActive(path) ? "page" : undefined}
                className="editorial-header__link" data-active={isActive(path)}>
                {label}
              </Link>
            ))}
            <details className="editorial-header__more">
              <summary>More <ChevronDown size={14} aria-hidden="true"/></summary>
              <div className="editorial-header__dropdown">
                {SECONDARY.map(({ path, label }) => (
                  <Link key={path} to={path} aria-current={isActive(path) ? "page" : undefined}
                    data-active={isActive(path)}>{label}</Link>
                ))}
              </div>
            </details>
          </nav>
          <Link to="/build-slip" className="editorial-header__cta" aria-current={isActive("/build-slip") ? "page" : undefined}>
            <Sliders size={15} aria-hidden="true"/> Build a slip <ArrowRight size={14} aria-hidden="true"/>
          </Link>
          <button type="button" className="editorial-header__mobile-toggle"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen} aria-controls="editorial-mobile-navigation"
            onClick={() => setMenuOpen(v => !v)}>
            {menuOpen ? <X size={23}/> : <Menu size={23}/>}
          </button>
        </div>
      </header>
      <nav id="editorial-mobile-navigation" aria-label="Mobile menu" className="editorial-mobile-menu"
        data-open={menuOpen} aria-hidden={!menuOpen} inert={!menuOpen}>
        <span className="editorial-overline">EXPLORE BETSIGHTLY</span>
        {[...PRIMARY, { path: "/build-slip", label: "Build Slip", icon: Sliders }, ...SECONDARY].map(({ path, label, icon: Icon }) => (
          <Link key={path} to={path} aria-current={isActive(path) ? "page" : undefined}
            className="editorial-mobile-menu__link" data-active={isActive(path)}
            onClick={() => setMenuOpen(false)}>
            <Icon size={19} aria-hidden="true"/>{label}<ArrowRight size={16} aria-hidden="true"/>
          </Link>
        ))}
        <p>18+ only. All predictions are informational. Past results do not guarantee future outcomes.</p>
      </nav>
    </>
  );
}
