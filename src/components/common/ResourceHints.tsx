/**
 * ResourceHints Component
 *
 * This component adds resource hints to improve performance:
 * 1. dns-prefetch: Resolves domain names in advance
 * 2. preconnect: Establishes connections in advance
 * 3. preload: Loads critical resources early
 * 4. prefetch: Loads resources for future navigations
 * 5. prerender: Renders pages in the background
 */

import React from 'react';

export interface ResourceHint {
  /** Type of resource hint */
  type: 'dns-prefetch' | 'preconnect' | 'preload' | 'prefetch' | 'prerender';
  /** URL to hint */
  href: string;
  /** Resource type for preload */
  as?: 'script' | 'style' | 'image' | 'font' | 'fetch' | 'document';
  /** Whether to include credentials for cross-origin requests */
  crossOrigin?: 'anonymous' | 'use-credentials';
  /** Media query for conditional loading */
  media?: string;
  /** MIME type of the resource */
  type?: string;
  /** Whether the resource is disabled */
  disabled?: boolean;
}

interface ResourceHintsProps {
  /** Resource hints to add */
  hints: ResourceHint[];
}

const ResourceHints: React.FC<ResourceHintsProps> = ({ hints }) => {
  // Filter out disabled hints
  const enabledHints = hints.filter(hint => !hint.disabled);

  return (
    <>
      {enabledHints.map((hint, index) => {
        // Common attributes
        const commonProps = {
          key: `${hint.type}-${index}`,
          rel: hint.type,
          href: hint.href,
        };

        // Add specific attributes based on hint type
        switch (hint.type) {
          case 'preload':
            return (
              <link
                {...commonProps}
                as={hint.as}
                crossOrigin={hint.crossOrigin}
                type={hint.type}
                media={hint.media}
              />
            );

          case 'preconnect':
          case 'dns-prefetch':
            return (
              <link
                {...commonProps}
                crossOrigin={hint.crossOrigin}
              />
            );

          case 'prefetch':
          case 'prerender':
            return (
              <link
                {...commonProps}
                media={hint.media}
              />
            );

          default:
            return <link {...commonProps} />;
        }
      })}
    </>
  );
};

export default ResourceHints;
