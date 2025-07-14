/**
 * PWA Install Prompt Component
 * 
 * Shows a prompt to install the app when it's installable
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone } from 'lucide-react';
import { Button } from './Button';
import { usePWA } from './PWAProvider';
import { HapticInteractions } from '../../utils/hapticFeedback';

const PWAInstallPrompt: React.FC = () => {
  const { isInstallable, installApp, dismissInstallPrompt } = usePWA();
  const [isInstalling, setIsInstalling] = useState(false);

  const handleInstall = async () => {
    setIsInstalling(true);
    HapticInteractions.buttonPress();
    
    try {
      await installApp();
    } catch (error) {
      console.error('Install failed:', error);
      HapticInteractions.error();
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    HapticInteractions.buttonPress();
    dismissInstallPrompt();
  };

  return (
    <AnimatePresence>
      {isInstallable && (
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50"
        >
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl p-4 shadow-xl border border-amber-400/20">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-white" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold text-sm">
                  Install BetSightly
                </h3>
                <p className="text-white/90 text-xs mt-1">
                  Get faster access and offline features by installing our app
                </p>
                
                <div className="flex space-x-2 mt-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleInstall}
                    disabled={isInstalling}
                    className="bg-white text-amber-600 hover:bg-white/90 text-xs px-3 py-1.5 h-auto"
                  >
                    {isInstalling ? (
                      <>
                        <div className="w-3 h-3 border border-amber-600 border-t-transparent rounded-full animate-spin mr-1" />
                        Installing...
                      </>
                    ) : (
                      <>
                        <Download className="w-3 h-3 mr-1" />
                        Install
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDismiss}
                    className="text-white hover:bg-white/10 text-xs px-2 py-1.5 h-auto"
                  >
                    Later
                  </Button>
                </div>
              </div>
              
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 text-white/70 hover:text-white transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PWAInstallPrompt;
