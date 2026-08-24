import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { catchError, concatMap, forkJoin, from, Observable, of, switchMap, toArray } from 'rxjs';

import { PorcientoDesempenoCompetencia } from 'src/app/Controllers/PorcientoDesempenoCompetencia';
import { Periodos } from 'src/app/Controllers/Periodos';
import { IPorcientoDesempenoCompetencia } from 'src/app/Models/PorcientoDesempenoCompetencia/IPorcientoDesempenoCompetencia';
import { IPeriodo } from 'src/app/Models/Periodos/IPeriodo';
import { ModelResponse } from 'src/app/Models/Usuario/modelResponse';
import { DatosServiceService } from 'src/app/Services/datos-service.service';
import { LoggerService } from 'src/app/Services/logger.service';

/** Un periodo que ya tiene su ponderacion configurada, candidato a ser copiado. */
interface IOrigenPonderacion {
  periodoId: number;
  descripcion: string;
  desempeno: number;
  competencia: number;
}

/**
 * Pestaña "Ponderación" (PorcientoDesempenoCompetencia) de la pantalla de
 * Configuración de Competencias.
 *
 * Muestra y edita el reparto Desempeño / Competencia del periodo elegido (en los
 * periodos 7 y 8 es 30 / 70). Resuelve a mano lo que en el periodo 8 hubo que
 * hacer por SQL (§3 de Docs/proceso-configuracion-competencias-periodo8.md):
 * el periodo no tenia ninguna fila y nadie se entero hasta revisarlo a mano.
 *
 * Tres reglas de la pestaña:
 *   1. Si el periodo no tiene filas, se ofrece crearlas copiando las de otro
 *      periodo que si las tenga (por defecto el anterior mas reciente).
 *   2. No se deja guardar si Desempeño + Competencia no suman 100.
 *   3. Despues de cada escritura se RELEE del API y se compara con lo enviado.
 *      El API de prueba responde 200 sin llegar a procesar en algunos casos, asi
 *      que el codigo HTTP no se toma como prueba de nada.
 */
@Component({
  selector: 'app-cc-ponderacion',
  templateUrl: './ponderacion.component.html',
  styleUrls: ['./ponderacion.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule
  ]
})
export class PonderacionComponent implements OnChanges {

  /** Periodo elegido en el selector del shell. */
  @Input() periodoId!: number;

  /** true cuando el periodo elegido es el periodo activo (para advertencias). */
  @Input() periodoActivo!: boolean;

  /** Se emite tras cada alta, edición o baja para que el shell refresque los contadores. */
  @Output() cambios = new EventEmitter<void>();

  /** Etiquetas exactas que usa la tabla PorcientoDesempenoCompetencia. */
  private readonly ETIQUETA_DESEMPENO = 'Desempeño';
  private readonly ETIQUETA_COMPETENCIA = 'Competencia';

  /** Tolerancia al comparar la suma; los valores llegan en crudo desde el API. */
  private readonly TOLERANCIA = 0.01;

  private readonly titulo = 'Ponderación Desempeño / Competencia';

  public cargando = false;
  public guardando = false;

  /** Fila de Desempeño del periodo, si existe. */
  public filaDesempeno: IPorcientoDesempenoCompetencia | null = null;

  /** Fila de Competencia del periodo, si existe. */
  public filaCompetencia: IPorcientoDesempenoCompetencia | null = null;

  /** Filas del periodo que no son ni Desempeño ni Competencia (configuración sucia). */
  public filasInesperadas: IPorcientoDesempenoCompetencia[] = [];

  /** Valores en edición. */
  public valorDesempeno = 0;
  public valorCompetencia = 0;

  /** true cuando el periodo no tiene ninguna fila: hay que crearlas. */
  public sinConfigurar = false;

  /** Periodos que si tienen ponderación y pueden servir de origen para la copia. */
  public origenes: IOrigenPonderacion[] = [];

  /** Origen elegido en el desplegable de copia. */
  public origenSeleccionadoId: number | null = null;

  /** Periodos leidos en la ultima carga, para no volver a pedirlos al reverificar. */
  private periodosCache: IPeriodo[] = [];

  constructor(
    private porcientoController: PorcientoDesempenoCompetencia,
    private periodosController: Periodos,
    private datosService: DatosServiceService,
    private logger: LoggerService
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['periodoId'] && this.periodoId) {
      this.cargar();
    }
  }

  // ── Lectura ───────────────────────────────────────────────────────────────

  /** Relee la tabla completa y reconstruye el estado de la pestaña. */
  public cargar(): void {
    if (!this.periodoId) { return; }
    this.cargando = true;

    forkJoin({
      porcientos: this.porcientoController.Gets().pipe(
        catchError((err) => {
          this.logger.error('Ponderación: error leyendo PorcientoDesempenoCompetencias', err);
          return of({ exito: 0, mensaje: '', count: 0, data: [] } as ModelResponse);
        })
      ),
      periodos: this.periodosController.Gets().pipe(
        catchError((err) => {
          this.logger.error('Ponderación: error leyendo los periodos', err);
          return of({ exito: 0, mensaje: '', count: 0, data: [] } as ModelResponse);
        })
      )
    }).subscribe({
      next: (resultado) => {
        this.cargando = false;
        const filas: IPorcientoDesempenoCompetencia[] = Array.isArray(resultado.porcientos?.data)
          ? resultado.porcientos.data : [];
        this.periodosCache = Array.isArray(resultado.periodos?.data) ? resultado.periodos.data : [];
        this.reconstruirEstado(filas, this.periodosCache);
      },
      error: (err) => {
        this.cargando = false;
        this.logger.error('Ponderación: error cargando la pestaña', err);
        this.datosService.showMessage(
          'No se pudo leer la ponderación: ' + this.mensajeDe(err), this.titulo, 'error');
      }
    });
  }

  /** Reparte las filas leidas entre el periodo actual y los posibles origenes. */
  private reconstruirEstado(filas: IPorcientoDesempenoCompetencia[], periodos: IPeriodo[]): void {
    const delPeriodo = filas.filter(f => Number(f?.periodId) === Number(this.periodoId));

    this.filaDesempeno = delPeriodo.find(f => this.esDesempeno(f.descripcion)) ?? null;
    this.filaCompetencia = delPeriodo.find(f => this.esCompetencia(f.descripcion)) ?? null;
    this.filasInesperadas = delPeriodo.filter(f => !this.esDesempeno(f.descripcion) && !this.esCompetencia(f.descripcion));

    this.valorDesempeno = Number(this.filaDesempeno?.valor ?? 0);
    this.valorCompetencia = Number(this.filaCompetencia?.valor ?? 0);
    this.sinConfigurar = delPeriodo.length === 0;

    this.origenes = this.construirOrigenes(filas, periodos);
    this.origenSeleccionadoId = this.origenes.length > 0 ? this.origenes[0].periodoId : null;

    this.logger.info('Ponderación: estado del periodo', {
      periodoId: this.periodoId,
      filas: delPeriodo.length,
      desempeno: this.valorDesempeno,
      competencia: this.valorCompetencia,
      origenesDisponibles: this.origenes.length
    });
  }

  /**
   * Periodos distintos del actual que tienen las dos filas completas.
   * Se ordenan poniendo primero los anteriores al actual, del mas reciente al
   * mas antiguo (que es el criterio que se siguio al configurar el periodo 8:
   * se copio del 7, el mas reciente con la configuración correcta).
   */
  private construirOrigenes(filas: IPorcientoDesempenoCompetencia[], periodos: IPeriodo[]): IOrigenPonderacion[] {
    const porPeriodo = new Map<number, IPorcientoDesempenoCompetencia[]>();
    for (const fila of filas) {
      const id = Number(fila?.periodId) || 0;
      if (id === 0 || id === Number(this.periodoId)) { continue; }
      if (!porPeriodo.has(id)) { porPeriodo.set(id, []); }
      porPeriodo.get(id)!.push(fila);
    }

    const nombres = new Map<number, string>(periodos.map(p => [Number(p.id), p.descripcion]));
    const origenes: IOrigenPonderacion[] = [];

    porPeriodo.forEach((suyas, id) => {
      const d = suyas.find(f => this.esDesempeno(f.descripcion));
      const c = suyas.find(f => this.esCompetencia(f.descripcion));
      if (!d || !c) { return; }
      origenes.push({
        periodoId: id,
        descripcion: nombres.get(id) ?? `Periodo ${id}`,
        desempeno: Number(d.valor) || 0,
        competencia: Number(c.valor) || 0
      });
    });

    const actual = Number(this.periodoId);
    return origenes.sort((a, b) => {
      const aAnterior = a.periodoId < actual ? 0 : 1;
      const bAnterior = b.periodoId < actual ? 0 : 1;
      return aAnterior - bAnterior || b.periodoId - a.periodoId;
    });
  }

  // ── Validación ────────────────────────────────────────────────────────────

  public get suma(): number {
    return (Number(this.valorDesempeno) || 0) + (Number(this.valorCompetencia) || 0);
  }

  /** La suma debe dar 100; se compara con tolerancia, no con ===. */
  public get sumaValida(): boolean {
    return Math.abs(this.suma - 100) <= this.TOLERANCIA;
  }

  public get valoresEnRango(): boolean {
    const d = Number(this.valorDesempeno);
    const c = Number(this.valorCompetencia);
    return Number.isFinite(d) && Number.isFinite(c) && d >= 0 && c >= 0;
  }

  public get puedeGuardar(): boolean {
    return !this.cargando && !this.guardando && !this.sinConfigurar
      && this.valoresEnRango && this.sumaValida;
  }

  /** Ajusta el otro campo para que la suma cierre en 100. */
  public completarA100(campo: 'desempeno' | 'competencia'): void {
    if (campo === 'desempeno') {
      this.valorCompetencia = 100 - (Number(this.valorDesempeno) || 0);
    } else {
      this.valorDesempeno = 100 - (Number(this.valorCompetencia) || 0);
    }
  }

  public get origenSeleccionado(): IOrigenPonderacion | null {
    return this.origenes.find(o => o.periodoId === this.origenSeleccionadoId) ?? null;
  }

  // ── Escritura ─────────────────────────────────────────────────────────────

  /**
   * Guarda los dos valores del periodo. Actualiza la fila que ya existe y crea
   * la que falte (un periodo puede tener solo una de las dos por una carga a medias).
   */
  public guardar(): void {
    if (!this.puedeGuardar) {
      this.datosService.showMessage(
        `Desempeño (${this.valorDesempeno}) + Competencia (${this.valorCompetencia}) = ${this.suma}. ` +
        'Los dos porcentajes deben sumar exactamente 100 para poder guardar.',
        this.titulo, 'warning');
      return;
    }

    const esperadoDesempeno = Number(this.valorDesempeno);
    const esperadoCompetencia = Number(this.valorCompetencia);

    const operaciones: Observable<any>[] = [
      this.escribirFila(this.filaDesempeno, this.ETIQUETA_DESEMPENO, esperadoDesempeno),
      this.escribirFila(this.filaCompetencia, this.ETIQUETA_COMPETENCIA, esperadoCompetencia)
    ];

    this.guardando = true;
    this.ejecutarYVerificar(operaciones, esperadoDesempeno, esperadoCompetencia,
      'La ponderación del periodo quedó guardada');
  }

  /**
   * Crea las dos filas del periodo copiando las del periodo elegido.
   * Es el equivalente por pantalla del INSERT ... SELECT de la §3 del documento
   * del periodo 8, que copio la ponderación del periodo 7 al 8.
   */
  public copiarDeOrigen(): void {
    const origen = this.origenSeleccionado;
    if (!origen) {
      this.datosService.showMessage(
        'No hay ningún periodo con la ponderación configurada del que copiar. ' +
        'Escriba los dos porcentajes a mano.', this.titulo, 'warning');
      return;
    }

    const suma = origen.desempeno + origen.competencia;
    if (Math.abs(suma - 100) > this.TOLERANCIA) {
      this.datosService.showMessage(
        `El periodo "${origen.descripcion}" tiene una ponderación que no suma 100 ` +
        `(${origen.desempeno} + ${origen.competencia} = ${suma}). Corrija ese periodo antes de copiarlo.`,
        this.titulo, 'warning');
      return;
    }

    const operaciones: Observable<any>[] = [
      this.escribirFila(null, this.ETIQUETA_DESEMPENO, origen.desempeno),
      this.escribirFila(null, this.ETIQUETA_COMPETENCIA, origen.competencia)
    ];

    this.guardando = true;
    this.logger.info('Ponderación: copiando desde otro periodo', {
      destino: this.periodoId, origen: origen.periodoId,
      desempeno: origen.desempeno, competencia: origen.competencia
    });
    this.ejecutarYVerificar(operaciones, origen.desempeno, origen.competencia,
      `Ponderación copiada desde "${origen.descripcion}"`);
  }

  /** Alta o actualización de una fila, segun exista ya o no. */
  private escribirFila(fila: IPorcientoDesempenoCompetencia | null,
                       descripcion: string,
                       valor: number): Observable<any> {
    if (fila) {
      return this.porcientoController.Update({ ...fila, descripcion: fila.descripcion || descripcion, valor });
    }
    return this.porcientoController.insert({ id: 0, periodId: Number(this.periodoId), descripcion, valor });
  }

  /**
   * Lanza las escrituras en serie y RELEE del API para comprobar que quedaron.
   * No se confia en el 200: el API de prueba responde 200 sin procesar en algunos
   * casos, y el PUT ademas devuelve 204 sin cuerpo, asi que la respuesta no dice
   * nada del estado real de la fila.
   */
  private ejecutarYVerificar(operaciones: Observable<any>[],
                             esperadoDesempeno: number,
                             esperadoCompetencia: number,
                             textoExito: string): void {
    from(operaciones).pipe(
      concatMap(op => op),
      toArray(),
      switchMap(() => this.porcientoController.Gets())
    ).subscribe({
      next: (rep: ModelResponse) => {
        this.guardando = false;
        const filas: IPorcientoDesempenoCompetencia[] = Array.isArray(rep?.data) ? rep.data : [];
        const delPeriodo = filas.filter(f => Number(f?.periodId) === Number(this.periodoId));
        const d = delPeriodo.find(f => this.esDesempeno(f.descripcion));
        const c = delPeriodo.find(f => this.esCompetencia(f.descripcion));

        const okDesempeno = !!d && Math.abs(Number(d.valor) - esperadoDesempeno) <= this.TOLERANCIA;
        const okCompetencia = !!c && Math.abs(Number(c.valor) - esperadoCompetencia) <= this.TOLERANCIA;

        // se repinta con lo que el API devolvio de verdad, no con lo que se envio
        this.reconstruirEstado(filas, this.periodosCache);

        if (okDesempeno && okCompetencia) {
          this.logger.info('Ponderación: verificada tras releer del API',
            { periodoId: this.periodoId, desempeno: esperadoDesempeno, competencia: esperadoCompetencia });
          this.datosService.showMessage(
            `${textoExito}: ${esperadoDesempeno}% Desempeño / ${esperadoCompetencia}% Competencia ` +
            '(verificado releyendo del API).', this.titulo, 'success');
          this.cambios.emit();
          return;
        }

        this.logger.warn('Ponderación: el API acepto la operación pero los datos no quedaron', {
          periodoId: this.periodoId,
          esperado: { desempeno: esperadoDesempeno, competencia: esperadoCompetencia },
          leido: { desempeno: d?.valor ?? null, competencia: c?.valor ?? null }
        });
        this.datosService.showMessage(
          'El API respondió correctamente pero al releer los datos NO quedaron guardados. ' +
          `Se esperaba ${esperadoDesempeno} / ${esperadoCompetencia} y se leyó ` +
          `${d ? d.valor : 'sin fila'} / ${c ? c.valor : 'sin fila'}. Vuelva a intentarlo y, si se repite, ` +
          'verifique por base de datos antes de abrir el periodo.',
          this.titulo, 'error');
      },
      error: (err) => {
        this.guardando = false;
        this.logger.error('Ponderación: error grabando la ponderación', err, { periodoId: this.periodoId });
        this.datosService.showMessage(
          'No se pudo guardar la ponderación: ' + this.mensajeDe(err), this.titulo, 'error');
        this.cargar();
      }
    });
  }

  // ── Utilidades ────────────────────────────────────────────────────────────

  /**
   * Compara sin acentos ni mayusculas: la tabla guarda "Desempeño" con ñ.
   * NFD separa la letra de su tilde, de modo que "Desempeño" pasa a empezar
   * por "desempen" y la comparacion deja de depender del acento.
   */
  private normalizar(texto: any): string {
    return (texto ?? '').toString().trim().toLowerCase().normalize('NFD');
  }

  private esDesempeno(descripcion: any): boolean {
    return this.normalizar(descripcion).startsWith('desempen');
  }

  private esCompetencia(descripcion: any): boolean {
    return this.normalizar(descripcion).startsWith('competencia');
  }

  private mensajeDe(err: any): string {
    return err?.error?.mensaje ?? err?.error?.title ?? err?.message ?? 'error desconocido';
  }
}
