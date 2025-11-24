import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { catchError, Observable, throwError } from 'rxjs';
import { DatosServiceService } from './datos-service.service';
import { SegurityService } from './segurity.service';

@Injectable({
  providedIn: 'root'
})
export class ErrorInterceptorService implements HttpInterceptor {

  constructor(private authenticationService: SegurityService,
    private router:Router,
    public dial: MatDialog,
    public datos:DatosServiceService) { }

intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(catchError((err) => {

        // Solo hacer logout automático para errores de autenticación/autorización
        if (err.status === 401 || err.status === 403) {
            this.datos.showMessage(
                'Su sesión ha expirado o no tiene permisos. Por favor, inicie sesión nuevamente.',
                'Sesión Expirada',
                'warning'
            );
            this.authenticationService.logout();
            this.router.navigate(['login']);
        }
        // Para otros errores, solo mostrar mensaje sin cerrar sesión
        else if (err.status === 404) {
            this.datos.showMessage(
                'El recurso solicitado no fue encontrado.',
                'Recurso No Encontrado',
                'info'
            );
        }
        else if (err.status >= 500) {
            this.datos.showMessage(
                'Error del servidor. Por favor, intente nuevamente más tarde.',
                'Error del Servidor',
                'error'
            );
        }
        else if (err.status === 0) {
            this.datos.showMessage(
                'No se pudo conectar con el servidor. Verifique su conexión a internet.',
                'Error de Conexión',
                'error'
            );
        }

        const error = err.error?.message || err.statusText || 'Error desconocido';
        return throwError(() => error);
    }))
}


}
