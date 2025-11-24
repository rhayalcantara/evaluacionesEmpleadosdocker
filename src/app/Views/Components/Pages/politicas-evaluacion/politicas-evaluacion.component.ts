import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TablesComponent } from '../../tables/tables.component';
import { FormsModule } from '@angular/forms';
import { PoliticaEvaluacion } from 'src/app/Controllers/PoliticaEvaluacion';
import { ComunicacionService } from 'src/app/Services/comunicacion.service';
import { DatosServiceService } from 'src/app/Services/datos-service.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TableResponse } from 'src/app/Helpers/Interfaces';
import { LoadingComponent } from '../../loading/loading.component';
import { IPoliticaEvaluacion } from 'src/app/Models/PoliticaEvaluacion/IPoliticaEvaluacion';
import { FormPoliticaEvaluacionComponent } from '../../Forms/form-politica-evaluacion/form-politica-evaluacion.component';


@Component({
  selector: 'app-politicas-evaluacion',
  standalone: true,
  imports: [FormsModule, TablesComponent, CommonModule,MatDialogModule],
  templateUrl: './politicas-evaluacion.component.html',
  styleUrls: ['./politicas-evaluacion.component.css']
})
export class PoliticasEvaluacionComponent implements OnInit {


  constructor(
    public politicaEvaluacion: PoliticaEvaluacion,
    private ServiceComunicacion: ComunicacionService,
    private datos: DatosServiceService,
    private toastr: MatDialog
  ) {
    this.ServiceComunicacion.enviarMensajeObservable.subscribe({
      next: (mensaje: string) => {
      }
    })
  }

  config: any
  public term: string = '';

  public campos: string[] = []
  public tituloslocal: string[] = []

  ngOnInit(): void {
    const dialogRef = this.toastr.open(LoadingComponent, {
      width: '340px',
      height: '180px',
    });
    this.politicaEvaluacion.getdatos()
    
    this.politicaEvaluacion.TRegistros.subscribe({
      next: (rep: number) => {
        this.config.totalItems = rep
        this.ServiceComunicacion.enviarMensaje(this.config)
        dialogRef.close()
      }
    })

    this.config = {
      id: '',
      itemsPerPage: 10,
      currentPage: 1,
      totalItems: this.politicaEvaluacion.totalregistros
    };

    this.politicaEvaluacion.titulos.map((x: string | any) => {
      let nx: string = x[Object.keys(x)[0]]
      this.campos.push(...Object.keys(x))
      this.tituloslocal.push(nx)
    })
  }



  paginacambio(event: number) {
    this.politicaEvaluacion.actualpage = event
  }

  actualizaelidtable(event: string) {
    this.config.id = event
  }

  filtro() {
    if (this.term != '') {
      this.politicaEvaluacion.arraymodel = this.politicaEvaluacion.arraymodel.filter(x => x.nombre.includes((this.term.toUpperCase())))
    } else {
      this.politicaEvaluacion.getdatos()
    }
  }

  excel() { }

  pdf() { }

  opcion(event: TableResponse) {
    const acct: any = {
      edit: this.edita,
      del: this.delete
    };
    
    const handler = acct[event.option](event.key, this.politicaEvaluacion, this.toastr);
    handler.then((rep: IPoliticaEvaluacion) => {
      this.politicaEvaluacion.getdatos();
    }, (err: Error) => {
      this.datos.showMessage("Error: " + err.message, "Error", "error");
    });
  }

  edita(prod: IPoliticaEvaluacion, p: PoliticaEvaluacion, t: MatDialog): Promise<any> {
    return new Promise((resolve: any, reject: any) => {
      p.model = prod;
      
      const dialogRef = t.open(FormPoliticaEvaluacionComponent, {
        width: '800px',
        data: { model: p.model }
      });
      dialogRef.afterClosed().subscribe((result: IPoliticaEvaluacion) => {
        if (result) {
          resolve(result);
        } else {
          resolve(null);
        }
      });
    });
  }
  agregar() {
    this.abrirmodalperiodo(this.toastr,this.politicaEvaluacion)
    }

  abrirmodalperiodo(t: MatDialog, p: PoliticaEvaluacion) {
    p.model = p.inicializamodelo();
    
    const dialogRef = t.open(FormPoliticaEvaluacionComponent, {
      width: '800px',
      data: { model: p.model }
    });
    dialogRef.afterClosed().subscribe((rep: IPoliticaEvaluacion) => {
      this.politicaEvaluacion.arraymodel.push(rep);
      this.datos.showMessage("Registro Insertado Correctamente", this.politicaEvaluacion.titulomensage, "success");
    });
  }

  delete(prod: IPoliticaEvaluacion, p: PoliticaEvaluacion, t: MatDialog): Promise<any> {
    return new Promise((resolve, reject) => { resolve(prod); });
  }
}
