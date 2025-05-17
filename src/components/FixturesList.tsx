import React, { useState, useEffect } from 'react';
import { getFixtures, refreshPredictions } from '../services/apiService';
import { formatDate } from '../utils/dateUtils';
import { Spinner, Alert, Button, Card, CardContent, Badge } from '../components/ui';
import { RefreshCw, Clock, AlertCircle } from 'lucide-react';

interface FixturesListProps {
  date?: string;
  league?: string;
  team?: string;
  onFixtureSelect?: (fixture: any) => void;
}

const FixturesList: React.FC<FixturesListProps> = ({
  date,
  league,
  team,
  onFixtureSelect
}) => {
  const [fixtures, setFixtures] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Load fixtures on component mount or when date/league/team changes
  useEffect(() => {
    loadFixtures();
  }, [date, league, team]);

  // Function to load fixtures
  const loadFixtures = async (forceRefresh: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      const fixturesData = await getFixtures(date, forceRefresh);

      // Filter fixtures if league or team is specified
      let filteredFixtures = fixturesData.fixtures || [];

      if (league) {
        filteredFixtures = filteredFixtures.filter((fixture: any) =>
          fixture.league.toLowerCase().includes(league.toLowerCase())
        );
      }

      if (team) {
        filteredFixtures = filteredFixtures.filter((fixture: any) =>
          fixture.home_team.toLowerCase().includes(team.toLowerCase()) ||
          fixture.away_team.toLowerCase().includes(team.toLowerCase())
        );
      }

      setFixtures(filteredFixtures);
    } catch (err) {
      console.error('Error loading fixtures:', err);
      setError('Failed to load fixtures. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Function to refresh fixtures and predictions
  const handleRefresh = async () => {
    try {
      setRefreshing(true);

      // Refresh predictions first
      await refreshPredictions(date);

      // Then reload fixtures with force refresh
      await loadFixtures(true);

    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Failed to refresh data. Please try again later.');
    } finally {
      setRefreshing(false);
    }
  };

  // Function to handle fixture selection
  const handleFixtureClick = (fixture: any) => {
    if (onFixtureSelect) {
      onFixtureSelect(fixture);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center my-8">
        <Spinner size="lg" variant="primary" />
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <Alert variant="danger" className="flex flex-col sm:flex-row items-center justify-between p-4">
        <div className="flex items-center">
          <AlertCircle className="mr-2 h-5 w-5" />
          <span>{error}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-3 sm:mt-0"
          onClick={() => loadFixtures()}
        >
          Try Again
        </Button>
      </Alert>
    );
  }

  // Render empty state
  if (fixtures.length === 0) {
    return (
      <div className="text-center py-8 space-y-4">
        <p className="text-[var(--muted-foreground)]">No fixtures found for the selected criteria.</p>
        <Button
          variant="default"
          className="bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <>
              <Spinner size="sm" className="mr-2" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw size={16} className="mr-2" />
              Refresh Fixtures
            </>
          )}
        </Button>
      </div>
    );
  }

  // Group fixtures by league
  const fixturesByLeague: Record<string, any[]> = {};
  fixtures.forEach(fixture => {
    const league = fixture.league;
    if (!fixturesByLeague[league]) {
      fixturesByLeague[league] = [];
    }
    fixturesByLeague[league].push(fixture);
  });

  // Render fixtures grouped by league
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <h3 className="text-2xl font-bold">Fixtures {date ? `for ${formatDate(new Date(date))}` : 'Today'}</h3>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center"
        >
          {refreshing ? (
            <>
              <Spinner size="sm" className="mr-2" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw size={16} className="mr-2" />
              Refresh
            </>
          )}
        </Button>
      </div>

      {Object.entries(fixturesByLeague).map(([leagueName, leagueFixtures]) => (
        <div key={leagueName} className="space-y-4 mb-8">
          <h4 className="text-xl font-semibold border-b border-[var(--border)] pb-2">{leagueName}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {leagueFixtures.map(fixture => (
              <Card
                key={fixture.id}
                className={`h-full transition-all duration-300 hover:shadow-md ${onFixtureSelect ? 'cursor-pointer' : ''}`}
                onClick={() => handleFixtureClick(fixture)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-3">
                    <Badge variant="secondary" className="flex items-center">
                      <Clock size={12} className="mr-1" />
                      {formatTime(fixture.match_date)}
                    </Badge>
                    <Badge
                      variant={getStatusBadgeVariant(fixture.status)}
                    >
                      {fixture.status}
                    </Badge>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="font-medium">
                      {fixture.home_team}
                    </div>
                    <div className="text-[var(--muted-foreground)] text-sm">vs</div>
                    <div className="font-medium">
                      {fixture.away_team}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// Helper function to format time from ISO string
const formatTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return dateString;
  }
};

// Helper function to get badge variant based on status
const getStatusBadgeVariant = (status: string): string => {
  switch (status.toUpperCase()) {
    case 'SCHEDULED':
      return 'primary';
    case 'IN_PLAY':
    case 'LIVE':
      return 'success';
    case 'PAUSED':
      return 'warning';
    case 'FINISHED':
      return 'secondary';
    case 'POSTPONED':
    case 'SUSPENDED':
    case 'CANCELLED':
      return 'danger';
    default:
      return 'info';
  }
};

export default FixturesList;
