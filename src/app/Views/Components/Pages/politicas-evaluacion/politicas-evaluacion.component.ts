import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TablesComponent } from '../../tables/tables.component';
import { FormsModule } from '@angular/forms';
import { PoliticaEvaluacion } from 'src/app/Controllers/PoliticaEvaluacion';
import { ComunicacionService } from 'src/app/Services/comunicacion.service';
import { DatosServiceService } from 'src/app/Services/datos-service.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TableResponse } from 'src/app/Helpers/Interfaces';
import { IPoliticaEvaluacion } from 'src/app/Models/PoliticaEvaluacion/IPoliticaEvaluacion';
import { LoadingComponent } from '../../loading/loading.component';


@Component({
  selector: 'app-politicas-evaluacion',
  standalone: true,
  imports: [FormsModule, TablesComponent, CommonModule,MatDialogModule],
  templateUrl: './politicas-evaluacion.component.html',
  styleUrls: ['./politicas-evaluacion.component.css']
})
export class PoliticasEvaluacionComponent implements OnInit {
opcion($event: TableResponse) {
throw new Error('Method not implemented.');
}
  constructor(
    public politicaEvaluacion: PoliticaEvaluacion,
    private ServiceComunicacion: ComunicacionService,
    private datos: DatosServiceService,
    private toastr: MatDialog
  ) {
    this.ServiceComunicacion.enviarMensajeObservable.subscribe({
      next: (mensaje: string) => {
        console.log('PoliticasEvaluacion Constructor: ' + mensaje)
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
        console.log("evento#:", rep)
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
    console.log('se actualizo el config', event)
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


}