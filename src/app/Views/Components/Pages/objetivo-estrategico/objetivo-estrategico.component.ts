import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IObjetivoEstrategico, IPlanExtrategico } from 'src/app/Models/PlanExtrategico/IPlanExtrategico';
import { TablesComponent } from '../../tables/tables.component';
import { CommonModule } from '@angular/common';
import { ComunicacionService } from 'src/app/Services/comunicacion.service';
import { TableResponse } from 'src/app/Helpers/Interfaces';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DatosServiceService } from 'src/app/Services/datos-service.service';
import { ObjetivoEstrategico } from 'src/app/Controllers/ObjetivoEstrategico';
import { PlanExtrategico } from 'src/app/Controllers/PlanExtrategico';
import { FromObjetivoExtrategicoComponent } from '../../Forms/from-objetivo-extrategico/from-objetivo-extrategico.component';
import { FormKriComponent } from '../../Forms/form-kri/form-kri.component';
import { ModelResponse } from 'src/app/Models/Usuario/modelResponse';

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

  // Filtro por plan estratégico
  public planEstrategicoIdFiltro: number = 0;
  public planesEstrategicos: IPlanExtrategico[] = [];

  constructor(
    public objetivoEstrategicoService: ObjetivoEstrategico,
    public planEstrategicoService: PlanExtrategico,
    private ServiceComunicacion: ComunicacionService,
    private datos: DatosServiceService,
    private dialog: MatDialog
  ) {
    this.ServiceComunicacion.enviarMensajeObservable.subscribe({
      next: (mensaje: string) => {
        console.table(mensaje);
      }
    });
  }

  ngOnInit(): void {
    // Cargar planes estratégicos
    this.planEstrategicoService.Gets().subscribe({
      next: (rep: ModelResponse) => {
        this.planesEstrategicos = rep.data;
      }
    });

    // Cargar objetivos estratégicos
    this.objetivoEstrategicoService.getdatos();
    this.objetivoEstrategicoService.TRegistros.subscribe({
      next: (rep: number) => {
        console.table(this.objetivoEstrategicoService.arraymodel);
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
  }

  actualizaelidtable(event: string) {
    this.config.id = event;
  }

  filtro() {
    // Aplicar filtros combinados: búsqueda por texto y plan estratégico
    this.aplicarFiltros();
  }

  filtroPorPlan() {
    // Aplicar filtros cuando cambia el plan estratégico
    this.aplicarFiltros();
  }

  private aplicarFiltros() {
    // Recargar todos los datos primero
    if (this.term === '' && this.planEstrategicoIdFiltro === 0) {
      // Si no hay filtros, recargar todos los datos
      this.objetivoEstrategicoService.getdatos();
      return;
    }

    // Partir del array total
    let resultados = [...this.objetivoEstrategicoService.arraytotal];

    // Filtrar por plan estratégico si se seleccionó uno
    if (this.planEstrategicoIdFiltro > 0) {
      resultados = resultados.filter(x =>
        x.perspectiva && x.perspectiva.planExtrategicoModelId === this.planEstrategicoIdFiltro
      );
    }

    // Filtrar por término de búsqueda si existe
    if (this.term !== '') {
      resultados = resultados.filter(x =>
        x.descripcion.toUpperCase().includes(this.term.toUpperCase())
      );
    }

    // Actualizar el array de visualización
    this.objetivoEstrategicoService.arraymodel = resultados;
    this.objetivoEstrategicoService.totalregistros = resultados.length;
    this.config.totalItems = resultados.length;
  }

  excel() { }

  pdf() { }

  agregar() {
    this.abrirmodalzona(this.dialog, this.objetivoEstrategicoService);
  }
}
