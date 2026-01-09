import { Inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';

import { CommonsLibService } from '@commons-lib';
import { Usuario } from '../Helpers/Interfaces';

@Injectable({
  providedIn: 'root'
})
export class SegurityService {

  private _usuario!:Usuario
  get usuario(){
    
    return this._usuario;
  }
  agregarusuario(value:Usuario){
    this._usuario=value;
   // this.commons.sendData('loguiado');
  }
  public logout(): Observable<any> {
    // 1. Limpiar localStorage
    localStorage.clear();

    // 2. Limpiar estado de usuario
    this._usuario = null!;

    // 3. Notificar a otros componentes
    this.commons.sendData('logout');

    // 4. Redirigir al login usando Angular Router
    // El login está configurado como lazy-loaded module de Module Federation
    // en app-routing.module.ts línea 21-23
    setTimeout(() => {
      this.router.navigate(['/']).then(() => {
        // Forzar recarga completa para limpiar estado del Module Federation
        window.location.reload();
      });
    }, 100);

    // 5. Retornar Observable para manejo asíncrono
    return of({ success: true });
  }
  constructor( 
    @Inject(CommonsLibService) private commons: CommonsLibService,
    private router: Router
  ) { }
}
