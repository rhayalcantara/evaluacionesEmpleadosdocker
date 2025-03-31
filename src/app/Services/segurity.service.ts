import { Inject, Injectable } from '@angular/core';

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
  public logout(){
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
    localStorage.removeItem('empleado');
    localStorage.removeItem('periodo');
    localStorage.removeItem('rol');
  }
  constructor( @Inject(CommonsLibService) private commons: CommonsLibService,) { }
}
