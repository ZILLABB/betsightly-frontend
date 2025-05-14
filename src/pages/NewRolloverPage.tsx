import React, { useState } from 'react';
import { Container, Row, Col, Card, Alert, Button, Form } from 'react-bootstrap';
import RolloverPredictions from '../components/RolloverPredictions';
import { Prediction } from '../types';

const NewRolloverPage: React.FC = () => {
  const [days, setDays] = useState<number>(10);
  const [showExplanations, setShowExplanations] = useState<boolean>(true);

  // Handle days change
  const handleDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 1 && value <= 30) {
      setDays(value);
    }
  };

  // Handle prediction selection
  const handlePredictionSelect = (prediction: Prediction) => {
    console.log('Selected prediction:', prediction);
    // You can implement additional functionality here
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h1>Rollover Challenge</h1>
          <p className="text-muted">
            Follow our daily rollover predictions to maximize your returns over time
          </p>
        </Col>
      </Row>

      {/* Info Section */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Body>
              <h3>How the Rollover Challenge Works</h3>
              <p>
                The rollover challenge is a betting strategy where you start with a small stake and 
                reinvest your winnings in each subsequent bet. By following our carefully selected 
                predictions over a period of {days} days, you can potentially multiply your initial 
                stake significantly.
              </p>
              <Alert variant="info">
                <h5>Rules of the Challenge:</h5>
                <ol>
                  <li>Start with a small stake that you're comfortable losing</li>
                  <li>Bet on the prediction for Day 1</li>
                  <li>If you win, use all your winnings as the stake for Day 2</li>
                  <li>Continue this process for all {days} days</li>
                  <li>If any bet loses, the challenge ends and you can start again</li>
                </ol>
              </Alert>
              <div className="d-flex justify-content-between align-items-center">
                <Form.Group className="mb-0" style={{ width: '200px' }}>
                  <Form.Label>Number of Days</Form.Label>
                  <Form.Control
                    type="number"
                    min={1}
                    max={30}
                    value={days}
                    onChange={handleDaysChange}
                  />
                </Form.Group>
                <Form.Check
                  type="switch"
                  id="show-explanations"
                  label="Show Explanations"
                  checked={showExplanations}
                  onChange={() => setShowExplanations(!showExplanations)}
                />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Rollover Predictions */}
      <Row>
        <Col>
          <Card>
            <Card.Body>
              <RolloverPredictions
                days={days}
                onPredictionSelect={handlePredictionSelect}
                showExplanation={showExplanations}
                showGameCode={true}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Calculator Section */}
      <Row className="mt-4">
        <Col>
          <Card>
            <Card.Body>
              <h3>Rollover Calculator</h3>
              <p>
                Use this calculator to see how much your initial stake could grow over the course of the challenge.
              </p>
              <div className="mb-3">
                <Form.Group className="mb-3">
                  <Form.Label>Initial Stake</Form.Label>
                  <Form.Control type="number" placeholder="Enter your initial stake" />
                </Form.Group>
                <Button variant="primary">Calculate Potential Return</Button>
              </div>
              <Alert variant="success">
                <h5>Potential Return:</h5>
                <p className="mb-0">
                  If all predictions win, your initial stake could grow to <strong>$X</strong> after {days} days.
                </p>
              </Alert>
              <p className="text-muted small">
                <strong>Disclaimer:</strong> This is a theoretical calculation. Sports betting involves risk, and there's no guarantee of winning.
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default NewRolloverPage;
