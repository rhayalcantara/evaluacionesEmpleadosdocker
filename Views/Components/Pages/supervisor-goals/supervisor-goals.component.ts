import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DatosServiceService } from '../../../../Services/datos-service.service';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Empleados } from 'src/app/Controllers/Empleados';
import { IPuesto } from 'src/app/Models/Puesto/IPuesto';
import { TablesComponent } from '../../tables/tables.component';
import { IMeta, IMetaDts } from 'src/app/Models/Meta/IMeta';
import { TableResponse } from 'src/app/Helpers/Interfaces';
import { ComunicacionService } from 'src/app/Services/comunicacion.service';
import { IPeriodo } from 'src/app/Models/Periodos/IPeriodo';
import { Metas } from 'src/app/Controllers/Metas';
import { FormMetasComponent } from '../../Forms/form-metas/form-metas.component';

interface Position {
  id: number;
  name: string;
}

interface Goal {
  id: number;
  description: string;
}

@Component({
  selector: 'app-supervisor-goals',
  templateUrl: './supervisor-goals.component.html',
  styleUrls: ['./supervisor-goals.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule,TablesComponent]
})
export class SupervisorGoalsComponent implements OnInit {

  searchTerm: string = '';
  filteredPositions: IPuesto[] = [];

newGoal: IMeta=this.metascontroller.inicializamodelo()

subordinatePositions: Position[] = [];
selectedPosition: IPuesto  ={
  secuencial: 0,
  descripcion: '',
  departmentSecuencial: 0,
  departamento: '',
  categoriaPuestoId: 0
};
periodo:IPeriodo={
  id: 0,
  descripcion: '',
  fechaInicio: new Date(),
  fechaFin: new Date(),
  activa: false,
  estadoid: 0
}
goalInput: string = '';
goals: Goal[] = [];
metas:IMeta[]=[]
campos: string[]=['name'];
tituloslocal: string[]=['Meta'];
term: string="";
actualpage: number=1;
config: any;




  constructor(
    private datosService: DatosServiceService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<SupervisorGoalsComponent>,
    private dialog: MatDialog,
    public empl: Empleados,
    private ServiceComunicacion:ComunicacionService,
    private metascontroller:Metas
    //private router: Router
  ) {

  }
  ngOnInit() {
    this.goals = [];
    this.metas=[];
    this.empl = this.data.empl
    this.periodo =this.data.periodo
    
    this.config = {
      id:'',
       itemsPerPage: 10,
       currentPage: this.actualpage,
       totalItems: this.metas.length
     };
     this.ServiceComunicacion.enviarMensaje(this.config)

     this.filteredPositions = this.empl.arraypuestossub;
  }
  addGoal() {
    //llamar el formulario de metas
    const  dialogRef = this.dialog.open(FormMetasComponent,{
      width: '1200px',data:{model:this.newGoal}})
      dialogRef.afterClosed().subscribe((rep:IMetaDts )=>{
        //console.log('llego del formulario de Meta ',result)
        this.fetchGoalsForPosition(this.selectedPosition.secuencial)
        this.datosService.showMessage("Registro Insertado Correctamente","Metas SubOrdinados","sucess")
      }); 
  }
  selectPosition(_t11: IPuesto) {
    this.selectedPosition= _t11
    this.fetchGoalsForPosition(this.selectedPosition.secuencial)
  }


  searchPositions() {
    if (!this.searchTerm) {
      this.filteredPositions = this.empl.arraypuestossub;
    } else {
      this.filteredPositions = this.empl.arraypuestossub.filter(position => 
        position.descripcion.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
  }

 
  actualizaelidtable($event: string) {

  }
  paginacambio($event: number) {
    this.actualpage = $event
  }
  opcion($event: TableResponse) {
    this.newGoal= $event.key as IMeta
    const  dialogRef = this.dialog.open(FormMetasComponent,{
      width: '1200px',data:{model:this.newGoal}})
      dialogRef.afterClosed().subscribe((rep:IMetaDts )=>{
        //console.log('llego del formulario de Meta ',result)
        this.fetchGoalsForPosition(this.selectedPosition.secuencial)
        this.datosService.showMessage("Registro Insertado Correctamente","Metas SubOrdinados","sucess")
      }); 
  }
  onPositionSelect(position: IPuesto) {
    console.log('Seleciono el puesto',position)
    this.selectedPosition = position;
    //this.fetchGoalsForPosition(position.id);
    

  }

  fetchGoalsForPosition(positionId: number) {
    console.log('buscando las metas',positionId,this.periodo)
    this.metascontroller.GetMetasPorPeriodoYPuesto(this.periodo.id,positionId)
      .subscribe((rep:IMeta[])=>{
        console.log('las metas',rep)
        this.metas=rep
        this.config = {
          id:'',
           itemsPerPage: 10,
           currentPage: 1,
           totalItems: this.metas.length
         };
         this.ServiceComunicacion.enviarMensaje(this.config)
      })
  }

  onSubmitGoal() {
    if (this.selectedPosition && this.goalInput) {
      const newGoal = {
        Descripcion: this.goalInput,
        PuestoId: this.selectedPosition.secuencial
      };

     /* this.datosService.add('meta', newGoal).subscribe(
        (response: any) => {
          console.log('Goal added successfully:', response);
          this.goals.push({ id: response.Id, description: this.goalInput });
          this.goalInput = ''; // Clear the input after submission
        },
        (error) => {
          console.error('Error adding goal:', error);
        }
      );*/
    }
  }

  onFinish() {
    // Navigate back to the previous page or a specific route
   //this.router.navigate(['/Home']); // You can change this to the appropriate route
   this.dialogRef.close()
  }
}
