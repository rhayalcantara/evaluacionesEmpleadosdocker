import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TokenInterceptorService implements HttpInterceptor  {

  constructor() { }
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    
    
    const userToken = localStorage.getItem('token');
    
    
    console.log({token:userToken})
    const modifiedReq = req.clone({ 
      headers: 
        req.headers.set('Authorization', `Bearer ${userToken}`),

    });


 
    return next.handle(modifiedReq);
  }
}
