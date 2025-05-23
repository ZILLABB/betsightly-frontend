import React, { useState, useEffect } from 'react';

/**
 * Component that shows a notification when the application has been updated
 */
const UpdateNotification: React.FC = () => {
  const [showNotification, setShowNotification] = useState(false);
  
  useEffect(() => {
    // Check for application updates
    const checkForUpdates = () => {
      // In a real app, this would check for service worker updates
      // or compare app versions from the server
      
      // For demo purposes, we'll just simulate an update check
      // by checking local storage for a version
      const currentVersion = '1.0.0'; // This would come from your package.json or env
      const storedVersion = localStorage.getItem('app_version');
      
      if (storedVersion && storedVersion !== currentVersion) {
        // Show update notification if versions don't match
        setShowNotification(true);
      }
      
      // Store current version
      localStorage.setItem('app_version', currentVersion);
    };
    
    // Check for updates when component mounts
    checkForUpdates();
    
    // Set up periodic checks (every 30 minutes)
    const interval = setInterval(checkForUpdates, 30 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Handle refresh click
  const handleRefresh = () => {
    // Reload the page to apply updates
    window.location.reload();
  };
  
  // Handle dismiss click
  const handleDismiss = () => {
    setShowNotification(false);
  };
  
  // If no notification to show, render nothing
  if (!showNotification) {
    return null;
  }
  
  // Styles for the notification
  const notificationStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#4a5568',
    color: 'white',
    padding: '12px 20px',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1000,
    maxWidth: '90%',
    width: '400px',
  };
  
  const messageStyle: React.CSSProperties = {
    marginRight: '16px',
  };
  
  const buttonContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
  };
  
  const refreshButtonStyle: React.CSSProperties = {
    backgroundColor: '#4299e1',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '6px 12px',
    cursor: 'pointer',
    fontSize: '14px',
  };
  
  const dismissButtonStyle: React.CSSProperties = {
    backgroundColor: 'transparent',
    color: '#cbd5e0',
    border: 'none',
    borderRadius: '4px',
    padding: '6px 12px',
    cursor: 'pointer',
    fontSize: '14px',
  };
  
  return (
    <div style={notificationStyle}>
      <div style={messageStyle}>
        A new version of the app is available!
      </div>
      <div style={buttonContainerStyle}>
        <button 
          style={refreshButtonStyle}
          onClick={handleRefresh}
        >
          Refresh
        </button>
        <button 
          style={dismissButtonStyle}
          onClick={handleDismiss}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};

export default UpdateNotification;
