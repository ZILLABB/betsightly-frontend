import {
  Cache,
  CacheStorageType,
  CACHE_TTL,
  localStorageCache,
  sessionStorageCache,
  memoryCache
} from '../cacheUtils';

describe('cacheUtils', () => {
  // Mock localStorage and sessionStorage
  const mockStorage = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: jest.fn((key: string) => store[key] || null),
      setItem: jest.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: jest.fn((key: string) => {
        delete store[key];
      }),
      clear: jest.fn(() => {
        store = {};
      }),
      key: jest.fn((index: number) => Object.keys(store)[index] || null),
      length: 0
    };
  })();

  // Save original storage
  const originalLocalStorage = window.localStorage;
  const originalSessionStorage = window.sessionStorage;

  beforeEach(() => {
    // Reset mock storage
    mockStorage.clear();
    
    // Mock storage objects
    Object.defineProperty(window, 'localStorage', {
      value: mockStorage
    });
    
    Object.defineProperty(window, 'sessionStorage', {
      value: mockStorage
    });
    
    // Reset mock function calls
    jest.clearAllMocks();
  });

  afterAll(() => {
    // Restore original storage
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage
    });
    
    Object.defineProperty(window, 'sessionStorage', {
      value: originalSessionStorage
    });
  });

  describe('Cache class', () => {
    it('initializes with correct storage type', () => {
      const localCache = new Cache(CacheStorageType.LOCAL_STORAGE);
      const sessionCache = new Cache(CacheStorageType.SESSION_STORAGE);
      const memCache = new Cache(CacheStorageType.MEMORY);
      
      expect(localCache).toBeInstanceOf(Cache);
      expect(sessionCache).toBeInstanceOf(Cache);
      expect(memCache).toBeInstanceOf(Cache);
    });

    it('falls back to memory cache when storage is not available', () => {
      // Mock storage unavailability
      const mockUnavailableStorage = {
        getItem: jest.fn(() => {
          throw new Error('Storage not available');
        }),
        setItem: jest.fn(() => {
          throw new Error('Storage not available');
        })
      };
      
      Object.defineProperty(window, 'localStorage', {
        value: mockUnavailableStorage
      });
      
      // Create cache with unavailable storage
      const cache = new Cache(CacheStorageType.LOCAL_STORAGE);
      
      // Should fall back to memory cache
      cache.set('test', 'value');
      expect(cache.get('test')).toBe('value');
    });

    it('sets and gets items from storage', () => {
      const cache = new Cache(CacheStorageType.LOCAL_STORAGE);
      
      cache.set('test', 'value');
      expect(cache.get('test')).toBe('value');
      
      // Check that localStorage was used
      expect(mockStorage.setItem).toHaveBeenCalled();
      expect(mockStorage.getItem).toHaveBeenCalled();
    });

    it('sets and gets items from memory', () => {
      const cache = new Cache(CacheStorageType.MEMORY);
      
      cache.set('test', 'value');
      expect(cache.get('test')).toBe('value');
      
      // Check that localStorage was not used
      expect(mockStorage.setItem).not.toHaveBeenCalled();
      expect(mockStorage.getItem).not.toHaveBeenCalled();
    });

    it('respects TTL for cached items', () => {
      jest.useFakeTimers();
      
      const cache = new Cache(CacheStorageType.MEMORY);
      
      // Set item with 1 second TTL
      cache.set('test', 'value', 1);
      
      // Item should be available immediately
      expect(cache.get('test')).toBe('value');
      
      // Advance time by 2 seconds
      jest.advanceTimersByTime(2000);
      
      // Item should be expired
      expect(cache.get('test')).toBeNull();
      
      jest.useRealTimers();
    });

    it('removes items from cache', () => {
      const cache = new Cache(CacheStorageType.LOCAL_STORAGE);
      
      cache.set('test', 'value');
      expect(cache.get('test')).toBe('value');
      
      cache.remove('test');
      expect(cache.get('test')).toBeNull();
      
      // Check that localStorage.removeItem was called
      expect(mockStorage.removeItem).toHaveBeenCalled();
    });

    it('clears all cached items', () => {
      const cache = new Cache(CacheStorageType.LOCAL_STORAGE);
      
      cache.set('test1', 'value1');
      cache.set('test2', 'value2');
      
      cache.clear();
      
      expect(cache.get('test1')).toBeNull();
      expect(cache.get('test2')).toBeNull();
    });

    it('clears expired items', () => {
      jest.useFakeTimers();
      
      const cache = new Cache(CacheStorageType.MEMORY);
      
      // Set items with different TTLs
      cache.set('test1', 'value1', 1); // 1 second TTL
      cache.set('test2', 'value2', 10); // 10 seconds TTL
      
      // Advance time by 5 seconds
      jest.advanceTimersByTime(5000);
      
      // Clear expired items
      cache.clearExpired();
      
      // test1 should be expired, test2 should still be available
      expect(cache.get('test1')).toBeNull();
      expect(cache.get('test2')).toBe('value2');
      
      jest.useRealTimers();
    });

    it('invalidates items by tag', () => {
      const cache = new Cache(CacheStorageType.MEMORY);
      
      // Set items with tags
      cache.set('test1', 'value1', CACHE_TTL.MEDIUM, ['tag1', 'tag2']);
      cache.set('test2', 'value2', CACHE_TTL.MEDIUM, ['tag2', 'tag3']);
      cache.set('test3', 'value3', CACHE_TTL.MEDIUM, ['tag3']);
      
      // Invalidate by tag
      cache.invalidateByTag('tag2');
      
      // Items with tag2 should be invalidated
      expect(cache.get('test1')).toBeNull();
      expect(cache.get('test2')).toBeNull();
      expect(cache.get('test3')).toBe('value3');
    });

    it('gets all cache keys', () => {
      const cache = new Cache(CacheStorageType.MEMORY);
      
      cache.set('test1', 'value1');
      cache.set('test2', 'value2');
      
      const keys = cache.getKeys();
      
      expect(keys).toContain('test1');
      expect(keys).toContain('test2');
      expect(keys.length).toBe(2);
    });

    it('checks if a key exists in the cache', () => {
      const cache = new Cache(CacheStorageType.MEMORY);
      
      cache.set('test', 'value');
      
      expect(cache.has('test')).toBe(true);
      expect(cache.has('nonexistent')).toBe(false);
    });
  });

  describe('Singleton instances', () => {
    it('exports singleton instances for different storage types', () => {
      expect(localStorageCache).toBeInstanceOf(Cache);
      expect(sessionStorageCache).toBeInstanceOf(Cache);
      expect(memoryCache).toBeInstanceOf(Cache);
    });
  });

  describe('CACHE_TTL constants', () => {
    it('exports TTL constants', () => {
      expect(CACHE_TTL.SHORT).toBe(60); // 1 minute
      expect(CACHE_TTL.MEDIUM).toBe(300); // 5 minutes
      expect(CACHE_TTL.LONG).toBe(3600); // 1 hour
      expect(CACHE_TTL.VERY_LONG).toBe(86400); // 24 hours
    });
  });
});
