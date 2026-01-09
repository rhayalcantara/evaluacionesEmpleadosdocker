import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TablesComponent } from '../../tables/tables.component';
import { TableResponse } from 'src/app/Helpers/Interfaces';
import { GrupoCompetencia } from 'src/app/Controllers/GrupoCompetencia';
import { ComunicacionService } from 'src/app/Services/comunicacion.service';
import { DatosServiceService } from 'src/app/Services/datos-service.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { IGrupoCompetencia } from 'src/app/Models/Objetivo/IObjetivo';
import { FormGrupoCompetenciaComponent } from '../../Forms/form-grupo-competencia/form-grupo-competencia.component';

@Component({
  standalone:true,
  imports:[FormsModule,TablesComponent,MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
  selector: 'app-grupo-competencias',
  templateUrl: './grupo-competencias.component.html',
  styleUrls: ['./grupo-competencias.component.css']
})
export class GrupoCompetenciasComponent implements OnInit {
  campos: string[]=[];
  tituloslocal: string[]=[];
  config: any;
  public term: string='';


  constructor(public grupoCompetencia: GrupoCompetencia,
              private ServiceComunicacion: ComunicacionService,
              private datos: DatosServiceService,
              private toastr: MatDialog) {}

  ngOnInit(): void {
    this.grupoCompetencia.getdatos();
    this.grupoCompetencia.TRegistros.subscribe({next:(rep:number)=>{
      this.config.totalItems=rep;
      this.ServiceComunicacion.enviarMensaje(this.config);
    }});

    this.config = {
      id:'',
      itemsPerPage: 5,
      currentPage: 1,
      totalItems: this.grupoCompetencia.totalregistros
    };

    this.grupoCompetencia.titulos.map((x:string|any)=>{
      let nx:string = x[Object.keys(x)[0]];
      this.campos.push(...Object.keys(x));
      this.tituloslocal.push(nx);
    });
  }

  actualizaelidtable($event: string) {
    this.config.id = $event
  }

  paginacambio($event: number) {
    this.grupoCompetencia.actualpage = $event
  }

  opcion(event: TableResponse) {
    const acct:any = {
      edit: this.edita,
      del: this.delete
    };
    const handler = acct[event.option](event.key, this.grupoCompetencia, this.toastr);
    handler.then((rep: IGrupoCompetencia) => {
        this.graba(rep)
      this.grupoCompetencia.getdatos();
    }, (err: Error) => {
      this.datos.showMessage("Error: " + err.message, "Error", "error");
    });
  }
  edita(prod:IGrupoCompetencia,p:GrupoCompetencia,t:MatDialog):Promise<any> {
    
    const rep =  new Promise ((resolve:any,reject:any)=>{
      // p.getdatos()
      
      p.model = prod // p.arraymodel.find(x=>x.id=prod.id) as IEmpleado
      
        const  dialogRef = t.open(FormGrupoCompetenciaComponent,{
          width: '900px',data:{model:p.model}})
          dialogRef.afterClosed().subscribe((result:IGrupoCompetencia)=>{
            if (result){
                
              resolve(result);
            }else{
              resolve(null)
            }
            
          });  
          
    })
    return rep
}
  filtro() {
    if (this.term != '') {
      this.grupoCompetencia.arraymodel = this.grupoCompetencia.arraymodel.filter(x => x.nombre.includes((this.term.toUpperCase())));
    } else {
      this.grupoCompetencia.getdatos();
    }
  }

  agregar() {
    this.grupoCompetencia.model = this.grupoCompetencia.inicializamodelo();
    this.abrirmodalzona(this.toastr, this.grupoCompetencia);
  }

  excel() {
    // Logic for exporting to Excel
  }

  pdf() {
    // Logic for exporting to PDF
  }

  abrirmodalzona(t: MatDialog, p: GrupoCompetencia) {
    
    const dialogRef = t.open(FormGrupoCompetenciaComponent, {
      width: '800px', data: { model: p.model }
    });
    dialogRef.afterClosed().subscribe((rep: IGrupoCompetencia) => {
        if (rep!=null){
            // if(this.grupoCompetencia.model.id==0){
            //     this.grupoCompetencia.arraymodel.push(rep);
            // }
           this.graba(rep)
            
            
        }
    });
  }

  graba(rep:IGrupoCompetencia){
    this.grupoCompetencia.model = rep
    this.grupoCompetencia.grabar().then((pp)=>{
        if(pp){
            this.grupoCompetencia.getdatos();
            this.datos.showMessage("Registro Grabado Correctamente", this.grupoCompetencia.titulomensaje, "sucess");
        }else{
            this.datos.showMessage("Error: Grabando", this.grupoCompetencia.titulomensaje, "error");
        }
    })
  }
  delete(prod: IGrupoCompetencia, p: GrupoCompetencia, t: MatDialog): Promise<any> {
    return new Promise((resolve, reject) => { resolve(prod); });
  }
}
