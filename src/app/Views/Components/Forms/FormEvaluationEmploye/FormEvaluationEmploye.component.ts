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

declare const pdfMake: any;

@Component({
  selector: 'app-form-evaluation-employe',
  standalone: true,
  imports: [CommonModule, FormsModule, CriterialitemComponent],
  templateUrl: './FormEvaluationEmploye.component.html',
  styleUrls: ['./FormEvaluationEmploye.component.css']
})
export class FormEvaluationEmployeComponent {
  @Input() empleado: IEmpleado=this.empleadocontroller.inicializamodelo();
  @Input() periodo: IPeriodo=this.periodocontroller.inicializamodelo();
  @Input() titulo:string="";
  @Input() supervisor:Boolean=false
  @Input() mostargrabar:Boolean=true
  @Output() dataEmitter: EventEmitter<string> = new EventEmitter();
  @Output() puntuacion: EventEmitter<number> = new EventEmitter();
  
  public obervaciones:string=""
  public fecha:Date=new Date()
  public evaluacionempleado:IEvaluacion
  public comentarioAdicional: string = '';
  public desempeno:IEvalucionResultDto[]=[]

  constructor(private EvaluacionController:Evaluacion,
              private datos:DatosServiceService,
              private empleadocontroller:Empleados,
              private periodocontroller:Periodos,
              private ServiceComunicacion:ComunicacionService, 
              private cd: ChangeDetectorRef
  ){
    this.evaluacionempleado = EvaluacionController.inicializamodelo()
  }

  ngOnInit(): void {
    this.EvaluacionController.GetEvaluacionePorEmpleadoyPeriodo(this.empleado.secuencial, this.periodo.id)
    .subscribe({
      next: (rep: IEvaluacion) => {
        this.evaluacionempleado = rep;
        this.ServiceComunicacion.enviarMensaje({mensaje:'buscar',id:this.evaluacionempleado.id,model:this.evaluacionempleado})
        this.cd.detectChanges(); 
        this.comentarioAdicional = rep.observacion
      },
      error: (err) => console.error('Error al obtener la evaluación:', err)
    });
  }
  onPuntacionChange(event:number){
    this.puntuacion.emit(event)
  }
  onEvaluacionChange(evaluacion:IEvaluacion): void {
    this.evaluacionempleado = evaluacion;
    console.log("la evaluacion del empleado cambio",this.evaluacionempleado,this.supervisor);
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

      const content: any[] = [
        { text: this.titulo, style: 'header' },
        { text: 'Evaluación de Desempeño', style: 'subheader' },
        {
          text: [
            { text: 'Empleado: ', bold: true }, this.empleado.nombreunido, '\n',
            { text: 'Departamento: ', bold: true }, this.empleado.departamento, '\n',
            { text: 'Periodo: ', bold: true }, this.periodo.descripcion, '\n',
            { text: 'Fecha: ', bold: true }, this.fecha.toLocaleDateString(), '\n\n'
          ]
        },
        { text: 'Desempeño', style: 'sectionHeader' },
        {
          table: {
            headerRows: 1,
            widths: ['auto', '*', 'auto', 'auto', 'auto', 'auto', 'auto'],
            body: [
              [
                { text: 'Tipo', style: 'tableHeader' },
                { text: 'Descripción', style: 'tableHeader' },
                { text: 'Meta', style: 'tableHeader' },
                { text: 'Peso', style: 'tableHeader' },
                { text: 'Logro', style: 'tableHeader' },
                { text: '%', style: 'tableHeader' },
                { text: 'Resultado', style: 'tableHeader' }
              ],
              ...this.evaluacionempleado.evaluacionDesempenoMetas.map(item => [
                item.tipo || '',
                item.descripcion || '',
                item.meta?.toString() || '',
                item.peso?.toString() || '',
                item.evaluacioneDesempenoMetaRespuestas?.logro?.toString() || '',
                this.calculatePercentage(item),
                this.calculateResult(item)
              ])
            ]
          }
        },
        { text: '\nCompetencias', style: 'sectionHeader' },
        ...competenciasContent,
        { text: 'Comentario Adicional', style: 'sectionHeader' },
        { text: this.comentarioAdicional || 'Sin comentarios', margin: [0, 0, 0, 20] }
      ];

      if (this.supervisor) {
        content.push(
          { text: '\n\n' },
          {
            table: {
              widths: ['*', '*'],
              body: [
                [
                  { text: '_______________________', alignment: 'center' },
                  { text: '_______________________', alignment: 'center' }
                ],
                [
                  { text: 'Firma del Empleado', alignment: 'center' },
                  { text: 'Firma del Supervisor', alignment: 'center' }
                ],
                [
                  { text: 'Fecha: _______________', alignment: 'center' },
                  { text: 'Fecha: _______________', alignment: 'center' }
                ]
              ]
            },
            layout: 'noBorders'
          }
        );
      }

      const docDefinition = {
        content,
        styles: {
          header: {
            fontSize: 22,
            bold: true,
            alignment: 'center',
            margin: [0, 0, 0, 10]
          },
          subheader: {
            fontSize: 18,
            bold: true,
            alignment: 'center',
            margin: [0, 0, 0, 20]
          },
          sectionHeader: {
            fontSize: 14,
            bold: true,
            margin: [0, 20, 0, 10]
          },
          tableHeader: {
            bold: true,
            fillColor: '#eeeeee'
          },
          goalHeader: {
            fontSize: 12,
            bold: true,
            margin: [0, 10, 0, 5]
          },
          goalDescription: {
            fontSize: 10,
            italics: true,
            margin: [0, 0, 0, 5]
          }
        }
      };

      pdfMake.createPdf(docDefinition).download(`evaluacion_${this.empleado.nombreunido}_${this.periodo.descripcion}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
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
    
    this.evaluacionempleado.goalEmpleadoRespuestas.forEach(element => {
        if(this.supervisor){          
          if(element.repuestasupervisor==0){              
            puede=false;
          }          
        }else{
          if (element.repuesta==0){
            console.log('Falta este competencia',element)
            puede=false;
          }
        }
    });
    
    this.evaluacionempleado.evaluacionDesempenoMetas.forEach((item)=>{
      item.evaluacion=undefined;
        if((item.evaluacioneDesempenoMetaRespuestas?.logro)==0){
          console.log('falta este item',item)
          puede=false;
        }           
    });

    if (puede){
      this.EvaluacionController.model = this.evaluacionempleado;
      this.EvaluacionController.grabar().then((rep)=>{
        if(rep){
          this.datos.showMessage("Grabado",this.titulo,"sucess");
          // Generate PDF after successful save
          this.generatePDF();
        }
      });
    }else{
      console.log('se retirne el Form submitted',this.evaluacionempleado);
      this.datos.showMessage("Favor Verificar tiene respuestas sin contestar",this.titulo,"error");
    }
  }

  cancelar(): void {
    this.dataEmitter.emit("cancelar");
  }
}
