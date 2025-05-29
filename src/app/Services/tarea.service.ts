import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ITarea } from '../Models/Tarea/ITarea';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TareaService {
  private apiUrl = 'api/tareas'; // Reemplazar con la URL real de la API

  constructor(private http: HttpClient) { }

  getTareas(): Observable<ITarea[]> {
    return this.http.get<ITarea[]>(this.apiUrl);
  }

  createTarea(tarea: ITarea): Observable<ITarea> {
    return this.http.post<ITarea>(this.apiUrl, tarea);
  }

  updateTarea(id: number, tarea: ITarea): Observable<ITarea> {
    return this.http.put<ITarea>(`${this.apiUrl}/${id}`, tarea);
  }

  deleteTarea(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
