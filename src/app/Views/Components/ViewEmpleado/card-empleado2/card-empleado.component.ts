import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { IEmpleado } from 'src/app/Models/Empleado/IEmpleado';
import { FormEvaluationEmployeComponent } from '../../Forms/FormEvaluationEmploye/FormEvaluationEmploye.component';
import { IPeriodo } from 'src/app/Models/Periodos/IPeriodo';
import { FormEvaluacionSupervisorComponent } from '../../Forms/form-evaluacion-supervisor/form-evaluacion-supervisor.component';
import { EmpleadoTeamComponent } from '../empleadoteam/empleadoteam.component';
import { CategoriaPuesto } from 'src/app/Controllers/CategoriaPuesto';
import { Puestos } from 'src/app/Controllers/Puestos';
import { RolCategoriaPuestoDet } from 'src/app/Controllers/RolCategoriaPuestoDet';
import { RolCategoriaPuesto } from 'src/app/Controllers/RolCategoriaPuesto';
import { ICategoriaPuesto, IPuesto } from 'src/app/Models/Puesto/IPuesto';
import { IRolCategoriaPuestoDet, IRolCategoriaPuesto } from 'src/app/Models/RolCategoriaPuesto/IRolCategoriaPuesto';
import { ModelResponse } from 'src/app/Models/Usuario/modelResponse';

@Component({
  selector: 'app-card-empleado2',
  standalone: true,
  imports: [FormsModule, CommonModule,MatDialogModule],
  templateUrl: './card-empleado.component.html',
  styleUrls: ['./card-empleado.component.css']
})
export class CardEmpleadoComponent2 implements OnInit {

 public rolcategoriapuesto:string=''
  constructor(private cdr: ChangeDetectorRef,
    private categoriapuestocontroller:CategoriaPuesto,
    private puestocontroller:Puestos,
    private rolcategoriapuestodet:RolCategoriaPuestoDet,
    private rolcategoriapuestocontroller:RolCategoriaPuesto,    
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
    jefeinmediato: ''
  }
  @Input() periodo!:IPeriodo
  @Input() llamarevaluacion: boolean = false;
  @Input() mostrarpuntualcionfinal:boolean =false;
  @Input() puntuacionFinal:number=0
  @Output() evaluateEmployee = new EventEmitter<IEmpleado>();

  public nfoto: number = 0;
  public foto: string = "";

  ngOnInit(): void {
    this.nfoto = this.empleado.secuencial > 99 ? Math.floor(this.empleado.secuencial/10) : this.empleado.secuencial;
    // this.foto = "https://randomuser.me/api/portraits/men/" + this.nfoto.toString() + ".jpg";
    this.cdr.detectChanges();
    //buscar el rolcategoriapuesto
    //1) encontrar la categoria puesto con el puestos del empleado
    this.puestocontroller.Get(this.empleado.scargo.toString()).subscribe({
      next:(rep:IPuesto)=>{
        // al retornar el puesto busca la categoria
        this.categoriapuestocontroller.Get(rep.categoriaPuestoId.toString()).subscribe({
          next:(cp:ICategoriaPuesto)=>{
            // al retornar la categoria busco el rolcategoriapuestodet
            this.rolcategoriapuestodet.Gets().subscribe({
              next:(rep:ModelResponse)=>{
                  let t:IRolCategoriaPuestoDet[] = rep.data
                  let tx:IRolCategoriaPuestoDet = t.filter(x=>x.categoriaPuestoId==cp.id)[0]
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
  }
  subdelsub() {
    //throw new Error('Method not implemented.');
    const dialogRef = this.toastr.open(EmpleadoTeamComponent ,
      {width:'1200px',height:'950px',disableClose:false,data:{empleado:this.empleado,periodo:this.periodo}}
    );
    dialogRef.afterClosed().subscribe((rep)=>{
      
    }); 
  }
  openEvaluationForm(): void {
    //this.evaluateEmployee.emit(this.empleado);
    const dialogRef = this.toastr.open(FormEvaluacionSupervisorComponent,
      {width: '1200px',
       disableClose: true,
       data:{empleado:this.empleado,
             periodo:this.periodo,
             titutlo:"Evaluacion Equipo"}}
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
}
