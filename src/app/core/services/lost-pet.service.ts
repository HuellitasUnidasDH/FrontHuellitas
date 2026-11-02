import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  LostPetReport,
  LostPetType,
  LostPetStatus,
  CreateLostPetPayload,
  PetSighting,
  CreateSightingPayload,
} from '../models/lost-pet.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root',
})
export class LostPetService {
  private http = inject(HttpClient);
  private readonly URL = `${environment.apiUrl}/lost-pets`;

  getAll(filters?: {
    type?: LostPetType;
    status?: LostPetStatus;
    coloniaId?: string;
    species?: string;
    search?: string;
  }): Observable<LostPetReport[]> {
    let params = new HttpParams();
    if (filters?.type) params = params.set('type', filters.type);
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.coloniaId) params = params.set('coloniaId', filters.coloniaId);
    if (filters?.species) params = params.set('species', filters.species);
    if (filters?.search) params = params.set('search', filters.search);

    return this.http.get<ApiResponse<LostPetReport[]>>(this.URL, { params }).pipe(map((r) => r.data));
  }

  getById(id: string): Observable<LostPetReport> {
    return this.http.get<ApiResponse<LostPetReport>>(`${this.URL}/${id}`).pipe(map((r) => r.data));
  }

  create(payload: CreateLostPetPayload): Observable<LostPetReport> {
    return this.http.post<ApiResponse<LostPetReport>>(this.URL, payload).pipe(map((r) => r.data));
  }

  update(id: string, payload: Partial<CreateLostPetPayload>): Observable<LostPetReport> {
    return this.http
      .patch<ApiResponse<LostPetReport>>(`${this.URL}/${id}`, payload)
      .pipe(map((r) => r.data));
  }

  updateStatus(id: string, status: LostPetStatus): Observable<LostPetReport> {
    return this.http
      .patch<ApiResponse<LostPetReport>>(`${this.URL}/${id}/status`, { status })
      .pipe(map((r) => r.data));
  }

  addSighting(id: string, payload: CreateSightingPayload): Observable<PetSighting> {
    return this.http
      .post<ApiResponse<PetSighting>>(`${this.URL}/${id}/sightings`, payload)
      .pipe(map((r) => r.data));
  }

  addComment(id: string, content: string): Observable<any> {
    return this.http
      .post<ApiResponse<any>>(`${this.URL}/${id}/comments`, { content })
      .pipe(map((r) => r.data));
  }

  delete(id: string): Observable<{ message: string }> {
    return this.http
      .delete<ApiResponse<{ message: string }>>(`${this.URL}/${id}`)
      .pipe(map((r) => r.data));
  }
}
