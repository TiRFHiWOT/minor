// Mobile-safe storage utility
class SafeStorage {
  private fallbackData: { [key: string]: string } = {};
  private isStorageAvailable = false;

  constructor() {
    // Test if localStorage is available and accessible
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      this.isStorageAvailable = true;
      console.log('✅ localStorage is available');
    } catch (error) {
      console.warn('⚠️ localStorage not available, using fallback storage:', error.message);
      this.isStorageAvailable = false;
    }
  }

  getItem(key: string): string | null {
    try {
      if (this.isStorageAvailable) {
        return localStorage.getItem(key);
      } else {
        return this.fallbackData[key] || null;
      }
    } catch (error) {
      console.warn(`Storage getItem failed for key "${key}":`, error.message);
      return this.fallbackData[key] || null;
    }
  }

  setItem(key: string, value: string): void {
    try {
      if (this.isStorageAvailable) {
        localStorage.setItem(key, value);
      } else {
        this.fallbackData[key] = value;
      }
    } catch (error) {
      console.warn(`Storage setItem failed for key "${key}":`, error.message);
      this.fallbackData[key] = value;
    }
  }

  removeItem(key: string): void {
    try {
      if (this.isStorageAvailable) {
        localStorage.removeItem(key);
      } else {
        delete this.fallbackData[key];
      }
    } catch (error) {
      console.warn(`Storage removeItem failed for key "${key}":`, error.message);
      delete this.fallbackData[key];
    }
  }

  clear(): void {
    try {
      if (this.isStorageAvailable) {
        localStorage.clear();
      } else {
        this.fallbackData = {};
      }
    } catch (error) {
      console.warn('Storage clear failed:', error.message);
      this.fallbackData = {};
    }
  }
}

export const safeStorage = new SafeStorage();