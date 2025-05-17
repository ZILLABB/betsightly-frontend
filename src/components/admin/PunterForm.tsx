import React, { useState } from 'react';
import { Button, Input, Textarea, Checkbox, Select, SelectItem } from '../ui';
import { Save, X } from 'lucide-react';

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

interface PunterFormProps {
  initialData: Punter | null;
  onSubmit: (data: Partial<Punter>) => void;
  onCancel: () => void;
}

const PunterForm: React.FC<PunterFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Punter>>(
    initialData || {
      name: '',
      nickname: '',
      country: 'Nigeria',
      popularity: 0,
      specialty: '',
      success_rate: undefined,
      image_url: '',
      social_media: {
        twitter: '',
        instagram: '',
        telegram: ''
      },
      bio: '',
      verified: false
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

  // Handle social media input changes
  const handleSocialMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const platform = name.split('_')[1]; // Extract platform from name (e.g., social_twitter -> twitter)
    
    setFormData(prev => ({
      ...prev,
      social_media: {
        ...prev.social_media,
        [platform]: value
      }
    }));
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

    if (formData.success_rate !== undefined && (formData.success_rate < 0 || formData.success_rate > 100)) {
      newErrors.success_rate = 'Success rate must be between 0 and 100';
    }

    if (formData.popularity !== undefined && (formData.popularity < 0 || formData.popularity > 100)) {
      newErrors.popularity = 'Popularity must be between 0 and 100';
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
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="name"
              name="name"
              value={formData.name || ''}
              onChange={handleChange}
              error={errors.name}
              placeholder="Enter punter name"
            />
          </div>

          <div>
            <label htmlFor="nickname" className="block text-sm font-medium mb-1">
              Nickname
            </label>
            <Input
              id="nickname"
              name="nickname"
              value={formData.nickname || ''}
              onChange={handleChange}
              placeholder="Enter punter nickname"
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
            <label htmlFor="specialty" className="block text-sm font-medium mb-1">
              Specialty
            </label>
            <Select
              id="specialty"
              name="specialty"
              value={formData.specialty || ''}
              onChange={handleChange}
            >
              <SelectItem value="">Select specialty</SelectItem>
              <SelectItem value="Football">Football</SelectItem>
              <SelectItem value="Basketball">Basketball</SelectItem>
              <SelectItem value="Tennis">Tennis</SelectItem>
              <SelectItem value="Horse Racing">Horse Racing</SelectItem>
              <SelectItem value="Mixed">Mixed</SelectItem>
            </Select>
          </div>

          <div>
            <label htmlFor="success_rate" className="block text-sm font-medium mb-1">
              Success Rate (%)
            </label>
            <Input
              id="success_rate"
              name="success_rate"
              type="number"
              min="0"
              max="100"
              value={formData.success_rate?.toString() || ''}
              onChange={handleChange}
              error={errors.success_rate}
              placeholder="Enter success rate percentage"
            />
          </div>

          <div>
            <label htmlFor="popularity" className="block text-sm font-medium mb-1">
              Popularity (0-100)
            </label>
            <Input
              id="popularity"
              name="popularity"
              type="number"
              min="0"
              max="100"
              value={formData.popularity?.toString() || '0'}
              onChange={handleChange}
              error={errors.popularity}
              placeholder="Enter popularity rating"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="image_url" className="block text-sm font-medium mb-1">
              Profile Image URL
            </label>
            <Input
              id="image_url"
              name="image_url"
              value={formData.image_url || ''}
              onChange={handleChange}
              placeholder="Enter profile image URL"
            />
          </div>

          <div>
            <label htmlFor="social_twitter" className="block text-sm font-medium mb-1">
              Twitter
            </label>
            <Input
              id="social_twitter"
              name="social_twitter"
              value={formData.social_media?.twitter || ''}
              onChange={handleSocialMediaChange}
              placeholder="Enter Twitter handle"
            />
          </div>

          <div>
            <label htmlFor="social_instagram" className="block text-sm font-medium mb-1">
              Instagram
            </label>
            <Input
              id="social_instagram"
              name="social_instagram"
              value={formData.social_media?.instagram || ''}
              onChange={handleSocialMediaChange}
              placeholder="Enter Instagram handle"
            />
          </div>

          <div>
            <label htmlFor="social_telegram" className="block text-sm font-medium mb-1">
              Telegram
            </label>
            <Input
              id="social_telegram"
              name="social_telegram"
              value={formData.social_media?.telegram || ''}
              onChange={handleSocialMediaChange}
              placeholder="Enter Telegram handle"
            />
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium mb-1">
              Biography
            </label>
            <Textarea
              id="bio"
              name="bio"
              value={formData.bio || ''}
              onChange={handleChange}
              placeholder="Enter punter biography"
              rows={4}
            />
          </div>

          <div className="flex items-center mt-4">
            <Checkbox
              id="verified"
              name="verified"
              checked={formData.verified || false}
              onChange={handleCheckboxChange}
            />
            <label htmlFor="verified" className="ml-2 text-sm font-medium">
              Verified Punter
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
          {initialData ? 'Update Punter' : 'Create Punter'}
        </Button>
      </div>
    </form>
  );
};

export default PunterForm;
