import React, { useState } from 'react';
import { Button, Input, Textarea, Select, SelectItem } from '../ui';
import { Save, X } from 'lucide-react';

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

interface BookmakerFormProps {
  initialData: Bookmaker | null;
  onSubmit: (data: Partial<Bookmaker>) => void;
  onCancel: () => void;
}

const BookmakerForm: React.FC<BookmakerFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Bookmaker>>(
    initialData || {
      name: '',
      country: 'Nigeria',
      website: '',
      logo_url: '',
      description: ''
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

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.country?.trim()) {
      newErrors.country = 'Country is required';
    }

    if (formData.website && !isValidUrl(formData.website)) {
      newErrors.website = 'Please enter a valid URL';
    }

    if (formData.logo_url && !isValidUrl(formData.logo_url)) {
      newErrors.logo_url = 'Please enter a valid URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate URL
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
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
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="name"
              name="name"
              value={formData.name || ''}
              onChange={handleChange}
              error={errors.name}
              placeholder="Enter bookmaker name"
            />
          </div>

          <div>
            <label htmlFor="country" className="block text-sm font-medium mb-1">
              Country <span className="text-red-500">*</span>
            </label>
            <Select
              id="country"
              name="country"
              value={formData.country || 'Nigeria'}
              onChange={handleChange}
              error={errors.country}
            >
              <SelectItem value="Nigeria">Nigeria</SelectItem>
              <SelectItem value="Ghana">Ghana</SelectItem>
              <SelectItem value="Kenya">Kenya</SelectItem>
              <SelectItem value="South Africa">South Africa</SelectItem>
              <SelectItem value="United Kingdom">United Kingdom</SelectItem>
              <SelectItem value="United States">United States</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </Select>
          </div>

          <div>
            <label htmlFor="website" className="block text-sm font-medium mb-1">
              Website
            </label>
            <Input
              id="website"
              name="website"
              value={formData.website || ''}
              onChange={handleChange}
              error={errors.website}
              placeholder="Enter website URL (e.g., https://example.com)"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="logo_url" className="block text-sm font-medium mb-1">
              Logo URL
            </label>
            <Input
              id="logo_url"
              name="logo_url"
              value={formData.logo_url || ''}
              onChange={handleChange}
              error={errors.logo_url}
              placeholder="Enter logo image URL"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">
              Description
            </label>
            <Textarea
              id="description"
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              placeholder="Enter bookmaker description"
              rows={4}
            />
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
          {initialData ? 'Update Bookmaker' : 'Create Bookmaker'}
        </Button>
      </div>
    </form>
  );
};

export default BookmakerForm;
