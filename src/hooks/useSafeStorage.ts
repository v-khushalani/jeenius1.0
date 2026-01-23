import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/utils/logger';

type StorageType = 'localStorage' | 'sessionStorage';

/**
 * Safe storage hook that handles errors gracefully
 * Works in incognito mode and when storage is unavailable
 */
export function useSafeStorage<T>(
  key: string,
  initialValue: T,
  storageType: StorageType = 'localStorage'
) {
  const storage = storageType === 'localStorage' ? localStorage : sessionStorage;

  // Get initial value from storage or use provided initial value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = storage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      logger.warn(`Error reading ${key} from ${storageType}:`, error);
      return initialValue;
    }
  });

  // Save to storage
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      storage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      logger.error(`Error saving ${key} to ${storageType}:`, error);
    }
  }, [key, storedValue, storage, storageType]);

  // Remove from storage
  const removeValue = useCallback(() => {
    try {
      storage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      logger.error(`Error removing ${key} from ${storageType}:`, error);
    }
  }, [key, initialValue, storage, storageType]);

  return [storedValue, setValue, removeValue] as const;
}

/**
 * Simple safe storage utilities
 */
export const safeStorage = {
  getItem: (key: string, storageType: StorageType = 'localStorage'): string | null => {
    try {
      const storage = storageType === 'localStorage' ? localStorage : sessionStorage;
      return storage.getItem(key);
    } catch (error) {
      logger.warn(`Error reading ${key}:`, error);
      return null;
    }
  },

  setItem: (key: string, value: string, storageType: StorageType = 'localStorage'): void => {
    try {
      const storage = storageType === 'localStorage' ? localStorage : sessionStorage;
      storage.setItem(key, value);
    } catch (error) {
      logger.error(`Error saving ${key}:`, error);
    }
  },

  removeItem: (key: string, storageType: StorageType = 'localStorage'): void => {
    try {
      const storage = storageType === 'localStorage' ? localStorage : sessionStorage;
      storage.removeItem(key);
    } catch (error) {
      logger.error(`Error removing ${key}:`, error);
    }
  },

  clear: (storageType: StorageType = 'localStorage'): void => {
    try {
      const storage = storageType === 'localStorage' ? localStorage : sessionStorage;
      storage.clear();
    } catch (error) {
      logger.error('Error clearing storage:', error);
    }
  }
};
