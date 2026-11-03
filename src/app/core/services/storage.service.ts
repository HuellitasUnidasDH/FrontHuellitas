import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private readonly PREFIX = 'vet_reg_';

  setItem(key: string, value: string): void {
    try {
      if (typeof window !== 'undefined' && typeof localStorage?.setItem === 'function') {
        localStorage.setItem(this.PREFIX + key, value);
      }
    } catch (e) {
      console.error('Error saving to storage', e);
    }
  }

  getItem(key: string): string | null {
    try {
      if (typeof window !== 'undefined' && typeof localStorage?.getItem === 'function') {
        return localStorage.getItem(this.PREFIX + key);
      }
    } catch (e) {
      console.error('Error reading from storage', e);
    }
    return null;
  }

  removeItem(key: string): void {
    try {
      if (typeof window !== 'undefined' && typeof localStorage?.removeItem === 'function') {
        localStorage.removeItem(this.PREFIX + key);
      }
    } catch (e) {
      console.error('Error removing from storage', e);
    }
  }

  clear(): void {
    try {
      if (typeof window !== 'undefined' && typeof localStorage?.removeItem === 'function') {
        localStorage.removeItem(this.PREFIX + 'token');
        localStorage.removeItem(this.PREFIX + 'refresh_token');
        localStorage.removeItem(this.PREFIX + 'user');
      }
    } catch (e) {
      console.error('Error clearing storage', e);
    }
  }
}
