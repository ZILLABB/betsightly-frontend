import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Alert, Tabs, Tab, Badge } from 'react-bootstrap';
import { getMultiAPIPredictions, refreshPredictions } from '../services/apiService';
import PredictionsList from '../components/PredictionsList';
import DatePicker from '../components/DatePicker';
import RolloverPredictions from '../components/RolloverPredictions';

const NewHomePage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('predictions');
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Format date for API calls
  const formattedDate = selectedDate.toISOString().split('T')[0];

  // Handle date change
  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  // Handle refresh
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await refreshPredictions(formattedDate);
      // Force reload the current page
      window.location.reload();
    } catch (err) {
      console.error('Error refreshing predictions:', err);
      setError('Failed to refresh predictions. Please try again later.');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Container fluid className="py-4">
      {/* Hero Section */}
      <Row className="mb-4">
        <Col>
          <Card className="bg-dark text-white">
            <Card.Body className="text-center py-5">
              <h1 className="display-4 mb-3">BetSightly</h1>
              <p className="lead mb-4">
                AI-powered sports predictions organized by odds categories
              </p>
              <div className="d-flex justify-content-center gap-3">
                <Button variant="primary" as={Link} to="/predictions">
                  View All Predictions
                </Button>
                <Button variant="outline-light" as={Link} to="/rollover">
                  Rollover Challenge
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Date Picker and Refresh Button */}
      <Row className="mb-4">
        <Col md={6}>
          <DatePicker
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
            minDate={new Date(new Date().setDate(new Date().getDate() - 7))}
            maxDate={new Date(new Date().setDate(new Date().getDate() + 7))}
          />
        </Col>
        <Col md={6} className="d-flex justify-content-end align-items-center">
          <Button
            variant="outline-primary"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh All Predictions'}
          </Button>
        </Col>
      </Row>

      {/* Main Content Tabs */}
      <Row>
        <Col>
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k || 'predictions')}
            className="mb-4"
          >
            <Tab eventKey="predictions" title="Today's Predictions">
              <Card>
                <Card.Body>
                  <h2 className="mb-4">Predictions for {selectedDate.toLocaleDateString()}</h2>
                  
                  {/* 2 Odds Section */}
                  <div className="mb-5">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h3>
                        <Badge bg="success" className="me-2">2 Odds</Badge>
                        Safe Bets
                      </h3>
                    </div>
                    <PredictionsList
                      date={formattedDate}
                      category="2_odds"
                      maxItems={3}
                    />
                  </div>
                  
                  {/* 5 Odds Section */}
                  <div className="mb-5">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h3>
                        <Badge bg="warning" className="me-2">5 Odds</Badge>
                        Balanced Risk
                      </h3>
                    </div>
                    <PredictionsList
                      date={formattedDate}
                      category="5_odds"
                      maxItems={3}
                    />
                  </div>
                  
                  {/* 10 Odds Section */}
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h3>
                        <Badge bg="danger" className="me-2">10 Odds</Badge>
                        High Reward
                      </h3>
                    </div>
                    <PredictionsList
                      date={formattedDate}
                      category="10_odds"
                      maxItems={3}
                    />
                  </div>
                </Card.Body>
              </Card>
            </Tab>
            
            <Tab eventKey="fixtures" title="Today's Fixtures">
              <Card>
                <Card.Body>
                  <h2 className="mb-4">Fixtures for {selectedDate.toLocaleDateString()}</h2>
                  <div className="mb-3">
                    <Alert variant="info">
                      <i className="bi bi-info-circle me-2"></i>
                      Click on a fixture to see detailed predictions for that match.
                    </Alert>
                  </div>
                  {/* Import and use FixturesList component here */}
                  <div className="text-center py-4">
                    <p>Loading fixtures...</p>
                  </div>
                </Card.Body>
              </Card>
            </Tab>
            
            <Tab eventKey="rollover" title="Rollover Challenge">
              <Card>
                <Card.Body>
                  <h2 className="mb-4">10-Day Rollover Challenge</h2>
                  <div className="mb-3">
                    <Alert variant="info">
                      <i className="bi bi-info-circle me-2"></i>
                      The rollover challenge consists of 10 days of carefully selected predictions to maximize your returns.
                    </Alert>
                  </div>
                  <RolloverPredictions days={10} showGameCode={true} />
                </Card.Body>
              </Card>
            </Tab>
          </Tabs>
        </Col>
      </Row>

      {/* Footer Section */}
      <Row className="mt-5">
        <Col>
          <Card bg="dark" text="white">
            <Card.Body className="text-center py-4">
              <h4>Ready to see more predictions?</h4>
              <p>Check out our detailed predictions page for more options.</p>
              <Button variant="outline-light" as={Link} to="/predictions">
                View All Predictions
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default NewHomePage;
