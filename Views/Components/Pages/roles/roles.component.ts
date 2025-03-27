import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IRol } from 'src/app/Models/Rol/IRol';

import { TablesComponent } from '../../tables/tables.component';
import { CommonModule } from '@angular/common';
import { Roles } from 'src/app/Controllers/Roles';
import { ComunicacionService } from 'src/app/Services/comunicacion.service';
import { TableResponse } from 'src/app/Helpers/Interfaces';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DatosServiceService } from 'src/app/Services/datos-service.service';
import { FormRolesComponent } from '../../Forms/form-roles/form-roles.component';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [FormsModule, TablesComponent, CommonModule,MatDialogModule],
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.css']
})
export class RolesComponent implements OnInit {
  config: any
  public term: string = '';
  public campos: string[] = []
  public tituloslocal: string[] = []

  constructor(public roleService: Roles,
    private ServiceComunicacion: ComunicacionService,
    private datos: DatosServiceService,
    private dialog: MatDialog,
  ) {
    this.ServiceComunicacion.enviarMensajeObservable.subscribe({
      next: (mensaje: string) => {
        console.log('roleServices Construtor: ' + mensaje)
      }
    })
  }

  ngOnInit(): void {
    this.roleService.getdatos()
    this.roleService.TRegistros.subscribe({
      next: (rep: number) => {
        console.log("evento#:", rep)
        this.config.totalItems = rep
        this.ServiceComunicacion.enviarMensaje(this.config)
      }
    })

    this.config = {
      id: '',
      itemsPerPage: 5,
      currentPage: 1,
      totalItems: this.roleService.totalregistros
    };

    this.roleService.titulos.map((x: string | any) => {
      let nx: string = x[Object.keys(x)[0]]
      this.campos.push(...Object.keys(x))
      this.tituloslocal.push(nx)
    })
  }

  opcion(event: TableResponse) {

    console.log(event)

    const acct: any = {
      edit: this.edita,
      del: this.delete
    }

    const handler = acct[event.option](event.key, this.roleService, this.dialog)
    handler.then((rep: IRol) => {
      this.roleService.getdatos()
    }, (err: Error) => {
      this.datos.showMessage("Error: " + err.message, "Error", "error")
    })
      
  }

  edita(prod: IRol, p: Roles, t: MatDialog): Promise<any> {
    return new Promise((resolve: any, reject: any) => {
      p.model = prod
      console.log('roleService edit', p.model)

      const dialogRef = t.open(FormRolesComponent, {
        width: '800px', data: { model: p.model }
      })
      dialogRef.afterClosed().subscribe((result: IRol) => {
        if (result) {
          resolve(result);
        } else {
          resolve(null)
        }
      });
    })
  }

  abrirmodalzona(t: MatDialog, p: Roles) {
    p.model = p.inicializamodelo()

    const dialogRef = t.open(FormRolesComponent, {
      width: '800px', data: { model: p.model }
    })
    dialogRef.afterClosed().subscribe((rep: IRol) => {
      if (rep) {
        this.roleService.arraymodel.push(rep)
        this.datos.showMessage("Registro Insertado Correctamente", this.roleService.titulomensage, "success")
      }
    });
  }

  delete(prod: IRol, p: Roles, t: MatDialog): Promise<any> {
    return new Promise((resolve, reject) => { resolve(prod) })
  }

  paginacambio(event: number) {
    this.roleService.actualpage = event
    console.log(this.roleService.actualpage)
  }

  actualizaelidtable(event: string) {
    console.log('se actualizo el config', event)
    this.config.id = event
  }

  filtro() {
    if (this.term != '') {
      this.roleService.arraymodel = this.roleService.arraymodel.filter(x => x.name.includes((this.term.toUpperCase())))
    } else {
      this.roleService.getdatos()
    }
  }

  excel() { }

  pdf() { }

  agregar() {
     this.abrirmodalzona(this.dialog, this.roleService)
  }
}