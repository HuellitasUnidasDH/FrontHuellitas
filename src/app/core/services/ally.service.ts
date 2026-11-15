import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Ally, AllyCategory } from '../models/ally.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root',
})
export class AllyService {
  private http = inject(HttpClient);
  private readonly URL = `${environment.apiUrl}/allies`;

  getAll(filters?: {
    category?: AllyCategory;
    coloniaId?: string;
    search?: string;
  }): Observable<Ally[]> {
    let params = new HttpParams();
    if (filters?.category) params = params.set('category', filters.category);
    if (filters?.coloniaId) params = params.set('coloniaId', filters.coloniaId);
    if (filters?.search) params = params.set('search', filters.search);

    return this.http.get<ApiResponse<Ally[]>>(this.URL, { params }).pipe(map((r) => r.data));
  }

  getById(id: string): Observable<Ally> {
    return this.http.get<ApiResponse<Ally>>(`${this.URL}/${id}`).pipe(map((r) => r.data));
  }

  getAllAdmin(): Observable<Ally[]> {
    return this.http.get<ApiResponse<Ally[]>>(`${this.URL}/admin/all`).pipe(map((r) => r.data));
  }

  create(payload: Partial<Ally>): Observable<Ally> {
    return this.http.post<ApiResponse<Ally>>(this.URL, payload).pipe(map((r) => r.data));
  }

  update(id: string, payload: Partial<Ally>): Observable<Ally> {
    return this.http.patch<ApiResponse<Ally>>(`${this.URL}/${id}`, payload).pipe(map((r) => r.data));
  }
}
