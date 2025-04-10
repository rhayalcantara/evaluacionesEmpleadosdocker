import { ChangeDetectorRef, Component, EventEmitter, Inject, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CriterialitemComponent } from '../../evaluacioncomponents/criterialitem/criterialitem.component';
import { IEmpleado } from 'src/app/Models/Empleado/IEmpleado';
import { IPeriodo } from 'src/app/Models/Periodos/IPeriodo';
import { IEvaluacion, IEvaluacionDto, IEvalucionResultDto, IGoalEmpleadoRespuesta, IEvaluacionGoal } from 'src/app/Models/Evaluacion/IEvaluacion';
import { Evaluacion } from 'src/app/Controllers/Evaluacion';
import { DatosServiceService } from 'src/app/Services/datos-service.service';
import { Empleados } from 'src/app/Controllers/Empleados';
import { Periodos } from 'src/app/Controllers/Periodos';
import { ModelResponse } from 'src/app/Models/Usuario/modelResponse';
import { ComunicacionService } from 'src/app/Services/comunicacion.service';
import { IEvaluacionDesempenoMeta } from 'src/app/Models/EvaluacionDesempenoMeta/IEvaluacionDesempenoMeta';
import { Router } from '@angular/router';
import { ICursoCapacitacion, IEvaluacionCursoCapacitacion } from 'src/app/Models/Capacitacion/Cursos';
import { CursoCapacitacionController } from 'src/app/Controllers/CursoCapacitacion';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { LoadingComponent } from '../../loading/loading.component';
import { HttpClient } from '@angular/common/http';

declare const pdfMake: any;

@Component({
  selector: 'app-form-evaluation-employe',
  standalone: true,
  imports: [CommonModule, FormsModule, CriterialitemComponent, MatDialogModule],
  templateUrl: './FormEvaluationEmploye.component.html',
  styleUrls: ['./FormEvaluationEmploye.component.css']
})
export class FormEvaluationEmployeComponent {
  ondes() {
    this.cd.detectChanges();
  }

  @Input() empleado: IEmpleado = this.empleadocontroller.inicializamodelo();
  @Input() periodo: IPeriodo = this.periodocontroller.inicializamodelo();
  @Input() titulo: string = "";
  @Input() supervisor: Boolean = false
  @Input() mostargrabar: Boolean = true
  @Input() mostarAceptar: Boolean = false
  @Input() mostarAceptarBoton: Boolean = false
  @Output() dataEmitter: EventEmitter<string> = new EventEmitter();
  @Output() puntuacion: EventEmitter<number> = new EventEmitter();
  public logoBase64: string = '';
  public obervaciones: string = ""
  public fecha: Date = new Date()
  public evaluacionempleado!: IEvaluacion
  public comentarioAdicional: string = '';
  public comentarioDisgusto: string = '';
  public entrevistaConSupervisor: boolean = false;
  public aceptaEnDisgusto: boolean = false;
  public desempeno: IEvalucionResultDto[] = []
  public cursos: ICursoCapacitacion[] = [];
  public cursosSeleccionados: IEvaluacionCursoCapacitacion[] = [];
  public dialogRef: any

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

  private loadLogoAsBase64() {
    this.http.get('assets/LOGO-COOPASPIRE.png', { responseType: 'blob' }).subscribe(blob => {
      const reader = new FileReader();
      reader.onloadend = () => {
        this.logoBase64 = reader.result as string;
      };
      reader.readAsDataURL(blob);
    });
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

          console.log('Evaluación cargada:', this.evaluacionempleado);

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

          this.ServiceComunicacion.enviarMensaje({ mensaje: 'buscar', id: this.evaluacionempleado.id, model: this.evaluacionempleado })
          this.cd.detectChanges();

          this.comentarioAdicional = this.evaluacionempleado.observacion || '';
          this.cursosSeleccionados = this.evaluacionempleado.evaluacionCursoCapacitacions || [];
          this.entrevistaConSupervisor = this.evaluacionempleado.entrevistaConSupervisor ?? false;
          this.aceptaEnDisgusto = this.evaluacionempleado.aceptaEnDisgusto ?? false;
          this.comentarioDisgusto = this.evaluacionempleado.comentarioDisgusto || '';

          this.dialogRef.close();
        },
        error: (err: Error) => {
          console.error('Error al obtener la evaluación:', err);
          this.dialogRef.close();
          this.datos.showMessage("Error al cargar la evaluación", this.titulo, "error");
        }
      });

    this.cursoCapacitacionController.Gets().subscribe({
      next: (rep: ModelResponse) => {
        this.cursos = rep.data as ICursoCapacitacion[];
      },
      error: (err: Error) => console.error('Error al obtener los cursos:', err)
    });
  }

  onCursoSeleccionado(curso: ICursoCapacitacion): void {
    if (this.cursosSeleccionados.length < 3) {
      if (!this.cursosSeleccionados.find(c => c.cursoCapacitacionId === curso.id)) {
        const evaluacionCurso: IEvaluacionCursoCapacitacion = {
          id: 0,
          evaluacionId: this.evaluacionempleado.id,
          cursoCapacitacionId: curso.id,
          cursoCapacitacion: curso,
          porque: ''
        };
        this.cursosSeleccionados.push(evaluacionCurso);
      }
    } else {
      this.datos.showMessage("Solo puede seleccionar hasta 3 cursos", this.titulo, "warning");
    }
  }

  onCursoRemovido(curso: IEvaluacionCursoCapacitacion): void {
    this.cursosSeleccionados = this.cursosSeleccionados.filter(c => c.cursoCapacitacionId !== curso.cursoCapacitacionId);
  }

  onPuntacionChange(event: number) {
    console.log('Puntuación total recalculada por hijo:', event);
     if (this.evaluacionempleado) {
       this.evaluacionempleado.totalCalculo = event;
       this.puntuacion.emit(event);
     }
  }

  onEvaluacionChange(evaluacionActualizada: IEvaluacion): void {
    this.evaluacionempleado = evaluacionActualizada;
    this.EvaluacionController.model = evaluacionActualizada;
    console.log('Evaluación actualizada desde criterialitem:', this.EvaluacionController.model);
    this.puntuacion.emit(evaluacionActualizada.totalCalculo);
  }

  // --- Getters para cálculos (devuelven number) ---
  get porcentajeDesempeno(): number {
    return Number(this.EvaluacionController.porcentajeDesempeno) || 0.2;
  }
  get porcentajeCompetencia(): number {
    return Number(this.EvaluacionController.porcentajeCompetencia) || 0.7;
  }
  get promedioDesempeno(): number {
     const metas = this.evaluacionempleado?.evaluacionDesempenoMetas || [];
     if (metas.length === 0) return 0;
     const sumaPorcentajes = metas.reduce((sum, item) => {
        const perc = parseFloat(this.calculatePercentage(item));
        return sum + (isNaN(perc) ? 0 : perc);
     }, 0);
     const avg = sumaPorcentajes / metas.length;
     return isNaN(avg) ? 0 : avg;
  }
   get desempenoFinal(): number {
     return (this.promedioDesempeno * this.porcentajeDesempeno) || 0;
   }
   get promedioCompetenciasSupervisor(): number {
      return Number(this.evaluacionempleado?.puntuacioncompetenciasupervisor) || 0;
   }
    get promedioCompetenciasColaborador(): number {
      return Number(this.evaluacionempleado?.puntuacioncompetenciacolaborador) || 0;
   }
   get competenciaFinalSupervisor(): number {
      return (this.promedioCompetenciasSupervisor * this.porcentajeCompetencia) || 0;
   }
    get competenciaFinalColaborador(): number {
      return (this.promedioCompetenciasColaborador * this.porcentajeCompetencia) || 0;
   }
   get totalCalculo(): number {
      const compFinal = this.supervisor ? this.competenciaFinalSupervisor : this.competenciaFinalColaborador;
      const total = (Number(this.desempenoFinal) || 0) + (Number(compFinal) || 0);
      return isNaN(total) ? 0 : total;
   }


  generatePDF(): void {
     if (!this.evaluacionempleado) {
        this.datos.showMessage("No hay datos de evaluación para generar el PDF.", this.titulo, "warning");
        return;
     }
     // Obtener valores calculados como números
     const currentPromedioDesempeno = this.promedioDesempeno;
     const currentDesempenoFinal = this.desempenoFinal;
     const currentPromedioCompColab = this.promedioCompetenciasColaborador;
     const currentPromedioCompSup = this.promedioCompetenciasSupervisor;
     const currentCompFinalColab = this.competenciaFinalColaborador;
     const currentCompFinalSup = this.competenciaFinalSupervisor;
     const currentTotalCalculo = this.totalCalculo;

    try {
      // --- Contenido Competencias ---
      let competenciasContent: any[] = [];
      if (this.evaluacionempleado.evaluacionGoals && this.evaluacionempleado.evaluacionGoals.length > 0) {
          competenciasContent = this.evaluacionempleado.evaluacionGoals.map((goal: IEvaluacionGoal) => {
              const respuesta = (this.evaluacionempleado.goalEmpleadoRespuestas || []).find(r => r.goalId === goal.goalId); // Usar goalId
              const evalEmpleado = respuesta?.repuesta ?? 'N/A';
              const evalSupervisor = respuesta?.repuestasupervisor ?? 'N/A';
              const evaluationText =  `Evaluación Empleado: ${evalEmpleado} - Evaluación Supervisor: ${evalSupervisor}` ;
              const nombre = goal.goal?.objetivo?.nombre ?? 'Competencia sin nombre';
              const descripcion = goal.goal?.objetivo?.descripcion ?? 'Sin descripción';
              let observacion = respuesta?.observacion ?? 'Sin observación';
              let observacionSupervisor = respuesta?.observacionsupervisor ?? 'Sin observación';
              const observacionempleado = `Comentario Empleado : ${observacion}`; 
              const observacionsupervisor = `Comentario Supervisor : ${observacionSupervisor}`;	
             
              return [
                  { text: nombre, style: 'goalHeader' },
                  { text: descripcion, style: 'goalDescription' },
                  { text: evaluationText },
                  { text: observacionempleado },
                  { text: observacionsupervisor },
                  { text: '\n' }
              ];
          }).flat();
      } else {
          competenciasContent.push({ text: 'No hay competencias definidas.', italics: true, margin: [0, 5, 0, 10] });
      }


      // --- Contenido Cursos ---
      const cursosContent = (this.cursosSeleccionados || []).length > 0 ? [
        { text: 'Cursos de Capacitación Sugeridos:', style: 'sectionHeader' },
        {
          ul: this.cursosSeleccionados.map(curso =>
            `${curso.cursoCapacitacion?.descripcion ?? 'Curso desconocido'} - Por qué: ${curso.porque || 'No especificado'}`
          )
        },
        { text: '\n' }
      ] : [];

      // --- Contenido Objetivos ---
      let objetivosTableBody: any[] = [];
      if (this.evaluacionempleado.evaluacionDesempenoMetas && this.evaluacionempleado.evaluacionDesempenoMetas.length > 0) {
          objetivosTableBody = [
              [ 'Tipo', 'Descripción', 'Meta', 'Peso', 'Logro', '%' ].map(h => ({ text: h, style: 'tableHeader' })),
              ...(this.evaluacionempleado.evaluacionDesempenoMetas.map(item => [
                  item.tipo || '',
                  item.descripcion || '',
                  item.meta?.toString() || 'N/A',
                  (item.peso?.toString() ?? '0') + '%',
                  item.evaluacioneDesempenoMetaRespuestas?.logro?.toString() || '0',
                  this.calculatePercentage(item) + '%'
              ]))
          ];
      }

      // --- Contenido Principal ---
      const content: any[] = [
         {
          columns: [
            { text: this.periodo?.descripcion ?? 'Periodo no especificado', style: 'header', width: '*' },
            { image: this.logoBase64 || '', width: 100, alignment: 'right' }
          ]
        },
        {
          text: [
            { text: 'Empleado: ', bold: true }, this.empleado?.nombreunido ?? 'N/A', '\n',
            { text: 'Departamento: ', bold: true }, this.empleado?.departamento ?? 'N/A', '\n',
            { text: 'Periodo: ', bold: true }, this.periodo?.descripcion ?? 'N/A', '\n',
            { text: 'Fecha Generación: ', bold: true }, this.fecha.toLocaleDateString(), '\n\n'
          ]
        },
        // --- Tabla Objetivos (Condicional) ---
        ...(objetivosTableBody.length > 0 ? [
            { table: { widths: ['*'], body: [[{ text: 'Objetivos de Desempeño', style: 'categoryHeader' }]] }, layout: 'noBorders', margin: [0, 10, 0, 5] },
            {
              table: { headerRows: 1, widths: ['auto', '*', 'auto', 'auto', 'auto', 'auto'], body: objetivosTableBody },
              layout: 'lightHorizontalLines'
            },
        ] : [{ text: 'No hay objetivos de desempeño definidos.', italics: true, margin: [0, 10, 0, 10] }]), // Mensaje si no hay objetivos

        // --- Tabla Competencias (Condicional) ---
         { table: { widths: ['*'], body: [[{ text: 'Competencias', style: 'categoryHeader' }]] }, layout: 'noBorders', margin: [0, 15, 0, 5] },
         ...competenciasContent, // Ya incluye mensaje si está vacío
        // ******** INICIO: SALTO DE PÁGINA ********
        { text: '', pageBreak: 'before' },
        // ******** FIN: SALTO DE PÁGINA ********

        // --- Tabla Resultados --- Ponderación Evaluación (20% Autoeva + 80% Eva Supervisor)
        {
          table: {
            widths: ['*', 'auto', 'auto'],
            body: [
              [{ text: `RESULTADOS OBJETIVOS (${(this.porcentajeDesempeno).toFixed(0)}%)`, style: 'resultsHeader', colSpan: 3, alignment: 'center', fillColor: '#3498DB', color: 'white' }, {}, {}],
              [{ text: 'Total Peso:', bold: true }, {}, { text: '100%', alignment: 'right' }],
              [{ text: 'Promedio Objetivos:', bold: true }, {}, { text: `${currentPromedioDesempeno.toFixed(2)}%`, alignment: 'right' }],
              [{ text: `Desempeño Objetivo (${(this.porcentajeDesempeno ).toFixed(0)}%):`, bold: true }, {}, { text: (currentDesempenoFinal/100).toFixed(2), alignment: 'right' }],
              [{ text: `RESULTADOS COMPETENCIAS (${(this.porcentajeCompetencia ).toFixed(0)}%)`, style: 'resultsHeader', colSpan: 3, alignment: 'center', fillColor: '#3498DB', color: 'white' }, {}, {}],
              [{ text: `COMPETENCIAS (${(this.porcentajeCompetencia).toFixed(0)}%)`, style: 'resultsSubHeader', fillColor: '#EAECEE' },  { text: 'Evaluación Supervisor', style: 'resultsSubHeader', alignment: 'right', fillColor: '#EAECEE' } , { text: 'Autoevaluación', style: 'resultsSubHeader', alignment: 'right', fillColor: '#EAECEE' }],
              [{ text: 'Promedio Desempeño de las Competencias' },  { text: currentPromedioCompSup.toFixed(2), alignment: 'right' } , { text: currentPromedioCompColab.toFixed(2), alignment: 'right' }],
              [{ text: `Desempeño Final (${(this.porcentajeCompetencia ).toFixed(0)}%):` },  { text: (currentCompFinalSup/100).toFixed(2), alignment: 'right' } , { text: (currentCompFinalColab/100).toFixed(2), alignment: 'right' }],
              [{ text: 'Total Evaluación (Objetivos + Competencias)' }, { text: ((currentDesempenoFinal + currentCompFinalSup)/100).toFixed(2), alignment: 'right' } , { text: ((currentDesempenoFinal + currentCompFinalColab)/100).toFixed(2), alignment: 'right' }],
              [{ text: 'Ponderación Evaluación ( 80% Eva Supervisor+20% Autoeva )' }, { text: (((currentDesempenoFinal + currentCompFinalSup)/100)*.8).toFixed(2), alignment: 'right' } , { text: (((currentDesempenoFinal + currentCompFinalColab)/100)*.2).toFixed(2), alignment: 'right' }],
              [{ text: 'Puntuación Final', style: 'resultsTotal',colSpan: 2, bold: true, fillColor: '#D5F5E3' }, {}, { text: ((((currentDesempenoFinal + currentCompFinalSup)/100)*.8)+(((currentDesempenoFinal + currentCompFinalColab)/100)*.2)).toFixed(2), style: 'resultsTotal', bold: true, alignment: 'right', fillColor: '#D5F5E3' }]
            ]
          },
          layout: 'lightHorizontalLines', style: 'resultsTable'
        },
        // --- Cursos y Comentarios ---
        ...cursosContent,
        { text: 'Comentario Adicional:', style: 'sectionHeader' },
        { text: this.comentarioAdicional || 'Sin comentarios adicionales.', margin: [0, 0, 0, 20] },
        // --- Firmas ---
        {
          columns: [
            { qr: `Empleado: ${this.empleado?.nombreunido ?? 'N/A'}\nPeriodo: ${this.periodo?.descripcion ?? 'N/A'}\nFecha: ${this.fecha.toLocaleDateString()}\nPuntaje: ${currentTotalCalculo.toFixed(2)}`, fit: '80' },
            { text: '', width: '*' },
            {
              stack: [
                { text: '\n\n\n_________________________', style: 'signatureLine' },
                { text: 'Firma del Empleado', style: 'signatureText' },
                 { text: `Fecha: ${this.evaluacionempleado.fechaRepuestas ? new Date(this.evaluacionempleado.fechaRepuestas).toLocaleDateString() : '_______________'}`, style: 'signatureText' }
              ], width: 'auto'
            },
            { text: '', width: '*' },
            {
              stack: [
                { text: '\n\n\n_________________________', style: 'signatureLine' },
                { text: 'Firma del Supervisor', style: 'signatureText' },
                 { text: `Fecha: _______________`, style: 'signatureText' }
              ], width: 'auto'
            }
          ],
          margin: [0, 40, 0, 0]
        }
      ];

      // --- Definición del Documento ---
      const docDefinition: any = {
        content,
        styles: {
          header: { fontSize: 18, bold: true, alignment: 'center', margin: [0, 0, 0, 15], color: '#1a237e' },
          categoryHeader: { fontSize: 12, bold: true, alignment: 'left', color: 'white', fillColor: '#5DADE2', margin: [0, 5, 0, 5] },
          tableHeader: { fontSize: 10, bold: true, fillColor: '#AEB6BF', color: 'black', alignment: 'center' },
          goalHeader: { fontSize: 11, bold: true, margin: [0, 8, 0, 2], alignment: 'left' },
          goalDescription: { fontSize: 9, italics: true, margin: [0, 0, 0, 4], alignment: 'left' },
          sectionHeader: { fontSize: 12, bold: true, margin: [0, 15, 0, 5], alignment: 'left', color: '#1A5276' },
          resultsTable: { margin: [0, 15, 0, 15] },
          resultsHeader: { fontSize: 12, bold: true, color: 'white', margin: [0, 4, 0, 4] },
          resultsSubHeader: { fontSize: 10, bold: true, margin: [0, 2, 0, 2] },
          resultsTotal: { fontSize: 11, bold: true, margin: [0, 4, 0, 4] },
          signatureLine: { margin: [0, 0, 0, 2], alignment: 'center' },
          signatureText: { fontSize: 9, alignment: 'center' }
        },
        defaultStyle: { alignment: 'justify', fontSize: 10 }
      };

      //console.log("Definición del documento PDF:", JSON.stringify(docDefinition, null, 2));
      pdfMake.createPdf(docDefinition).download(`evaluacion_${this.empleado?.nombreunido ?? 'empleado'}_${this.periodo?.descripcion ?? 'periodo'}.pdf`);
    } catch (error) {
      console.error('Error detallado al generar el PDF:', error);
      this.datos.showMessage('Error al generar el PDF. Verifique la consola para más detalles.', this.titulo, 'error');
    }
  }

  calculatePercentage(item: IEvaluacionDesempenoMeta): string {
    if (!item.evaluacioneDesempenoMetaRespuestas) return '0.00';
    const logro = item.evaluacioneDesempenoMetaRespuestas.logro || 0;
    const meta = item.meta || 1;
    const inverso = item.inverso || false;
    if (meta === 0 && !inverso) return '0.00';
    if (logro === 0 && inverso) return '0.00';
    if (logro === 0 && !inverso) return '0.00';
    const percentage = inverso ? (meta / logro) * 100 : (logro / meta) * 100;
    return percentage.toFixed(2);
  }

  calculateResult(item: IEvaluacionDesempenoMeta): string {
    const percentage = parseFloat(this.calculatePercentage(item));
    const peso = item.peso || 0;
    return ((percentage * peso) / 100).toFixed(2);
  }

  onSubmit(): void {
    let puede: boolean = true;
    if (!this.evaluacionempleado) {
        this.datos.showMessage("Error: No se ha cargado la evaluación.", this.titulo, "error");
        return;
    }
    this.evaluacionempleado.observacion = this.comentarioAdicional;

    const fechaActual = new Date();
    if (!this.supervisor) {
       this.evaluacionempleado.fechaRepuestas = fechaActual.toISOString().split('T')[0];
    }

    (this.evaluacionempleado.goalEmpleadoRespuestas || []).forEach(respuesta => {
      // CORREGIDO: Usar goalId para enlazar
      const goalRelacionado = (this.evaluacionempleado.evaluacionGoals || []).find(g => g.goalId === respuesta.goalId);
      const nombreCompetencia = goalRelacionado?.goal?.objetivo?.nombre || `ID ${respuesta.goalId}`;
      if (this.supervisor) {
        if ((respuesta.repuestasupervisor ?? 0) === 0 || (respuesta.repuesta ?? 0) === 0) {
          this.datos.showMessage(`Respuesta(s) faltante(s) en competencia: ${nombreCompetencia}`, "Error", "error");
          puede = false;
        }
      } else {
        if ((respuesta.repuesta ?? 0) === 0) {
          this.datos.showMessage(`Respuesta faltante en competencia: ${nombreCompetencia}`, "Error", "error");
          puede = false;
        }
      }
    });

    console.log('Puede continuar (competencias)?', puede);

    (this.evaluacionempleado.evaluacionDesempenoMetas || []).forEach((item) => {
      item.evaluacion = undefined;
      if (!this.supervisor && (item.evaluacioneDesempenoMetaRespuestas?.logro ?? 0) === 0) {
        this.datos.showMessage(`Logro faltante en objetivo: ${item.descripcion || 'sin descripción'}`, "Error", "error");
        puede = false;
      }
    });

    console.log('Puede continuar (objetivos)?', puede);

    if (puede) {
      this.evaluacionempleado.evaluacionCursoCapacitacions = (this.cursosSeleccionados || []).map(c => {
         const cursoLimpio: Partial<IEvaluacionCursoCapacitacion> = {...c};
         delete cursoLimpio.cursoCapacitacion;
         return cursoLimpio as IEvaluacionCursoCapacitacion;
      });

      if (this.supervisor) {
        this.evaluacionempleado.estadoevaluacion = 'EvaluadoPorSupervisor';
      } else {
        this.evaluacionempleado.estadoevaluacion = 'AutoEvaluado';
      }

      this.evaluacionempleado.totalCalculo = this.totalCalculo;
      this.EvaluacionController.model = this.evaluacionempleado;

      console.log('Enviando a grabar:', JSON.stringify(this.EvaluacionController.model, null, 2));

      this.dialogRef = this.toastr.open(LoadingComponent, { disableClose: true });

      this.EvaluacionController.grabar(this.supervisor).then((rep) => {
        this.dialogRef.close();
        this.datos.showMessage("Grabado con éxito", this.titulo, "success");
        if (this.supervisor) {
          this.dataEmitter.emit("grabado");
          this.generatePDF();
        }
        this.router.navigate(['/Home']);
      }).catch(err => {
        this.dialogRef.close();
        console.error("Error al grabar:", err);
        const errorMsg = err?.error?.message || err?.message || "Error desconocido al grabar";
        this.datos.showMessage(`Error al grabar: ${errorMsg}`, this.titulo, "error");
      });

    } else {
      this.datos.showMessage("Favor verificar, tiene respuestas o logros sin completar.", this.titulo, "error");
    }
  }

  cancelar(): void {
    if (this.supervisor) {
      this.dataEmitter.emit("cancelar");
    } else {
      this.router.navigate(['/Home']);
    }
  }

  onAceptarEvaluacion() {
     if (!this.evaluacionempleado) {
        this.datos.showMessage("Error: No se ha cargado la evaluación.", this.titulo, "error");
        return;
    }
    if (this.aceptaEnDisgusto && !this.comentarioDisgusto) {
      this.datos.showMessage("Debe proporcionar un comentario de No Conformidad.", this.titulo, "error");
      return;
    }

    this.evaluacionempleado.estadoevaluacion = 'Completado';
    this.evaluacionempleado.entrevistaConSupervisor = this.entrevistaConSupervisor;
    this.evaluacionempleado.aceptaEnDisgusto = this.aceptaEnDisgusto;
    this.evaluacionempleado.comentarioDisgusto = this.comentarioDisgusto;
    this.evaluacionempleado.totalCalculo = this.totalCalculo;

    this.EvaluacionController.model = this.evaluacionempleado;
    console.log('Enviando a aceptar:', JSON.stringify(this.EvaluacionController.model, null, 2));

    this.dialogRef = this.toastr.open(LoadingComponent, { disableClose: true });

    this.EvaluacionController.grabar(this.supervisor).then((rep) => {
      this.dialogRef.close();
      this.datos.showMessage("Evaluación Aceptada con éxito", this.titulo, "success");
      this.generatePDF();
      this.router.navigate(['/Home']);
    }).catch(err => {
      this.dialogRef.close();
      console.error("Error al aceptar:", err);
       const errorMsg = err?.error?.message || err?.message || "Error desconocido al aceptar";
      this.datos.showMessage(`Error al aceptar: ${errorMsg}`, this.titulo, "error");
    });
  }
}
