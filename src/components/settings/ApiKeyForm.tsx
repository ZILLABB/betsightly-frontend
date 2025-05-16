import React, { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../common/Card';
import { Input } from '../common/Input';
import { Label } from '../common/Label';
import { AlertCircle, CheckCircle, Copy, Key, Loader2 } from 'lucide-react';
import { validateApiKey } from '../../services/settingsService';

interface ApiKeyFormProps {
  onSave: (apiKey: string) => Promise<boolean>;
  initialApiKey?: string;
  apiName?: string;
  apiDescription?: string;
  apiUrl?: string;
}

const ApiKeyForm: React.FC<ApiKeyFormProps> = ({
  onSave,
  initialApiKey = '',
  apiName = 'Football-Data.org',
  apiDescription = 'Enter your API key to fetch live fixture data',
  apiUrl = 'https://www.football-data.org/client/register'
}) => {
  const [apiKey, setApiKey] = useState<string>(initialApiKey);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [remainingRequests, setRemainingRequests] = useState<number | null>(null);

  // Reset success and error states when API key changes
  useEffect(() => {
    setSuccess(false);
    setError(null);
    setValidationMessage(null);
  }, [apiKey]);

  const handleValidate = async () => {
    if (!apiKey.trim()) {
      setError('Please enter an API key to validate');
      return;
    }

    setIsValidating(true);
    setError(null);
    setValidationMessage(null);

    try {
      const result = await validateApiKey(apiKey);

      if (result.valid) {
        setValidationMessage('API key is valid');
        setRemainingRequests(result.remainingRequests || null);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('An error occurred while validating the API key.');
      console.error('Error validating API key:', err);
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate API key
    if (!apiKey.trim()) {
      setError('Please enter a valid API key');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Validate the API key first
      const validationResult = await validateApiKey(apiKey);

      if (!validationResult.valid) {
        setError(validationResult.message);
        return;
      }

      // If valid, save it
      const result = await onSave(apiKey);
      if (result) {
        setSuccess(true);
        setValidationMessage('API key is valid');
        setRemainingRequests(validationResult.remainingRequests || null);
      } else {
        setError('Failed to save API key. Please try again.');
      }
    } catch (err) {
      setError('An error occurred while saving the API key.');
      console.error('Error saving API key:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key size={20} />
          {apiName} API Key
        </CardTitle>
        <CardDescription>
          {apiDescription}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <div className="relative">
                <Input
                  id="apiKey"
                  type="text"
                  placeholder="Enter your Football-Data.org API key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className={`pr-10 ${error ? 'border-red-500' : success || validationMessage ? 'border-green-500' : ''}`}
                />
                {apiKey && (
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={handleCopy}
                  >
                    <Copy size={16} />
                  </button>
                )}
              </div>

              {/* Error message */}
              {error && (
                <div className="text-red-500 text-sm flex items-center gap-1 mt-1">
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}

              {/* Success message */}
              {success && (
                <div className="text-green-500 text-sm flex items-center gap-1 mt-1">
                  <CheckCircle size={14} />
                  API key saved successfully!
                </div>
              )}

              {/* Validation message */}
              {validationMessage && !error && (
                <div className="text-green-500 text-sm flex items-center gap-1 mt-1">
                  <CheckCircle size={14} />
                  {validationMessage}
                </div>
              )}

              {/* API usage info */}
              {remainingRequests !== null && (
                <div className="mt-2 p-2 bg-[var(--secondary)]/10 rounded-md">
                  <p className="text-xs text-[var(--muted-foreground)]">
                    API Requests Available: {remainingRequests}
                  </p>
                  <div className="h-1.5 bg-[var(--secondary)]/20 rounded-full mt-1">
                    <div
                      className="h-full bg-[var(--primary)] rounded-full"
                      style={{ width: `${Math.min(100, remainingRequests)}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Copy confirmation */}
              {copied && (
                <div className="text-blue-500 text-sm flex items-center gap-1 mt-1">
                  Copied to clipboard!
                </div>
              )}
            </div>

            <div className="text-sm text-[var(--muted-foreground)]">
              <p>Don't have an API key? <a href="https://www.football-data.org/client/register" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Register for free at Football-Data.org</a></p>
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-2 sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={handleValidate}
          disabled={isValidating || !apiKey.trim()}
          className="w-full sm:w-auto"
        >
          {isValidating ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              Validating...
            </>
          ) : (
            'Test API Key'
          )}
        </Button>
        <Button
          type="submit"
          onClick={handleSubmit}
          disabled={isLoading || !apiKey.trim()}
          className="w-full sm:w-auto"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save API Key'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ApiKeyForm;
