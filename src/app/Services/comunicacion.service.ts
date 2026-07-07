import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

/**
 * Valores de "mensaje" usados historicamente en enviarMensaje({mensaje: ...}).
 * Los archivos vetados (FormEvaluationEmploye, Evaluacion.ts) conservan el
 * string literal hasta Fase 7 (T7.7 los migra a usar estas constantes).
 */
export const MENSAJES = {
  BUSCAR: 'buscar',
  ACTUALIZAR_VARIABLES: 'Actualizar variables',
} as const;

/**
 * Forma de los payloads que hoy pasan por ComunicacionService.enviarMensaje.
 * Es intencionalmente laxa (todo opcional): el canal se usa para dos cosas
 * sin relacion entre si (sincronizar la paginacion de <app-tables> via
 * id/totalItems/itemsPerPage, y comandos puntuales via mensaje/id/model).
 * NO se separa en canales por topico (fuera de alcance de T6.2).
 */
export interface MensajeComunicacion {
  mensaje?: string;
  id?: number | string;
  model?: any;
  titulo?: string;
  totalItems?: number;
  itemsPerPage?: number;
  currentPage?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ComunicacionService {

  mensaje: MensajeComunicacion | undefined;
  private enviarMensajeSubject = new Subject<MensajeComunicacion>();
  enviarMensajeObservable = this.enviarMensajeSubject.asObservable();
  constructor() { }
  enviarMensaje(mensaje: MensajeComunicacion) {
    this.mensaje = mensaje;
    this.enviarMensajeSubject.next(mensaje);
  }
}
