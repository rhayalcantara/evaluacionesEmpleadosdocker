import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IPerspectiva } from 'src/app/Models/Perspectiva/IPerspectiva';
import { TablesComponent } from '../../tables/tables.component';
import { CommonModule } from '@angular/common';
import { ComunicacionService } from 'src/app/Services/comunicacion.service';
import { TableResponse } from 'src/app/Helpers/Interfaces';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DatosServiceService } from 'src/app/Services/datos-service.service';
import { Perspectiva } from 'src/app/Controllers/Perspectiva';
import { FormPerspectivaComponent } from '../../Forms/form-perspectiva/form-perspectiva.component';

@Component({
  selector: 'app-perspectivas',
  standalone: true,
  imports: [FormsModule, TablesComponent, CommonModule, MatDialogModule, FormPerspectivaComponent],
  templateUrl: './perspectivas.component.html',
  styleUrls: ['./perspectivas.component.css']
})
export class PerspectivasComponent implements OnInit {
  config: any;
  public term: string = '';
  public campos: string[] = [];
  public tituloslocal: string[] = [];

  constructor(
    public perspectivaService: Perspectiva,
    private ServiceComunicacion: ComunicacionService,
    private datos: DatosServiceService,
    private dialog: MatDialog
  ) {
    this.ServiceComunicacion.enviarMensajeObservable.subscribe({
      next: (mensaje: string) => {
        console.log('perspectivaServices Constructor: ' + mensaje);
      }
    });
  }

  ngOnInit(): void {
    this.perspectivaService.getdatos();
    this.perspectivaService.TRegistros.subscribe({
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
      totalItems: this.perspectivaService.totalregistros
    };

    this.perspectivaService.titulos.map((x: string | any) => {
      let nx: string = x[Object.keys(x)[0]];
      this.campos.push(...Object.keys(x));
      this.tituloslocal.push(nx);
    });
  }

  opcion(event: TableResponse) {
    console.log(event);

    const acct: any = {
      edit: this.edita,
      del: this.delete
    };

    const handler = acct[event.option](event.key, this.perspectivaService, this.dialog);
    handler.then((rep: IPerspectiva) => {
      this.perspectivaService.getdatos();
    }, (err: Error) => {
      this.datos.showMessage("Error: " + err.message, "Error", "error");
    });
  }

  edita(perspectiva: IPerspectiva, p: Perspectiva, t: MatDialog): Promise<any> {
    return new Promise((resolve: any, reject: any) => {
      p.model = perspectiva;
      console.log('perspectivaService edit', p.model);

      const dialogRef = t.open(FormPerspectivaComponent, {
        width: '800px', data: { model: p.model }
      });
      dialogRef.afterClosed().subscribe((result: IPerspectiva) => {
        if (result) {
          resolve(result);
        } else {
          resolve(null);
        }
      });
    });
  }

  abrirmodalzona(t: MatDialog, p: Perspectiva) {
    p.model = p.inicializamodelo();

    const dialogRef = t.open(FormPerspectivaComponent, {
      width: '800px', data: { model: p.model }
    });
    dialogRef.afterClosed().subscribe((rep: IPerspectiva) => {
      if (rep) {
        this.perspectivaService.arraymodel.push(rep);
        this.datos.showMessage("Registro Insertado Correctamente", this.perspectivaService.titulomensage, "success");
      }
    });
  }

  delete(perspectiva: IPerspectiva, p: Perspectiva, t: MatDialog): Promise<any> {
    return new Promise((resolve, reject) => { resolve(perspectiva); });
  }

  paginacambio(event: number) {
    this.perspectivaService.actualpage = event;
    console.log(this.perspectivaService.actualpage);
  }

  actualizaelidtable(event: string) {
    console.log('se actualizo el config', event);
    this.config.id = event;
  }

  filtro() {
    if (this.term != '') {
      this.perspectivaService.arraymodel = this.perspectivaService.arraymodel.filter(x => x.name.includes((this.term.toUpperCase())));
    } else {
      this.perspectivaService.getdatos();
    }
  }

  excel() { }

  pdf() { }

  agregar() {
    this.abrirmodalzona(this.dialog, this.perspectivaService);
  }
}
