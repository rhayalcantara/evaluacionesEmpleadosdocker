import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IEstado } from 'src/app/Models/Estado/IEstado';

import { TablesComponent } from '../../tables/tables.component';
import { CommonModule } from '@angular/common';

import { ComunicacionService } from 'src/app/Services/comunicacion.service';
import { TableResponse } from 'src/app/Helpers/Interfaces';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DatosServiceService } from 'src/app/Services/datos-service.service';
import { Estado } from 'src/app/Controllers/Estado';
import { FormEstadoComponent } from '../../Forms/form-estado/form-estado.component';

@Component({
  selector: 'app-estado',
  standalone: true,
  imports: [FormsModule, TablesComponent,
     CommonModule, MatDialogModule, FormEstadoComponent],
  templateUrl: './estado.component.html',
  styleUrls: ['./estado.component.css']
})
export class EstadoComponent implements OnInit {
  config: any;
  public term: string = '';
  public campos: string[] = [];
  public tituloslocal: string[] = [];

  constructor(
    public estadoService: Estado,
    private ServiceComunicacion: ComunicacionService,
    private datos: DatosServiceService,
    private dialog: MatDialog
  ) {
    this.ServiceComunicacion.enviarMensajeObservable.subscribe({
      next: (mensaje: string) => {
      }
    });
  }

  ngOnInit(): void {
    this.estadoService.getdatos();
    this.estadoService.TRegistros.subscribe({
      next: (rep: number) => {
        this.config.totalItems = rep;
        this.ServiceComunicacion.enviarMensaje(this.config);
      }
    });

    this.config = {
      id: '',
      itemsPerPage: 5,
      currentPage: 1,
      totalItems: this.estadoService.totalregistros
    };

    this.estadoService.titulos.map((x: string | any) => {
      let nx: string = x[Object.keys(x)[0]];
      this.campos.push(...Object.keys(x));
      this.tituloslocal.push(nx);
    });
  }

  opcion(event: TableResponse) {

    const acct: any = {
      edit: this.edita,
      del: this.delete
    };

    const handler = acct[event.option](event.key, this.estadoService, this.dialog);
    handler.then((rep: IEstado) => {
      this.estadoService.getdatos();
    }, (err: Error) => {
      this.datos.showMessage("Error: " + err.message, "Error", "error");
    });
  }

  edita(estado: IEstado, p: Estado, t: MatDialog): Promise<any> {
    return new Promise((resolve: any, reject: any) => {
      p.model = estado;

      const dialogRef = t.open(FormEstadoComponent, {
        width: '800px', data: { model: p.model }
      });
      dialogRef.afterClosed().subscribe((result: IEstado) => {
        if (result) {
          resolve(result);
        } else {
          resolve(null);
        }
      });
    });
  }

  abrirmodalzona(t: MatDialog, p: Estado) {
    p.model = p.inicializamodelo();

    const dialogRef = t.open(FormEstadoComponent, {
      width: '800px', data: { model: p.model }
    });
    dialogRef.afterClosed().subscribe((rep: IEstado) => {
      if (rep) {
        this.estadoService.arraymodel.push(rep);
        this.datos.showMessage("Registro Insertado Correctamente", this.estadoService.titulomensage, "success");
      }
    });
  }

  delete(estado: IEstado, p: Estado, t: MatDialog): Promise<any> {
    return new Promise((resolve, reject) => { resolve(estado); });
  }

  paginacambio(event: number) {
    this.estadoService.actualpage = event;
  }

  actualizaelidtable(event: string) {
    this.config.id = event;
  }

  filtro() {
    if (this.term != '') {
      this.estadoService.arraymodel = this.estadoService.arraymodel.filter(x => x.descripcion.includes((this.term.toUpperCase())));
    } else {
      this.estadoService.getdatos();
    }
  }

  excel() { }

  pdf() { }

  agregar() {
    this.abrirmodalzona(this.dialog, this.estadoService);
  }
}
