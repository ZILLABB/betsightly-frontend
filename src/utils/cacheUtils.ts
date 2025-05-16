/**
 * Cache Utilities
 *
 * This module provides utilities for caching data with expiration,
 * memory caching, and automatic cache invalidation.
 */

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  SHORT: 60,          // 1 minute
  MEDIUM: 300,        // 5 minutes
  LONG: 3600,         // 1 hour
  VERY_LONG: 86400    // 24 hours
};

// Cache storage types
export enum CacheStorageType {
  LOCAL_STORAGE = 'localStorage',
  SESSION_STORAGE = 'sessionStorage',
  MEMORY = 'memory'
}

// Cache item interface
interface CacheItem<T> {
  data: T;
  expiry: number;
  tags?: string[];
}

class Cache {
  private storage: Storage | null;
  private prefix: string;
  private memoryCache: Map<string, CacheItem<any>>;
  private storageType: CacheStorageType;

  constructor(
    storageType: CacheStorageType = CacheStorageType.LOCAL_STORAGE,
    prefix: string = 'betsightly_cache_'
  ) {
    this.prefix = prefix;
    this.memoryCache = new Map();
    this.storageType = storageType;

    // Initialize storage based on type
    if (storageType === CacheStorageType.LOCAL_STORAGE) {
      this.storage = this.isStorageAvailable('localStorage') ? localStorage : null;
    } else if (storageType === CacheStorageType.SESSION_STORAGE) {
      this.storage = this.isStorageAvailable('sessionStorage') ? sessionStorage : null;
    } else {
      this.storage = null;
    }

    // If storage is not available, fall back to memory cache
    if (this.storage === null && storageType !== CacheStorageType.MEMORY) {
      console.warn(`${storageType} not available, falling back to memory cache`);
      this.storageType = CacheStorageType.MEMORY;
    }
  }

  /**
   * Check if a storage type is available
   * @param type Storage type to check
   * @returns Whether the storage is available
   */
  private isStorageAvailable(type: 'localStorage' | 'sessionStorage'): boolean {
    try {
      const storage = window[type];
      const testKey = '__storage_test__';
      storage.setItem(testKey, testKey);
      storage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Set an item in the cache with optional expiration
   * @param key Cache key
   * @param data Data to cache
   * @param ttl Time to live in seconds (default: 1 hour)
   * @param tags Optional tags for cache invalidation
   */
  set<T>(key: string, data: T, ttl: number = CACHE_TTL.LONG, tags?: string[]): void {
    // Log cache operation
    console.log(`[CACHE] SET: ${key} (TTL: ${ttl}s)`, {
      storageType: this.storageType,
      dataSize: JSON.stringify(data).length,
      ttl,
      tags
    });

    // Re-enabled caching
    // Original implementation
    const cacheKey = this.prefix + key;
    const expiry = Date.now() + (ttl * 1000);
    const cacheItem: CacheItem<T> = { data, expiry, tags };

    // For memory cache
    if (this.storageType === CacheStorageType.MEMORY) {
      this.memoryCache.set(cacheKey, cacheItem);
      return;
    }

    // For storage-based cache
    if (this.storage) {
      try {
        this.storage.setItem(cacheKey, JSON.stringify(cacheItem));
      } catch (error) {
        console.warn('Cache set failed:', error);
        // If storage is full, clear expired items and try again
        this.clearExpired();
        try {
          this.storage.setItem(cacheKey, JSON.stringify(cacheItem));
        } catch (retryError) {
          console.error('Cache set failed after clearing expired items:', retryError);
          // Fall back to memory cache
          this.memoryCache.set(cacheKey, cacheItem);
        }
      }
    }

  }

  /**
   * Get an item from the cache
   * @param key Cache key
   * @returns Cached data or null if not found or expired
   */
  get<T>(key: string): T | null {
    // Log cache operation
    console.log(`[CACHE] GET: ${key}`, {
      storageType: this.storageType
    });

    // Re-enabled caching
    // Original implementation
    const cacheKey = this.prefix + key;

    // Check memory cache first
    if (this.memoryCache.has(cacheKey)) {
      const cacheItem = this.memoryCache.get(cacheKey) as CacheItem<T>;

      // Check if item is expired
      if (Date.now() > cacheItem.expiry) {
        this.memoryCache.delete(cacheKey);
        return null;
      }

      return cacheItem.data;
    }

    // If not in memory and not using storage, return null
    if (this.storageType === CacheStorageType.MEMORY || !this.storage) {
      return null;
    }

    // Check storage
    const item = this.storage.getItem(cacheKey);

    if (!item) return null;

    try {
      const cacheItem = JSON.parse(item) as CacheItem<T>;

      // Check if item is expired
      if (Date.now() > cacheItem.expiry) {
        this.remove(key);
        return null;
      }

      // Store in memory cache for faster access next time
      this.memoryCache.set(cacheKey, cacheItem);

      return cacheItem.data;
    } catch (error) {
      console.error('Cache get failed:', error);
      this.remove(key);
      return null;
    }

  }

  /**
   * Remove an item from the cache
   * @param key Cache key
   */
  remove(key: string): void {
    const cacheKey = this.prefix + key;

    // Remove from memory cache
    this.memoryCache.delete(cacheKey);

    // Remove from storage if available
    if (this.storage) {
      this.storage.removeItem(cacheKey);
    }
  }

  /**
   * Clear all cached items
   */
  clear(): void {
    // Clear memory cache
    this.memoryCache.clear();

    // Clear storage if available
    if (this.storage) {
      const keysToRemove: string[] = [];

      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key && key.startsWith(this.prefix)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => this.storage!.removeItem(key));
    }
  }

  /**
   * Clear expired cached items
   */
  clearExpired(): void {
    const now = Date.now();

    // Clear expired items from memory cache
    for (const [key, item] of this.memoryCache.entries()) {
      if (now > item.expiry) {
        this.memoryCache.delete(key);
      }
    }

    // Clear expired items from storage if available
    if (this.storage) {
      const keysToRemove: string[] = [];

      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key && key.startsWith(this.prefix)) {
          const item = this.storage.getItem(key);
          if (item) {
            try {
              const cacheItem = JSON.parse(item) as CacheItem<unknown>;
              if (now > cacheItem.expiry) {
                keysToRemove.push(key);
              }
            } catch {
              // If we can't parse the item, it's invalid, so remove it
              keysToRemove.push(key);
            }
          }
        }
      }

      keysToRemove.forEach(key => this.storage!.removeItem(key));
    }
  }

  /**
   * Invalidate cache items by tag
   * @param tag Tag to invalidate
   */
  invalidateByTag(tag: string): void {
    // Invalidate from memory cache
    for (const [key, item] of this.memoryCache.entries()) {
      if (item.tags && item.tags.includes(tag)) {
        this.memoryCache.delete(key);
      }
    }

    // Invalidate from storage if available
    if (this.storage) {
      const keysToRemove: string[] = [];

      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key && key.startsWith(this.prefix)) {
          const item = this.storage.getItem(key);
          if (item) {
            try {
              const cacheItem = JSON.parse(item) as CacheItem<unknown>;
              if (cacheItem.tags && cacheItem.tags.includes(tag)) {
                keysToRemove.push(key);
              }
            } catch {
              // Ignore parsing errors
            }
          }
        }
      }

      keysToRemove.forEach(key => this.storage!.removeItem(key));
    }
  }

  /**
   * Get all cache keys
   * @returns Array of cache keys
   */
  getKeys(): string[] {
    const keys: string[] = [];

    // Get keys from memory cache
    for (const key of this.memoryCache.keys()) {
      keys.push(key.substring(this.prefix.length));
    }

    // Get keys from storage if available
    if (this.storage) {
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key && key.startsWith(this.prefix)) {
          const normalizedKey = key.substring(this.prefix.length);
          if (!keys.includes(normalizedKey)) {
            keys.push(normalizedKey);
          }
        }
      }
    }

    return keys;
  }

  /**
   * Check if a key exists in the cache and is not expired
   * @param key Cache key
   * @returns Whether the key exists
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }
}

// Create singleton instances for different storage types
const localStorageCache = new Cache(CacheStorageType.LOCAL_STORAGE);
const sessionStorageCache = new Cache(CacheStorageType.SESSION_STORAGE);
const memoryCache = new Cache(CacheStorageType.MEMORY);

// Default cache is localStorage
const defaultCache = localStorageCache;

export {
  localStorageCache,
  sessionStorageCache,
  memoryCache,
  Cache
};

export default defaultCache;


