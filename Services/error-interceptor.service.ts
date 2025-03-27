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
      
        if ((err.status === 401 ) || (err.status=== 404)) {
            // auto logout if 401 response returned from api
            this.datos.showMessage('Error: error estatus:'+err.status.toString()+' error mensaje:'+err.message,'error','Error')
            this.authenticationService.logout();
            this.router.navigate(['/'])
            
           
        }
        const error = err.error.message || err.statusText;
        return throwError(error);
        
    }))
}


}
