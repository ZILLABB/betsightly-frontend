import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Alert,
  Button,
  Input
} from '../components/ui';
import RolloverPredictions from '../components/RolloverPredictions';
import type { Prediction } from '../types';
import { Calculator, Info } from 'lucide-react';

const NewRolloverPage: React.FC = () => {
  const [days, setDays] = useState<number>(10);
  const [showExplanations, setShowExplanations] = useState<boolean>(true);
  const [initialStake, setInitialStake] = useState<string>('10');

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

  // Calculate potential return (simplified example)
  const calculatePotentialReturn = () => {
    const stake = parseFloat(initialStake);
    if (isNaN(stake)) return 'N/A';

    // Assuming average odds of 1.5 per day
    const avgOdds = 1.5;
    let total = stake;

    for (let i = 0; i < days; i++) {
      total *= avgOdds;
    }

    return total.toFixed(2);
  };

  return (
    <div className="space-y-8 py-4">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Rollover Challenge</h1>
        <p className="text-[var(--muted-foreground)]">
          Follow our daily rollover predictions to maximize your returns over time
        </p>
      </div>

      {/* Info Section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <Info className="text-[var(--primary)] mt-1 flex-shrink-0" size={24} />
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">How the Rollover Challenge Works</h3>
              <p>
                The rollover challenge is a betting strategy where you start with a small stake and
                reinvest your winnings in each subsequent bet. By following our carefully selected
                predictions over a period of {days} days, you can potentially multiply your initial
                stake significantly.
              </p>

              <Alert variant="info" className="p-4">
                <h5 className="font-semibold mb-2">Rules of the Challenge:</h5>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Start with a small stake that you're comfortable losing</li>
                  <li>Bet on the prediction for Day 1</li>
                  <li>If you win, use all your winnings as the stake for Day 2</li>
                  <li>Continue this process for all {days} days</li>
                  <li>If any bet loses, the challenge ends and you can start again</li>
                </ol>
              </Alert>

              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pt-2">
                <div className="space-y-2">
                  <label htmlFor="days-input" className="text-sm font-medium">
                    Number of Days
                  </label>
                  <Input
                    id="days-input"
                    type="number"
                    min={1}
                    max={30}
                    value={days}
                    onChange={handleDaysChange}
                    className="w-full sm:w-32"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="show-explanations"
                    checked={showExplanations}
                    onChange={() => setShowExplanations(!showExplanations)}
                    className="h-4 w-4 rounded border-[var(--input)]"
                  />
                  <label htmlFor="show-explanations" className="text-sm font-medium">
                    Show Explanations
                  </label>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rollover Predictions */}
      <Card>
        <CardContent className="p-6">
          <RolloverPredictions
            days={days}
            onPredictionSelect={handlePredictionSelect}
            showExplanation={showExplanations}
            showGameCode={true}
          />
        </CardContent>
      </Card>

      {/* Calculator Section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <Calculator className="text-[var(--primary)] mt-1 flex-shrink-0" size={24} />
            <div className="space-y-4 w-full">
              <h3 className="text-xl font-semibold">Rollover Calculator</h3>
              <p>
                Use this calculator to see how much your initial stake could grow over the course of the challenge.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="space-y-2 flex-grow">
                  <label htmlFor="stake-input" className="text-sm font-medium">
                    Initial Stake
                  </label>
                  <Input
                    id="stake-input"
                    type="number"
                    placeholder="Enter your initial stake"
                    value={initialStake}
                    onChange={(e) => setInitialStake(e.target.value)}
                  />
                </div>
                <Button
                  variant="default"
                  className="bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90"
                >
                  Calculate Potential Return
                </Button>
              </div>

              <Alert variant="success" className="p-4">
                <h5 className="font-semibold mb-1">Potential Return:</h5>
                <p className="mb-0">
                  If all predictions win, your initial stake could grow to <strong>${calculatePotentialReturn()}</strong> after {days} days.
                </p>
              </Alert>

              <p className="text-[var(--muted-foreground)] text-sm">
                <strong>Disclaimer:</strong> This is a theoretical calculation. Sports betting involves risk, and there's no guarantee of winning.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewRolloverPage;
