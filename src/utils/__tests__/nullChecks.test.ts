import {
  safeGet,
  safeFormatDate,
  safeArrayAccess,
  safeCall,
  safeString,
  safeExecute,
  makeSafe
} from '../nullChecks';

describe('nullChecks', () => {
  describe('safeGet', () => {
    it('gets nested property safely', () => {
      const obj = {
        user: {
          profile: {
            name: 'John',
            address: {
              city: 'New York'
            }
          }
        }
      };

      expect(safeGet(obj, 'user.profile.name')).toBe('John');
      expect(safeGet(obj, 'user.profile.address.city')).toBe('New York');
    });

    it('returns default value for non-existent property', () => {
      const obj = {
        user: {
          profile: {
            name: 'John'
          }
        }
      };

      expect(safeGet(obj, 'user.profile.age')).toBeUndefined();
      expect(safeGet(obj, 'user.profile.age', 30)).toBe(30);
    });

    it('handles null and undefined objects', () => {
      expect(safeGet(null, 'user.name')).toBeUndefined();
      expect(safeGet(undefined, 'user.name')).toBeUndefined();
      expect(safeGet(null, 'user.name', 'Unknown')).toBe('Unknown');
    });

    it('handles empty path', () => {
      const obj = { name: 'John' };
      expect(safeGet(obj, '')).toBeUndefined();
    });
  });

  describe('safeFormatDate', () => {
    it('formats date correctly', () => {
      const date = new Date(2023, 0, 15); // January 15, 2023
      const formatted = safeFormatDate(date);
      
      // The exact format depends on the locale, but should contain 2023 and Jan/January
      expect(formatted).toContain('2023');
      expect(formatted).toMatch(/Jan|January/);
      expect(formatted).toContain('15');
    });

    it('formats date string correctly', () => {
      const dateStr = '2023-01-15T12:00:00Z';
      const formatted = safeFormatDate(dateStr);
      
      expect(formatted).toContain('2023');
      expect(formatted).toMatch(/Jan|January/);
      expect(formatted).toContain('15');
    });

    it('formats date with custom options', () => {
      const date = new Date(2023, 0, 15);
      const formatted = safeFormatDate(date, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      expect(formatted).toContain('2023');
      expect(formatted).toContain('January');
      expect(formatted).toContain('15');
    });

    it('returns fallback for invalid date', () => {
      expect(safeFormatDate('invalid-date')).toBe('Unknown date');
      expect(safeFormatDate('invalid-date', {}, 'Invalid')).toBe('Invalid');
    });

    it('handles null and undefined', () => {
      expect(safeFormatDate(null)).toBe('Unknown date');
      expect(safeFormatDate(undefined)).toBe('Unknown date');
    });
  });

  describe('safeArrayAccess', () => {
    it('accesses array element safely', () => {
      const arr = ['a', 'b', 'c'];
      
      expect(safeArrayAccess(arr, 0)).toBe('a');
      expect(safeArrayAccess(arr, 1)).toBe('b');
      expect(safeArrayAccess(arr, 2)).toBe('c');
    });

    it('returns default value for out-of-bounds index', () => {
      const arr = ['a', 'b', 'c'];
      
      expect(safeArrayAccess(arr, 3)).toBeUndefined();
      expect(safeArrayAccess(arr, 3, 'default')).toBe('default');
      expect(safeArrayAccess(arr, -1)).toBeUndefined();
    });

    it('handles null and undefined arrays', () => {
      expect(safeArrayAccess(null, 0)).toBeUndefined();
      expect(safeArrayAccess(undefined, 0)).toBeUndefined();
      expect(safeArrayAccess(null, 0, 'default')).toBe('default');
    });
  });

  describe('safeCall', () => {
    it('calls function safely', () => {
      const fn = (a: number, b: number) => a + b;
      
      expect(safeCall(fn, [1, 2])).toBe(3);
    });

    it('returns default value when function throws', () => {
      const fn = () => { throw new Error('Test error'); };
      
      expect(safeCall(fn, [], 'default')).toBe('default');
    });

    it('handles non-function values', () => {
      expect(safeCall(null as any, [], 'default')).toBe('default');
      expect(safeCall(undefined as any, [], 'default')).toBe('default');
      expect(safeCall('not a function' as any, [], 'default')).toBe('default');
    });
  });

  describe('safeString', () => {
    it('converts value to string', () => {
      expect(safeString(123)).toBe('123');
      expect(safeString(true)).toBe('true');
      expect(safeString('test')).toBe('test');
    });

    it('handles null and undefined', () => {
      expect(safeString(null)).toBe('');
      expect(safeString(undefined)).toBe('');
      expect(safeString(null, 'N/A')).toBe('N/A');
    });

    it('handles objects', () => {
      const obj = { toString: () => 'custom string' };
      expect(safeString(obj)).toBe('custom string');
    });
  });

  describe('safeExecute', () => {
    it('executes callback safely', () => {
      const callback = jest.fn().mockReturnValue('result');
      
      expect(safeExecute(callback)).toBe('result');
      expect(callback).toHaveBeenCalled();
    });

    it('handles errors and calls error handler', () => {
      const callback = jest.fn().mockImplementation(() => {
        throw new Error('Test error');
      });
      
      const errorHandler = jest.fn();
      
      expect(safeExecute(callback, errorHandler)).toBeUndefined();
      expect(callback).toHaveBeenCalled();
      expect(errorHandler).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('makeSafe', () => {
    it('creates a safe version of a function', () => {
      const fn = (a: number, b: number) => {
        if (b === 0) throw new Error('Division by zero');
        return a / b;
      };
      
      const safeFn = makeSafe(fn, Infinity);
      
      expect(safeFn(10, 2)).toBe(5);
      expect(safeFn(10, 0)).toBe(Infinity);
    });
  });
});
