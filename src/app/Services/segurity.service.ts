import { Inject, Injectable } from '@angular/core';
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
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
    localStorage.removeItem('empleado');
    localStorage.removeItem('periodo');
    localStorage.removeItem('rol');

    // 2. Limpiar estado de usuario
    this._usuario = null!;

    // 3. Notificar a otros componentes
    this.commons.sendData('logout');

    // 4. Retornar Observable para manejo asíncrono
    return of({ success: true });
  }
  constructor( @Inject(CommonsLibService) private commons: CommonsLibService,) { }
}
