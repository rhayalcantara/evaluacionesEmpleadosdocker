import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ComunicacionService {

  mensaje:any;
  private enviarMensajeSubject = new Subject<any>();
  enviarMensajeObservable = this.enviarMensajeSubject.asObservable();
  constructor() { }
  enviarMensaje(mensaje:any){
    this.mensaje = mensaje;
    this.enviarMensajeSubject.next(mensaje);
  }
}
