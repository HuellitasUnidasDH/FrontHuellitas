import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  PetGroup,
  CreateGroupPayload,
  JoinGroupPayload,
  GroupFeedMoment,
} from '../models/group.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root',
})
export class GroupService {
  private http = inject(HttpClient);
  private readonly GROUPS_URL = `${environment.apiUrl}/groups`;

  getAll(): Observable<PetGroup[]> {
    return this.http
      .get<ApiResponse<PetGroup[]>>(this.GROUPS_URL)
      .pipe(map((res) => res.data));
  }

  getById(id: string): Observable<PetGroup> {
    return this.http
      .get<ApiResponse<PetGroup>>(`${this.GROUPS_URL}/${id}`)
      .pipe(map((res) => res.data));
  }

  create(payload: CreateGroupPayload): Observable<PetGroup> {
    return this.http
      .post<ApiResponse<PetGroup>>(this.GROUPS_URL, payload)
      .pipe(map((res) => res.data));
  }

  join(payload: JoinGroupPayload): Observable<PetGroup> {
    return this.http
      .post<ApiResponse<PetGroup>>(`${this.GROUPS_URL}/join`, payload)
      .pipe(map((res) => res.data));
  }

  assignPet(groupId: string, petId: string): Observable<{ message: string }> {
    return this.http
      .patch<ApiResponse<{ message: string }>>(`${this.GROUPS_URL}/${groupId}/pets/${petId}`, {})
      .pipe(map((res) => res.data));
  }

  unassignPet(groupId: string, petId: string): Observable<{ message: string }> {
    return this.http
      .delete<ApiResponse<{ message: string }>>(`${this.GROUPS_URL}/${groupId}/pets/${petId}`)
      .pipe(map((res) => res.data));
  }

  removeMember(groupId: string, userId: string): Observable<{ message: string }> {
    return this.http
      .delete<ApiResponse<{ message: string }>>(`${this.GROUPS_URL}/${groupId}/members/${userId}`)
      .pipe(map((res) => res.data));
  }

  deleteGroup(groupId: string): Observable<{ message: string }> {
    return this.http
      .delete<ApiResponse<{ message: string }>>(`${this.GROUPS_URL}/${groupId}`)
      .pipe(map((res) => res.data));
  }

  getFeed(groupId: string): Observable<GroupFeedMoment[]> {
    return this.http
      .get<ApiResponse<GroupFeedMoment[]>>(`${this.GROUPS_URL}/${groupId}/feed`)
      .pipe(map((res) => res.data));
  }
}
