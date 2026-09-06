import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { PaginatedAuditLogs, SystemStats } from '../models/audit-log.model';

@Injectable({
  providedIn: 'root',
})
export class AuditService {
  private http = inject(HttpClient);
  private readonly AUDIT_URL = `${environment.apiUrl}/audit-logs`;

  getLogs(page = 1, limit = 20, action = '', search = ''): Observable<PaginatedAuditLogs> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (action) {
      params = params.set('action', action);
    }
    if (search) {
      params = params.set('search', search);
    }

    return this.http
      .get<ApiResponse<PaginatedAuditLogs>>(this.AUDIT_URL, { params })
      .pipe(map((res) => res.data));
  }

  getSystemStats(): Observable<SystemStats> {
    return this.http
      .get<ApiResponse<SystemStats>>(`${this.AUDIT_URL}/stats`)
      .pipe(map((res) => res.data));
  }
}
