import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TablesComponent } from '../../tables/tables.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { TableResponse } from 'src/app/Helpers/Interfaces';
import { IException, IExceptionDts } from 'src/app/Models/Excepcion/IExcepcion';
import { Excepcion } from 'src/app/Controllers/Excepcion';
import { ComunicacionService } from 'src/app/Services/comunicacion.service';
import { DatosServiceService } from 'src/app/Services/datos-service.service';
import { ExcepcionFormComponent } from '../../Forms/form-exception/excepcion-form.component';



@Component({
  selector: 'app-excepciones',
  standalone:true,
  imports:[FormsModule,TablesComponent,MatDialogModule,CommonModule],
  templateUrl: './excepciones.component.html',
  styleUrls: ['./excepciones.component.css']
})
export class ExcepcionesComponent implements OnInit {

campos: string[]=[];
tituloslocal: string[]=[];
term: string='';
actualpage: number=1;
totalregistros: number=0;
config: any;

constructor(public excepcioncontrolador:Excepcion,
            private ServiceComunicacion: ComunicacionService,
            private datos: DatosServiceService,
            private dialog: MatDialog
) { 
    this.ServiceComunicacion.enviarMensajeObservable.subscribe({
        next: (mensaje: string) => {
          console.log('estadoServices Constructor: ' + mensaje);
        }
    });
}

ngOnInit(): void {
    this.excepcioncontrolador.getdatos() // obtiene los datos
    this.excepcioncontrolador.TRegistros.subscribe({
        next: (rep: number) => {
          console.log("evento#:", rep);
          this.config.totalItems = rep;
          this.ServiceComunicacion.enviarMensaje(this.config);
        }
      });
  
      this.config = {
        id: '',
        itemsPerPage: 5,
        currentPage: 1,
        totalItems: this.excepcioncontrolador.totalregistros
      };
  
      this.excepcioncontrolador.titulos.map((x: string | any) => {
        let nx: string = x[Object.keys(x)[0]];
        this.campos.push(...Object.keys(x));
        this.tituloslocal.push(nx);
      });
}

actualizaelidtable($event: string) {
    this.config.id = $event;
}

paginacambio($event: number) {
    this.actualpage = $event;
}
opcion($event: TableResponse) {
    //aqui va la logica de opciones
    //puede ser editar o eliminar
    // en el event vienen   key:object; es el objeto del tipo IExcepcion
    // option:string es que accion necesitamos realizar
}
  nuevaExcepcion: IException = {
      id: 0,
      tipo: '',
      empleadoSecuencial: 0,
      detalles: '',
      fecha: '',
      activa: false
  };

  excepciones: IException[] = [
    { id: 1,  detalles: 'Cambio de Supervisor', tipo: 'Cambio Supervisor',empleadoSecuencial:525,fecha:'2024-10-01',activa:true }    
  ];

  filtro() {
    throw new Error('Method not implemented.');
    }
    agregar() {
        this.abrirmodalzona(this.dialog, this.excepcioncontrolador);
    }
    abrirmodalzona(t: MatDialog, p: Excepcion) {
        p.model = p.inicializamodelo();
    
        const dialogRef = t.open(ExcepcionFormComponent, {
          width: '800px', data: { model: p.model }
        });
        dialogRef.afterClosed().subscribe((rep: IExceptionDts) => {
          if (rep) {
            this.excepcioncontrolador.arraymodel.push(rep);
            this.datos.showMessage("Registro Insertado Correctamente", this.excepcioncontrolador.titulomensage, "success");
          }
        });
      }
    pdf() {
    throw new Error('Method not implemented.');
    }
    excel() {
    throw new Error('Method not implemented.');
    }

 
}