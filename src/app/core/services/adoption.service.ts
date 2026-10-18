import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AdopterVerification,
  AdoptionRequest,
  AdoptionRequestStatus,
  AdoptionFollowup,
} from '../models/adoption.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root',
})
export class AdoptionService {
  private http = inject(HttpClient);
  private readonly URL = `${environment.apiUrl}/adoptions`;

  // 1. Verificación por Niveles
  getMyVerification(): Observable<AdopterVerification | null> {
    return this.http
      .get<ApiResponse<AdopterVerification | null>>(`${this.URL}/my-verification`)
      .pipe(map((r) => r.data));
  }

  submitLevel2(payload: Partial<AdopterVerification>): Observable<AdopterVerification> {
    return this.http
      .post<ApiResponse<AdopterVerification>>(`${this.URL}/verification/level-2`, payload)
      .pipe(map((r) => r.data));
  }

  submitLevel3(payload: Partial<AdopterVerification>): Observable<AdopterVerification> {
    return this.http
      .post<ApiResponse<AdopterVerification>>(`${this.URL}/verification/level-3`, payload)
      .pipe(map((r) => r.data));
  }

  // 2. Solicitudes de Adopción
  createRequest(petId: string, message?: string): Observable<AdoptionRequest> {
    return this.http
      .post<ApiResponse<AdoptionRequest>>(`${this.URL}/pets/${petId}/request`, { message })
      .pipe(map((r) => r.data));
  }

  getPublisherInbox(): Observable<AdoptionRequest[]> {
    return this.http
      .get<ApiResponse<AdoptionRequest[]>>(`${this.URL}/requests/inbox`)
      .pipe(map((r) => r.data));
  }

  getMyApplications(): Observable<AdoptionRequest[]> {
    return this.http
      .get<ApiResponse<AdoptionRequest[]>>(`${this.URL}/requests/my-applications`)
      .pipe(map((r) => r.data));
  }

  updateRequestStatus(
    requestId: string,
    status: AdoptionRequestStatus,
    publisherNotes?: string,
  ): Observable<AdoptionRequest> {
    return this.http
      .patch<ApiResponse<AdoptionRequest>>(`${this.URL}/requests/${requestId}/status`, {
        status,
        publisherNotes,
      })
      .pipe(map((r) => r.data));
  }

  // 3. Seguimientos post-adopción (7, 30 y 90 días)
  getFollowups(): Observable<AdoptionFollowup[]> {
    return this.http
      .get<ApiResponse<AdoptionFollowup[]>>(`${this.URL}/followups`)
      .pipe(map((r) => r.data));
  }

  registerFollowupProof(
    followupId: string,
    proofPhotoUrl: string,
    proofNotes?: string,
  ): Observable<AdoptionFollowup> {
    return this.http
      .patch<ApiResponse<AdoptionFollowup>>(`${this.URL}/followups/${followupId}/proof`, {
        proofPhotoUrl,
        proofNotes,
      })
      .pipe(map((r) => r.data));
  }
}
