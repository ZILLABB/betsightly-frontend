import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Check, Palette, Moon, Sun } from "lucide-react";
import { usePreferences } from "../../hooks/usePreferences";
import {
  initialPalette, isPalettePreviewHost, paletteBrowserChrome,
  PALETTE_OPTIONS, type PaletteChoice,
} from "./paletteLab";

const ROUTES = [
  { path: "/", label: "Home" },
  { path: "/predictions", label: "Predictions" },
  { path: "/build-slip", label: "Build Slip" },
  { path: "/rollover", label: "Rollover" },
];

/**
 * Visible only on isolated Vercel previews. Palette changes apply to the
 * document theme tokens and persist for this browser tab across route changes.
 * Users' publication, bookmaker and betting settings are untouched.
 */
export function PaletteLab() {
  const { pathname } = useLocation();
  const { preferences, updatePreference } = usePreferences();
  const preview = isPalettePreviewHost(window.location.hostname);
  const [palette, setPalette] = useState<PaletteChoice>(() => {
    let saved: string | null = null;
    try { saved = window.sessionStorage.getItem("betsightly_palette_preview"); } catch { /* unavailable */ }
    return initialPalette(window.location.search, saved);
  });
  const [collapsed, setCollapsed] = useState(false);
  const effectiveTheme = preferences.theme === "system"
    ? (window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light")
    : preferences.theme;

  useEffect(() => {
    if (!preview) return;
    document.documentElement.dataset.brandPalette = palette;
    try { window.sessionStorage.setItem("betsightly_palette_preview", palette); } catch { /* unavailable */ }
    const meta = document.querySelector('meta[name="theme-color"]');
    meta?.setAttribute("content", paletteBrowserChrome(palette, effectiveTheme));
    return () => { delete document.documentElement.dataset.brandPalette; };
  }, [palette, effectiveTheme, preview]);

  if (!preview) return null;
  return (
    <aside className="palette-lab" aria-label="BetSightly color palette comparison">
      <div className="palette-lab__top">
        <div className="palette-lab__intro">
          <span className="palette-lab__overline"><Palette size={13} aria-hidden="true"/> DESIGN COMPARISON</span>
          <strong>Explore BetSightly's next color direction</strong>
          <span>Preview only · Does not change production</span>
        </div>
        <button type="button" className="palette-lab__collapse" aria-expanded={!collapsed}
          aria-controls="palette-lab-controls" onClick={() => setCollapsed(v => !v)}>
          {collapsed ? "Expand" : "Minimize"}
        </button>
      </div>
      {!collapsed && (
        <div id="palette-lab-controls" className="palette-lab__body">
          <div className="palette-lab__options" role="group" aria-label="Choose palette">
            {PALETTE_OPTIONS.map(option => (
              <button key={option.id} type="button" className="palette-lab__option"
                onClick={() => setPalette(option.id)} aria-pressed={palette === option.id}>
                <span className={`palette-lab__swatches palette-lab__swatches--${option.id}`} aria-hidden="true">
                  <i/><i/><i/><i/>
                </span>
                <span className="palette-lab__option-name">{option.label}</span>
                {palette === option.id && <Check size={15} aria-hidden="true"/>}
              </button>
            ))}
          </div>
          <div className="palette-lab__theme" role="group" aria-label="Preview appearance">
            <button type="button" aria-pressed={effectiveTheme === "dark"}
              onClick={() => updatePreference("theme", "dark")}><Moon size={14}/> Dark</button>
            <button type="button" aria-pressed={effectiveTheme === "light"}
              onClick={() => updatePreference("theme", "light")}><Sun size={14}/> Light</button>
          </div>
          <nav className="palette-lab__routes" aria-label="Compare pages">
            {ROUTES.map(route => (
              <Link key={route.path} to={route.path}
                aria-current={route.path === pathname ? "page" : undefined}>
                {route.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </aside>
  );
}
