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
import { Plus, Search, Edit, Trash, Check, X, RefreshCw, Globe } from 'lucide-react';
import { fadeVariants } from '../../utils/animations';
import BookmakerForm from './BookmakerForm';
import { API_BASE_URL } from '../../config/apiConfig';

interface Bookmaker {
  id: number;
  name: string;
  country: string;
  website?: string;
  logo_url?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

const BookmakersAdmin: React.FC = () => {
  const [bookmakers, setBookmakers] = useState<Bookmaker[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingBookmaker, setEditingBookmaker] = useState<Bookmaker | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load bookmakers on component mount
  useEffect(() => {
    loadBookmakers();
  }, []);

  // Function to load bookmakers
  const loadBookmakers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/bookmakers`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      setBookmakers(data.bookmakers || []);
    } catch (err) {
      console.error('Error loading bookmakers:', err);
      setError('Failed to load bookmakers. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Function to handle bookmaker deletion
  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this bookmaker?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/bookmakers/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      // Remove bookmaker from state
      setBookmakers(bookmakers.filter(bookmaker => bookmaker.id !== id));
      setSuccessMessage('Bookmaker deleted successfully');

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Error deleting bookmaker:', err);
      setError('Failed to delete bookmaker. Please try again later.');
    }
  };

  // Function to handle form submission
  const handleFormSubmit = async (formData: Partial<Bookmaker>) => {
    try {
      const isEditing = !!editingBookmaker;
      const url = isEditing 
        ? `${API_BASE_URL}/bookmakers/${editingBookmaker.id}` 
        : `${API_BASE_URL}/bookmakers`;
      
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

      // Reload bookmakers
      await loadBookmakers();
      
      // Reset form state
      setShowForm(false);
      setEditingBookmaker(null);
      
      setSuccessMessage(`Bookmaker ${isEditing ? 'updated' : 'created'} successfully`);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Error saving bookmaker:', err);
      setError('Failed to save bookmaker. Please try again later.');
    }
  };

  // Filter bookmakers based on search term
  const filteredBookmakers = bookmakers.filter(bookmaker => 
    bookmaker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bookmaker.country.toLowerCase().includes(searchTerm.toLowerCase())
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

      {/* Bookmaker form */}
      {showForm && (
        <Card className="mb-6 border border-[var(--border)] bg-black/10">
          <CardHeader>
            <CardTitle>{editingBookmaker ? 'Edit Bookmaker' : 'Add New Bookmaker'}</CardTitle>
          </CardHeader>
          <CardContent>
            <BookmakerForm 
              initialData={editingBookmaker} 
              onSubmit={handleFormSubmit} 
              onCancel={() => {
                setShowForm(false);
                setEditingBookmaker(null);
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Bookmakers list */}
      <Card className="border border-[var(--border)] bg-black/10">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Bookmakers</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadBookmakers}
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
                  setEditingBookmaker(null);
                }}
              >
                <Plus size={16} className="mr-2" />
                Add Bookmaker
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Search bookmakers..."
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
          ) : filteredBookmakers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[var(--muted-foreground)]">
                {searchTerm ? 'No bookmakers match your search' : 'No bookmakers found'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left py-3 px-4">Name</th>
                    <th className="text-left py-3 px-4">Country</th>
                    <th className="text-left py-3 px-4">Website</th>
                    <th className="text-right py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookmakers.map((bookmaker) => (
                    <tr key={bookmaker.id} className="border-b border-[var(--border)] hover:bg-black/5">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          {bookmaker.logo_url && (
                            <img 
                              src={bookmaker.logo_url} 
                              alt={bookmaker.name} 
                              className="w-6 h-6 mr-2 rounded-full"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                          <span className="font-medium">{bookmaker.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">{bookmaker.country}</td>
                      <td className="py-3 px-4">
                        {bookmaker.website ? (
                          <a 
                            href={bookmaker.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center text-blue-500 hover:text-blue-600"
                          >
                            <Globe size={14} className="mr-1" />
                            {bookmaker.website.replace(/^https?:\/\//, '')}
                          </a>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingBookmaker(bookmaker);
                              setShowForm(true);
                            }}
                            title="Edit bookmaker"
                          >
                            <Edit size={16} className="text-blue-500" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(bookmaker.id)}
                            title="Delete bookmaker"
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

export default BookmakersAdmin;
