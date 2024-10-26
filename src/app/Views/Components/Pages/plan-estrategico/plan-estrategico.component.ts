import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormPlanEstrategicoComponent } from '../../Forms/form-plan-estrategico/form-plan-estrategico.component';
import { PlanExtrategico } from 'src/app/Controllers/PlanExtrategico';
import { ComunicacionService } from 'src/app/Services/comunicacion.service';
import { DatosServiceService } from 'src/app/Services/datos-service.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TableResponse } from 'src/app/Helpers/Interfaces';
import { IPlanExtrategico } from 'src/app/Models/PlanExtrategico/IPlanExtrategico';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TablesComponent } from '../../tables/tables.component';

@Component({
  selector: 'app-plan-estrategico',
  templateUrl: './plan-estrategico.component.html',
  standalone: true,
  imports: [CommonModule,FormsModule,TablesComponent,
    ReactiveFormsModule, FormPlanEstrategicoComponent,
  MatDialogModule]
})
export class PlanEstrategicoComponent {
  config: any;
  public term: string = '';
  public campos: string[] = [];
  public tituloslocal: string[] = [];

  constructor(
    public PlanExtrategicoController: PlanExtrategico,
    private ServiceComunicacion: ComunicacionService,
    private datos: DatosServiceService,
    private dialog: MatDialog
  ) {
    this.ServiceComunicacion.enviarMensajeObservable.subscribe({
      next: (mensaje: string) => {
        console.log('PlanExtrategicoControllers Constructor: ' + mensaje);
      }
    });
  }

  ngOnInit(): void {
    this.PlanExtrategicoController.getdatos();
    this.PlanExtrategicoController.TRegistros.subscribe({
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
      totalItems: this.PlanExtrategicoController.totalregistros
    };

    this.PlanExtrategicoController.titulos.map((x: string | any) => {
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

    const handler = acct[event.option](event.key, this.PlanExtrategicoController, this.dialog);
    handler.then((rep: IPlanExtrategico) => {
      this.PlanExtrategicoController.getdatos();
    }, (err: Error) => {
      this.datos.showMessage("Error: " + err.message, "Error", "error");
    });
  }

  edita(PlanExtrategico: IPlanExtrategico, p: PlanExtrategico, t: MatDialog): Promise<any> {
    return new Promise((resolve: any, reject: any) => {
      p.model = PlanExtrategico;
      console.log('PlanExtrategicoController edit', p.model);

      const dialogRef = t.open(FormPlanEstrategicoComponent, {
        width: '800px', data: { model: p.model }
      });
      dialogRef.afterClosed().subscribe((result: IPlanExtrategico) => {
        if (result) {
          resolve(result);
        } else {
          resolve(null);
        }
      });
    });
  }

  abrirmodalzona(t: MatDialog, p: PlanExtrategico) {
    p.model = p.inicializamodelo();

    const dialogRef = t.open(FormPlanEstrategicoComponent, {
      width: '800px', data: { model: p.model }
    });
    dialogRef.afterClosed().subscribe((rep: IPlanExtrategico) => {
      if (rep) {
        this.PlanExtrategicoController.arraymodel.push(rep);
        this.datos.showMessage("Registro Insertado Correctamente", this.PlanExtrategicoController.titulomensage, "success");
      }
    });
  }

  delete(PlanExtrategico: IPlanExtrategico, p: PlanExtrategico, t: MatDialog): Promise<any> {
    return new Promise((resolve, reject) => { resolve(PlanExtrategico); });
  }

  paginacambio(event: number) {
    this.PlanExtrategicoController.actualpage = event;
    console.log(this.PlanExtrategicoController.actualpage);
  }

  actualizaelidtable(event: string) {
    console.log('se actualizo el config', event);
    this.config.id = event;
  }

  filtro() {
    if (this.term != '') {
      this.PlanExtrategicoController.arraymodel = this.PlanExtrategicoController.arraymodel.filter(x => x.descripcion.includes((this.term.toUpperCase())));
    } else {
      this.PlanExtrategicoController.getdatos();
    }
  }

  excel() { }

  pdf() { }

  agregar() {
    this.abrirmodalzona(this.dialog, this.PlanExtrategicoController);
  }
}
