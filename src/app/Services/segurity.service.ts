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
    this.commons.sendData('nuevousuario');
  }
  public logout(){}
  constructor( @Inject(CommonsLibService) private commons: CommonsLibService,) { }
}
