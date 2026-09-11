import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';
import { Subscription } from 'rxjs';
import { Bitacora } from '../../../../Controllers/Bitacora';
import { IBitacoraResumenCompetencia } from '../../../../Models/Bitacora/IBitacora';
import {
  textoResumen,
  normalizarTexto,
  fechaCorta as fechaCortaUtil,
  claseTipo as claseTipoUtil,
  claseImpacto as claseImpactoUtil
} from '../../../../Helpers/bitacora-utils';

/**
 * Resumen de solo lectura de la bitácora para una competencia:
 * cuántos eventos del periodo la evidencian y la lista de esos eventos.
 * Nunca modifica nada: es evidencia para el supervisor, no puntuación.
 */
@Component({
  selector: 'app-bitacora-resumen',
  templateUrl: './bitacora-resumen.component.html',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    .bitacora-resumen{font-size:.85rem}
    .sin-eventos .resumen-texto{color:#6c757d}
    .lista-eventos{list-style:none;padding-left:0;margin:.25rem 0 0}
    .lista-eventos li{border-left:3px solid #dee2e6;padding:.25rem .5rem;margin-bottom:.25rem}
    .descripcion{white-space:pre-line}
    .evento-logro{background:#198754;color:#fff}
    .evento-incumplimiento{background:#dc3545;color:#fff}
    .evento-iniciativa{background:#0d6efd;color:#fff}
    .evento-conducta{background:#fd7e14;color:#fff}
    .evento-otro{background:#6c757d;color:#fff}
    .impacto-alto{background:#f8d7da;color:#842029}
    .impacto-medio{background:#fff3cd;color:#664d03}
    .impacto-bajo{background:#e2e3e5;color:#41464b}
    .impacto-otro{background:#e2e3e5}
  `]
})
export class BitacoraResumenComponent implements OnChanges, OnDestroy {
  @Input() empleadoSecuencial: number = 0;
  @Input() periodoId: number = 0;
  /** Id de la competencia (Objetivo.Id) de la fila donde se incrusta. */
  @Input() objetivoId: number | null = null;
  /** Alternativa cuando no se conoce el id: se empareja por normalizarTexto. */
  @Input() nombreCompetencia: string | null = null;
  /** 'compacto' (por defecto): texto + botón desplegar. 'lista': siempre desplegado. */
  @Input() modo: 'compacto' | 'lista' = 'compacto';

  /** Fila del resumen que corresponde a esta competencia (null si no empareja). */
  fila: IBitacoraResumenCompetencia | null = null;
  cargando: boolean = false;
  error: string = '';
  abierto: boolean = false;

  /**
   * Caché compartida por clave `empleadoSecuencial|periodoId`:
   * 12 instancias de la misma evaluación → 1 petición HTTP.
   */
  private static cache = new Map<string, Observable<IBitacoraResumenCompetencia[]>>();

  /** Último array recibido (reempareja al cambiar objetivoId/nombre sin HTTP). */
  private filas: IBitacoraResumenCompetencia[] | null = null;
  private suscripcion: Subscription | null = null;

  constructor(private bitacora: Bitacora) {}

  /** Descarta la caché; la próxima instancia vuelve a pedir el resumen. */
  static limpiarCache(): void {
    BitacoraResumenComponent.cache.clear();
  }

  /** Recarga solo si cambian empleadoSecuencial o periodoId (ambos > 0). */
  ngOnChanges(cambios: SimpleChanges): void {
    const identicoCambiado = Boolean(cambios['empleadoSecuencial'] || cambios['periodoId']);
    if (identicoCambiado) {
      this.cargando = false;
      this.error = '';
      this.abierto = false;
      this.fila = null;
      this.filas = null;
      if (this.empleadoSecuencial > 0 && this.periodoId > 0) {
        this.cargar();
      }
      // Inputs <= 0: no pide nada, fila = null, sin error.
      return;
    }
    // Cambió solo la competencia seleccionada: reempareja con lo ya cacheado.
    const emparejada = cambios['objetivoId'] || cambios['nombreCompetencia'];
    if (emparejada && this.filas) {
      this.fila = this.emparejar(this.filas);
      this.abierto = false;
    }
  }

  ngOnDestroy(): void {
    this.suscripcion?.unsubscribe();
  }

  /** Texto corto de la fila, o 'Sin eventos' si no hay fila. */
  get texto(): string {
    return this.fila ? textoResumen(this.fila) : 'Sin eventos';
  }

  /** true si la fila emparejada tiene al menos un evento. */
  get hayEventos(): boolean {
    return (this.fila?.total ?? 0) > 0;
  }

  /** Alterna el desplegado; solo tiene efecto en modo compacto. */
  alternar(): void {
    if (this.modo === 'compacto') {
      this.abierto = !this.abierto;
    }
  }

  /** Delegan en bitacora-utils para el template. */
  fechaCorta(fecha: string | null | undefined): string {
    return fechaCortaUtil(fecha);
  }
  claseTipo(tipo: string | null | undefined): string {
    return claseTipoUtil(tipo);
  }
  claseImpacto(impacto: string | null | undefined): string {
    return claseImpactoUtil(impacto);
  }

  /**
   * Empareja la fila: primero por objetivoId; si no hay coincidencia (o no
   * hay id) y hay nombreCompetencia, por nombre normalizado. Sin ambas → null.
   */
  private emparejar(filas: IBitacoraResumenCompetencia[]): IBitacoraResumenCompetencia | null {
    const id = this.objetivoId;
    if (id !== null && id !== undefined && id > 0) {
      const porId = filas.find((f) => f.objetivoId === id);
      if (porId) return porId;
    }
    if (this.nombreCompetencia) {
      const nombre = normalizarTexto(this.nombreCompetencia);
      return filas.find((f) => normalizarTexto(f.nombre) === nombre) ?? null;
    }
    return null;
  }

  /** Suscribe al resumen (compartido en caché); en error olvida la clave. */
  private cargar(): void {
    const clave = `${this.empleadoSecuencial}|${this.periodoId}`;
    if (!BitacoraResumenComponent.cache.has(clave)) {
      BitacoraResumenComponent.cache.set(
        clave,
        this.bitacora.resumen(this.empleadoSecuencial, this.periodoId).pipe(shareReplay(1))
      );
    }
    this.cargando = true;
    const flujo = BitacoraResumenComponent.cache.get(clave);
    if (!flujo) return;
    this.suscripcion?.unsubscribe();
    this.suscripcion = flujo.subscribe({
      next: (filas) => {
        this.filas = filas;
        this.fila = this.emparejar(filas);
        this.cargando = false;
      },
      // El componente nunca lanza: el error queda solo en `error`.
      error: (err: unknown) => {
        BitacoraResumenComponent.cache.delete(clave);
        this.cargando = false;
        this.error = this.bitacora.mensajeError(err);
      }
    });
  }
}
