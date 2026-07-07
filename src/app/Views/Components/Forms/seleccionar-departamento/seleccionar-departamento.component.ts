import { Component, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TablesComponent } from '../../tables/tables.component';
import { Departamento } from 'src/app/Controllers/Departamento';
import { ComunicacionService } from 'src/app/Services/comunicacion.service';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { LoadingComponent } from '../../loading/loading.component';
import { TableResponse } from 'src/app/Helpers/Interfaces';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-seleccionar-departamento',
  standalone: true,
  imports: [CommonModule, FormsModule,TablesComponent,MatDialogModule],
  templateUrl: './seleccionar-departamento.component.html',
  styleUrls: ['./seleccionar-departamento.component.css']
})
export class SeleccionarDepartamentoComponent implements OnInit, OnDestroy{
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

  private destroy$ = new Subject<void>();

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
    let loadingCerrado = false;
    const cerrarLoading = () => {
      if (loadingCerrado) { return; }
      loadingCerrado = true;
      try {
        dialogRef.close();
      } catch (e) {
        // No-op: el dialogo ya pudo haber sido cerrado previamente.
      }
    };
    // Nota: Departamento (src/app/Controllers/Departamento.ts, fuera del alcance de este cambio)
    // solo emite TRegistros cuando la peticion HTTP tiene exito; si falla, su subscribe()
    // no tiene manejador de error y TRegistros nunca se emite, dejando este overlay pegado.
    // Como mitigacion local se agrega este timeout de seguridad.
    const timeoutSeguridad = setTimeout(() => cerrarLoading(), 15000);
    this.departamentoService.TRegistros.pipe(takeUntil(this.destroy$)).subscribe({
      next:(rep:number)=>{
        clearTimeout(timeoutSeguridad);
        this.config.totalItems=rep
        this.ServiceComunicacion.enviarMensaje(this.config)
        cerrarLoading()
      },
      error: () => {
        clearTimeout(timeoutSeguridad);
        cerrarLoading();
      }
    })
    this.departamentoService.titulos.map((x: string | any) => {
      let nx: string = x[Object.keys(x)[0]];
      this.campos.push(...Object.keys(x));
      this.tituloslocal.push(nx);
    });
     }

     ngOnDestroy(): void {
       this.destroy$.next();
       this.destroy$.complete();
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
