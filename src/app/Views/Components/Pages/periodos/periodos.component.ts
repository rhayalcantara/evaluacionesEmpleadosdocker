import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TablesComponent } from '../../tables/tables.component';
import { TableResponse } from 'src/app/Helpers/Interfaces';
import { Periodos } from 'src/app/Controllers/Periodos';
import { ComunicacionService } from 'src/app/Services/comunicacion.service';
import { DatosServiceService } from 'src/app/Services/datos-service.service';
import { MatDialog } from '@angular/material/dialog';
import { IPeriodo } from 'src/app/Models/Periodos/IPeriodo';
import { FormPeriodosComponent } from '../../Forms/form-periodos/form-periodos.component';

@Component({
  standalone: true,
  imports: [FormsModule, TablesComponent],
  selector: 'app-periodos',
  templateUrl: './periodos.component.html',
  styleUrls: ['./periodos.component.css']
})
export class PeriodosComponent implements OnInit {
  campos: string[] = [];
  tituloslocal: string[] = [];
  config: any;
  public term: string = '';

  constructor(
    public periodo: Periodos,
    private ServiceComunicacion: ComunicacionService,
    private datos: DatosServiceService,
    private toastr: MatDialog
  ) {}

  ngOnInit(): void {
    this.periodo.getdatos();
    this.periodo.TRegistros.subscribe({
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
      totalItems: this.periodo.totalregistros
    };
    this.periodo.titulos.map((x:string|any)=>{
      let nx:string = x[Object.keys(x)[0]]
      this.campos.push(...Object.keys(x))
      this.tituloslocal.push(nx)
    })
    
  }

  actualizaelidtable($event: string) {
    // Implementation
  }

  paginacambio($event: number) {
    // Implementation
  }

  opcion(event: TableResponse) {
    console.log(event);
    const acct: any = {
      edit: this.edita,
      del: this.delete
    };
    
    const handler = acct[event.option](event.key, this.periodo, this.toastr);
    handler.then((rep: IPeriodo) => {
      this.periodo.getdatos();
    }, (err: Error) => {
      this.datos.showMessage("Error: " + err.message, "Error", "error");
    });
  }

  filtro() {
    if (this.term != '') {
      this.periodo.arraymodel = this.periodo.arraymodel.filter(x => x.descripcion.includes((this.term.toUpperCase())));
    } else {
      this.periodo.getdatos();
    }
  }

  agregar() {
    this.abrirmodalperiodo(this.toastr, this.periodo);
  }

  excel() {
    // Implementation
  }

  pdf() {
    // Implementation
  }

  edita(prod: IPeriodo, p: Periodos, t: MatDialog): Promise<any> {
    return new Promise((resolve: any, reject: any) => {
      p.model = prod;
      console.log('Periodo edit', p.model);
      
      const dialogRef = t.open(FormPeriodosComponent, {
        width: '800px',
        data: { model: p.model }
      });
      dialogRef.afterClosed().subscribe((result: IPeriodo) => {
        if (result) {
          resolve(result);
        } else {
          resolve(null);
        }
      });
    });
  }

  abrirmodalperiodo(t: MatDialog, p: Periodos) {
    p.model = p.inicializamodelo();
    
    const dialogRef = t.open(FormPeriodosComponent, {
      width: '800px',
      data: { model: p.model }
    });
    dialogRef.afterClosed().subscribe((rep: IPeriodo) => {
      this.periodo.arraymodel.push(rep);
      this.datos.showMessage("Registro Insertado Correctamente", this.periodo.titulomensage, "success");
    });
  }

  delete(prod: IPeriodo, p: Periodos, t: MatDialog): Promise<any> {
    return new Promise((resolve, reject) => { resolve(prod); });
  }
}