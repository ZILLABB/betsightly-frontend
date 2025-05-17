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
import PunterForm from './PunterForm';
import { API_BASE_URL } from '../../config/apiConfig';

interface Punter {
  id: number;
  name: string;
  nickname?: string;
  country: string;
  popularity: number;
  specialty?: string;
  success_rate?: number;
  image_url?: string;
  social_media?: Record<string, string>;
  bio?: string;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

const PuntersAdmin: React.FC = () => {
  const [punters, setPunters] = useState<Punter[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingPunter, setEditingPunter] = useState<Punter | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load punters on component mount
  useEffect(() => {
    loadPunters();
  }, []);

  // Function to load punters
  const loadPunters = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/punters`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      setPunters(data.punters || []);
    } catch (err) {
      console.error('Error loading punters:', err);
      setError('Failed to load punters. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Function to handle punter deletion
  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this punter?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/punters/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      // Remove punter from state
      setPunters(punters.filter(punter => punter.id !== id));
      setSuccessMessage('Punter deleted successfully');

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Error deleting punter:', err);
      setError('Failed to delete punter. Please try again later.');
    }
  };

  // Function to handle punter verification toggle
  const handleVerificationToggle = async (punter: Punter) => {
    try {
      const response = await fetch(`${API_BASE_URL}/punters/${punter.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...punter,
          verified: !punter.verified,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      // Update punter in state
      setPunters(punters.map(p => 
        p.id === punter.id ? { ...p, verified: !p.verified } : p
      ));

      setSuccessMessage(`Punter ${punter.verified ? 'unverified' : 'verified'} successfully`);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Error updating punter verification:', err);
      setError('Failed to update punter verification. Please try again later.');
    }
  };

  // Function to handle form submission
  const handleFormSubmit = async (formData: Partial<Punter>) => {
    try {
      const isEditing = !!editingPunter;
      const url = isEditing 
        ? `${API_BASE_URL}/punters/${editingPunter.id}` 
        : `${API_BASE_URL}/punters`;
      
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

      // Reload punters
      await loadPunters();
      
      // Reset form state
      setShowForm(false);
      setEditingPunter(null);
      
      setSuccessMessage(`Punter ${isEditing ? 'updated' : 'created'} successfully`);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Error saving punter:', err);
      setError('Failed to save punter. Please try again later.');
    }
  };

  // Filter punters based on search term
  const filteredPunters = punters.filter(punter => 
    punter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (punter.nickname && punter.nickname.toLowerCase().includes(searchTerm.toLowerCase())) ||
    punter.country.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

      {/* Punter form */}
      {showForm && (
        <Card className="mb-6 border border-[var(--border)] bg-black/10">
          <CardHeader>
            <CardTitle>{editingPunter ? 'Edit Punter' : 'Add New Punter'}</CardTitle>
          </CardHeader>
          <CardContent>
            <PunterForm 
              initialData={editingPunter} 
              onSubmit={handleFormSubmit} 
              onCancel={() => {
                setShowForm(false);
                setEditingPunter(null);
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Punters list */}
      <Card className="border border-[var(--border)] bg-black/10">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Punters</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadPunters}
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
                  setEditingPunter(null);
                }}
              >
                <Plus size={16} className="mr-2" />
                Add Punter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Search punters..."
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
          ) : filteredPunters.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[var(--muted-foreground)]">
                {searchTerm ? 'No punters match your search' : 'No punters found'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left py-3 px-4">Name</th>
                    <th className="text-left py-3 px-4">Country</th>
                    <th className="text-left py-3 px-4">Specialty</th>
                    <th className="text-left py-3 px-4">Success Rate</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-right py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPunters.map((punter) => (
                    <tr key={punter.id} className="border-b border-[var(--border)] hover:bg-black/5">
                      <td className="py-3 px-4">
                        <div className="font-medium">{punter.name}</div>
                        {punter.nickname && (
                          <div className="text-sm text-[var(--muted-foreground)]">{punter.nickname}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">{punter.country}</td>
                      <td className="py-3 px-4">{punter.specialty || '-'}</td>
                      <td className="py-3 px-4">
                        {punter.success_rate ? `${punter.success_rate}%` : '-'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={punter.verified ? 'success' : 'secondary'}>
                          {punter.verified ? 'Verified' : 'Unverified'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleVerificationToggle(punter)}
                            title={punter.verified ? 'Remove verification' : 'Verify punter'}
                          >
                            {punter.verified ? (
                              <StarOff size={16} className="text-amber-500" />
                            ) : (
                              <Star size={16} className="text-amber-500" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingPunter(punter);
                              setShowForm(true);
                            }}
                            title="Edit punter"
                          >
                            <Edit size={16} className="text-blue-500" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(punter.id)}
                            title="Delete punter"
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

export default PuntersAdmin;
