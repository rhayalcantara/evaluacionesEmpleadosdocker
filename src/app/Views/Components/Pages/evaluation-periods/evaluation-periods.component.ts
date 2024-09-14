import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IPeriodo } from 'src/app/Models/Periodos/IPeriodo';
import { TablesComponent } from '../../tables/tables.component';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Periodos } from 'src/app/Controllers/Periodos';
import { TableResponse } from 'src/app/Helpers/Interfaces';
import { ComunicacionService } from 'src/app/Services/comunicacion.service';
import { LoadingComponent } from '../../loading/loading.component';


@Component({
  selector: 'app-evaluation-periods',
  standalone:true,
  imports:[FormsModule,TablesComponent,CommonModule,MatDialogModule],
  templateUrl: './evaluation-periods.component.html',
  styleUrls: ['./evaluation-periods.component.css']
})
export class EvaluationPeriodsComponent implements OnInit {
campos: string[]=[];
tituloslocal:string[]=[];
term: string="";
config: any;
@Output() TRegistros = new EventEmitter<number>();

constructor(public Periodo:Periodos,
    private ServiceComunicacion:ComunicacionService,
    private toastr: MatDialog,
  ) { }


actualizaelidtable($event: string) {
throw new Error('Method not implemented.');
}
paginacambio($event: number) {
throw new Error('Method not implemented.');
}
opcion($event: TableResponse) {
throw new Error('Method not implemented.');
}
  public periods: IPeriodo[] = [];


  ngOnInit(): void {
    // TODO: Fetch actual periods data from a service
    
    this.Periodo.getdatos();
    
    const dialogRef = this.toastr.open(LoadingComponent, {
      width: '340px',
      height: '180px', 
    }); 
   
    
    
    this.Periodo.TRegistros.subscribe({
     next:(rep:number)=>{
      console.log("evento#:",rep)
       this.config.totalItems=rep
       this.ServiceComunicacion.enviarMensaje(this.config)
       dialogRef.close()
     }
     
    })
    this.periods =this.Periodo.arraymodel;
    this.config = {
        id:'',
         currentPage: 1,
         itemsPerPage: 10,
         totalItems: this.Periodo.totalregistros
       };
    this.Periodo.titulos.map((x:string|any)=>{
        let nx:string = x[Object.keys(x)[0]]
        this.campos.push(...Object.keys(x))
        this.tituloslocal.push(nx)
      })
  }

  activatePeriod(period: IPeriodo): void {
    if (confirm(`Are you sure you want to activate ${period.descripcion}?`)) {
      period.activa = true;
      period.estadoid = 2;
      // TODO: Update the period in the backend
      console.log(`Period ${period.descripcion} activated and set to Configurando state`);
    }
  }

  changeState(period: IPeriodo, newState: number): void {
    // if (this.isValidTransition(period.estadoid, newState)) {
    //   if (confirm(`Are you sure you want to change the state of ${period.nombre} to ${newState}?`)) {
    //     period.estadoid = newState;
    //     // TODO: Update the period in the backend
    //     console.log(`Period ${period.nombre} state changed to ${newState}`);
    //   }
    // } else {
    //   alert('Invalid state transition');
    // }
  }

  private isValidTransition(currentState: string, newState: string): boolean {
    const validTransitions: { [key: string]: string[] } = {
      'Inactiva': ['Configurando'],
      'Configurando': ['Evaluando'],
      'Evaluando': ['Calculando'],
      'Calculando': ['Cerrada'],
      'Cerrada': []
    };

    return validTransitions[currentState]?.includes(newState) || false;
  }
}