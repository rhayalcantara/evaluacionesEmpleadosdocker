import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Periodos } from 'src/app/Controllers/Periodos';
import { IPeriodo } from 'src/app/Models/Periodos/IPeriodo';
import { TablesComponent } from '../../tables/tables.component';
import { TableResponse } from 'src/app/Helpers/Interfaces';

@Component({
  selector: 'app-seleccion-periodo',
  standalone: true,
  imports: [CommonModule, FormsModule, TablesComponent],
  templateUrl:'./seleccion-periodo.component.html',
  styleUrls: ['./seleccion-periodo.component.css']
})
export class SeleccionPeriodoComponent implements OnInit {
  periodos: IPeriodo[] = [];
  filteredPeriodos: IPeriodo[] = [];
  sele: boolean = true;
  config: any;
  public campos: string[] = [];
  public tituloslocal: string[] = [];
  public term: string = '';

  constructor(
    public periodosService: Periodos,
    public dialogRef: MatDialogRef<SeleccionPeriodoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.cargarPeriodos();
    this.config = {
      id: '',
      itemsPerPage: 10,
      currentPage: 1,
      totalItems: this.periodosService.totalregistros
    };
  }

  cargarPeriodos() {
    this.periodosService.getdatos();
    this.periodos = this.periodosService.arraymodel;
    this.filteredPeriodos = this.periodos;

    this.periodosService.titulos.map((x: string | any) => {
      let nx: string = x[Object.keys(x)[0]];
      this.campos.push(...Object.keys(x));
      this.tituloslocal.push(nx);
    });
  }

  filtro() {
    if (this.term != '') {
      this.filteredPeriodos = this.periodos.filter(x =>
        x.descripcion.toLowerCase().includes(this.term.toLowerCase())
      );
    } else {
      this.filteredPeriodos = this.periodos;
    }
  }

  seleccionarPeriodo(periodo: IPeriodo) {
    this.dialogRef.close(periodo);
  }

  cancelar() {
    this.dialogRef.close();
  }

  opcion(event: TableResponse) {
    this.dialogRef.close(event.key);
  }

  paginacambio(event: number) {
    this.periodosService.actualpage = event;
  }

  actualizaelidtable(event: string) {
    this.config.id = event;
  }
}