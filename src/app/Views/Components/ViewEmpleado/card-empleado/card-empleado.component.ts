import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { IEmpleado } from 'src/app/Models/Empleado/IEmpleado';
import { FormEvaluationEmployeComponent } from '../../Forms/FormEvaluationEmploye/FormEvaluationEmploye.component';
import { IPeriodo } from 'src/app/Models/Periodos/IPeriodo';
import { FormEvaluacionSupervisorComponent } from '../../Forms/form-evaluacion-supervisor/form-evaluacion-supervisor.component';
import { CategoriaPuesto } from 'src/app/Controllers/CategoriaPuesto';
import { Puestos } from 'src/app/Controllers/Puestos';
import { ICategoriaPuesto, IPuesto } from 'src/app/Models/Puesto/IPuesto';
import { RolCategoriaPuesto } from 'src/app/Controllers/RolCategoriaPuesto';
import { RolCategoriaPuestoDet } from 'src/app/Controllers/RolCategoriaPuestoDet';
import { ModelResponse } from 'src/app/Models/Usuario/modelResponse';
import { IRolCategoriaPuesto, IRolCategoriaPuestoDet } from 'src/app/Models/RolCategoriaPuesto/IRolCategoriaPuesto';
import { Evaluacion } from 'src/app/Controllers/Evaluacion';
import { IEvaluacion } from 'src/app/Models/Evaluacion/IEvaluacion';
import { DatosServiceService } from 'src/app/Services/datos-service.service';


@Component({
  selector: 'app-card-empleado',
  standalone: true,
  imports: [FormsModule, CommonModule,MatDialogModule],
  templateUrl: './card-empleado.component.html',
  styleUrls: ['./card-empleado.component.css']
})
export class CardEmpleadoComponent implements OnInit {


 
 
  constructor(private cdr: ChangeDetectorRef,
              private datos:DatosServiceService,
              private categoriapuestocontroller:CategoriaPuesto,
              private puestocontroller:Puestos,
              private rolcategoriapuestodet:RolCategoriaPuestoDet,
              private rolcategoriapuestocontroller:RolCategoriaPuesto,
              private evaluacion:Evaluacion,
              private toastr: MatDialog,) {}

  @Input() empleado: IEmpleado = {
    secuencial: 0,
    codigousuario: '',
    nombreunido: '',
    identificacion: '',
    sdept: 0,
    departamento: '',
    codigoestado: '',
    scargo: 0,
    cargo: '',
    esjefatura: 0,
    tienejefe: 0,
    nivel: 0,
    fechapostulacion: "",
    jefeinmediatO_SECUENCIAL: 0,
    jefeinmediato: '',
    oficina: ''
  }
  @Input() mostrarEstadoEvaluacion: boolean = false;
  @Input() mostrarboton:boolean =false
  @Input() periodo!:IPeriodo
  @Input() llamarevaluacion: boolean = false;
  @Output() evaluateEmployee = new EventEmitter<IEmpleado>();

  public mostarenviar:boolean = false
  public rolcategoriapuesto:string=''
  public estadoAutoevaluacion: string = 'Pendiente';
  public estadoEvaluacionSupervisor: string = 'Pendiente';
  public nfoto: number = 0;
  public foto: string = "";

  ngOnInit(): void {
    this.nfoto = this.empleado.secuencial > 99 ? Math.floor(this.empleado.secuencial/10) : this.empleado.secuencial;
    this.foto = "https://randomuser.me/api/portraits/men/" + this.nfoto.toString() + ".jpg";
    this.cdr.detectChanges();

    //buscar el rolcategoriapuesto
    //1) encontrar la categoria puesto con el puestos del empleado
    this.puestocontroller.Get(this.empleado.scargo.toString()).subscribe({
      next:(rep:IPuesto)=>{
        // al retornar el puesto busca la categoria
        //console.log('puesto',rep)
        this.categoriapuestocontroller.Get(rep.categoriaPuestoId.toString()).subscribe({
          next:(cp:ICategoriaPuesto)=>{
            //console.log('ICategoriaPuesto',cp)
            // al retornar la categoria busco el rolcategoriapuestodet
            this.rolcategoriapuestodet.Gets().subscribe({
              next:(rep:ModelResponse)=>{
                  let t:IRolCategoriaPuestoDet[] = rep.data
                  let tx:IRolCategoriaPuestoDet = t.filter(x=>x.categoriaPuestoId==cp.id)[0]
                  //console.log('IRolCategoriaPuestoDet',tx)
                  // buscar el rolcategoriapuesto
                  this.rolcategoriapuestocontroller.Get(tx.rolCategoriaPuestoId.toString()).subscribe({
                    next:(rep:IRolCategoriaPuesto)=>{
                      this.rolcategoriapuesto = rep.descripcion
                      this.cdr.detectChanges();
                    }
                  })
              }
            })
          }
        })
      }
    })

    // buscar el estado de la evaluacion
    if (this.periodo && this.empleado){
    this.evaluacion.GetEvaluacionEstadoDts(this.periodo.id,this.empleado.secuencial).subscribe({
      next:(rep:ModelResponse)=>{
        //console.log('estado evaluacion',rep)  
        this.estadoAutoevaluacion = rep.data[0].estadoEvaluacion
        if (this.estadoAutoevaluacion == 'Pendiente' || 
            this.estadoAutoevaluacion == 'Completado' || 
            this.estadoAutoevaluacion == 'Enviado'
          ){
          this.llamarevaluacion = false
        }else{
          this.llamarevaluacion = true
        }
        if(this.estadoAutoevaluacion == 'EvaluadoPorSupervisor'){
          this.mostarenviar=true
        }else{
          this.mostarenviar=false
        }

        //this.estadoEvaluacionSupervisor = rep.data[1].EstadoEvaluacion
        this.cdr.detectChanges();
      }
    })
    }
  }
  cargarEstadoEvaluacion(): void {
/*     this.evaluacionService.obtenerEstadoEvaluacion(this.empleado.secuencial, this.periodo.id).subscribe(
      estado => {
        this.estadoAutoevaluacion = estado.autoevaluado ? 'Completada' : 'Pendiente';
        this.estadoEvaluacionSupervisor = estado.evaluadoPorSupervisor ? 'Completada' : 'Pendiente';
        this.cdr.detectChanges();
      },
      error => //console.error('Error al obtener estado de evaluación', error)
    ); */
  }
  subdelsub() {
    //throw new Error('Method not implemented.');
  //   const dialogRef = this.toastr.open(EmpleadoTeamComponent2 ,
  //     {width:'1200px',height:'950px',disableClose:false,data:{empleado:this.empleado,periodo:this.periodo}}
  //   );
  //   dialogRef.afterClosed().subscribe((rep)=>{
      
  //   }); 
  import('../empleadoteam2/empleadoteam2.component').then(({ EmpleadoTeamComponent2 }) => {
    const dialogRef = this.toastr.open(EmpleadoTeamComponent2, {
      width: '1200px',
      height: '950px',
      disableClose: false,
      data: { empleado: this.empleado, periodo: this.periodo }
    });
    dialogRef.afterClosed().subscribe((rep) => {
      // Manejar el cierre del diálogo si es necesario
    });
  });
   }
   Enviar(emp:number){
    //buscar la evaluacion para modificar el estado
    
    this.evaluacion.GetEvaluacionePorEmpleadoyPeriodo(emp,this.periodo.id).subscribe({
      next:(rep:IEvaluacion)=>{
        console.log(rep)
        let t:IEvaluacion  = rep       
        t.estadoevaluacion = 'Enviado'        
        this.evaluacion.Update(t).subscribe({
          next:(repx)=>{
            console.log('actualizado',repx)
            this.datos.showMessage("Enviado","Envio de Evaluacion","success");
            this.mostarenviar=false
            this.llamarevaluacion=false
            this.cdr.detectChanges();   
          }      
      })
    }
  })
  }

  openEvaluationForm(): void {
    //this.evaluateEmployee.emit(this.empleado);
    const dialogRef = this.toastr.open(FormEvaluacionSupervisorComponent,
      {width:'100%',height:'90%',disableClose:true,data:{empleado:this.empleado,periodo:this.periodo,titutlo:"Evaluacion Equipo"}}
    );
    dialogRef.afterClosed().subscribe((rep)=>{
      
    }); 
  }

  getButtonStyle(): { [key: string]: string } {
    return {
      'background-color': '#007bff',
      'color': 'white',
      'border': 'none',
      'padding': '10px 20px',
      'border-radius': '5px',
      'cursor': 'pointer',
      'font-weight': 'bold',
      'transition': 'background-color 0.3s ease'
    };
  }

  getButtonStyle2(): { [key: string]: string } {
    return {
      // background color verde
      'background-color': '#28a745',
      'color': 'white',
      'border': 'none',
      'padding': '10px 20px',
      'border-radius': '5px',
      'cursor': 'pointer',
      'font-weight': 'bold',
      'transition': 'background-color 0.3s ease'
    };
  }
}
