import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import './styles/experience-v3.css'
import './styles/experience-reference.css'
import './styles/brand-option-b.css'
// Shared page styles load before the final editorial layer so route-level CSS
// in lazily loaded pages cannot unexpectedly override the redesign.
import './styles/product-experience.css'
import './styles/builder-editor.css'
import './components/results/results.css'
import './pages/live-scores.css'
import './styles/editorial-system.css'
import './styles/editorial-layout.css'
import './styles/mobile-dock.css'
import './styles/team-crest.css'
import './styles/matchday-polish.css'
import './styles/mobile-qa.css'
import './styles/brand-loader.css'
import './styles/editorial-refinement.css'
import './styles/rollover-ticket-polish.css'
import './styles/palette-comparison.css'
import { analytics } from './services/analytics'
import { applyAnalyticsPreferenceFromUrl } from './services/internalTraffic'

// Apply the requested design comparison palette before the page renders.
const palette = new URLSearchParams(window.location.search).get('palette')
document.documentElement.setAttribute('data-bs-palette', palette === 'cobalt' ? 'cobalt' : 'atlantic')

// Apply a saved per-browser opt-out before any tracker initializes.
applyAnalyticsPreferenceFromUrl()

// Start human-behaviour analytics independently of React rendering. The
// provider remains lazy and non-blocking; route tracking reuses the same
// in-flight initialization promise and emits the one initial $pageview.
analytics.init()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
