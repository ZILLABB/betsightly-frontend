import { useState, useEffect } from 'react';
import { mockDataService } from '../services/mockDataService';

export const useMockDataToggle = () => {
  const [isUsingMockData, setIsUsingMockData] = useState(mockDataService.isUsingMockData());

  const toggleMockData = () => {
    const newState = !isUsingMockData;
    mockDataService.setEnabled(newState);
    setIsUsingMockData(newState);
    
    // Store preference in localStorage
    localStorage.setItem('betsightly_use_mock_data', newState.toString());
    
    // Reload the page to apply changes
    window.location.reload();
  };

  const enableMockData = () => {
    mockDataService.setEnabled(true);
    setIsUsingMockData(true);
    localStorage.setItem('betsightly_use_mock_data', 'true');
    window.location.reload();
  };

  const disableMockData = () => {
    mockDataService.setEnabled(false);
    setIsUsingMockData(false);
    localStorage.setItem('betsightly_use_mock_data', 'false');
    window.location.reload();
  };

  // Load preference from localStorage on mount
  useEffect(() => {
    const savedPreference = localStorage.getItem('betsightly_use_mock_data');
    if (savedPreference !== null) {
      const shouldUseMock = savedPreference === 'true';
      mockDataService.setEnabled(shouldUseMock);
      setIsUsingMockData(shouldUseMock);
    } else {
      // Default to mock data if no preference is saved
      mockDataService.setEnabled(true);
      setIsUsingMockData(true);
      localStorage.setItem('betsightly_use_mock_data', 'true');
    }
  }, []);

  return {
    isUsingMockData,
    toggleMockData,
    enableMockData,
    disableMockData
  };
};
