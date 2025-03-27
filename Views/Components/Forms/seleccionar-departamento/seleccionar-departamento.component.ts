import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TablesComponent } from '../../tables/tables.component';
import { Departamento } from 'src/app/Controllers/Departamento';
import { ComunicacionService } from 'src/app/Services/comunicacion.service';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { LoadingComponent } from '../../loading/loading.component';
import { TableResponse } from 'src/app/Helpers/Interfaces';

@Component({
  selector: 'app-seleccionar-departamento',
  standalone: true,
  imports: [CommonModule, FormsModule,TablesComponent,MatDialogModule],
  templateUrl: './seleccionar-departamento.component.html',
  styleUrls: ['./seleccionar-departamento.component.css']
})
export class SeleccionarDepartamentoComponent implements OnInit{
filtro() {
throw new Error('Method not implemented.');
}
cancelar() {
throw new Error('Method not implemented.');
}
  
  config:any
  searchTerm: string = '';
  selectedDepartamento: any = null;
sele: boolean=true;
campos: string[]=[];
tituloslocal: string[]=[];
term: string="";
  constructor(   
     public departamentoService: Departamento,
     private ServiceComunicacion:ComunicacionService,
     public dialogRef: MatDialogRef<SeleccionarDepartamentoComponent>,
     public toastr:MatDialog){}

     ngOnInit(): void {
       
    this.config = {
      id: '',
      itemsPerPage: 5,
      currentPage: 1,
      totalItems: this.departamentoService.totalregistros
    };
    this.departamentoService.getdatos()
    const dialogRef = this.toastr.open(LoadingComponent, {
      width: '340px',
      height: '180px', 
    }); 
    this.departamentoService.TRegistros.subscribe({
      next:(rep:number)=>{
       console.log("evento#:",rep)
        this.config.totalItems=rep
        this.ServiceComunicacion.enviarMensaje(this.config)
        dialogRef.close()
      }
     
    })
    this.departamentoService.titulos.map((x: string | any) => {
      let nx: string = x[Object.keys(x)[0]];
      this.campos.push(...Object.keys(x));
      this.tituloslocal.push(nx);
    });
     }
     opcion(event: TableResponse) {
      this.dialogRef.close(event.key);
    }
  
    paginacambio(event: number) {
      this.departamentoService.actualpage = event;
    }
  
    actualizaelidtable(event: string) {
      this.config.id = event;
    }


}