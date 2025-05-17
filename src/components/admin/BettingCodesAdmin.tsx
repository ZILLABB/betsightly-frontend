import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Alert,
  Spinner,
  Badge
} from '../ui';
import { Plus, Search, Edit, Trash, Star, StarOff, Check, X, RefreshCw } from 'lucide-react';
import { fadeVariants } from '../../utils/animations';
import BettingCodeForm from './BettingCodeForm';
import { API_BASE_URL } from '../../config/apiConfig';

interface BettingCode {
  id: number;
  code: string;
  punter_id: number;
  punter_name: string;
  bookmaker_id?: number;
  bookmaker_name?: string;
  odds?: number;
  event_date?: string;
  expiry_date?: string;
  status: 'pending' | 'won' | 'lost' | 'void';
  confidence?: number;
  featured: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface Punter {
  id: number;
  name: string;
}

interface Bookmaker {
  id: number;
  name: string;
}

const BettingCodesAdmin: React.FC = () => {
  const [bettingCodes, setBettingCodes] = useState<BettingCode[]>([]);
  const [punters, setPunters] = useState<Punter[]>([]);
  const [bookmakers, setBookmakers] = useState<Bookmaker[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingCode, setEditingCode] = useState<BettingCode | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load betting codes and reference data on component mount
  useEffect(() => {
    loadBettingCodes();
    loadReferenceData();
  }, []);

  // Function to load betting codes
  const loadBettingCodes = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/betting-codes`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      setBettingCodes(data.betting_codes || []);
    } catch (err) {
      console.error('Error loading betting codes:', err);
      setError('Failed to load betting codes. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Function to load reference data (punters and bookmakers)
  const loadReferenceData = async () => {
    try {
      const [puntersResponse, bookmakersResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/punters`),
        fetch(`${API_BASE_URL}/bookmakers`)
      ]);

      if (!puntersResponse.ok || !bookmakersResponse.ok) {
        throw new Error('Failed to load reference data');
      }

      const puntersData = await puntersResponse.json();
      const bookmakersData = await bookmakersResponse.json();

      setPunters(puntersData.punters || []);
      setBookmakers(bookmakersData.bookmakers || []);
    } catch (err) {
      console.error('Error loading reference data:', err);
      setError('Failed to load reference data. Some form features may be limited.');
    }
  };

  // Function to handle betting code deletion
  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this betting code?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/betting-codes/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      // Remove betting code from state
      setBettingCodes(bettingCodes.filter(code => code.id !== id));
      setSuccessMessage('Betting code deleted successfully');

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Error deleting betting code:', err);
      setError('Failed to delete betting code. Please try again later.');
    }
  };

  // Function to handle featured toggle
  const handleFeaturedToggle = async (code: BettingCode) => {
    try {
      const response = await fetch(`${API_BASE_URL}/betting-codes/${code.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...code,
          featured: !code.featured,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      // Update betting code in state
      setBettingCodes(codes => 
        codes.map(c => 
          c.id === code.id ? { ...c, featured: !c.featured } : c
        )
      );

      setSuccessMessage(`Betting code ${code.featured ? 'removed from' : 'marked as'} featured`);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Error updating betting code:', err);
      setError('Failed to update betting code. Please try again later.');
    }
  };

  // Function to handle form submission
  const handleFormSubmit = async (formData: Partial<BettingCode>) => {
    try {
      const isEditing = !!editingCode;
      const url = isEditing 
        ? `${API_BASE_URL}/betting-codes/${editingCode.id}` 
        : `${API_BASE_URL}/betting-codes`;
      
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      // Reload betting codes
      await loadBettingCodes();
      
      // Reset form state
      setShowForm(false);
      setEditingCode(null);
      
      setSuccessMessage(`Betting code ${isEditing ? 'updated' : 'created'} successfully`);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Error saving betting code:', err);
      setError('Failed to save betting code. Please try again later.');
    }
  };

  // Filter betting codes based on search term
  const filteredCodes = bettingCodes.filter(code => 
    code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    code.punter_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (code.bookmaker_name && code.bookmaker_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'won':
        return 'success';
      case 'lost':
        return 'danger';
      case 'void':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  return (
    <motion.div
      className="space-y-6"
      initial="initial"
      animate="animate"
      variants={fadeVariants}
    >
      {/* Success message */}
      {successMessage && (
        <Alert variant="success" className="mb-4">
          <Check className="h-4 w-4 mr-2" />
          {successMessage}
        </Alert>
      )}

      {/* Error message */}
      {error && (
        <Alert variant="danger" className="mb-4">
          <X className="h-4 w-4 mr-2" />
          {error}
        </Alert>
      )}

      {/* Betting code form */}
      {showForm && (
        <Card className="mb-6 border border-[var(--border)] bg-black/10">
          <CardHeader>
            <CardTitle>{editingCode ? 'Edit Betting Code' : 'Add New Betting Code'}</CardTitle>
          </CardHeader>
          <CardContent>
            <BettingCodeForm 
              initialData={editingCode} 
              punters={punters}
              bookmakers={bookmakers}
              onSubmit={handleFormSubmit} 
              onCancel={() => {
                setShowForm(false);
                setEditingCode(null);
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Betting codes list */}
      <Card className="border border-[var(--border)] bg-black/10">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Betting Codes</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadBettingCodes}
                disabled={loading}
              >
                <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setShowForm(true);
                  setEditingCode(null);
                }}
              >
                <Plus size={16} className="mr-2" />
                Add Betting Code
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Search betting codes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
              prefix={<Search size={16} className="text-[var(--muted-foreground)]" />}
            />
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Spinner size="lg" variant="primary" />
            </div>
          ) : filteredCodes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[var(--muted-foreground)]">
                {searchTerm ? 'No betting codes match your search' : 'No betting codes found'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left py-3 px-4">Code</th>
                    <th className="text-left py-3 px-4">Punter</th>
                    <th className="text-left py-3 px-4">Bookmaker</th>
                    <th className="text-left py-3 px-4">Odds</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Confidence</th>
                    <th className="text-right py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCodes.map((code) => (
                    <tr key={code.id} className="border-b border-[var(--border)] hover:bg-black/5">
                      <td className="py-3 px-4 font-medium">{code.code}</td>
                      <td className="py-3 px-4">{code.punter_name}</td>
                      <td className="py-3 px-4">{code.bookmaker_name || '-'}</td>
                      <td className="py-3 px-4">{code.odds || '-'}</td>
                      <td className="py-3 px-4">
                        <Badge variant={getStatusVariant(code.status)}>
                          {code.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        {code.confidence ? `${code.confidence}/10` : '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleFeaturedToggle(code)}
                            title={code.featured ? 'Remove from featured' : 'Mark as featured'}
                          >
                            {code.featured ? (
                              <StarOff size={16} className="text-amber-500" />
                            ) : (
                              <Star size={16} className="text-amber-500" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingCode(code);
                              setShowForm(true);
                            }}
                            title="Edit betting code"
                          >
                            <Edit size={16} className="text-blue-500" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(code.id)}
                            title="Delete betting code"
                          >
                            <Trash size={16} className="text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default BettingCodesAdmin;
