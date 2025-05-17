import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Alert,
  Button,
  Input,
  Badge
} from '../components/ui';
import RolloverPredictions from '../components/RolloverPredictions';
import type { Prediction } from '../types';
import { Calculator, Info } from 'lucide-react';

const RolloverChallengePage: React.FC = () => {
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
      <div className="bg-gradient-to-r from-gray-900 to-black border border-amber-500/20 rounded-xl p-6 shadow-lg">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-amber-400 bg-clip-text text-transparent">Premium Rollover Challenge</h1>
        <p className="text-amber-100/80">
          Maximize your returns with our exclusive 10-day rollover strategy
        </p>
      </div>

      {/* Info Section */}
      <Card className="bg-gradient-to-b from-gray-900 to-black border border-amber-500/20 shadow-xl overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-amber-400">
              How It Works
            </h2>

            <Badge variant="outline" className="border-amber-500/30 text-amber-400 px-3 py-1">
              Premium
            </Badge>
          </div>

          <div className="bg-black/30 rounded-xl p-6 border border-amber-500/10">
            <div className="flex items-center space-x-4 mb-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/10">
                <Info size={24} className="text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">The Rollover Strategy</h3>
                <p className="text-white/70">Carefully selected predictions over {days} days</p>
              </div>
            </div>

            <p className="text-white/80 mb-6">
              The rollover challenge is a premium betting strategy where you start with a small stake and
              reinvest your winnings in each subsequent bet. Our AI selects the safest, most reliable predictions
              to maximize your chances of completing the full {days}-day challenge.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-black/20 p-4 rounded-lg border border-amber-500/10">
                <div className="text-amber-400 font-bold text-lg mb-1">Step 1</div>
                <p className="text-white/70">Start with a small stake you're comfortable with</p>
              </div>

              <div className="bg-black/20 p-4 rounded-lg border border-amber-500/10">
                <div className="text-amber-400 font-bold text-lg mb-1">Step 2</div>
                <p className="text-white/70">Bet on each day's premium prediction</p>
              </div>

              <div className="bg-black/20 p-4 rounded-lg border border-amber-500/10">
                <div className="text-amber-400 font-bold text-lg mb-1">Step 3</div>
                <p className="text-white/70">Reinvest all winnings in the next day's bet</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-black/20 p-4 rounded-lg border border-amber-500/10">
              <div className="flex items-center space-x-3">
                <div className="text-amber-400 font-medium">Challenge Duration:</div>
                <Input
                  id="days-input"
                  type="number"
                  min={1}
                  max={30}
                  value={days}
                  onChange={handleDaysChange}
                  className="w-20 bg-black/30 border-amber-500/20 text-white"
                />
                <div className="text-white/70">days</div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="show-explanations"
                  checked={showExplanations}
                  onChange={() => setShowExplanations(!showExplanations)}
                  className="h-4 w-4 rounded border-amber-500/30 bg-black/30"
                />
                <label htmlFor="show-explanations" className="text-white/80 font-medium">
                  Show Analysis Details
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rollover Predictions */}
      <Card className="bg-gradient-to-b from-gray-900 to-black border border-amber-500/20 shadow-xl overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-amber-400">
              {days}-Day Challenge Predictions
            </h2>

            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-sm text-white/70">Live Updates</span>
            </div>
          </div>

          <div className="bg-black/30 rounded-xl p-6 border border-amber-500/10">
            <RolloverPredictions
              days={days}
              onPredictionSelect={handlePredictionSelect}
              showExplanation={showExplanations}
              showGameCode={true}
            />
          </div>
        </CardContent>
      </Card>

      {/* Calculator Section */}
      <Card className="bg-gradient-to-b from-gray-900 to-black border border-amber-500/20 shadow-xl overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-amber-400">
              Rollover Calculator
            </h2>

            <Badge variant="outline" className="border-amber-500/30 text-amber-400 px-3 py-1">
              Premium
            </Badge>
          </div>

          <div className="bg-black/30 rounded-xl p-6 border border-amber-500/10">
            <div className="flex items-center space-x-4 mb-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/10">
                <Calculator size={24} className="text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Calculate Your Potential Returns</h3>
                <p className="text-white/70">See how your stake could grow over {days} days</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-black/20 p-5 rounded-lg border border-amber-500/10">
                <div className="text-amber-400 font-medium mb-3">Initial Stake</div>
                <div className="flex items-center">
                  <div className="text-white font-bold text-2xl mr-2">$</div>
                  <Input
                    id="stake-input"
                    type="number"
                    placeholder="Enter amount"
                    value={initialStake}
                    onChange={(e) => setInitialStake(e.target.value)}
                    className="bg-black/30 border-amber-500/20 text-white text-xl"
                  />
                </div>
              </div>

              <div className="bg-black/20 p-5 rounded-lg border border-amber-500/10">
                <div className="text-amber-400 font-medium mb-3">Potential Return</div>
                <div className="flex items-center">
                  <div className="text-white font-bold text-2xl mr-2">$</div>
                  <div className="text-white font-bold text-3xl">{calculatePotentialReturn()}</div>
                </div>
              </div>
            </div>

            <div className="bg-amber-500/10 p-4 rounded-lg border border-amber-500/20 text-amber-100/90 text-sm">
              <strong>Note:</strong> This is a theoretical calculation based on all predictions winning.
              Sports betting involves risk, and there's no guarantee of winning. Always bet responsibly.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Premium Banner */}
      <div className="bg-gradient-to-r from-gray-900 to-black border border-amber-500/20 rounded-xl p-8 shadow-lg text-center">
        <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-black/30 border border-amber-500/30 text-amber-400 text-sm font-medium mb-6">
          PREMIUM FEATURE
        </div>
        <h2 className="text-3xl font-bold text-amber-400 mb-4">
          Start Your Rollover Challenge Today
        </h2>
        <p className="text-amber-100/80 mb-8 max-w-2xl mx-auto">
          Follow our expert AI predictions and see how far you can go with the {days}-day rollover challenge
        </p>
        <Button
          variant="outline"
          className="border-amber-500/30 text-amber-400 hover:bg-black/20 hover:border-amber-500/50 py-6 px-8 text-lg"
        >
          Get Started
        </Button>
      </div>
    </div>
  );
};

export default RolloverChallengePage;
