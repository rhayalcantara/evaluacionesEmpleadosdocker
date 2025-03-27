import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { DatosServiceService } from './datos-service.service';
import { SegurityService } from './segurity.service';


@Injectable({
  providedIn: 'root'
})
export class AuthGuard  {
  constructor(
      private router: Router,
      private datoservice: SegurityService,
      private datos:DatosServiceService
  ) {
     
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) 
  
  {
      const usuario = this.datoservice.usuario;
              
      if (usuario){            
          return true;            
      }
      this.datos.showMessage("Pagina no Autorizada","Error","error");
      this.router.navigate([''], { queryParams: { returnUrl: state.url }});
      return false;
  }
}
