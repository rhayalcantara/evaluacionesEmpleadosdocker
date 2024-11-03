import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IObjetivoEstrategico } from 'src/app/Models/PlanExtrategico/IPlanExtrategico';
import { TablesComponent } from '../../tables/tables.component';
import { CommonModule } from '@angular/common';
import { ComunicacionService } from 'src/app/Services/comunicacion.service';
import { TableResponse } from 'src/app/Helpers/Interfaces';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DatosServiceService } from 'src/app/Services/datos-service.service';
import { ObjetivoEstrategico } from 'src/app/Controllers/ObjetivoEstrategico';
import { FromObjetivoExtrategicoComponent } from '../../Forms/from-objetivo-extrategico/from-objetivo-extrategico.component';
import { FormKriComponent } from '../../Forms/form-kri/form-kri.component';

@Component({
  selector: 'app-objetivo-estrategico',
  standalone: true,
  imports: [FormsModule, TablesComponent, 
    CommonModule, MatDialogModule, FromObjetivoExtrategicoComponent],
  templateUrl: './objetivo-estrategico.component.html',
  styleUrls: ['./objetivo-estrategico.component.css']
})
export class ObjetivoEstrategicoComponent implements OnInit {
  config: any;
  public term: string = '';
  public campos: string[] = [];
  public tituloslocal: string[] = [];

  constructor(
    public objetivoEstrategicoService: ObjetivoEstrategico,
    private ServiceComunicacion: ComunicacionService,
    private datos: DatosServiceService,
    private dialog: MatDialog
  ) {
    this.ServiceComunicacion.enviarMensajeObservable.subscribe({
      next: (mensaje: string) => {
        console.log('objetivoEstrategicoService Constructor: ' + mensaje);
      }
    });
  }

  ngOnInit(): void {
    this.objetivoEstrategicoService.getdatos();
    this.objetivoEstrategicoService.TRegistros.subscribe({
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
      totalItems: this.objetivoEstrategicoService.totalregistros
    };

    this.objetivoEstrategicoService.titulos.map((x: string | any) => {
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

    const handler = acct[event.option](event.key, this.objetivoEstrategicoService, this.dialog);
    handler.then((rep: IObjetivoEstrategico) => {
      this.objetivoEstrategicoService.getdatos();
    }, (err: Error) => {
      this.datos.showMessage("Error: " + err.message, "Error", "error");
    });
  }

  edita(objetivo: IObjetivoEstrategico, p: ObjetivoEstrategico, t: MatDialog): Promise<any> {
    return new Promise((resolve: any, reject: any) => {
      p.model = objetivo;
      console.log('objetivoEstrategicoService edit', p.model);

      const dialogRef = t.open(FromObjetivoExtrategicoComponent, {
        width: '90%', data: { model: p.model }
      });
      dialogRef.afterClosed().subscribe((result: IObjetivoEstrategico) => {
        if (result) {
          resolve(result);
        } else {
          resolve(null);
        }
      });
    });
  }

  abrirmodalzona(t: MatDialog, p: ObjetivoEstrategico) {
    p.model = p.inicializamodelo();

    const dialogRef = t.open(FromObjetivoExtrategicoComponent, {
      width: '90%', data: { model: p.model }
    });
    dialogRef.afterClosed().subscribe((rep: IObjetivoEstrategico) => {
      if (rep) {
        this.objetivoEstrategicoService.arraymodel.push(rep);
        this.datos.showMessage("Registro Insertado Correctamente", this.objetivoEstrategicoService.titulomensage, "success");
      }
    });
  }

  delete(objetivo: IObjetivoEstrategico, p: ObjetivoEstrategico, t: MatDialog): Promise<any> {
    return new Promise((resolve, reject) => { resolve(objetivo); });
  }

  paginacambio(event: number) {
    this.objetivoEstrategicoService.actualpage = event;
    console.log(this.objetivoEstrategicoService.actualpage);
  }

  actualizaelidtable(event: string) {
    console.log('se actualizo el config', event);
    this.config.id = event;
  }

  filtro() {
    if (this.term != '') {
      this.objetivoEstrategicoService.arraymodel = this.objetivoEstrategicoService.arraymodel.filter(x => x.descripcion.includes((this.term.toUpperCase())));
    } else {
      this.objetivoEstrategicoService.getdatos();
    }
  }

  excel() { }

  pdf() { }

  agregar() {
    this.abrirmodalzona(this.dialog, this.objetivoEstrategicoService);
  }
}
