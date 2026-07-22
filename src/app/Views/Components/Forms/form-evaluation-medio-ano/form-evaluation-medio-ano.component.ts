import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';

import { IEmpleado } from 'src/app/Models/Empleado/IEmpleado';
import { IPeriodo } from 'src/app/Models/Periodos/IPeriodo';
import { IEvaluacion, IEvalucionResultDto, IEvaluacionGoal, IGoalEmpleadoRespuesta } from 'src/app/Models/Evaluacion/IEvaluacion';
import { Evaluacion } from 'src/app/Controllers/Evaluacion';
import { DatosServiceService } from 'src/app/Services/datos-service.service';
import { Empleados } from 'src/app/Controllers/Empleados';
import { Periodos } from 'src/app/Controllers/Periodos';
import { ComunicacionService } from 'src/app/Services/comunicacion.service';
import { LoadingComponent } from '../../loading/loading.component';
import { IResultadoLogro } from 'src/app/Models/EvaluacionDesempenoMeta/IEvaluacionDesempenoMeta';
import { IAccionPlan } from 'src/app/Models/Evaluacion/IAccionPlan';
import { PlanAccionMatrizComponent } from '../plan-accion-matriz/plan-accion-matriz.component';
import { finalize } from 'rxjs/operators';

interface IQualitativeFeedback {
  texto: string;
  competencias: number[];
}

interface ICierreFeedback {
  comentarios: string;
  compromisos: string;
  planAccion?: IAccionPlan[];
}

@Component({
  selector: 'app-form-evaluation-medio-ano',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule],
  templateUrl: './form-evaluation-medio-ano.component.html',
  styleUrls: ['./form-evaluation-medio-ano.component.css']
})
export class FormEvaluationMedioAnoComponent implements OnInit {
  @Input() empleado: IEmpleado = this.empleadocontroller.inicializamodelo();
  @Input() periodo: IPeriodo = this.periodocontroller.inicializamodelo();
  @Input() titulo: string = "Evaluación de Medio Año";
  @Input() supervisor: boolean = false;
  @Input() mostargrabar: boolean = true;
  @Input() mostarAceptar: boolean = false;
  @Input() mostarAceptarBoton: boolean = false;
  @Input() puntuacionFinal: number = 0;
  @Output() dataEmitter: EventEmitter<string> = new EventEmitter();

  public evaluacionempleado!: IEvaluacion;
  public logoBase64: string = '';
  public dialogRef: any;
  public fecha: Date = new Date();

  // Campos de Retroalimentación Start-Stop-Continue-More (Modelo estructurado)
  public feedbackColab = {
    continuar: { texto: '', competencias: [] as number[] },
    mas: { texto: '', competencias: [] as number[] },
    menos: { texto: '', competencias: [] as number[] },
    parar: { texto: '', competencias: [] as number[] }
  };

  public feedbackSuper = {
    continuar: { texto: '', competencias: [] as number[] },
    mas: { texto: '', competencias: [] as number[] },
    menos: { texto: '', competencias: [] as number[] },
    parar: { texto: '', competencias: [] as number[] }
  };

  public colaboradorComentarios: string = '';
  public colaboradorCompromisos: string = '';
  public supervisorComentarios: string = '';
  public supervisorCompromisos: string = '';
  public planAccion: IAccionPlan[] = [];

  // Objetivos de desempeño
  public desempeno: IEvalucionResultDto[] = [];
  public resultadologro: IResultadoLogro[] = [];
  public totalPeso: number = 0;
  public sololectura: boolean = false;

  // Opciones de calificación para tabla de competencias
  public readonly calificaciones: { valor: number; etiqueta: string }[] = [
    { valor: 0, etiqueta: '— Seleccione —' },
    { valor: 1, etiqueta: '(1) Deficiente' },
    { valor: 2, etiqueta: '(2) Necesita Mejorar' },
    { valor: 3, etiqueta: '(3) Cumple' },
    { valor: 4, etiqueta: '(4) Muy Efectivo' },
    { valor: 5, etiqueta: '(5) Excelente' },
  ];

  constructor(
    public EvaluacionController: Evaluacion,
    private datos: DatosServiceService,
    private empleadocontroller: Empleados,
    private periodocontroller: Periodos,
    private ServiceComunicacion: ComunicacionService,
    private cd: ChangeDetectorRef,
    private router: Router,
    private toastr: MatDialog,
    private http: HttpClient,
  ) {
    this.evaluacionempleado = this.EvaluacionController.inicializamodelo();
  }

  ngOnInit(): void {
    this.loadLogoAsBase64();

    // Modal de carga (disableClose). finalize() garantiza el cierre en next/error/complete
    // y ante teardown, evitando que el overlay quede bloqueando la app (incluido el menú).
    this.dialogRef = this.toastr.open(LoadingComponent, {
      width: '340px',
      height: '180px',
      disableClose: true
    });

    this.EvaluacionController.GetEvaluacionePorEmpleadoyPeriodo(this.empleado.secuencial, this.periodo.id)
      .pipe(finalize(() => this.cerrarLoading()))
      .subscribe({
        next: (rep: IEvaluacion) => {
            this.evaluacionempleado = rep;
            this.EvaluacionController.model = rep;

            // Manejo de visibilidad de botones según estado de la evaluación
            if (this.evaluacionempleado.estadoevaluacion === "Enviado") {
              this.mostarAceptar = true;
              this.mostarAceptarBoton = true;
              this.mostargrabar = false;
            } else if (this.evaluacionempleado.estadoevaluacion === "Completado") {
              this.mostarAceptar = true;
              this.mostargrabar = false;
              this.mostarAceptarBoton = false;
            } else {
              this.mostarAceptar = false;
              this.mostarAceptarBoton = false;
              this.mostargrabar = true;
            }

            // Cargar campos cualitativos y parsear si vienen en formato JSON
            this.parseQualitativeFields();

            // Asegurar arreglos para evitar excepciones si el API no los envía
            this.evaluacionempleado.evaluacionGoals = this.evaluacionempleado.evaluacionGoals || [];
            this.evaluacionempleado.goalEmpleadoRespuestas = this.evaluacionempleado.goalEmpleadoRespuestas || [];
            this.evaluacionempleado.evaluacionDesempenoMetas = this.evaluacionempleado.evaluacionDesempenoMetas || [];
            // Asegurar respuestas de competencias
            this.evaluacionempleado.evaluacionGoals.forEach((goal, i) => {
              if (!this.evaluacionempleado.goalEmpleadoRespuestas[i]) {
                this.evaluacionempleado.goalEmpleadoRespuestas.splice(i, 0, {
                  id: 0,
                  evaluacionId: rep.id,
                  goalId: goal.goalId,
                  repuesta: 0,
                  repuestasupervisor: 0,
                  weight: 0,
                  observacion: '',
                  observacionsupervisor: ''
                });
              }
            });
            // Buscar objetivos de desempeño asociados
            this.EvaluacionController.GetsEvaluacionResultado(rep.id)
              .subscribe({
                next: (ores) => {
                  this.desempeno = ores?.data || [];
                  this.totalPeso = this.desempeno.reduce((sum, item) => sum + Number(item.peso), 0);
                  this.resultadologro = [];
                  this.desempeno.forEach((item, index) => {
                    const metaAsociada = this.evaluacionempleado.evaluacionDesempenoMetas.find(x => x.id === item.id);
                    this.resultadologro.push({
                      id: item.id,
                      EvaluacionId: rep.id,
                      logro: Number(metaAsociada?.evaluacioneDesempenoMetaRespuestas?.logro || 0),
                      porcientologro: 0,
                      resultadologro: 0,
                      medioverificacion: metaAsociada?.evaluacioneDesempenoMetaRespuestas?.medioverificacion || '',
                      comentario: metaAsociada?.evaluacioneDesempenoMetaRespuestas?.comentario || '',
                      comentariosupervisor: '', // Se limpia para evitar error TS (no existe en DB de metas)
                      peso: item.peso
                    });
                    this.calcularLogro(index);
                  });
                  // Recalcular el agrupado UNA sola vez (referencia estable para *ngFor)
                  this.agruparObjetivos();
                  this.cd.detectChanges();
                },
                error: (err) => {
                  console.error('Error al obtener los resultados de desempeño:', err);
                }
              });
        },
        error: (err: any) => {
          // El interceptor re-lanza el error como string ("Not Found"), no como HttpErrorResponse
          const is404 = err?.status === 404 || err === 'Not Found' || String(err).toLowerCase().includes('not found');
          if (is404) {
            // Inicializar nueva evaluación para periodo de medio año
            this.evaluacionempleado = this.EvaluacionController.inicializamodelo();
            this.evaluacionempleado.periodId = this.periodo.id;
            this.evaluacionempleado.empleadoSecuencial = this.empleado.secuencial;
            this.evaluacionempleado.estadoevaluacion = 'Borrador';
            this.EvaluacionController.model = this.evaluacionempleado;

            this.mostarAceptar = false;
            this.mostarAceptarBoton = false;
            this.mostargrabar = true;

            this.cerrarLoading();
            this.datos.showMessage(
              `No se encontró evaluación previa. Se iniciará una autoevaluación para el periodo de medio año: ${this.periodo.descripcion}.`,
              this.titulo,
              "info"
            );
          } else {
            console.error('Error al obtener la evaluación:', err);
            this.cerrarLoading();
            this.datos.showMessage("Error al cargar la evaluación", this.titulo, "error");
          }
        }
      });
  }

  /** Cierra el diálogo de carga de forma segura e idempotente. */
  private cerrarLoading(): void {
    try {
      this.dialogRef?.close();
    } catch (e) {
      console.error('Error al cerrar el loading:', e);
    }
    this.dialogRef = null;
  }

  private loadLogoAsBase64() {
    this.http.get('assets/LOGO-COOPASPIRE.png', { responseType: 'blob' }).subscribe(blob => {
      const reader = new FileReader();
      reader.onloadend = () => {
        this.logoBase64 = reader.result as string;
      };
      reader.readAsDataURL(blob);
    });
  }

  private parseQualitativeFields() {
    // Colaborador
    this.feedbackColab.continuar = this.safeJsonParse(this.evaluacionempleado.colaboradorContinuar);
    this.feedbackColab.mas = this.safeJsonParse(this.evaluacionempleado.colaboradorHacerMas);
    this.feedbackColab.menos = this.safeJsonParse(this.evaluacionempleado.colaboradorHacerMenos);
    this.feedbackColab.parar = this.safeJsonParse(this.evaluacionempleado.colaboradorParar);

    // Supervisor
    this.feedbackSuper.continuar = this.safeJsonParse(this.evaluacionempleado.supervisorContinuar);
    this.feedbackSuper.mas = this.safeJsonParse(this.evaluacionempleado.supervisorHacerMas);
    this.feedbackSuper.menos = this.safeJsonParse(this.evaluacionempleado.supervisorHacerMenos);
    this.feedbackSuper.parar = this.safeJsonParse(this.evaluacionempleado.supervisorParar);

    // "Plan de Acción, Compromiso y Comentario" se guarda como JSON { comentarios, compromisos }
    // en los campos *Compromisos existentes (sin tocar la BD). Las claves conservan los nombres
    // originales aunque los rótulos en pantalla cambiaron (comentarios = "Plan de acción",
    // compromisos = "Compromiso y Comentario"). Datos viejos en texto plano se interpretan
    // como "compromisos" para mantener compatibilidad.
    const cierreColab = this.parseCierre(this.evaluacionempleado.colaboradorCompromisos);
    this.colaboradorComentarios = cierreColab.comentarios;
    this.colaboradorCompromisos = cierreColab.compromisos;
    this.planAccion = cierreColab.planAccion ?? [];

    const cierreSuper = this.parseCierre(this.evaluacionempleado.supervisorCompromisos);
    this.supervisorComentarios = cierreSuper.comentarios;
    this.supervisorCompromisos = cierreSuper.compromisos;
  }

  private parseCierre(val: string | undefined): ICierreFeedback {
    if (!val) {
      return { comentarios: '', compromisos: '' };
    }
    try {
      const obj = JSON.parse(val);
      // Validar que sea el objeto esperado (y no, p.ej., un número o arreglo)
      if (obj && typeof obj === 'object' && ('comentarios' in obj || 'compromisos' in obj)) {
        return {
          comentarios: obj.comentarios || '',
          compromisos: obj.compromisos || '',
          planAccion: Array.isArray(obj.planAccion) ? obj.planAccion : []
        };
      }
      return { comentarios: '', compromisos: val };
    } catch {
      // Dato viejo en texto plano → era un compromiso
      return { comentarios: '', compromisos: val };
    }
  }

  private stringifyCierre(comentarios: string, compromisos: string, planAccion?: IAccionPlan[]): string {
    const cierre: ICierreFeedback = { comentarios, compromisos };
    if (planAccion && planAccion.length > 0) {
      cierre.planAccion = planAccion;
    }
    return JSON.stringify(cierre);
  }

  /** Abre la matriz de plan de acción. El colaborador la edita; supervisor y solo-lectura la ven. */
  public abrirPlanAccion(): void {
    const ref = this.toastr.open(PlanAccionMatrizComponent, {
      width: '1100px',
      maxWidth: '95vw',
      data: { filas: this.planAccion, sololectura: this.supervisor || this.sololectura }
    });
    ref.afterClosed().subscribe((filas?: IAccionPlan[]) => {
      if (filas) {
        this.planAccion = filas;
      }
    });
  }

  private safeJsonParse(val: string | undefined): IQualitativeFeedback {
    if (!val) {
      return { texto: '', competencias: [] };
    }
    try {
      return JSON.parse(val) as IQualitativeFeedback;
    } catch {
      // Si no es JSON (dato viejo o texto plano directo), retornar el valor directo como texto
      return { texto: val, competencias: [] };
    }
  }

  private stringifyFeedback(val: IQualitativeFeedback): string {
    return JSON.stringify(val);
  }

  public onCompetenciaSeleccionada(feedbackObj: IQualitativeFeedback, compIdStr: string) {
    const compId = Number(compIdStr);
    if (!compId) return;
    if (feedbackObj.competencias.includes(compId)) return;
    if (feedbackObj.competencias.length >= 3) {
      this.datos.showMessage("Solo puede vincular hasta 3 competencias por sección", this.titulo, "warning");
      return;
    }
    feedbackObj.competencias.push(compId);
  }

  public removerCompetenciaVinculada(feedbackObj: IQualitativeFeedback, compId: number) {
    feedbackObj.competencias = feedbackObj.competencias.filter(id => id !== compId);
  }

  public getCompetenciaNombre(compId: number): string {
    const item = this.evaluacionempleado?.evaluacionGoals?.find(x => x.goalId === compId);
    return item?.goal?.objetivo?.nombre || `Competencia ${compId}`;
  }

  // Competencias expandidas (descripcion visible)
  public expandedCompetencias = new Set<number>();
  public toggleCompetencia(index: number) {
    this.expandedCompetencias.has(index)
      ? this.expandedCompetencias.delete(index)
      : this.expandedCompetencias.add(index);
  }

  // Agrupa desempeno por tipo preservando los índices originales para acceder a resultadologro[]
  // Memoizado: se recalcula SOLO cuando cambia `desempeno` (vía agruparObjetivos()).
  // Antes era un getter que devolvía un arreglo NUEVO en cada ciclo de detección de cambios;
  // usado en *ngFor hacía que Angular recreara todo el árbol y entrara en un loop infinito
  // de change detection (congelaba el hilo principal). Ahora es una referencia estable.
  public objetivosAgrupados: { tipo: string; filas: { row: IEvalucionResultDto; idx: number }[] }[] = [];

  private agruparObjetivos(): void {
    const order = ['KRI', 'KPI', 'Objetivo', 'Proyecto'];
    const map = new Map<string, { row: IEvalucionResultDto; idx: number }[]>();
    this.desempeno.forEach((row, idx) => {
      const tipo = row.tipo || 'Otro';
      if (!map.has(tipo)) map.set(tipo, []);
      map.get(tipo)!.push({ row, idx });
    });
    const result: { tipo: string; filas: { row: IEvalucionResultDto; idx: number }[] }[] = [];
    order.forEach(t => { if (map.has(t)) result.push({ tipo: t, filas: map.get(t)! }); });
    map.forEach((filas, tipo) => { if (!order.includes(tipo)) result.push({ tipo, filas }); });
    this.objetivosAgrupados = result;
  }

  public calcularLogro(index: number) {
    const row = this.desempeno[index];
    const res = this.resultadologro[index];
    if (!row || !res) return;

    if (row.inverso) {
      res.porcientologro = res.logro > 0 ? (row.meta / res.logro) * 100 : 0;
    } else {
      res.porcientologro = row.meta > 0 ? (res.logro / row.meta) * 100 : 0;
    }
    res.resultadologro = (res.porcientologro * row.meta) / 100;
  }

  public onLogroChange(event: any, index: number) {
    const val = Number(event.target.value);
    this.resultadologro[index].logro = val;
    this.calcularLogro(index);

    if (this.evaluacionempleado.evaluacionDesempenoMetas[index]) {
      if (!this.evaluacionempleado.evaluacionDesempenoMetas[index].evaluacioneDesempenoMetaRespuestas) {
        this.evaluacionempleado.evaluacionDesempenoMetas[index].evaluacioneDesempenoMetaRespuestas = {
          id: 0,
          evaluacionDesempenoMetaId: this.evaluacionempleado.evaluacionDesempenoMetas[index].id,
          logro: val,
          supervisado_logro: 0,
          medioverificacion: this.resultadologro[index].medioverificacion,
          comentario: this.resultadologro[index].comentario
        };
      } else {
        this.evaluacionempleado.evaluacionDesempenoMetas[index].evaluacioneDesempenoMetaRespuestas!.logro = val;
      }
    }
  }

  public onMedioverificacionChange(event: any, index: number) {
    const val = event.target.value;
    this.resultadologro[index].medioverificacion = val;
    if (this.evaluacionempleado.evaluacionDesempenoMetas[index]?.evaluacioneDesempenoMetaRespuestas) {
      this.evaluacionempleado.evaluacionDesempenoMetas[index].evaluacioneDesempenoMetaRespuestas!.medioverificacion = val;
    }
  }

  public onComentarioObjetivoChange(event: any, index: number) {
    const val = event.target.value;
    this.resultadologro[index].comentario = val;
    if (this.evaluacionempleado.evaluacionDesempenoMetas[index]?.evaluacioneDesempenoMetaRespuestas) {
      this.evaluacionempleado.evaluacionDesempenoMetas[index].evaluacioneDesempenoMetaRespuestas!.comentario = val;
    }
  }

  public onComentarioObjetivoSupervisorChange(event: any, index: number) {
    const val = event.target.value;
    this.resultadologro[index].comentariosupervisor = val;
    if (this.evaluacionempleado.evaluacionDesempenoMetas[index]?.evaluacioneDesempenoMetaRespuestas) {
      this.evaluacionempleado.evaluacionDesempenoMetas[index].evaluacioneDesempenoMetaRespuestas!.comentario = val; // Se guarda en el comentario común
    }
  }

  public async onSubmit() {
    if (!this.evaluacionempleado) return;

    // Guardar estructurados de Retroalimentación en campos String de la base de datos
    this.evaluacionempleado.colaboradorContinuar = this.stringifyFeedback(this.feedbackColab.continuar);
    this.evaluacionempleado.colaboradorHacerMas = this.stringifyFeedback(this.feedbackColab.mas);
    this.evaluacionempleado.colaboradorHacerMenos = this.stringifyFeedback(this.feedbackColab.menos);
    this.evaluacionempleado.colaboradorParar = this.stringifyFeedback(this.feedbackColab.parar);

    this.evaluacionempleado.supervisorContinuar = this.stringifyFeedback(this.feedbackSuper.continuar);
    this.evaluacionempleado.supervisorHacerMas = this.stringifyFeedback(this.feedbackSuper.mas);
    this.evaluacionempleado.supervisorHacerMenos = this.stringifyFeedback(this.feedbackSuper.menos);
    this.evaluacionempleado.supervisorParar = this.stringifyFeedback(this.feedbackSuper.parar);

    this.evaluacionempleado.colaboradorCompromisos = this.stringifyCierre(this.colaboradorComentarios, this.colaboradorCompromisos, this.planAccion);
    this.evaluacionempleado.supervisorCompromisos = this.stringifyCierre(this.supervisorComentarios, this.supervisorCompromisos);

    // Estado de la evaluación
    if (this.supervisor) {
      this.evaluacionempleado.estadoevaluacion = 'EvaluadoPorSupervisor';
    } else {
      this.evaluacionempleado.estadoevaluacion = 'AutoEvaluado';
    }

    // Recalcular logros de todas las metas antes de persistir
    this.resultadologro.forEach((_, index) => {
      this.calcularLogro(index);
    });

    // Registrar firma electrónica con la fecha actual si aún no tiene valor
    if (!this.evaluacionempleado.fechaRepuestas) {
      this.evaluacionempleado.fechaRepuestas = new Date().toISOString().split('T')[0];
    }

    this.EvaluacionController.model = this.evaluacionempleado;
    this.dialogRef = this.toastr.open(LoadingComponent, { disableClose: true });

    try {
      // Calcular totalCalculo, desempeñoFinal y puntuaciones de competencia
      await this.EvaluacionController.calculaelpromediodesempeno(this.supervisor, this.resultadologro);

      await this.EvaluacionController.grabar(this.supervisor);
      this.cerrarLoading();
      this.datos.showMessage("Evaluación de medio año guardada exitosamente.", this.titulo, "success");
      if (this.supervisor) {
        this.dataEmitter.emit("grabado");
      } else {
        this.router.navigate(['/Home']);
      }
    } catch (err) {
      this.cerrarLoading();
      console.error(err);
      this.datos.showMessage("Error al guardar la evaluación de medio año.", this.titulo, "error");
    }
  }

  public onAceptar() {
    if (!this.evaluacionempleado) return;

    this.evaluacionempleado.estadoevaluacion = 'Completado';
    this.EvaluacionController.model = this.evaluacionempleado;
    this.dialogRef = this.toastr.open(LoadingComponent, { disableClose: true });

    this.EvaluacionController.grabar(this.supervisor).then(() => {
      this.cerrarLoading();
      this.datos.showMessage("Evaluación de medio año completada.", this.titulo, "success");
      this.dataEmitter.emit("grabado");
    }).catch(err => {
      this.cerrarLoading();
      console.error(err);
      this.datos.showMessage("Error al completar la evaluación.", this.titulo, "error");
    });
  }

  public cancelar() {
    if (this.supervisor) {
      this.dataEmitter.emit("cancelar");
    } else {
      this.router.navigate(['/Home']);
    }
  }
}
