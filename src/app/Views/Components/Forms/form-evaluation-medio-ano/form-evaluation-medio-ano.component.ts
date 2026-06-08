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
import { ICursoCapacitacion, IEvaluacionCursoCapacitacion } from 'src/app/Models/Capacitacion/Cursos';
import { CursoCapacitacionController } from 'src/app/Controllers/CursoCapacitacion';
import { IResultadoLogro } from 'src/app/Models/EvaluacionDesempenoMeta/IEvaluacionDesempenoMeta';

interface IQualitativeFeedback {
  texto: string;
  competencias: number[];
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

  public colaboradorCompromisos: string = '';
  public supervisorCompromisos: string = '';
  public comentarioAdicional: string = '';

  // Objetivos de desempeño
  public desempeno: IEvalucionResultDto[] = [];
  public resultadologro: IResultadoLogro[] = [];
  public totalPeso: number = 0;
  public sololectura: boolean = false;

  // Cursos de capacitación
  public cursos: ICursoCapacitacion[] = [];
  public cursosSeleccionados: IEvaluacionCursoCapacitacion[] = [];

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
    private cursoCapacitacionController: CursoCapacitacionController
  ) {
    this.evaluacionempleado = this.EvaluacionController.inicializamodelo();
  }

  ngOnInit(): void {
    this.loadLogoAsBase64();
    this.dialogRef = this.toastr.open(LoadingComponent, {
      width: '340px',
      height: '180px',
      disableClose: true
    });

    this.EvaluacionController.GetEvaluacionePorEmpleadoyPeriodo(this.empleado.secuencial, this.periodo.id)
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

          this.comentarioAdicional = this.evaluacionempleado.observacion || '';
          this.cursosSeleccionados = this.evaluacionempleado.evaluacionCursoCapacitacions || [];

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
          this.EvaluacionController.GetsEvaluacionResultado(rep.id).subscribe({
            next: (ores) => {
              this.desempeno = ores.data;
              this.totalPeso = this.desempeno.reduce((sum, item) => sum + Number(item.peso), 0);

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
              this.dialogRef.close();
              this.cd.detectChanges();
            },
            error: (err) => {
              console.error(err);
              this.dialogRef.close();
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

            this.dialogRef.close();
            this.datos.showMessage(
              `No se encontró evaluación previa. Se iniciará una autoevaluación para el periodo de medio año: ${this.periodo.descripcion}.`,
              this.titulo,
              "info"
            );
          } else {
            console.error('Error al obtener la evaluación:', err);
            this.dialogRef.close();
            this.datos.showMessage("Error al cargar la evaluación", this.titulo, "error");
          }
        }
      });

    // Cargar catálogo de cursos sugeridos
    this.cursoCapacitacionController.Gets().subscribe({
      next: (rep) => {
        this.cursos = rep.data as ICursoCapacitacion[];
      },
      error: (err) => console.error(err)
    });
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

    this.colaboradorCompromisos = this.evaluacionempleado.colaboradorCompromisos || '';
    this.supervisorCompromisos = this.evaluacionempleado.supervisorCompromisos || '';
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

  public onCursoSeleccionado(curso: ICursoCapacitacion): void {
    if (this.cursosSeleccionados.length < 3) {
      if (!this.cursosSeleccionados.find(c => c.cursoCapacitacionId === curso.id)) {
        this.cursosSeleccionados.push({
          id: 0,
          evaluacionId: this.evaluacionempleado.id,
          cursoCapacitacionId: curso.id,
          cursoCapacitacion: curso,
          porque: ''
        });
      }
    } else {
      this.datos.showMessage("Solo puede seleccionar hasta 3 cursos", this.titulo, "warning");
    }
  }

  public onCursoRemovido(curso: IEvaluacionCursoCapacitacion): void {
    this.cursosSeleccionados = this.cursosSeleccionados.filter(c => c.cursoCapacitacionId !== curso.cursoCapacitacionId);
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

    this.evaluacionempleado.colaboradorCompromisos = this.colaboradorCompromisos;
    this.evaluacionempleado.supervisorCompromisos = this.supervisorCompromisos;
    this.evaluacionempleado.observacion = this.comentarioAdicional;

    // Estado de la evaluación
    if (this.supervisor) {
      this.evaluacionempleado.estadoevaluacion = 'EvaluadoPorSupervisor';
    } else {
      this.evaluacionempleado.estadoevaluacion = 'AutoEvaluado';
    }

    this.evaluacionempleado.evaluacionCursoCapacitacions = this.cursosSeleccionados.map(c => {
      const cLimpio = { ...c };
      delete cLimpio.cursoCapacitacion;
      return cLimpio;
    });

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

    // Calcular totalCalculo, desempeñoFinal y puntuaciones de competencia
    await this.EvaluacionController.calculaelpromediodesempeno(this.supervisor, this.resultadologro);

    this.EvaluacionController.grabar(this.supervisor).then(() => {
      this.dialogRef.close();
      this.datos.showMessage("Evaluación de medio año guardada exitosamente.", this.titulo, "success");
      if (this.supervisor) {
        this.dataEmitter.emit("grabado");
      } else {
        this.router.navigate(['/Home']);
      }
    }).catch(err => {
      this.dialogRef.close();
      console.error(err);
      this.datos.showMessage("Error al guardar la evaluación de medio año.", this.titulo, "error");
    });
  }

  public onAceptar() {
    if (!this.evaluacionempleado) return;

    this.evaluacionempleado.estadoevaluacion = 'Completado';
    this.EvaluacionController.model = this.evaluacionempleado;
    this.dialogRef = this.toastr.open(LoadingComponent, { disableClose: true });

    this.EvaluacionController.grabar(this.supervisor).then(() => {
      this.dialogRef.close();
      this.datos.showMessage("Evaluación de medio año completada.", this.titulo, "success");
      this.dataEmitter.emit("grabado");
    }).catch(err => {
      this.dialogRef.close();
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
