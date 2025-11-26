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

    // 4. Redirigir al login (usando window.location para forzar recarga del módulo remoto)
    // Esto es necesario porque el login está en un módulo remoto de Module Federation
    // y necesitamos asegurar que se cargue correctamente después del logout
    const baseUrl = window.location.origin;
    const loginUrl = `${baseUrl}/evaluacionempleado/login`;

    // Usar setTimeout para permitir que se complete la limpieza antes de navegar
    setTimeout(() => {
      window.location.href = loginUrl;
    }, 100);

    // 5. Retornar Observable para manejo asíncrono
    return of({ success: true });
  }
  constructor( 
    @Inject(CommonsLibService) private commons: CommonsLibService,
    private router: Router
  ) { }
}
