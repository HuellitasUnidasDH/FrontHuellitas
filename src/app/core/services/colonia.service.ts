import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Colonia } from '../models/colonia.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root',
})
export class ColoniaService {
  private http = inject(HttpClient);
  private readonly URL = `${environment.apiUrl}/colonias`;

  getAll(search?: string): Observable<Colonia[]> {
    let params = new HttpParams();
    if (search && search.trim() !== '') {
      params = params.set('search', search.trim());
    }
    return this.http.get<ApiResponse<Colonia[]>>(this.URL, { params }).pipe(map((r) => r.data));
  }
}
