import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { Input, Button, Alert } from '../components/ui';
import { Lock, User, AlertCircle } from 'lucide-react';
import { pageVariants, fadeVariants } from '../utils/animations';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  
  const { login, isAuthenticated, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the redirect path from location state or default to home
  const from = (location.state as any)?.from?.pathname || '/';
  
  // If already authenticated, redirect to the intended page
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);
  
  // Clear API errors when inputs change
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [username, password, clearError, error]);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!username.trim()) {
      setFormError('Username is required');
      return;
    }
    
    if (!password.trim()) {
      setFormError('Password is required');
      return;
    }
    
    // Clear form error
    setFormError(null);
    
    // Submit login
    await login(username, password);
  };
  
  return (
    <motion.div
      className="min-h-screen flex items-center justify-center px-4"
      initial="initial"
      animate="animate"
      variants={pageVariants}
    >
      <motion.div 
        className="w-full max-w-md"
        variants={fadeVariants}
      >
        <div className="text-center mb-8">
          <motion.h1 
            className="text-3xl font-bold bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/70 bg-clip-text text-transparent"
            variants={fadeVariants}
            custom={1}
          >
            Admin Login
          </motion.h1>
          <motion.p 
            className="text-[var(--muted-foreground)] mt-2"
            variants={fadeVariants}
            custom={2}
          >
            Sign in to access the admin dashboard
          </motion.p>
        </div>
        
        <motion.div
          variants={fadeVariants}
          custom={3}
          className="bg-black/10 rounded-xl p-6 border border-[var(--border)] shadow-md"
        >
          {/* Error messages */}
          {(error || formError) && (
            <Alert variant="danger" className="mb-6">
              <AlertCircle className="h-4 w-4 mr-2" />
              {formError || error}
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium mb-1">
                  Username
                </label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  prefix={<User size={16} className="text-[var(--muted-foreground)]" />}
                  autoComplete="username"
                  disabled={isLoading}
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  prefix={<Lock size={16} className="text-[var(--muted-foreground)]" />}
                  autoComplete="current-password"
                  disabled={isLoading}
                />
              </div>
            </div>
            
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              loading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default LoginPage;
