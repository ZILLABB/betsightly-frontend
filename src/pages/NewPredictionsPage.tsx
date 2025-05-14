import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, InputGroup, Tabs, Tab, Alert } from 'react-bootstrap';
import { getFixtures, refreshPredictions } from '../services/apiService';
import PredictionsList from '../components/PredictionsList';
import FixturesList from '../components/FixturesList';
import DatePicker from '../components/DatePicker';
import { Prediction } from '../types';

const NewPredictionsPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLeague, setSelectedLeague] = useState<string>('');
  const [selectedFixture, setSelectedFixture] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>('categories');
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [leagues, setLeagues] = useState<string[]>([]);

  // Format date for API calls
  const formattedDate = selectedDate.toISOString().split('T')[0];

  // Load leagues for the selected date
  useEffect(() => {
    const loadLeagues = async () => {
      try {
        const fixturesData = await getFixtures(formattedDate);
        
        if (fixturesData && fixturesData.fixtures) {
          // Extract unique leagues
          const uniqueLeagues = [...new Set(fixturesData.fixtures.map((fixture: any) => fixture.league))];
          setLeagues(uniqueLeagues.sort());
        }
      } catch (err) {
        console.error('Error loading leagues:', err);
      }
    };
    
    loadLeagues();
  }, [formattedDate]);

  // Handle date change
  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    setSelectedFixture(null); // Reset selected fixture when date changes
  };

  // Handle category change
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
  };

  // Handle league change
  const handleLeagueChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedLeague(e.target.value);
  };

  // Handle fixture selection
  const handleFixtureSelect = (fixture: any) => {
    setSelectedFixture(fixture);
    setActiveTab('fixture');
  };

  // Handle prediction selection
  const handlePredictionSelect = (prediction: Prediction) => {
    console.log('Selected prediction:', prediction);
    // You can implement additional functionality here
  };

  // Handle refresh
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await refreshPredictions(formattedDate);
      window.location.reload(); // Force reload the current page
    } catch (err) {
      console.error('Error refreshing predictions:', err);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h1>Predictions</h1>
          <p className="text-muted">
            Browse and filter predictions by date, category, and league
          </p>
        </Col>
      </Row>

      {/* Filters Section */}
      <Row className="mb-4">
        <Col md={4} className="mb-3 mb-md-0">
          <DatePicker
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
            minDate={new Date(new Date().setDate(new Date().getDate() - 7))}
            maxDate={new Date(new Date().setDate(new Date().getDate() + 7))}
          />
        </Col>
        
        <Col md={3} className="mb-3 mb-md-0">
          <Form.Group>
            <Form.Label>Category</Form.Label>
            <Form.Select value={selectedCategory} onChange={handleCategoryChange}>
              <option value="all">All Categories</option>
              <option value="2_odds">2 Odds</option>
              <option value="5_odds">5 Odds</option>
              <option value="10_odds">10 Odds</option>
              <option value="rollover">Rollover</option>
            </Form.Select>
          </Form.Group>
        </Col>
        
        <Col md={3} className="mb-3 mb-md-0">
          <Form.Group>
            <Form.Label>League</Form.Label>
            <Form.Select value={selectedLeague} onChange={handleLeagueChange}>
              <option value="">All Leagues</option>
              {leagues.map(league => (
                <option key={league} value={league}>{league}</option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
        
        <Col md={2} className="d-flex align-items-end">
          <Button
            variant="outline-primary"
            className="w-100"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </Col>
      </Row>

      {/* Main Content */}
      <Row>
        <Col>
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k || 'categories')}
            className="mb-4"
          >
            <Tab eventKey="categories" title="By Category">
              <Card>
                <Card.Body>
                  {selectedCategory === 'all' ? (
                    <PredictionsList
                      date={formattedDate}
                      onPredictionSelect={handlePredictionSelect}
                      showExplanation={true}
                      showGameCode={true}
                    />
                  ) : (
                    <PredictionsList
                      date={formattedDate}
                      category={selectedCategory}
                      onPredictionSelect={handlePredictionSelect}
                      showExplanation={true}
                      showGameCode={true}
                    />
                  )}
                </Card.Body>
              </Card>
            </Tab>
            
            <Tab eventKey="fixtures" title="By Fixture">
              <Card>
                <Card.Body>
                  <FixturesList
                    date={formattedDate}
                    league={selectedLeague}
                    onFixtureSelect={handleFixtureSelect}
                  />
                </Card.Body>
              </Card>
            </Tab>
            
            {selectedFixture && (
              <Tab eventKey="fixture" title={`${selectedFixture.home_team} vs ${selectedFixture.away_team}`}>
                <Card>
                  <Card.Body>
                    <div className="mb-4">
                      <h2>{selectedFixture.home_team} vs {selectedFixture.away_team}</h2>
                      <p className="text-muted">
                        {selectedFixture.league} • {new Date(selectedFixture.match_date).toLocaleString()}
                      </p>
                    </div>
                    
                    <Alert variant="info" className="mb-4">
                      <i className="bi bi-info-circle me-2"></i>
                      Below are all available predictions for this fixture.
                    </Alert>
                    
                    {/* This would need a component to show predictions for a specific fixture */}
                    <div className="text-center py-4">
                      <p>Predictions for this fixture will be displayed here.</p>
                      <p>This feature is coming soon!</p>
                    </div>
                  </Card.Body>
                </Card>
              </Tab>
            )}
          </Tabs>
        </Col>
      </Row>
    </Container>
  );
};

export default NewPredictionsPage;
