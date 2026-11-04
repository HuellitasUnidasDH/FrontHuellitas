import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Pet, CreatePetPayload, UpdatePetPayload } from '../models/pet.model';
import { PublicationComment } from '../models/lost-pet.model';
import {
  MedicalRecord,
  CreateMedicalRecordPayload,
} from '../models/medical-record.model';
import { PetMoment } from '../models/pet-moment.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root',
})
export class PetService {
  private http = inject(HttpClient);
  private readonly PETS_URL = `${environment.apiUrl}/pets`;
  private readonly RECORDS_URL = `${environment.apiUrl}/medical-records`;

  getAll(search?: string, species?: string): Observable<Pet[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (species) params = params.set('species', species);

    return this.http
      .get<ApiResponse<Pet[]>>(this.PETS_URL, { params })
      .pipe(map((res) => res.data));
  }

  getById(id: string): Observable<Pet> {
    return this.http
      .get<ApiResponse<Pet>>(`${this.PETS_URL}/${id}`)
      .pipe(map((res) => res.data));
  }

  getAdoptionCatalog(filters?: {
    species?: string;
    size?: string;
    status?: string;
    coloniaId?: string;
    goodWithKids?: boolean;
    goodWithOtherPets?: boolean;
    search?: string;
  }): Observable<Pet[]> {
    let params = new HttpParams();
    if (filters?.species) params = params.set('species', filters.species);
    if (filters?.size) params = params.set('size', filters.size);
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.coloniaId) params = params.set('coloniaId', filters.coloniaId);
    if (filters?.goodWithKids !== undefined) params = params.set('goodWithKids', String(filters.goodWithKids));
    if (filters?.goodWithOtherPets !== undefined) params = params.set('goodWithOtherPets', String(filters.goodWithOtherPets));
    if (filters?.search) params = params.set('search', filters.search);

    return this.http
      .get<ApiResponse<Pet[]>>(`${this.PETS_URL}/public/catalog`, { params })
      .pipe(map((res) => res.data));
  }

  getPublicById(id: string): Observable<Pet> {
    return this.http
      .get<ApiResponse<Pet>>(`${this.PETS_URL}/public/${id}`)
      .pipe(map((res) => res.data));
  }

  create(payload: CreatePetPayload): Observable<Pet> {
    return this.http
      .post<ApiResponse<Pet>>(this.PETS_URL, payload)
      .pipe(map((res) => res.data));
  }

  update(id: string, payload: UpdatePetPayload): Observable<Pet> {
    return this.http
      .patch<ApiResponse<Pet>>(`${this.PETS_URL}/${id}`, payload)
      .pipe(map((res) => res.data));
  }

  delete(id: string): Observable<void> {
    return this.http
      .delete<ApiResponse<{ message: string }>>(`${this.PETS_URL}/${id}`)
      .pipe(map(() => void 0));
  }

  getMedicalRecords(petId: string): Observable<MedicalRecord[]> {
    return this.http
      .get<ApiResponse<MedicalRecord[]>>(`${this.RECORDS_URL}/pet/${petId}`)
      .pipe(map((res) => res.data));
  }

  createMedicalRecord(payload: CreateMedicalRecordPayload): Observable<MedicalRecord> {
    return this.http
      .post<ApiResponse<MedicalRecord>>(this.RECORDS_URL, payload)
      .pipe(map((res) => res.data));
  }

  // ==========================================
  // MOMENTOS / RECUERDOS (Supabase Storage)
  // ==========================================

  getMoments(petId: string): Observable<PetMoment[]> {
    return this.http
      .get<ApiResponse<PetMoment[]>>(`${this.PETS_URL}/${petId}/moments`)
      .pipe(map((res) => res.data));
  }

  addMoment(petId: string, formData: FormData): Observable<PetMoment> {
    return this.http
      .post<ApiResponse<PetMoment>>(`${this.PETS_URL}/${petId}/moments`, formData)
      .pipe(map((res) => res.data));
  }

  deleteMoment(momentId: string): Observable<void> {
    return this.http
      .delete<ApiResponse<{ message: string }>>(`${this.PETS_URL}/moments/${momentId}`)
      .pipe(map(() => void 0));
  }

  // ==========================================
  // COMENTARIOS COMUNITARIOS EN ADOPCIONES
  // ==========================================

  getComments(petId: string): Observable<PublicationComment[]> {
    return this.http
      .get<ApiResponse<PublicationComment[]>>(`${this.PETS_URL}/${petId}/comments`)
      .pipe(map((res) => res.data));
  }

  addComment(petId: string, content: string): Observable<PublicationComment> {
    return this.http
      .post<ApiResponse<PublicationComment>>(`${this.PETS_URL}/${petId}/comments`, { content })
      .pipe(map((res) => res.data));
  }
}
