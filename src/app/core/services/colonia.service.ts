import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, map, tap, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Colonia } from '../models/colonia.model';
import { ApiResponse } from '../models/api-response.model';

const COLONIAS_CACHE_KEY = 'huellitas_colonias_dh_cache_v4';

@Injectable({
  providedIn: 'root',
})
export class ColoniaService {
  private http = inject(HttpClient);
  private readonly URL = `${environment.apiUrl}/colonias`;
  private cachedAll$?: Observable<Colonia[]>;
  private memoryCache: Colonia[] | null = null;

  /**
   * Obtiene el catálogo de colonias de Dolores Hidalgo / Guanajuato consumiendo la red UNA SOLA VEZ.
   * Guarda el resultado en memoria y en localStorage para no gastar Wi-Fi ni datos móviles en recargas.
   */
  getAll(search?: string): Observable<Colonia[]> {
    // 1. Si ya está en memoria y tiene el catálogo completo (más de 100 colonias), filtrar localmente
    if (this.memoryCache && this.memoryCache.length >= 100) {
      return of(this.filterLocally(this.memoryCache, search));
    }

    // 2. Intentar recuperar del caché persistente del dispositivo (localStorage con catálogo amplio >= 100)
    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(COLONIAS_CACHE_KEY);
        if (raw) {
          const parsed: Colonia[] = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length >= 100) {
            this.memoryCache = parsed;
            return of(this.filterLocally(parsed, search));
          }
        }
      } catch {
        // Ignorar errores de lectura de storage
      }
    }

    // 3. Consumir el endpoint una única vez y compartir la respuesta entre suscriptores
    if (!this.cachedAll$) {
      this.cachedAll$ = this.http.get<ApiResponse<Colonia[]>>(this.URL).pipe(
        map((r) => r.data || []),
        tap((list) => {
          if (list.length > 0) {
            this.memoryCache = list;
            if (typeof localStorage !== 'undefined') {
              try {
                localStorage.setItem(COLONIAS_CACHE_KEY, JSON.stringify(list));
              } catch {
                // Ignorar si quota excedida
              }
            }
          }
        }),
        shareReplay(1),
      );
    }

    return this.cachedAll$.pipe(map((list) => this.filterLocally(list, search)));
  }

  /**
   * Permite buscar o sincronizar colonias por Código Postal de Dolores Hidalgo / Guanajuato (37800 - 37899).
   */
  getByPostalCode(postalCode: string): Observable<Colonia[]> {
    const cleanCp = (postalCode || '').trim();
    if (!cleanCp) {
      return this.getAll();
    }

    if (this.memoryCache) {
      const matches = this.memoryCache.filter((c) => (c.postalCode || '').startsWith(cleanCp));
      if (matches.length > 0) {
        return of(matches);
      }
    }

    let params = new HttpParams().set('cp', cleanCp);
    return this.http.get<ApiResponse<Colonia[]>>(this.URL, { params }).pipe(
      map((r) => r.data || []),
      tap((newMatches) => {
        if (newMatches.length > 0 && this.memoryCache) {
          const existingIds = new Set(this.memoryCache.map((c) => c.id));
          const merged = [...this.memoryCache];
          for (const item of newMatches) {
            if (!existingIds.has(item.id)) {
              merged.push(item);
            }
          }
          merged.sort((a, b) => a.name.localeCompare(b.name));
          this.memoryCache = merged;
          if (typeof localStorage !== 'undefined') {
            try {
              localStorage.setItem(COLONIAS_CACHE_KEY, JSON.stringify(merged));
            } catch {}
          }
        }
      }),
    );
  }

  private filterLocally(list: Colonia[], search?: string): Colonia[] {
    if (!search || !search.trim()) {
      return list;
    }
    const q = search
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
    return list.filter((c) => {
      const normName = c.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      return normName.includes(q) || (c.postalCode && c.postalCode.includes(q));
    });
  }
}
