import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, switchMap, catchError, of, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { compressAndResizeImage } from '../utils/image-compressor.util';

@Injectable({
  providedIn: 'root',
})
export class ImageUploadService {
  private http = inject(HttpClient);
  private readonly UPLOAD_URL = `${environment.apiUrl}/storage/upload`;

  /**
   * Sube una imagen optimizada al backend (Supabase Storage).
   * Si el almacenamiento en la nube no está disponible, genera un Data URL optimizado
   * asegurando que la foto se guarde sin errores para el usuario.
   */
  uploadImage(file: File, folder = 'general'): Observable<string> {
    return from(compressAndResizeImage(file, 1200, 1200, 0.82)).pipe(
      switchMap((compressed) => {
        const formData = new FormData();
        formData.append('file', compressed.file);

        return this.http
          .post<ApiResponse<{ publicUrl: string; storagePath: string }>>(
            `${this.UPLOAD_URL}?folder=${folder}`,
            formData,
          )
          .pipe(
            map((res) => res.data.publicUrl),
            catchError((err) => {
              console.warn(
                'Supabase Storage no respondió o no está configurado, usando imagen optimizada en local:',
                err,
              );
              // Fallback a Base64 comprimida
              return from(this.fileToDataUrl(compressed.file));
            }),
          );
      }),
    );
  }

  /**
   * Convierte un archivo File/Blob en una cadena Base64 Data URL
   */
  fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }
}
