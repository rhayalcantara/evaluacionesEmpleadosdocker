import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  catchError, concatMap, debounceTime, finalize, firstValueFrom, forkJoin,
  from, map, Observable, of, reduce, Subject, switchMap, takeUntil
} from 'rxjs';

import { CategoriaPuesto } from 'src/app/Controllers/CategoriaPuesto';
import { CompetenciaCategoriaPuesto } from 'src/app/Controllers/CompetenciaCategoriaPuesto';
import { GrupoCompetencia } from 'src/app/Controllers/GrupoCompetencia';
import { Metas } from 'src/app/Controllers/Metas';
import { Objetivo } from 'src/app/Controllers/Objetivo';
import { Periodos } from 'src/app/Controllers/Periodos';
import { ICompetenciaCategoriaPuesto } from 'src/app/Models/CompetenciaCategoriaPuesto/ICompetenciaCategoriaPuesto';
import { IEstado } from 'src/app/Models/Estado/IEstado';
import { IMetaDts } from 'src/app/Models/Meta/IMeta';
import { IGrupoCompetencia, IObjetivo, IObjetivoDts } from 'src/app/Models/Objetivo/IObjetivo';
import { IPeriodo } from 'src/app/Models/Periodos/IPeriodo';
import { ICategoriaPuesto } from 'src/app/Models/Puesto/IPuesto';
import { ModelResponse } from 'src/app/Models/Usuario/modelResponse';
import { DatosServiceService } from 'src/app/Services/datos-service.service';
import { LoggerService } from 'src/app/Services/logger.service';
import { ConfirmDialogComponent } from '../../../../shared/confirm-dialog/confirm-dialog.component';
import {
  CopiarCatalogoDialogComponent, IDatosCopiadoCatalogo,
  IPlanCopiadoCatalogo, claveCompetencia
} from './copiar-catalogo-dialog.component';
import { FormCompetenciaDialogComponent, IDatosFormCompetencia } from './form-competencia-dialog.component';

/** Una competencia y su grupo, para pintar el catálogo agrupado. */
interface IGrupoConCompetencias {
  id: number;
  nombre: string;
  competencias: IObjetivoDts[];
}

/**
 * Pestaña "Catálogo y categorías" de la pantalla de Configuración de Competencias.
 *
 * Sustituye por interfaz el trabajo que hoy se hace por SQL
 * (`Docs/proceso-configuracion-competencias-periodo8.md`):
 *
 *  - §1   catálogo `Objetivo` del periodo, agrupado por grupo de competencia: alta,
 *         edición y borrado.
 *  - §1.1 matriz `CompetenciaCategoriaPuesto`: qué categorías de puesto ven cada
 *         competencia. Marcar la casilla crea la fila, desmarcarla la borra.
 *  - §3   botón "Copiar catálogo de otro periodo", el equivalente del INSERT que
 *         clonó el periodo 7 al 8, con previsualización antes de tocar nada.
 *
 * REGLA DE LA PANTALLA: el código HTTP no es evidencia. El API de prueba tiene el
 * defecto conocido de responder 200 sin haber procesado, así que después de cada
 * escritura se vuelve a leer del API y se compara con lo que se pidió; si no
 * coincide, se avisa al usuario en vez de dar la operación por buena.
 */
@Component({
  selector: 'app-cc-catalogo-categorias',
  templateUrl: './catalogo-categorias.component.html',
  styleUrls: ['./catalogo-categorias.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatDialogModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatTooltipModule
  ]
})
export class CatalogoCategoriasComponent implements OnInit, OnChanges, OnDestroy {

  /** Periodo elegido en el selector del shell. */
  @Input() periodoId!: number;

  /** true cuando el periodo elegido es el periodo activo (para advertencias). */
  @Input() periodoActivo!: boolean;

  /** Se emite tras cada alta, edición o baja para que el shell refresque los contadores. */
  @Output() cambios = new EventEmitter<void>();

  // ── Estado de la pantalla ───────────────────────────────────────────────────
  public cargando: boolean = false;
  public guardando: boolean = false;
  public verificandoUso: boolean = false;

  /** Catálogo del periodo (tabla Objetivo filtrada por periodoId). */
  public competencias: IObjetivoDts[] = [];
  /** Catálogo tras aplicar el filtro de texto; es lo que se pinta. */
  public competenciasFiltradas: IObjetivoDts[] = [];
  public gruposVisibles: IGrupoConCompetencias[] = [];

  public categorias: ICategoriaPuesto[] = [];
  public grupos: IGrupoCompetencia[] = [];
  public estados: IEstado[] = [];
  public periodos: IPeriodo[] = [];
  public periodoDescripcion: string = '';

  public filtro: string = '';

  /** Cuántas metas (Goal) usan cada competencia; solo se llena bajo demanda. */
  public usoPorCompetencia = new Map<number, number>();
  public usoVerificado: boolean = false;

  /** Celdas de la matriz con una operación en curso (para deshabilitarlas). */
  public celdasEnCurso = new Set<string>();

  /** Conteos de la matriz, precalculados para no recorrer arreglos en cada ciclo. */
  public conteoPorCategoria = new Map<number, number>();
  public conteoPorCompetencia = new Map<number, number>();

  public totalVinculos: number = 0;

  /** Casillas marcadas: claves `objetivoId|categoriaPuestoId`. */
  private marcados = new Set<string>();
  /** Id de la fila de CompetenciaCategoriaPuesto de cada casilla marcada (hace falta para borrarla). */
  private idVinculoPorClave = new Map<string, number>();

  /** Coalescencia del @Output `cambios` (en el shell dispara un recálculo caro). */
  private cambiosPendientes = new Subject<void>();
  private hayCambioSinAvisar: boolean = false;
  private destruido = new Subject<void>();

  private readonly titulo: string = 'Catálogo y categorías';

  constructor(
    private objetivoController: Objetivo,
    private vinculoController: CompetenciaCategoriaPuesto,
    private categoriaController: CategoriaPuesto,
    private grupoController: GrupoCompetencia,
    private metasController: Metas,
    private periodosController: Periodos,
    private datosService: DatosServiceService,
    private dialog: MatDialog,
    private logger: LoggerService
  ) {
    // Marcar varias casillas seguidas es una sola "operación" desde el punto de
    // vista del shell: se avisa una vez cuando el usuario para, no por casilla.
    this.cambiosPendientes.pipe(debounceTime(900), takeUntil(this.destruido)).subscribe(() => {
      this.hayCambioSinAvisar = false;
      this.cambios.emit();
    });
  }

  ngOnInit(): void {
    this.cargarTodo();
  }

  ngOnChanges(cambios: SimpleChanges): void {
    // El shell puede cambiar de periodo con la pestaña abierta.
    const p = cambios['periodoId'];
    if (p && !p.firstChange && p.currentValue !== p.previousValue) {
      this.usoVerificado = false;
      this.usoPorCompetencia.clear();
      this.cargarTodo();
    }
  }

  ngOnDestroy(): void {
    // La pestaña se destruye al cambiar de tab: si quedó un aviso en el aire por el
    // debounce, se emite ahora para que el shell no se quede con contadores viejos.
    if (this.hayCambioSinAvisar) {
      this.cambios.emit();
    }
    this.destruido.next();
    this.destruido.complete();
    this.cambiosPendientes.complete();
  }

  public ocupado(): boolean {
    return this.cargando || this.guardando || this.verificandoUso;
  }

  // ── Carga ───────────────────────────────────────────────────────────────────

  /**
   * Carga todo lo que necesita la pestaña. Cada fuente lleva su propio catchError:
   * si una falla, las demás se siguen pintando y el error se le dice al usuario con
   * el mensaje real del API, no con un texto genérico.
   */
  public cargarTodo(): void {
    if (!this.periodoId) { return; }

    this.cargando = true;
    const fallos: string[] = [];

    forkJoin({
      catalogo: this.objetivoController.Gets().pipe(
        catchError(err => { fallos.push('catálogo de competencias: ' + this.mensajeApi(err)); return of(this.respuestaVacia()); })
      ),
      categorias: this.categoriaController.Gets().pipe(
        catchError(err => { fallos.push('categorías de puesto: ' + this.mensajeApi(err)); return of(this.respuestaVacia()); })
      ),
      grupos: this.grupoController.Gets().pipe(
        catchError(err => { fallos.push('grupos de competencia: ' + this.mensajeApi(err)); return of(this.respuestaVacia()); })
      ),
      estados: this.objetivoController.getEstados().pipe(
        catchError(err => { fallos.push('estados: ' + this.mensajeApi(err)); return of([] as IEstado[]); })
      ),
      periodos: this.periodosController.Gets().pipe(
        catchError(err => { fallos.push('periodos: ' + this.mensajeApi(err)); return of(this.respuestaVacia()); })
      ),
      vinculos: this.vinculoController.Gets().pipe(
        catchError(err => { fallos.push('vínculos competencia-categoría: ' + this.mensajeApi(err)); return of([] as ICompetenciaCategoriaPuesto[]); })
      )
    }).pipe(takeUntil(this.destruido)).subscribe({
      next: (rep) => {
        this.cargando = false;

        const catalogo: IObjetivoDts[] = this.datosDe<IObjetivoDts>(rep.catalogo);
        this.competencias = catalogo
          .filter(c => c.periodoId === this.periodoId)
          .sort((a, b) => (a.grupoCompetenciaId - b.grupoCompetenciaId) || a.nombre.localeCompare(b.nombre));

        this.categorias = this.datosDe<ICategoriaPuesto>(rep.categorias)
          .sort((a, b) => a.id - b.id);
        this.grupos = this.datosDe<IGrupoCompetencia>(rep.grupos)
          .sort((a, b) => a.id - b.id);
        this.estados = Array.isArray(rep.estados) ? rep.estados : [];
        this.periodos = this.datosDe<IPeriodo>(rep.periodos).sort((a, b) => b.id - a.id);
        this.periodoDescripcion = this.periodos.find(p => p.id === this.periodoId)?.descripcion
          ?? `Periodo ${this.periodoId}`;

        this.aplicarVinculos(rep.vinculos);
        this.aplicarFiltro();

        if (this.competencias.length === 0) {
          // El controlador devuelve un Map vacío sin decir nada; la explicación la
          // pone la pestaña (ver la plantilla: bloque de "periodo sin competencias").
          this.logger.warn('Catálogo: el periodo no tiene competencias configuradas', { periodo: this.periodoId });
        }

        if (fallos.length > 0) {
          this.datosService.showMessage(
            'No se pudo leer todo: ' + fallos.join(' | '), this.titulo, 'error'
          );
        }
      },
      error: (err) => {
        this.cargando = false;
        this.logger.error('Catálogo: error cargando la pestaña', err);
        this.datosService.showMessage('No se pudo cargar la pestaña: ' + this.mensajeApi(err), this.titulo, 'error');
      }
    });
  }

  /**
   * Reconstruye la matriz a partir del listado completo de vínculos.
   *
   * Se trabaja con `Gets()` y no con `getMatrizPorPeriodo()` porque para DESMARCAR
   * hace falta el `id` de la fila de CompetenciaCategoriaPuesto (DELETE /{id}) y el
   * helper solo devuelve los CategoriaPuestoId. El recorte por periodo se hace igual:
   * solo entran los vínculos cuyas competencias están en el catálogo del periodo.
   */
  private aplicarVinculos(vinculos: ICompetenciaCategoriaPuesto[]): void {
    const delPeriodo = new Set<number>(this.competencias.map(c => c.id));

    this.marcados = new Set<string>();
    this.idVinculoPorClave = new Map<string, number>();
    this.conteoPorCategoria = new Map<number, number>();
    this.conteoPorCompetencia = new Map<number, number>();
    this.totalVinculos = 0;

    for (const vinculo of (vinculos ?? [])) {
      if (!delPeriodo.has(vinculo.objetivoId)) { continue; }

      const clave = this.claveCelda(vinculo.objetivoId, vinculo.categoriaPuestoId);
      if (this.marcados.has(clave)) {
        // Duplicado real en base de datos: se conserva el primero y se avisa al log.
        this.logger.warn('Catálogo: vínculo duplicado en el API', {
          objetivoId: vinculo.objetivoId, categoriaPuestoId: vinculo.categoriaPuestoId, id: vinculo.id
        });
        continue;
      }

      this.marcados.add(clave);
      this.idVinculoPorClave.set(clave, vinculo.id);
      this.totalVinculos++;
      this.conteoPorCategoria.set(vinculo.categoriaPuestoId, (this.conteoPorCategoria.get(vinculo.categoriaPuestoId) ?? 0) + 1);
      this.conteoPorCompetencia.set(vinculo.objetivoId, (this.conteoPorCompetencia.get(vinculo.objetivoId) ?? 0) + 1);
    }
  }

  /** Relectura de los vínculos: es la única prueba de que una casilla se guardó. */
  private releerVinculos(): Observable<ICompetenciaCategoriaPuesto[]> {
    return this.vinculoController.Gets();
  }

  /** Relectura del catálogo del periodo, tras un alta, edición o borrado. */
  private releerCatalogo(): Observable<IObjetivoDts[]> {
    return this.objetivoController.Gets().pipe(
      map((rep: ModelResponse) => this.datosDe<IObjetivoDts>(rep)
        .filter(c => c.periodoId === this.periodoId)
        .sort((a, b) => (a.grupoCompetenciaId - b.grupoCompetenciaId) || a.nombre.localeCompare(b.nombre)))
    );
  }

  public aplicarFiltro(): void {
    const texto = this.filtro.trim().toLowerCase();
    this.competenciasFiltradas = texto.length === 0
      ? [...this.competencias]
      : this.competencias.filter(c =>
          (c.nombre ?? '').toLowerCase().includes(texto) ||
          (c.descripcion ?? '').toLowerCase().includes(texto) ||
          (c.grupoc ?? c.grupoCompetencia?.nombre ?? '').toLowerCase().includes(texto));

    const porGrupo = new Map<number, IGrupoConCompetencias>();
    for (const comp of this.competenciasFiltradas) {
      let grupo = porGrupo.get(comp.grupoCompetenciaId);
      if (!grupo) {
        grupo = {
          id: comp.grupoCompetenciaId,
          nombre: this.nombreGrupo(comp),
          competencias: []
        };
        porGrupo.set(comp.grupoCompetenciaId, grupo);
      }
      grupo.competencias.push(comp);
    }
    this.gruposVisibles = Array.from(porGrupo.values()).sort((a, b) => a.id - b.id);
  }

  /** Nombre del grupo de una competencia, venga como venga del API. */
  public nombreGrupo(comp: IObjetivoDts): string {
    // El API manda el nombre en `grupoc`, pero llega vacío en las filas que no pasan
    // por el DTO; en ese caso se resuelve contra el catálogo de grupos.
    const directo = (comp.grupoc ?? comp.grupoCompetencia?.nombre ?? '').toString().trim();
    if (directo.length > 0) { return directo; }
    return this.grupos.find(g => g.id === comp.grupoCompetenciaId)?.nombre
      ?? `Grupo ${comp.grupoCompetenciaId}`;
  }

  // ── Matriz de vinculación ───────────────────────────────────────────────────

  public claveCelda(objetivoId: number, categoriaPuestoId: number): string {
    return `${objetivoId}|${categoriaPuestoId}`;
  }

  public estaVinculado(objetivoId: number, categoriaPuestoId: number): boolean {
    return this.marcados.has(this.claveCelda(objetivoId, categoriaPuestoId));
  }

  public celdaOcupada(objetivoId: number, categoriaPuestoId: number): boolean {
    return this.celdasEnCurso.has(this.claveCelda(objetivoId, categoriaPuestoId));
  }

  public categoriasDe(objetivoId: number): number {
    return this.conteoPorCompetencia.get(objetivoId) ?? 0;
  }

  public competenciasDe(categoriaPuestoId: number): number {
    return this.conteoPorCategoria.get(categoriaPuestoId) ?? 0;
  }

  /**
   * Marcar crea la fila en CompetenciaCategoriaPuesto; desmarcar la borra.
   *
   * La casilla se pinta de inmediato (optimista) y acto seguido se RELEE el listado
   * del API: si lo releído no coincide con lo pedido, la casilla vuelve a su sitio
   * sola —porque se repinta desde lo leído— y se avisa. Así un 200 vacío del API de
   * prueba no se confunde con una operación realizada.
   */
  public alternarVinculo(competencia: IObjetivoDts, categoria: ICategoriaPuesto, marcar: boolean): void {
    const clave = this.claveCelda(competencia.id, categoria.id);
    if (this.celdasEnCurso.has(clave)) { return; }

    const idVinculo = this.idVinculoPorClave.get(clave);
    if (!marcar && !idVinculo) {
      this.logger.warn('Catálogo: se pidió desmarcar una casilla sin vínculo conocido', { clave });
      this.refrescarMatriz();
      return;
    }

    this.celdasEnCurso.add(clave);
    this.pintarCelda(clave, competencia.id, categoria.id, marcar);

    const operacion$ = marcar
      ? this.vinculoController.insert({ id: 0, objetivoId: competencia.id, categoriaPuestoId: categoria.id })
      : this.vinculoController.Delete(idVinculo as number);

    operacion$.pipe(
      switchMap(() => this.releerVinculos()),
      finalize(() => this.celdasEnCurso.delete(clave)),
      takeUntil(this.destruido)
    ).subscribe({
      next: (vinculos) => {
        this.aplicarVinculos(vinculos);
        const quedo = this.marcados.has(clave);

        if (quedo === marcar) {
          this.logger.info('Catálogo: vínculo confirmado tras releer del API', {
            competencia: competencia.id, categoria: categoria.id, marcado: marcar
          });
          this.avisarCambios();
        } else {
          this.datosService.showMessage(
            `El API respondió sin error, pero al releer el listado la competencia "${competencia.nombre}" ` +
            `${marcar ? 'sigue sin estar vinculada a' : 'sigue vinculada a'} "${categoria.descripcion}". ` +
            `El cambio NO se guardó; vuelva a intentarlo.`,
            this.titulo, 'warning'
          );
          this.logger.warn('Catálogo: la relectura no confirmó el cambio de la casilla', {
            competencia: competencia.id, categoria: categoria.id, pedido: marcar
          });
        }
      },
      error: (err) => {
        this.logger.error('Catálogo: error cambiando un vínculo', err);
        this.datosService.showMessage(
          `No se pudo ${marcar ? 'vincular' : 'desvincular'} "${competencia.nombre}" con ` +
          `"${categoria.descripcion}": ${this.mensajeApi(err)}`,
          this.titulo, 'error'
        );
        this.refrescarMatriz();
      }
    });
  }

  /** Pintado optimista de una casilla mientras el API responde. */
  private pintarCelda(clave: string, objetivoId: number, categoriaId: number, marcar: boolean): void {
    if (marcar) {
      this.marcados.add(clave);
      this.conteoPorCategoria.set(categoriaId, (this.conteoPorCategoria.get(categoriaId) ?? 0) + 1);
      this.conteoPorCompetencia.set(objetivoId, (this.conteoPorCompetencia.get(objetivoId) ?? 0) + 1);
      this.totalVinculos++;
    } else {
      this.marcados.delete(clave);
      this.conteoPorCategoria.set(categoriaId, Math.max(0, (this.conteoPorCategoria.get(categoriaId) ?? 0) - 1));
      this.conteoPorCompetencia.set(objetivoId, Math.max(0, (this.conteoPorCompetencia.get(objetivoId) ?? 0) - 1));
      this.totalVinculos = Math.max(0, this.totalVinculos - 1);
    }
  }

  /** Vuelve a leer los vínculos y repinta la matriz (tras un fallo o una inconsistencia). */
  public refrescarMatriz(): void {
    this.releerVinculos().pipe(takeUntil(this.destruido)).subscribe({
      next: (vinculos) => this.aplicarVinculos(vinculos),
      error: (err) => this.logger.error('Catálogo: no se pudo releer la matriz', err)
    });
  }

  // ── Catálogo: alta, edición y borrado ───────────────────────────────────────

  public abrirFormulario(competencia?: IObjetivoDts): void {
    if (this.grupos.length === 0) {
      this.datosService.showMessage(
        'No hay grupos de competencia registrados; una competencia no puede crearse sin grupo.',
        this.titulo, 'warning'
      );
      return;
    }

    const datos: IDatosFormCompetencia = {
      competencia: competencia ? this.aPlano(competencia) : null,
      periodoId: this.periodoId,
      periodoDescripcion: this.periodoDescripcion,
      periodoActivo: this.periodoActivo,
      grupos: this.grupos,
      estados: this.estados
    };

    this.dialog.open(FormCompetenciaDialogComponent, { data: datos, width: '640px', disableClose: true })
      .afterClosed().pipe(takeUntil(this.destruido)).subscribe((payload: IObjetivo | undefined) => {
        if (payload) { this.guardarCompetencia(payload); }
      });
  }

  /**
   * Alta o edición del catálogo. Tras escribir se relee el catálogo del periodo y se
   * comprueba que la fila esté (alta) o que tenga el nombre nuevo (edición).
   */
  private guardarCompetencia(payload: IObjetivo): void {
    const esAlta = !payload.id || payload.id === 0;
    this.guardando = true;

    const operacion$ = esAlta
      ? this.objetivoController.insert(payload)
      : this.objetivoController.Update(payload);

    operacion$.pipe(
      switchMap(() => this.releerCatalogo()),
      finalize(() => { this.guardando = false; }),
      takeUntil(this.destruido)
    ).subscribe({
      next: (catalogo) => {
        this.competencias = catalogo;
        this.aplicarFiltro();
        this.refrescarMatriz();

        const clave = claveCompetencia(payload.nombre, payload.grupoCompetenciaId);
        // En una edición se comprueba también la descripción: es lo que más se edita
        // y el nombre puede no haber cambiado, así que comparar solo la clave daría
        // por buena una escritura que el API no procesó.
        const encontrada = esAlta
          ? catalogo.some(c => claveCompetencia(c.nombre, c.grupoCompetenciaId) === clave)
          : catalogo.some(c => c.id === payload.id
              && claveCompetencia(c.nombre, c.grupoCompetenciaId) === clave
              && this.normalizarTexto(c.descripcion) === this.normalizarTexto(payload.descripcion));

        if (encontrada) {
          this.datosService.showMessage(
            esAlta
              ? `Competencia "${payload.nombre}" creada y verificada releyendo el catálogo.`
              : `Competencia "${payload.nombre}" actualizada y verificada releyendo el catálogo.`,
            this.titulo, 'success'
          );
          this.avisarCambios();
        } else {
          this.datosService.showMessage(
            `El API respondió sin error, pero al releer el catálogo del periodo la competencia ` +
            `"${payload.nombre}" no quedó como se pidió. Ojo: el listado del API hace join con ` +
            `periodo, estado y grupo de competencia, así que la fila también puede haberse guardado ` +
            `con un estado o un grupo inexistente y quedar oculta. Revise antes de volver a intentarlo.`,
            this.titulo, 'warning'
          );
          this.logger.warn('Catálogo: la relectura no confirmó el guardado', { payload });
        }
      },
      error: (err) => {
        this.logger.error('Catálogo: error guardando una competencia', err);
        this.datosService.showMessage('No se pudo guardar: ' + this.mensajeApi(err), this.titulo, 'error');
      }
    });
  }

  /**
   * Borrado de una competencia del catálogo.
   *
   * Antes de preguntar se averigua cuántas metas (Goal) la usan; si no se ha
   * verificado todavía se verifica en ese momento, porque el criterio de la tarea es
   * que una competencia en uso NO se borre sin avisar de las consecuencias.
   */
  public async eliminarCompetencia(competencia: IObjetivoDts): Promise<void> {
    if (this.ocupado()) { return; }

    if (!this.usoVerificado) {
      const ok = await this.verificarUso();
      if (!ok) {
        this.datosService.showMessage(
          'No se pudo comprobar si la competencia está en uso, así que el borrado se cancela. ' +
          'Vuelva a intentarlo cuando el API responda.',
          this.titulo, 'error'
        );
        return;
      }
    }

    const usos = this.usoPorCompetencia.get(competencia.id) ?? 0;
    const vinculos = this.categoriasDe(competencia.id);

    let mensaje = `Se eliminará del catálogo la competencia "${competencia.nombre}" ` +
      `(periodo ${this.periodoDescripcion}).`;

    if (vinculos > 0) {
      mensaje += ` Primero se borrarán sus ${vinculos} vínculo(s) con categorías de puesto.`;
    }

    if (usos > 0) {
      mensaje += ` ATENCIÓN: ${usos} meta(s) de puesto (tabla Goal) la usan hoy como criterio de evaluación. ` +
        `Si se borra, esas metas se quedan sin competencia y las evaluaciones que dependan de ellas pueden ` +
        `dejar de calcularse; lo más probable es que el API rechace el borrado por integridad referencial. ` +
        `Lo correcto es borrar antes esas metas en la pestaña "Competencias por puesto".`;
    } else {
      mensaje += ' Ninguna meta de puesto la usa según el listado del API.';
    }

    if (this.periodoActivo) {
      mensaje += ' Este es el PERIODO ACTIVO: puede haber evaluaciones en curso.';
    }

    mensaje += ' El conteo sale de /api/Goals/periodo, que no lista las metas de puestos con departamento en 0, ' +
      'así que podría haber más usos de los mostrados. ¿Desea continuar?';

    const confirmado = await firstValueFrom(
      this.dialog.open(ConfirmDialogComponent, {
        width: '560px',
        data: {
          title: usos > 0 ? 'Competencia EN USO: confirme el borrado' : 'Confirme el borrado',
          message: mensaje
        }
      }).afterClosed()
    );

    if (confirmado === true) {
      await this.ejecutarBorrado(competencia);
    }
  }

  private async ejecutarBorrado(competencia: IObjetivoDts): Promise<void> {
    this.guardando = true;
    const errores: string[] = [];
    let vinculosBorrados = 0;

    try {
      // 1. Los vínculos primero: el Objetivo no se puede borrar mientras los tenga.
      for (const categoria of this.categorias) {
        const clave = this.claveCelda(competencia.id, categoria.id);
        const idVinculo = this.idVinculoPorClave.get(clave);
        if (!idVinculo) { continue; }
        try {
          await firstValueFrom(this.vinculoController.Delete(idVinculo));
          vinculosBorrados++;
        } catch (err: any) {
          errores.push(`vínculo con "${categoria.descripcion}": ${this.mensajeApi(err)}`);
        }
      }

      // 2. La competencia. `Objetivo.delete` ya muestra su propio mensaje de error
      //    del API; aquí solo interesa si terminó bien para poder verificar.
      const borrada = await this.objetivoController.delete(competencia.id);

      // 3. Verificación: la única prueba es releer.
      const catalogo = await firstValueFrom(this.releerCatalogo());
      const vinculos = await firstValueFrom(this.releerVinculos());
      this.competencias = catalogo;
      this.aplicarVinculos(vinculos);
      this.aplicarFiltro();

      const sigue = catalogo.some(c => c.id === competencia.id);

      if (!sigue) {
        this.usoPorCompetencia.delete(competencia.id);
        this.datosService.showMessage(
          `Competencia "${competencia.nombre}" eliminada (y ${vinculosBorrados} vínculo(s)), ` +
          `verificado releyendo el catálogo.` +
          (errores.length > 0 ? ` Con incidencias: ${errores.join(' | ')}` : ''),
          this.titulo, errores.length > 0 ? 'warning' : 'success'
        );
        this.avisarCambios();
      } else {
        this.datosService.showMessage(
          `La competencia "${competencia.nombre}" SIGUE en el catálogo tras el intento de borrado` +
          (borrada ? ' (el API respondió sin error)' : '') + '. ' +
          (errores.length > 0 ? `Incidencias: ${errores.join(' | ')}` : 'Revise si alguna meta la está usando.'),
          this.titulo, 'error'
        );
        this.logger.warn('Catálogo: la relectura no confirmó el borrado', { id: competencia.id });
        if (vinculosBorrados > 0) { this.avisarCambios(); }
      }
    } catch (err: any) {
      this.logger.error('Catálogo: error eliminando una competencia', err);
      this.datosService.showMessage('No se pudo eliminar: ' + this.mensajeApi(err), this.titulo, 'error');
    } finally {
      this.guardando = false;
    }
  }

  // ── Uso en metas (Goal) ─────────────────────────────────────────────────────

  /**
   * Cuenta cuántas metas usan cada competencia, recorriendo TODOS los periodos.
   *
   * Hay que mirar todos: en la base de prueba las metas del periodo 8 apuntan tanto a
   * competencias del 8 como a las del 7, así que mirar solo el periodo en pantalla
   * daría cero para competencias que sí están en uso.
   *
   * Se pide periodo por periodo (`GET /api/Goals/periodo`) y no `GET /api/Goals`,
   * que en el servidor de prueba son 15 MB y medio minuto. Aun así es una consulta
   * cara, por eso NO se lanza al abrir la pestaña: solo bajo demanda.
   */
  public async verificarUso(): Promise<boolean> {
    if (this.usoVerificado) { return true; }

    this.verificandoUso = true;
    try {
      const periodos = this.periodos.length > 0
        ? this.periodos
        : this.datosDe<IPeriodo>(await firstValueFrom(this.periodosController.Gets()));

      const fallidos: number[] = [];
      const conteo = await firstValueFrom(
        from(periodos.map(p => p.id)).pipe(
          concatMap((id: number) => this.metasController.getmetasperiodo(id).pipe(
            catchError(err => {
              fallidos.push(id);
              this.logger.error('Catálogo: no se pudieron leer las metas de un periodo', err, { periodo: id });
              return of([] as IMetaDts[]);
            })
          )),
          reduce((acumulado: Map<number, number>, metas: IMetaDts[]) => {
            for (const meta of (metas ?? [])) {
              const objetivoId = this.metasController.objetivoDe(meta);
              if (objetivoId > 0) {
                acumulado.set(objetivoId, (acumulado.get(objetivoId) ?? 0) + 1);
              }
            }
            return acumulado;
          }, new Map<number, number>())
        )
      );

      this.usoPorCompetencia = conteo;
      this.usoVerificado = fallidos.length === 0;

      if (fallidos.length > 0) {
        this.datosService.showMessage(
          `No se pudieron leer las metas de los periodos ${fallidos.join(', ')}: el conteo de uso está incompleto.`,
          this.titulo, 'warning'
        );
      }
      this.logger.info('Catálogo: uso de competencias verificado', {
        periodosLeidos: periodos.length, competenciasEnUso: conteo.size
      });
      return true;
    } catch (err: any) {
      this.logger.error('Catálogo: error verificando el uso de las competencias', err);
      this.datosService.showMessage('No se pudo verificar el uso: ' + this.mensajeApi(err), this.titulo, 'error');
      return false;
    } finally {
      this.verificandoUso = false;
    }
  }

  public textoUso(competencia: IObjetivoDts): string {
    const usos = this.usoPorCompetencia.get(competencia.id) ?? 0;
    return usos === 0 ? 'sin uso en metas' : `${usos} meta(s) la usan`;
  }

  public enUso(competencia: IObjetivoDts): boolean {
    return (this.usoPorCompetencia.get(competencia.id) ?? 0) > 0;
  }

  // ── Copiado desde otro periodo ──────────────────────────────────────────────

  public abrirCopiado(): void {
    if (this.periodos.length < 2) {
      this.datosService.showMessage(
        'No hay otro periodo del que copiar el catálogo.', this.titulo, 'warning'
      );
      return;
    }

    const datos: IDatosCopiadoCatalogo = {
      periodoDestinoId: this.periodoId,
      periodoDestinoDescripcion: this.periodoDescripcion,
      periodoDestinoActivo: this.periodoActivo,
      periodos: this.periodos,
      categorias: this.categorias,
      competenciasDestino: this.competencias,
      vinculosDestino: Array.from(this.marcados)
    };

    this.dialog.open(CopiarCatalogoDialogComponent, { data: datos, width: '680px' })
      .afterClosed().pipe(takeUntil(this.destruido)).subscribe((plan: IPlanCopiadoCatalogo | undefined) => {
        if (plan) { this.ejecutarCopiado(plan); }
      });
  }

  /**
   * Ejecuta el plan aprobado en la previsualización, en el mismo orden que el script
   * SQL del periodo 8: primero las competencias que faltan, después sus vínculos.
   *
   * Los ids de las competencias recién creadas NO se toman de la respuesta del POST:
   * se resuelven releyendo el catálogo y emparejando por nombre + grupo. Así, si el
   * API dijo 201 pero no guardó, el vínculo no se crea colgando de un id inventado.
   */
  private async ejecutarCopiado(plan: IPlanCopiadoCatalogo): Promise<void> {
    this.guardando = true;
    const errores: string[] = [];
    let competenciasCreadas = 0;
    let vinculosCreados = 0;
    let vinculosSaltados = 0;

    try {
      for (const competencia of plan.competenciasACrear) {
        try {
          await firstValueFrom(this.objetivoController.insert(competencia));
        } catch (err: any) {
          errores.push(`competencia "${competencia.nombre}": ${this.mensajeApi(err)}`);
        }
      }

      // Relectura 1: qué competencias hay ahora de verdad en el periodo destino.
      let catalogo = await firstValueFrom(this.releerCatalogo());
      const idPorClave = new Map<string, number>();
      for (const c of catalogo) {
        idPorClave.set(claveCompetencia(c.nombre, c.grupoCompetenciaId), c.id);
      }
      competenciasCreadas = plan.competenciasACrear
        .filter(c => idPorClave.has(claveCompetencia(c.nombre, c.grupoCompetenciaId))).length;

      const noCreadas = plan.competenciasACrear.length - competenciasCreadas;
      if (noCreadas > 0) {
        errores.push(`${noCreadas} competencia(s) no aparecen en el catálogo tras crearlas`);
      }

      // Los vínculos que ya existían en el destino al momento de ejecutar.
      const vinculosActuales = await firstValueFrom(this.releerVinculos());
      const yaExiste = new Set<string>(
        vinculosActuales.map(v => this.claveCelda(v.objetivoId, v.categoriaPuestoId))
      );

      for (const vinculo of plan.vinculosACrear) {
        const objetivoId = idPorClave.get(vinculo.clave);
        if (!objetivoId) {
          errores.push(`vínculo de "${vinculo.nombre}" con "${vinculo.categoria}": la competencia no existe en el destino`);
          continue;
        }
        const clave = this.claveCelda(objetivoId, vinculo.categoriaPuestoId);
        if (yaExiste.has(clave)) { vinculosSaltados++; continue; }

        try {
          await firstValueFrom(this.vinculoController.insert({
            id: 0, objetivoId: objetivoId, categoriaPuestoId: vinculo.categoriaPuestoId
          }));
          yaExiste.add(clave);
        } catch (err: any) {
          errores.push(`vínculo de "${vinculo.nombre}" con "${vinculo.categoria}": ${this.mensajeApi(err)}`);
        }
      }

      // Relectura 2: se cuenta sobre lo leído, no sobre lo que dijeron los POST.
      catalogo = await firstValueFrom(this.releerCatalogo());
      const vinculosFinales = await firstValueFrom(this.releerVinculos());
      this.competencias = catalogo;
      this.aplicarVinculos(vinculosFinales);
      this.aplicarFiltro();

      const clavesFinales = new Set<string>(
        vinculosFinales.map(v => this.claveCelda(v.objetivoId, v.categoriaPuestoId))
      );
      vinculosCreados = plan.vinculosACrear.filter(v => {
        const objetivoId = idPorClave.get(v.clave);
        return !!objetivoId && clavesFinales.has(this.claveCelda(objetivoId, v.categoriaPuestoId));
      }).length - vinculosSaltados;
      if (vinculosCreados < 0) { vinculosCreados = 0; }

      this.usoVerificado = false;

      const resumen =
        `Copiado desde "${plan.periodoOrigenDescripcion}": ` +
        `${competenciasCreadas} de ${plan.competenciasACrear.length} competencia(s) y ` +
        `${vinculosCreados} de ${plan.vinculosACrear.length} vínculo(s) creados y confirmados releyendo el API. ` +
        `Se saltaron ${plan.competenciasExistentes.length} competencia(s) y ` +
        `${plan.vinculosExistentes + vinculosSaltados} vínculo(s) que ya existían.`;

      this.datosService.showMessage(
        errores.length > 0 ? `${resumen} Incidencias: ${errores.slice(0, 5).join(' | ')}` : resumen,
        this.titulo, errores.length > 0 ? 'warning' : 'success'
      );
      this.logger.info('Catálogo: copiado ejecutado', {
        origen: plan.periodoOrigenId, destino: this.periodoId,
        competenciasCreadas, vinculosCreados, errores: errores.length
      });

      if (competenciasCreadas > 0 || vinculosCreados > 0) { this.avisarCambios(); }

    } catch (err: any) {
      this.logger.error('Catálogo: error ejecutando el copiado', err);
      this.datosService.showMessage('El copiado falló: ' + this.mensajeApi(err), this.titulo, 'error');
      this.cargarTodo();
    } finally {
      this.guardando = false;
    }
  }

  // ── Utilidades ──────────────────────────────────────────────────────────────

  /** Coalesce el aviso al shell: emitir dispara ahí un recálculo caro. */
  private avisarCambios(): void {
    this.hayCambioSinAvisar = true;
    this.cambiosPendientes.next();
  }

  private aPlano(competencia: IObjetivoDts): IObjetivo {
    return {
      id: competencia.id,
      grupoCompetenciaId: competencia.grupoCompetenciaId,
      nombre: competencia.nombre,
      descripcion: competencia.descripcion,
      periodoId: competencia.periodoId,
      estadoId: competencia.estadoId,
      fecha: competencia.fecha
    } as IObjetivo;
  }

  /** Compara textos largos sin que un salto de línea de Windows cuente como diferencia. */
  private normalizarTexto(texto: any): string {
    return (texto ?? '').toString().replace(/\r\n/g, '\n').trim();
  }

  private datosDe<T>(respuesta: ModelResponse | null | undefined): T[] {
    return Array.isArray(respuesta?.data) ? (respuesta!.data as T[]) : [];
  }

  private respuestaVacia(): ModelResponse {
    return { exito: 0, mensaje: '', count: 0, data: [] };
  }

  /** Mensaje real del API cuando lo hay; nunca un texto genérico si se puede evitar. */
  private mensajeApi(err: any): string {
    return err?.error?.mensaje
      ?? err?.error?.title
      ?? (typeof err?.error === 'string' ? err.error : null)
      ?? err?.message
      ?? 'error desconocido';
  }

  public trackGrupo = (_: number, grupo: IGrupoConCompetencias): number => grupo.id;
  public trackCompetencia = (_: number, competencia: IObjetivoDts): number => competencia.id;
  public trackCategoria = (_: number, categoria: ICategoriaPuesto): number => categoria.id;
}
