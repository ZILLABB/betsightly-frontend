import React, { useState, useEffect } from 'react';
import { getFixtures, refreshPredictions } from '../services/apiService';
import { formatDate } from '../utils/dateUtils';
import { Spinner, Alert, Button, Card, Badge } from 'react-bootstrap';

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
      <div className="d-flex justify-content-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <Alert variant="danger">
        {error}
        <Button 
          variant="outline-danger" 
          size="sm" 
          className="ms-3"
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
      <div className="text-center my-4">
        <p className="text-muted">No fixtures found for the selected criteria.</p>
        <Button 
          variant="primary" 
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? 'Refreshing...' : 'Refresh Fixtures'}
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
    <div className="fixtures-list">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Fixtures {date ? `for ${formatDate(new Date(date))}` : 'Today'}</h3>
        <Button 
          variant="outline-primary" 
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>
      
      {Object.entries(fixturesByLeague).map(([leagueName, leagueFixtures]) => (
        <div key={leagueName} className="mb-4">
          <h4 className="league-name">{leagueName}</h4>
          <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3">
            {leagueFixtures.map(fixture => (
              <div key={fixture.id} className="col">
                <Card 
                  className="h-100 fixture-card" 
                  onClick={() => handleFixtureClick(fixture)}
                  style={{ cursor: onFixtureSelect ? 'pointer' : 'default' }}
                >
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <Badge bg="secondary">{formatTime(fixture.match_date)}</Badge>
                      <Badge 
                        bg={getStatusBadgeColor(fixture.status)}
                      >
                        {fixture.status}
                      </Badge>
                    </div>
                    <div className="text-center">
                      <div className="team home-team mb-2">
                        <strong>{fixture.home_team}</strong>
                      </div>
                      <div className="versus">vs</div>
                      <div className="team away-team mt-2">
                        <strong>{fixture.away_team}</strong>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </div>
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

// Helper function to get badge color based on status
const getStatusBadgeColor = (status: string): string => {
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
