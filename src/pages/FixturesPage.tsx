import React from 'react';
import FixtureList from '../components/fixtures/FixtureList';

const FixturesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Today's Fixtures</h1>
        <p className="text-[var(--muted-foreground)]">
          Browse all available fixtures from multiple data sources
        </p>
      </div>
      
      <FixtureList />
    </div>
  );
};

export default FixturesPage;
