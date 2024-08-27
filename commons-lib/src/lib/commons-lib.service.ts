import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';

@Injectable({
  providedIn: 'root'
})
export class CommonsLibService {
  private _chanelSource = new BehaviorSubject<string>('nada');
  mensaje$ = this._chanelSource.asObservable();
  constructor() { }

  sendData(mensaje:string):void {
  //  console.log('mensaje recibido y enviado',mensaje)    
    this._chanelSource.next(mensaje);
  }
}
