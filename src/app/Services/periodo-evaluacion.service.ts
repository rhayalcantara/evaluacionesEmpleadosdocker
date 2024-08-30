import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IPeriodoEvaluacion } from '../Models/PeriodoEvaluacion/IPeriodoEvaluacion';


@Injectable({
  providedIn: 'root'
})
export class PeriodoEvaluacionService {
  private apiUrl = 'API_URL_HERE'; // Replace with your actual API URL

  constructor(private http: HttpClient) { }

  getPeriodosEvaluacion(): Observable<IPeriodoEvaluacion[]> {
    return this.http.get<IPeriodoEvaluacion[]>(`${this.apiUrl}/periodosEvaluacion`);
  }

  getPeriodoEvaluacion(id: number): Observable<IPeriodoEvaluacion> {
    return this.http.get<IPeriodoEvaluacion>(`${this.apiUrl}/periodosEvaluacion/${id}`);
  }

  createPeriodoEvaluacion(periodoEvaluacion: IPeriodoEvaluacion): Observable<IPeriodoEvaluacion> {
    return this.http.post<IPeriodoEvaluacion>(`${this.apiUrl}/periodosEvaluacion`, periodoEvaluacion);
  }

  updatePeriodoEvaluacion(id: number, periodoEvaluacion: IPeriodoEvaluacion): Observable<IPeriodoEvaluacion> {
    return this.http.put<IPeriodoEvaluacion>(`${this.apiUrl}/periodosEvaluacion/${id}`, periodoEvaluacion);
  }

  deletePeriodoEvaluacion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/periodosEvaluacion/${id}`);
  }
}