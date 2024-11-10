import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { DatosServiceService } from './datos-service.service';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  constructor(
    private dataService: DatosServiceService,
    private http: HttpClient
  ) {}

  uploadRawFile(file: File): Observable<any> {
    // Simular una carga de archivo con un delay
   /* return of({ success: true }).pipe(
      delay(2000) // Simular 2 segundos de carga
    );
*/
    // Para implementación real con backend:
    
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(this.dataService.URL+'/api/EmpleadoDesempenoes/upload', formData);
    
  }
}
