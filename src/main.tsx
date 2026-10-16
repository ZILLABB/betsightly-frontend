import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import './styles/experience-v3.css'
import './styles/experience-reference.css'
import './styles/brand-option-b.css'
import { analytics } from './services/analytics'
import { applyAnalyticsPreferenceFromUrl } from './services/internalTraffic'

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
