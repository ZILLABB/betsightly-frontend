import React, { useState } from 'react';
import { Button, Input, Textarea, Checkbox, Select, SelectItem } from '../ui';
import { Save, X } from 'lucide-react';

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

interface BettingCodeFormProps {
  initialData: BettingCode | null;
  punters: Punter[];
  bookmakers: Bookmaker[];
  onSubmit: (data: Partial<BettingCode>) => void;
  onCancel: () => void;
}

const BettingCodeForm: React.FC<BettingCodeFormProps> = ({ 
  initialData, 
  punters, 
  bookmakers, 
  onSubmit, 
  onCancel 
}) => {
  const [formData, setFormData] = useState<Partial<BettingCode>>(
    initialData || {
      code: '',
      punter_id: punters.length > 0 ? punters[0].id : 0,
      bookmaker_id: undefined,
      odds: undefined,
      event_date: new Date().toISOString().split('T')[0],
      expiry_date: undefined,
      status: 'pending',
      confidence: undefined,
      featured: false,
      notes: ''
    }
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  // Handle number input changes
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? undefined : parseFloat(value)
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.code?.trim()) {
      newErrors.code = 'Betting code is required';
    }

    if (!formData.punter_id) {
      newErrors.punter_id = 'Punter is required';
    }

    if (formData.odds !== undefined && formData.odds <= 0) {
      newErrors.odds = 'Odds must be greater than 0';
    }

    if (formData.confidence !== undefined && (formData.confidence < 1 || formData.confidence > 10)) {
      newErrors.confidence = 'Confidence must be between 1 and 10';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="code" className="block text-sm font-medium mb-1">
              Betting Code <span className="text-red-500">*</span>
            </label>
            <Input
              id="code"
              name="code"
              value={formData.code || ''}
              onChange={handleChange}
              error={errors.code}
              placeholder="Enter betting code"
            />
          </div>

          <div>
            <label htmlFor="punter_id" className="block text-sm font-medium mb-1">
              Punter <span className="text-red-500">*</span>
            </label>
            <Select
              id="punter_id"
              name="punter_id"
              value={formData.punter_id?.toString() || ''}
              onChange={(e) => handleChange({
                ...e,
                target: {
                  ...e.target,
                  name: e.target.name,
                  value: e.target.value ? parseInt(e.target.value) : ''
                }
              })}
              error={errors.punter_id}
            >
              <SelectItem value="">Select a punter</SelectItem>
              {punters.map(punter => (
                <SelectItem key={punter.id} value={punter.id.toString()}>
                  {punter.name}
                </SelectItem>
              ))}
            </Select>
          </div>

          <div>
            <label htmlFor="bookmaker_id" className="block text-sm font-medium mb-1">
              Bookmaker
            </label>
            <Select
              id="bookmaker_id"
              name="bookmaker_id"
              value={formData.bookmaker_id?.toString() || ''}
              onChange={(e) => handleChange({
                ...e,
                target: {
                  ...e.target,
                  name: e.target.name,
                  value: e.target.value ? parseInt(e.target.value) : ''
                }
              })}
            >
              <SelectItem value="">Select a bookmaker</SelectItem>
              {bookmakers.map(bookmaker => (
                <SelectItem key={bookmaker.id} value={bookmaker.id.toString()}>
                  {bookmaker.name}
                </SelectItem>
              ))}
            </Select>
          </div>

          <div>
            <label htmlFor="odds" className="block text-sm font-medium mb-1">
              Odds
            </label>
            <Input
              id="odds"
              name="odds"
              type="number"
              step="0.01"
              min="1"
              value={formData.odds?.toString() || ''}
              onChange={handleNumberChange}
              error={errors.odds}
              placeholder="Enter odds"
            />
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium mb-1">
              Status
            </label>
            <Select
              id="status"
              name="status"
              value={formData.status || 'pending'}
              onChange={handleChange}
            >
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="won">Won</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
              <SelectItem value="void">Void</SelectItem>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="event_date" className="block text-sm font-medium mb-1">
              Event Date
            </label>
            <Input
              id="event_date"
              name="event_date"
              type="date"
              value={formData.event_date || ''}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="expiry_date" className="block text-sm font-medium mb-1">
              Expiry Date
            </label>
            <Input
              id="expiry_date"
              name="expiry_date"
              type="date"
              value={formData.expiry_date || ''}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="confidence" className="block text-sm font-medium mb-1">
              Confidence (1-10)
            </label>
            <Input
              id="confidence"
              name="confidence"
              type="number"
              min="1"
              max="10"
              value={formData.confidence?.toString() || ''}
              onChange={handleNumberChange}
              error={errors.confidence}
              placeholder="Enter confidence rating"
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium mb-1">
              Notes
            </label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes || ''}
              onChange={handleChange}
              placeholder="Enter notes about this betting code"
              rows={4}
            />
          </div>

          <div className="flex items-center mt-4">
            <Checkbox
              id="featured"
              name="featured"
              checked={formData.featured || false}
              onChange={handleCheckboxChange}
            />
            <label htmlFor="featured" className="ml-2 text-sm font-medium">
              Featured Betting Code
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border)]">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X size={16} className="mr-2" />
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          <Save size={16} className="mr-2" />
          {initialData ? 'Update Betting Code' : 'Create Betting Code'}
        </Button>
      </div>
    </form>
  );
};

export default BettingCodeForm;
