import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private readonly PREFIX = 'vet_reg_';

  /**
   * Define si la sesión actual debe persistir al cerrar el navegador (localStorage)
   * o destruirse automáticamente al cerrar la pestaña/aplicación (sessionStorage).
   */
  setPersistenceMode(rememberMe: boolean): void {
    try {
      if (typeof window !== 'undefined') {
        if (rememberMe) {
          localStorage.setItem(this.PREFIX + 'remember_me', 'true');
          sessionStorage.removeItem(this.PREFIX + 'remember_me');
        } else {
          sessionStorage.setItem(this.PREFIX + 'remember_me', 'false');
          localStorage.removeItem(this.PREFIX + 'remember_me');
        }
      }
    } catch (e) {
      console.error('Error setting persistence mode', e);
    }
  }

  isRememberMeEnabled(): boolean {
    try {
      if (typeof window !== 'undefined') {
        if (localStorage.getItem(this.PREFIX + 'remember_me') === 'true') {
          return true;
        }
        if (sessionStorage.getItem(this.PREFIX + 'remember_me') === 'false') {
          return false;
        }
        // Compatibilidad si ya había un token previo en localStorage
        return Boolean(localStorage.getItem(this.PREFIX + 'token'));
      }
    } catch {
      return false;
    }
    return false;
  }

  setItem(key: string, value: string, forcePersistent?: boolean): void {
    try {
      if (typeof window === 'undefined') return;
      const fullKey = this.PREFIX + key;
      const useLocal = forcePersistent !== undefined ? forcePersistent : this.isRememberMeEnabled();

      if (useLocal) {
        localStorage.setItem(fullKey, value);
        sessionStorage.removeItem(fullKey);
      } else {
        sessionStorage.setItem(fullKey, value);
        localStorage.removeItem(fullKey);
      }
    } catch (e) {
      console.error('Error saving to storage', e);
    }
  }

  getItem(key: string): string | null {
    try {
      if (typeof window !== 'undefined') {
        const fullKey = this.PREFIX + key;
        return sessionStorage.getItem(fullKey) ?? localStorage.getItem(fullKey);
      }
    } catch (e) {
      console.error('Error reading from storage', e);
    }
    return null;
  }

  removeItem(key: string): void {
    try {
      if (typeof window !== 'undefined') {
        const fullKey = this.PREFIX + key;
        localStorage.removeItem(fullKey);
        sessionStorage.removeItem(fullKey);
      }
    } catch (e) {
      console.error('Error removing from storage', e);
    }
  }

  clear(): void {
    try {
      if (typeof window !== 'undefined') {
        const keys = ['token', 'refresh_token', 'user', 'remember_me'];
        for (const k of keys) {
          localStorage.removeItem(this.PREFIX + k);
          sessionStorage.removeItem(this.PREFIX + k);
        }
      }
    } catch (e) {
      console.error('Error clearing storage', e);
    }
  }
}
