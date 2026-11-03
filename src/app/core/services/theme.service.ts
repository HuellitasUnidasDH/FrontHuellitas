import { Injectable, signal, effect } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly THEME_KEY = 'vet_reg_theme';

  // Signals for reactive theme state
  public isDarkMode = signal<boolean>(this.getInitialTheme() === 'dark');

  constructor() {
    // Synchronize document <html> class whenever isDarkMode changes
    effect(() => {
      const isDark = this.isDarkMode();
      if (typeof document !== 'undefined') {
        const root = document.documentElement;
        if (isDark) {
          root.classList.add('dark');
          if (typeof localStorage !== 'undefined' && typeof localStorage?.setItem === 'function') {
            localStorage.setItem(this.THEME_KEY, 'dark');
          }
        } else {
          root.classList.remove('dark');
          if (typeof localStorage !== 'undefined' && typeof localStorage?.setItem === 'function') {
            localStorage.setItem(this.THEME_KEY, 'light');
          }
        }
      }
    });
  }

  toggleTheme(): void {
    this.isDarkMode.update((dark) => !dark);
  }

  setTheme(mode: ThemeMode): void {
    this.isDarkMode.set(mode === 'dark');
  }

  private getInitialTheme(): ThemeMode {
    if (typeof window === 'undefined') return 'dark';

    try {
      if (typeof localStorage !== 'undefined' && typeof localStorage?.getItem === 'function') {
        const saved = localStorage.getItem(this.THEME_KEY) as ThemeMode | null;
        if (saved === 'light' || saved === 'dark') {
          return saved;
        }
      }
    } catch {
      // Fallback if localStorage is unavailable
    }

    // Default to system preference, fallback to dark for premium aesthetic
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'dark';
    }

    return 'dark';
  }
}
