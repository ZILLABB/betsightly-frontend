/**
 * Security tests for BetSightly application
 */

import { 
  sanitizeString, 
  isValidEmail, 
  isValidUsername, 
  validatePassword,
  isValidNumber,
  sanitizeFormData,
  validateApiResponse 
} from '../utils/validation';

describe('Security Validation Tests', () => {
  describe('sanitizeString', () => {
    it('should remove dangerous HTML tags', () => {
      const maliciousInput = '<script>alert("xss")</script>Hello';
      const sanitized = sanitizeString(maliciousInput);
      expect(sanitized).toBe('scriptalert("xss")/scriptHello');
      expect(sanitized).not.toContain('<script>');
    });

    it('should remove javascript: protocol', () => {
      const maliciousInput = 'javascript:alert("xss")';
      const sanitized = sanitizeString(maliciousInput);
      expect(sanitized).toBe('alert("xss")');
      expect(sanitized).not.toContain('javascript:');
    });

    it('should remove event handlers', () => {
      const maliciousInput = 'onclick=alert("xss") onload=malicious()';
      const sanitized = sanitizeString(maliciousInput);
      expect(sanitized).toBe('alert("xss") malicious()');
      expect(sanitized).not.toContain('onclick=');
      expect(sanitized).not.toContain('onload=');
    });

    it('should handle non-string input', () => {
      expect(sanitizeString(null as any)).toBe('');
      expect(sanitizeString(undefined as any)).toBe('');
      expect(sanitizeString(123 as any)).toBe('');
    });

    it('should trim whitespace', () => {
      expect(sanitizeString('  hello  ')).toBe('hello');
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email formats', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('test.email+tag@domain.co.uk')).toBe(true);
      expect(isValidEmail('user123@test-domain.org')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('user..double.dot@domain.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('isValidUsername', () => {
    it('should validate correct username formats', () => {
      expect(isValidUsername('user123')).toBe(true);
      expect(isValidUsername('test_user')).toBe(true);
      expect(isValidUsername('User_Name_123')).toBe(true);
    });

    it('should reject invalid username formats', () => {
      expect(isValidUsername('ab')).toBe(false); // too short
      expect(isValidUsername('a'.repeat(31))).toBe(false); // too long
      expect(isValidUsername('user-name')).toBe(false); // contains hyphen
      expect(isValidUsername('user name')).toBe(false); // contains space
      expect(isValidUsername('user@name')).toBe(false); // contains special char
      expect(isValidUsername('')).toBe(false); // empty
    });
  });

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      const result = validatePassword('StrongPass123');
      expect(result.isValid).toBe(true);
      expect(result.message).toBe('Password is valid');
    });

    it('should reject weak passwords', () => {
      // Too short
      expect(validatePassword('Short1').isValid).toBe(false);
      expect(validatePassword('Short1').message).toContain('at least 8 characters');

      // No uppercase
      expect(validatePassword('lowercase123').isValid).toBe(false);
      expect(validatePassword('lowercase123').message).toContain('uppercase letter');

      // No lowercase
      expect(validatePassword('UPPERCASE123').isValid).toBe(false);
      expect(validatePassword('UPPERCASE123').message).toContain('lowercase letter');

      // No numbers
      expect(validatePassword('NoNumbers').isValid).toBe(false);
      expect(validatePassword('NoNumbers').message).toContain('number');
    });
  });

  describe('isValidNumber', () => {
    it('should validate numbers within range', () => {
      expect(isValidNumber(5, 1, 10)).toBe(true);
      expect(isValidNumber('5', 1, 10)).toBe(true);
      expect(isValidNumber(1, 1, 10)).toBe(true);
      expect(isValidNumber(10, 1, 10)).toBe(true);
    });

    it('should reject invalid numbers', () => {
      expect(isValidNumber('not-a-number')).toBe(false);
      expect(isValidNumber(0, 1, 10)).toBe(false);
      expect(isValidNumber(11, 1, 10)).toBe(false);
      expect(isValidNumber(null)).toBe(false);
      expect(isValidNumber(undefined)).toBe(false);
    });
  });

  describe('sanitizeFormData', () => {
    it('should sanitize all string fields in form data', () => {
      const formData = {
        username: '<script>alert("xss")</script>user',
        email: 'user@example.com',
        age: 25,
        bio: 'javascript:alert("xss")',
      };

      const sanitized = sanitizeFormData(formData);

      expect(sanitized.username).toBe('scriptalert("xss")/scriptuser');
      expect(sanitized.email).toBe('user@example.com');
      expect(sanitized.age).toBe(25);
      expect(sanitized.bio).toBe('alert("xss")');
    });
  });

  describe('validateApiResponse', () => {
    it('should validate responses with required fields', () => {
      const response = {
        user: { id: 1, username: 'test' },
        access_token: 'token123',
        extra_field: 'value',
      };

      expect(validateApiResponse(response, ['user', 'access_token'])).toBe(true);
    });

    it('should reject responses missing required fields', () => {
      const response = {
        user: { id: 1, username: 'test' },
        // missing access_token
      };

      expect(validateApiResponse(response, ['user', 'access_token'])).toBe(false);
    });

    it('should reject invalid response types', () => {
      expect(validateApiResponse(null, ['field'])).toBe(false);
      expect(validateApiResponse('string', ['field'])).toBe(false);
      expect(validateApiResponse(123, ['field'])).toBe(false);
    });
  });
});

describe('Authentication Security Tests', () => {
  beforeEach(() => {
    // Mock fetch for authentication tests
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should not expose sensitive data in error messages', async () => {
    const { login } = await import('../services/authService');

    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('Database connection failed with password: secret123')
    );

    try {
      await login('testuser', 'password');
    } catch (error) {
      expect(error.message).not.toContain('secret123');
      expect(error.message).not.toContain('Database connection failed');
    }
  });

  it('should validate input before making API calls', async () => {
    const { login } = await import('../services/authService');

    // Test with invalid username
    await expect(login('<script>alert("xss")</script>', 'password'))
      .rejects.toThrow('Invalid username format');

    // Test with empty inputs
    await expect(login('', 'password')).rejects.toThrow('Username is required');
    await expect(login('username', '')).rejects.toThrow('Password is required');
  });
});

describe('XSS Prevention Tests', () => {
  it('should prevent script injection in user inputs', () => {
    const maliciousInputs = [
      '<script>alert("xss")</script>',
      'javascript:alert("xss")',
      '<img src="x" onerror="alert(\'xss\')" />',
      '<svg onload="alert(\'xss\')" />',
      'onclick="alert(\'xss\')"',
    ];

    maliciousInputs.forEach(input => {
      const sanitized = sanitizeString(input);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('javascript:');
      expect(sanitized).not.toContain('onclick=');
      expect(sanitized).not.toContain('onload=');
      expect(sanitized).not.toContain('onerror=');
    });
  });
});

describe('Data Validation Security Tests', () => {
  it('should validate API response structure to prevent injection', () => {
    const maliciousResponse = {
      user: {
        id: '<script>alert("xss")</script>',
        username: 'javascript:alert("xss")',
        email: 'user@example.com',
      },
      access_token: 'valid-token',
    };

    // The validation should pass structure check
    expect(validateApiResponse(maliciousResponse, ['user', 'access_token'])).toBe(true);
    
    // But individual fields should be sanitized when used
    const sanitizedId = sanitizeString(maliciousResponse.user.id);
    const sanitizedUsername = sanitizeString(maliciousResponse.user.username);
    
    expect(sanitizedId).not.toContain('<script>');
    expect(sanitizedUsername).not.toContain('javascript:');
  });
});
