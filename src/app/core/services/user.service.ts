import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, UserRole } from '../models/user.model';
import { ApiResponse } from '../models/api-response.model';

export interface UpdateUserPayload {
  email?: string;
  fullName?: string;
  phone?: string;
  role?: UserRole;
  isActive?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private http = inject(HttpClient);
  private readonly USERS_URL = `${environment.apiUrl}/users`;

  getAll(): Observable<User[]> {
    return this.http
      .get<ApiResponse<User[]>>(this.USERS_URL)
      .pipe(map((res) => res.data));
  }

  getById(id: string): Observable<User> {
    return this.http
      .get<ApiResponse<User>>(`${this.USERS_URL}/${id}`)
      .pipe(map((res) => res.data));
  }

  update(id: string, payload: UpdateUserPayload): Observable<User> {
    return this.http
      .patch<ApiResponse<User>>(`${this.USERS_URL}/${id}`, payload)
      .pipe(map((res) => res.data));
  }

  delete(id: string): Observable<void> {
    return this.http
      .delete<ApiResponse<{ message: string }>>(`${this.USERS_URL}/${id}`)
      .pipe(map(() => void 0));
  }

  resetPrivacyTerms(newVersion = '2026-v2.0'): Observable<{ message: string }> {
    return this.http
      .post<ApiResponse<{ message: string }>>(`${this.USERS_URL}/admin/reset-privacy`, { newVersion })
      .pipe(map((res) => res.data));
  }
}
