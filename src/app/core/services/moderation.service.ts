import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { User } from '../models/user.model';

export type ReportTargetType = 'PET_POST' | 'USER_ACCOUNT' | 'LOST_REPORT';
export type ContentReportReason =
  | 'INTENTO_DE_COBRO'
  | 'MALTRATO_ANIMAL'
  | 'DATOS_FALSOS'
  | 'SPAM'
  | 'OTRO';
export type ContentReportStatus = 'PENDIENTE' | 'EN_REVISION' | 'SANCIONADO' | 'DESESTIMADO';
export type ModerationAction =
  | 'DISMISS'
  | 'MARK_REVIEWING'
  | 'WARN_AUTHOR'
  | 'DELETE_CONTENT'
  | 'SUSPEND_USER'
  | 'DELETE_AND_SUSPEND';

export interface ModerationAuthorSummary {
  id: string;
  fullName: string;
  email?: string;
  role: string;
  isActive: boolean;
  isBanned: boolean;
  priorSanctionsCount: number;
}

export interface ModerationTargetSummary {
  exists: boolean;
  targetType: ReportTargetType;
  targetId: string;
  title: string;
  subtitle?: string;
  previewText?: string;
  photoUrl?: string | null;
  statusLabel: string;
  isDeleted: boolean;
  routePath: string | null;
  author: ModerationAuthorSummary | null;
}

export interface ContentReport {
  id: string;
  reporterUserId: string;
  reporterUser?: User;
  targetType: ReportTargetType;
  targetId: string;
  reason: ContentReportReason;
  description: string;
  status: ContentReportStatus;
  actionTaken?: ModerationAction;
  adminResolutionNotes?: string;
  reviewedByAdminId?: string;
  reviewedByAdmin?: User;
  targetSummary?: ModerationTargetSummary;
  cascadedReportsCount?: number;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class ModerationService {
  private http = inject(HttpClient);
  private readonly URL = `${environment.apiUrl}/moderation`;

  createReport(payload: {
    targetType: ReportTargetType;
    targetId: string;
    reason: ContentReportReason;
    description: string;
  }): Observable<ContentReport> {
    return this.http
      .post<ApiResponse<ContentReport>>(`${this.URL}/reports`, payload)
      .pipe(map((r) => r.data));
  }

  getReports(status?: ContentReportStatus | ''): Observable<ContentReport[]> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    return this.http
      .get<ApiResponse<ContentReport[]>>(`${this.URL}/reports`, { params })
      .pipe(map((r) => r.data));
  }

  resolveReport(
    id: string,
    payload: {
      status?: ContentReportStatus;
      action?: ModerationAction;
      adminNotes?: string;
    },
  ): Observable<ContentReport> {
    return this.http
      .patch<ApiResponse<ContentReport>>(`${this.URL}/reports/${id}/resolve`, payload)
      .pipe(map((r) => r.data));
  }
}
