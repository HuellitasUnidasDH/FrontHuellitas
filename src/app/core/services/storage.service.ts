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
        if (sessionStorage.getItem(this.PREFIX + 'remember_me') === 'false') {
          return false;
        }
        if (localStorage.getItem(this.PREFIX + 'remember_me') === 'true') {
          return true;
        }
        // Compatibilidad si ya había un token o refresh_token previo en localStorage
        if (
          localStorage.getItem(this.PREFIX + 'token') ||
          localStorage.getItem(this.PREFIX + 'refresh_token')
        ) {
          localStorage.setItem(this.PREFIX + 'remember_me', 'true');
          return true;
        }
      }
    } catch {
      return false;
    }
    return true;
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
        return this.isRememberMeEnabled()
          ? (localStorage.getItem(fullKey) ?? sessionStorage.getItem(fullKey))
          : (sessionStorage.getItem(fullKey) ?? localStorage.getItem(fullKey));
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
