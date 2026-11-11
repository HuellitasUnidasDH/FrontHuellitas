import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AdopterVerification,
  AdoptionRequest,
  AdoptionRequestDetailResponse,
  AdoptionRequestStatus,
  AdoptionFollowup,
  AdvanceAdoptionStagePayload,
  CreateAdoptionRequestPayload,
  FollowupStatus,
  PublishedPetProgress,
  SignAdoptionAgreementPayload,
} from '../models/adoption.model';
import { Pet } from '../models/pet.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root',
})
export class AdoptionService {
  private http = inject(HttpClient);
  private readonly URL = `${environment.apiUrl}/adoptions`;

  // 1. Verificación por Niveles (Usuario solicita, Rescatista/Admin aprueba)
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

  getVerificationsForReview(): Observable<AdopterVerification[]> {
    return this.http
      .get<ApiResponse<AdopterVerification[]>>(`${this.URL}/verifications/review-list`)
      .pipe(map((r) => r.data || []));
  }

  reviewVerification(
    verificationId: string,
    payload: { level: 2 | 3; approved: boolean; notes?: string },
  ): Observable<AdopterVerification> {
    return this.http
      .patch<ApiResponse<AdopterVerification>>(
        `${this.URL}/verifications/${verificationId}/review`,
        payload,
      )
      .pipe(map((r) => r.data));
  }

  // 2. Solicitudes de Adopción (Protocolo 4 Pasos - Opción 2 Estricta)
  createRequest(
    petId: string,
    payloadOrMessage?: string | CreateAdoptionRequestPayload,
  ): Observable<AdoptionRequest> {
    const body: CreateAdoptionRequestPayload =
      typeof payloadOrMessage === 'string'
        ? { message: payloadOrMessage }
        : payloadOrMessage || {};

    return this.http
      .post<ApiResponse<AdoptionRequest>>(`${this.URL}/pets/${petId}/request`, body)
      .pipe(map((r) => r.data));
  }

  getPublisherInbox(): Observable<AdoptionRequest[]> {
    return this.http
      .get<ApiResponse<AdoptionRequest[]>>(`${this.URL}/requests/inbox`)
      .pipe(map((r) => r.data || []));
  }

  getMyApplications(): Observable<AdoptionRequest[]> {
    return this.http
      .get<ApiResponse<AdoptionRequest[]>>(`${this.URL}/requests/my-applications`)
      .pipe(map((r) => r.data || []));
  }

  getMyPublishedProgress(): Observable<PublishedPetProgress[]> {
    return this.http
      .get<ApiResponse<PublishedPetProgress[]>>(`${this.URL}/requests/my-published-progress`)
      .pipe(map((r) => r.data || []));
  }

  getRequestDetail(requestId: string): Observable<AdoptionRequestDetailResponse> {
    return this.http
      .get<ApiResponse<AdoptionRequestDetailResponse>>(`${this.URL}/requests/${requestId}`)
      .pipe(map((r) => r.data));
  }

  advanceStage(
    requestId: string,
    payload: AdvanceAdoptionStagePayload,
  ): Observable<AdoptionRequest> {
    return this.http
      .patch<ApiResponse<AdoptionRequest>>(`${this.URL}/requests/${requestId}/stage`, payload)
      .pipe(map((r) => r.data));
  }

  signAgreement(
    requestId: string,
    payload: SignAdoptionAgreementPayload,
  ): Observable<AdoptionRequest> {
    return this.http
      .patch<ApiResponse<AdoptionRequest>>(`${this.URL}/requests/${requestId}/agreement`, payload)
      .pipe(map((r) => r.data));
  }

  updateRequestStatus(
    requestId: string,
    status: AdoptionRequestStatus,
    publisherNotes?: string,
    rejectionReason?: string,
  ): Observable<AdoptionRequest> {
    return this.http
      .patch<ApiResponse<AdoptionRequest>>(`${this.URL}/requests/${requestId}/status`, {
        status,
        publisherNotes,
        rejectionReason,
      })
      .pipe(map((r) => r.data));
  }

  // 3. Seguimientos post-adopción (14 días / 1 mes / 6 meses / 1 año)
  getFollowups(): Observable<AdoptionFollowup[]> {
    return this.http
      .get<ApiResponse<AdoptionFollowup[]>>(`${this.URL}/followups`)
      .pipe(map((r) => r.data || []));
  }

  getMyFollowups(): Observable<AdoptionFollowup[]> {
    return this.http
      .get<ApiResponse<AdoptionFollowup[]>>(`${this.URL}/followups/my-adoptions`)
      .pipe(map((r) => r.data || []));
  }

  registerFollowupProof(
    followupId: string,
    proofPhotoUrl: string,
    proofNotes?: string,
    markCompleted?: boolean,
  ): Observable<AdoptionFollowup> {
    return this.http
      .patch<ApiResponse<AdoptionFollowup>>(`${this.URL}/followups/${followupId}/proof`, {
        proofPhotoUrl,
        proofNotes,
        ...(markCompleted !== undefined ? { markCompleted } : {}),
      })
      .pipe(map((r) => r.data));
  }

  updateFollowupStatus(
    followupId: string,
    status: FollowupStatus,
    proofNotes?: string,
  ): Observable<AdoptionFollowup> {
    return this.http
      .patch<ApiResponse<AdoptionFollowup>>(`${this.URL}/followups/${followupId}/status`, {
        status,
        proofNotes,
      })
      .pipe(map((r) => r.data));
  }

  updatePetSterilization(
    petId: string,
    isSterilized: boolean,
    notes?: string,
  ): Observable<Pet> {
    return this.http
      .patch<ApiResponse<Pet>>(`${this.URL}/pets/${petId}/sterilization`, {
        isSterilized,
        notes,
      })
      .pipe(map((r) => r.data));
  }
}
