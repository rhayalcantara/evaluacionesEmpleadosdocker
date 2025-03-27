import { ChangeDetectorRef, Component, EventEmitter, Inject, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardEmpleadoComponent } from '../../ViewEmpleado/card-empleado/card-empleado.component';
import { CriterialitemComponent } from '../../evaluacioncomponents/criterialitem/criterialitem.component';
import { IEmpleado } from 'src/app/Models/Empleado/IEmpleado';
import { IPeriodo } from 'src/app/Models/Periodos/IPeriodo';
import { IEvaluacion, IEvaluacionDto, IEvalucionResultDto } from 'src/app/Models/Evaluacion/IEvaluacion';
import { Evaluacion } from 'src/app/Controllers/Evaluacion';
import { DatosServiceService } from 'src/app/Services/datos-service.service';
import { Empleados } from 'src/app/Controllers/Empleados';
import { Periodos } from 'src/app/Controllers/Periodos';
import { EvaluacionDesempenoMeta } from 'src/app/Controllers/EvaluacionDesempenoMeta';
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
  imports: [CommonModule, FormsModule, CriterialitemComponent,MatDialogModule],
  templateUrl: './FormEvaluationEmploye.component.html',
  styleUrls: ['./FormEvaluationEmploye.component.css']
})
export class FormEvaluationEmployeComponent {
ondes() {
  this.cd.detectChanges();
}

  @Input() empleado: IEmpleado=this.empleadocontroller.inicializamodelo();
  @Input() periodo: IPeriodo=this.periodocontroller.inicializamodelo();
  @Input() titulo:string="";
  @Input() supervisor:Boolean=false
  @Input() mostargrabar:Boolean=true
  @Input() mostarAceptar:Boolean=false
  @Input() mostarAceptarBoton:Boolean=false
  @Output() dataEmitter: EventEmitter<string> = new EventEmitter();
  @Output() puntuacion: EventEmitter<number> = new EventEmitter();
  public logoBase64: string = '';
  public obervaciones:string=""
  public fecha:Date=new Date()
  public evaluacionempleado:IEvaluacion
  public comentarioAdicional: string = '';
  public comentarioDisgusto: string = '';
  public entrevistaConSupervisor: boolean = false;
  public aceptaEnDisgusto: boolean = false;
  public desempeno:IEvalucionResultDto[]=[]
  public cursos: ICursoCapacitacion[] = [];
  public cursosSeleccionados: IEvaluacionCursoCapacitacion[] = [];
  public dialogRef:any

  constructor(private EvaluacionController:Evaluacion,
              private datos:DatosServiceService,
              private empleadocontroller:Empleados,
              private periodocontroller:Periodos,
              private ServiceComunicacion:ComunicacionService, 
              private cd: ChangeDetectorRef,
              private router: Router,
              private toastr: MatDialog,
              private http: HttpClient,
              private cursoCapacitacionController: CursoCapacitacionController
  ){
    this.evaluacionempleado = EvaluacionController.inicializamodelo()
  }
  private loadLogoAsBase64() {
    this.http.get('assets/LOGO-COOPASPIRE.png', { responseType: 'blob' }).subscribe(blob => {
      const reader = new FileReader();
      reader.onloadend = () => {
        this.logoBase64 = reader.result as string; // Almacena el contenido Base64
      };
      reader.readAsDataURL(blob); // Lee el archivo como Base64
    });
  }
  ngOnInit(): void {
    this.loadLogoAsBase64();
    // Cargar evaluación
    // mostrar loading component hasta que lleguen los datos
    this.dialogRef = this.toastr.open(LoadingComponent, {
      width: '340px',
      height: '180px', 
    }); 

    this.EvaluacionController.GetEvaluacionePorEmpleadoyPeriodo(this.empleado.secuencial, this.periodo.id)
    .subscribe({
      next: (rep: IEvaluacion) => {
        this.evaluacionempleado = rep;

        // Verificar si la evaluacion esta en estado Enviada
        console.log(this.evaluacionempleado.estadoevaluacion)
        if (this.evaluacionempleado.estadoevaluacion == "Enviado") {
          this.mostarAceptar = true;
          this.mostarAceptarBoton=true;
          this.mostargrabar = false;
        }
        if (this.evaluacionempleado.estadoevaluacion == "Completado") {
          this.mostarAceptar = true;
          this.mostargrabar = false;
        }
        

        this.ServiceComunicacion.enviarMensaje({mensaje:'buscar',id:this.evaluacionempleado.id,model:this.evaluacionempleado})
        this.cd.detectChanges(); 
        
        this.comentarioAdicional = this.evaluacionempleado.observacion;
        this.cursosSeleccionados=[]
        this.cursosSeleccionados = this.evaluacionempleado.evaluacionCursoCapacitacions || [];

        
      },
      error: (err: Error) => console.error('Error al obtener la evaluación:', err)
    });

    // Cargar cursos
    this.cursoCapacitacionController.Gets().subscribe({
      next: (rep: ModelResponse) => {
        this.cursos = rep.data as ICursoCapacitacion[];
      },
      error: (err: Error) => console.error('Error al obtener los cursos:', err)
    });
  }

  onCursoSeleccionado(curso: ICursoCapacitacion): void {
    if (this.cursosSeleccionados.length < 3) {
      // Verificar si el curso ya fue seleccionado
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

  onPuntacionChange(event:number){
    this.puntuacion.emit(event)
    console.log('FormEvaluationEmployeComponent puntuacion',event)
    this.dialogRef.close();
  }
  onEvaluacionChange(evaluacion:IEvaluacion): void {
    this.evaluacionempleado = evaluacion;
    
    //this.ServiceComunicacion.enviarMensaje({mensaje:'Actualizar variables',id:this.evaluacionempleado.id,model:this.evaluacionempleado})
  }

  generatePDF(): void {
    try {
      const competenciasContent = this.evaluacionempleado.evaluacionGoals.map((goal, index) => {
        const evaluationText = this.supervisor ? 
          `Evaluación Empleado: ${this.evaluacionempleado.goalEmpleadoRespuestas[index].repuesta} - Evaluación Supervisor: ${this.evaluacionempleado.goalEmpleadoRespuestas[index].repuestasupervisor}` :
          `Evaluación Empleado: ${this.evaluacionempleado.goalEmpleadoRespuestas[index].repuesta}`;
  
        return [
          { text: goal.goal.objetivo.nombre, style: 'goalHeader' },
          { text: goal.goal.objetivo.descripcion, style: 'goalDescription' },
          { text: evaluationText },
          { text: '\n' }
        ];
      }).flat();
  
      const cursosContent = this.cursosSeleccionados.length > 0 ? [
        { text: 'Cursos de Capacitación Seleccionados:', style: 'sectionHeader' },
        {
          ul: this.cursosSeleccionados.map(curso => 
            `${curso.cursoCapacitacion?.descripcion} - Porque: ${curso.porque || 'No especificado'}`
          )
        },
        { text: '\n' }
      ] : [];
  
      const content: any[] = [
        {
          columns: [
            {
              text: this.periodo.descripcion,
              style: 'header',
              width: '*'
            },
            {
              image: this.logoBase64,
              width: 100,
              alignment: 'right'
            }
          ]
        },
        {
          text: [
            { text: 'Empleado: ', bold: true }, this.empleado.nombreunido, '\n',
            { text: 'Departamento: ', bold: true }, this.empleado.departamento, '\n',
            { text: 'Periodo: ', bold: true }, this.periodo.descripcion, '\n',
            { text: 'Fecha: ', bold: true }, this.fecha.toLocaleDateString(), '\n\n'
          ]
        },
        {
          table: {
            widths: ['*'], // Hacer que el título abarque todo el ancho
            body: [
              [
          {text: 'Puntuación Final: ' + (Number(this.EvaluacionController.desempenoFinal) + Number(this.EvaluacionController.CompetenciaFinal)).toFixed(2),
          style: 'puntuacion',
          }
        ]
      ]
    }
        },
        {
          table: {
 
            widths: ['*'],
            
            body: [
              [
                { text: 'Objetivos', style: 'categoryHeader' }
              ]
            ]
          },
          layout: 'noBorders',
          margin: [0, 10, 0, 10]
        },
        {
          table: {
            headerRows: 1,
            widths: ['auto', '*', 'auto', 'auto', 'auto', 'auto'],
            body: [
              [
                { text: 'Tipo', style: 'tableHeader' },
                { text: 'Descripción', style: 'tableHeader' },
                { text: 'Meta', style: 'tableHeader' },
                { text: 'Peso', style: 'tableHeader' },
                { text: 'Logro', style: 'tableHeader' },
                { text: '%', style: 'tableHeader' }
              ],
              ...this.evaluacionempleado.evaluacionDesempenoMetas.map(item => [
                item.tipo || '',
                item.descripcion || '',
                item.meta?.toString() || '',
                item.peso?.toString() || '',
                item.evaluacioneDesempenoMetaRespuestas?.logro?.toString() || '',
                this.calculatePercentage(item)
              ])
            ]
          }
        },
        
        { 
          table: {
            widths: ['*'], // Hacer que el título abarque todo el ancho
            body: [
              [              
              {text: 'Promedio Objetivos:' + Number(this.EvaluacionController.promedioDesempeno).toFixed(2) + '%'
            , style: 'puntuacion' ,
            layout: 'noBorders'}
        ]
      ]
    }
        },
        {  table: {
          widths: ['*'], // Hacer que el título abarque todo el ancho
          body: [
            [
        {text: 'Desempeño Final :' + Number(this.EvaluacionController.desempenoFinal).toFixed(2)
          , style: 'puntuacion' ,
          layout: 'noBorders'},
      ]
    ]
  }
}, 
        {
          table: {
            widths: ['*'],
            body: [
              [
                { text: 'COMPETENCIAS', style: 'categoryHeader' }
              ]
            ]
          },
          layout: 'noBorders',
          margin: [0, 20, 0, 10]
        },
        ...competenciasContent,
        { 
          
          table: {
            widths: ['*'],
            body: [
              [{text: 'Promedio Competencias:' + Number(this.EvaluacionController.promedioCompetencias).toFixed(2) + '%', style: 'puntuacion'},               
              ]
            ]
          },
                layout: 'noBorders'
            }   
                
                ,
        {   table: {
          widths: ['*'],
          body: [
            [ {text: 'Competencias Final :' + Number(this.EvaluacionController.CompetenciaFinal).toFixed(2), style: 'puntuacion' },
            ]
          ]
        },
              layout: 'noBorders'
          
          },

            {
              table: {
                widths: ['*'], // Hacer que el título abarque todo el ancho
                body: [
                  [
              {text: 'Total Puntuación Final: ' + (Number(this.EvaluacionController.desempenoFinal) + Number(this.EvaluacionController.CompetenciaFinal)).toFixed(2),
              style: 'puntuacionfinal',
              margin: [10, 10, 10, 10]
              }
            ]
          ]
        }
            },

        ...cursosContent,
        
        { text: 'Comentario Final', style: 'sectionHeader' },
        { text: this.comentarioAdicional || 'Sin comentarios', margin: [0, 0, 0, 20] },

        // Agregar información de entrevista y disgusto si aplica
        ...(this.evaluacionempleado.estadoevaluacion === 'Completado' ? [
          { text: 'Información Adicional', style: 'sectionHeader' },
          { text: `Entrevista con Supervisor: ${this.evaluacionempleado.entrevistaConSupervisor ? 'Sí' : 'No'}` },
          ...(this.evaluacionempleado.aceptaEnDisgusto ? [
            { text: 'Aceptación en No Conformidad: Sí' },
            { text: 'Comentario de No Conformidad:', style: 'subHeader' },
            { text: this.evaluacionempleado.comentarioDisgusto || 'Sin comentario', margin: [0, 0, 0, 10] }
          ] : [])
        ] : [])
      ];
  
      const docDefinition = {
        content,
        styles: {
          categoryHeader: {
            fontSize: 14,
            bold: true,
            alignment: 'left',
            color: 'white',
            fillColor: '#808080',
            margin: [0, 5, 0, 5]
          },
          puntuacion: {
            fontSize: 14,
            bold: true,
            alignment: 'right',
            color: 'white',
            fillColor: '#1a237e',
            margin:[0, 10, 0, 10]
          },
          puntuacionfinal: {
            fontSize: 14,
            bold: true,
            alignment: 'center',
            color: 'white',
            fillColor: '#1a237e',
            margin:[0, 10, 0, 10]
          },
          promedio: {
            fontSize: 14,
            bold: true,
            alignment: 'right',        
            fillColor: '#808080',
            margin:[0, 20, 0, 10]
          },
          header: {
            fontSize: 22,
            bold: true,
            alignment: 'center',
            margin: [0, 0, 0, 10],
            color: '#1a237e'
          },
          scoreBox: {
            fontSize: 18,
            bold: true,
            margin: [0, 10, 0, 20],
            fillColor: '#1a237e',
            color: 'white',
            alignment: 'center'
          },
          sectionHeader: {
            fontSize: 14,
            bold: true,
            margin: [0, 20, 0, 10],
            alignment: 'left'
          },
          tableHeader: {
            bold: true,
            fillColor: '#1a237e',
            color: 'white',
            alignment: 'center'
          },
          goalHeader: {
            fontSize: 12,
            bold: true,
            margin: [0, 10, 0, 5],
            alignment: 'left'
          },
          goalDescription: {
            fontSize: 10,
            italics: true,
            margin: [0, 0, 0, 5],
            alignment: 'left'
          },
          subHeader: {
            fontSize: 12,
            bold: true,
            margin: [0, 10, 0, 5],
            alignment: 'left'
          }
        },
        defaultStyle: {
          alignment: 'justify'
        }
      };
  
      pdfMake.createPdf(docDefinition).download(`evaluacion_${this.empleado.nombreunido}_${this.periodo.descripcion}.pdf`);
    } catch (error) {
      this.datos.showMessage("Error al generar el PDF", this.titulo, "error");
    }
  }
  

  calculatePercentage(item: IEvaluacionDesempenoMeta): string {
    if (!item.evaluacioneDesempenoMetaRespuestas) return '0.00';
    
    const logro = item.evaluacioneDesempenoMetaRespuestas.logro || 0;
    const meta = item.meta || 1;
    const inverso = item.inverso || false;
    
    const percentage = inverso ? 
      (meta / logro) * 100 :
      (logro / meta) * 100;
    
    return percentage.toFixed(2);
  }

  calculateResult(item: IEvaluacionDesempenoMeta): string {
    const percentage = parseFloat(this.calculatePercentage(item));
    const peso = item.peso || 0;
    return ((percentage * peso) / 100).toFixed(2);
  }

  onSubmit(): void {
    let puede:boolean=true;
    this.evaluacionempleado.observacion = this.comentarioAdicional;
  
    const fechaActual = new Date();
    this.evaluacionempleado.fechaRepuestas = fechaActual.toISOString().replace('T', ' ').slice(0, 10);
    
    // verifica si hay repuestas en cero en caso de que encuentre no podra seguir
    this.evaluacionempleado.goalEmpleadoRespuestas.forEach(element => {
        if(this.supervisor){          
          if(element.repuestasupervisor==0 || element.repuesta==0){    
            this.datos.showMessage(element.repuestasupervisor.toString(),"Error","error")          
            puede=false;
          }          
        }else{
          if (element.repuesta==0){
            this.datos.showMessage(element.evaluacionId.toString(),"Error","error")
            puede=false;
          }
        }
    });
    
    console.log(puede,this.evaluacionempleado.goalEmpleadoRespuestas)

    this.evaluacionempleado.evaluacionDesempenoMetas.forEach((item)=>{
      item.evaluacion=undefined;
        if((item.evaluacioneDesempenoMetaRespuestas?.logro)==0){
          this.datos.showMessage(item.evaluacioneDesempenoMetaRespuestas?.logro.toString() ,"Error","error")
          puede=false;
        }           
    });
    
    if (puede){

      
      // Agregar los cursos seleccionados a la evaluación
      this.evaluacionempleado.cursosCapacitacion = this.cursosSeleccionados.map(c => c.cursoCapacitacion!);      
      this.evaluacionempleado.evaluacionCursoCapacitacions = this.cursosSeleccionados;
      //console.table(this.evaluacionempleado.evaluacionCursoCapacitacions)
      if (this.supervisor){
        this.evaluacionempleado.estadoevaluacion='EvaluadoPorSupervisor';
      }else{
        this.evaluacionempleado.estadoevaluacion='AutoEvaluado';
      }
      if( this.evaluacionempleado.evaluacionDesempenoMetas.length==0){
        this.evaluacionempleado.totalcolaborador=this.evaluacionempleado.puntuacioncompetenciacolaborador
      }
      this.EvaluacionController.model = this.evaluacionempleado;
      console.log('verificacion evaluacion:',puede,this.evaluacionempleado,this.EvaluacionController.model)
      this.EvaluacionController.grabar(this.supervisor).then((rep)=>{
          
          this.datos.showMessage("Grabado",this.titulo,"sucess");
          if (this.supervisor){
            this.dataEmitter.emit("grabado");
            this.generatePDF();            
          }          
          this.router.navigate(['/Home'])
        
      });
      
    }else{
      this.datos.showMessage("Favor Verificar tiene respuestas sin contestar",this.titulo,"error");
    }
  }

  cancelar(): void {
    if (this.supervisor){
    this.dataEmitter.emit("cancelar");
    }else{
      this.router.navigate(['/Home'])
    }
    
  }
  onAceptarEvaluacion() {
    if (this.aceptaEnDisgusto && !this.comentarioDisgusto) {
      this.datos.showMessage("Debe proporcionar un comentario de disgusto", this.titulo, "error");
      return;
    }

    this.evaluacionempleado.estadoevaluacion = 'Completado';
    this.evaluacionempleado.entrevistaConSupervisor = this.entrevistaConSupervisor;
    this.evaluacionempleado.aceptaEnDisgusto  = this.aceptaEnDisgusto;
    this.evaluacionempleado.comentarioDisgusto = this.comentarioDisgusto;
    
    this.EvaluacionController.model = this.evaluacionempleado;
      
    this.EvaluacionController.grabar(this.supervisor).then((rep)=>{
        this.datos.showMessage("Grabado",this.titulo,"sucess");
        this.generatePDF();            
        this.router.navigate(['/Home'])
    });
  }
}
