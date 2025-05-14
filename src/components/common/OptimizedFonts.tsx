/**
 * OptimizedFonts Component
 *
 * This component optimizes font loading to prevent layout shifts:
 * 1. Preloads critical fonts
 * 2. Uses font-display: swap to show text immediately
 * 3. Adds font-family fallbacks with similar metrics
 * 4. Implements the Font Loading API for better control
 */

import React, { useEffect } from 'react';

export interface FontDefinition {
  /** Font family name */
  family: string;
  /** Font URL */
  url: string;
  /** Font weight */
  weight?: string | number;
  /** Font style */
  style?: 'normal' | 'italic';
  /** Whether this is a critical font that should be preloaded */
  preload?: boolean;
  /** Font display strategy */
  display?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
  /** Font format */
  format?: 'woff2' | 'woff' | 'truetype' | 'opentype';
  /** Unicode range for the font */
  unicodeRange?: string;
}

interface OptimizedFontsProps {
  /** Font definitions */
  fonts: FontDefinition[];
  /** Whether to disable font optimization */
  disabled?: boolean;
  /** Whether to use the Font Loading API */
  useFontLoadingAPI?: boolean;
  /** Callback when all fonts are loaded */
  onFontsLoaded?: () => void;
}

const OptimizedFonts: React.FC<OptimizedFontsProps> = ({
  fonts,
  disabled = false,
  useFontLoadingAPI = true,
  onFontsLoaded
}) => {
  // Skip if disabled
  if (disabled) return null;

  // Use Font Loading API if available
  useEffect(() => {
    if (useFontLoadingAPI && 'fonts' in document) {
      // Create a promise for each font
      const fontPromises = fonts.map(font => {
        // Create FontFace object
        const fontFace = new FontFace(
          font.family,
          `url(${font.url})`,
          {
            weight: font.weight?.toString() || '400',
            style: font.style || 'normal',
            display: font.display || 'swap',
            unicodeRange: font.unicodeRange
          }
        );

        // Add font to document fonts
        document.fonts.add(fontFace);

        // Return the loading promise
        return fontFace.load();
      });

      // Wait for all fonts to load
      Promise.all(fontPromises)
        .then(() => {
          // Mark document as font-ready
          document.documentElement.classList.add('fonts-loaded');

          // Call callback if provided
          if (onFontsLoaded) {
            onFontsLoaded();
          }
        })
        .catch(error => {
          console.error('Error loading fonts:', error);
        });
    }
  }, [fonts, useFontLoadingAPI, onFontsLoaded]);

  // Generate preload links for critical fonts
  const preloadLinks = fonts
    .filter(font => font.preload)
    .map((font, index) => (
      <link
        key={`preload-${index}`}
        rel="preload"
        href={font.url}
        as="font"
        type={`font/${font.format || 'woff2'}`}
        crossOrigin="anonymous"
      />
    ));

  // Generate font-face declarations
  const fontFaceStyles = fonts.map((font, index) => `
    @font-face {
      font-family: '${font.family}';
      src: url('${font.url}') format('${font.format || 'woff2'}');
      font-weight: ${font.weight || 400};
      font-style: ${font.style || 'normal'};
      font-display: ${font.display || 'swap'};
      ${font.unicodeRange ? `unicode-range: ${font.unicodeRange};` : ''}
    }
  `).join('\n');

  // Add size-adjust for fallback fonts to prevent layout shifts
  const fontFallbackStyles = `
    /* Apply fallback fonts with size-adjust to prevent CLS */
    .fonts-not-loaded h1, .fonts-not-loaded h2, .fonts-not-loaded h3 {
      font-family: Arial, sans-serif;
      font-size-adjust: 0.5;
    }

    .fonts-not-loaded body, .fonts-not-loaded p, .fonts-not-loaded div {
      font-family: system-ui, -apple-system, sans-serif;
      font-size-adjust: 0.5;
    }

    /* Add class to body when fonts are loaded */
    .fonts-loaded * {
      transition: font-variation-settings 0.3s ease;
    }
  `;

  return (
    <>
      {/* Preload links for critical fonts */}
      {preloadLinks}

      {/* Font face styles */}
      <style>
        {fontFaceStyles}
        {fontFallbackStyles}
      </style>
    </>
  );
};

export default OptimizedFonts;
