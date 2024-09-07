import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Metas } from 'src/app/Controllers/Metas';
import { DatosServiceService } from 'src/app/Services/datos-service.service';
import { ComunicacionService } from 'src/app/Services/comunicacion.service';
import { IMeta } from 'src/app/Models/Meta/IMeta';
import { IPuesto } from 'src/app/Models/Puesto/IPuesto';
import { SeleccionPuestoComponent } from '../seleccion-puesto/seleccion-puesto.component';
import { IPeriodo } from 'src/app/Models/Periodos/IPeriodo';
import { SeleccionPeriodoComponent } from '../seleccion-periodo/seleccion-periodo.component';
import { Puestos } from 'src/app/Controllers/Puestos';
import { Periodos } from 'src/app/Controllers/Periodos';
import { ITipo } from 'src/app/Models/Tipo/ITipo';
import { Tipos } from 'src/app/Controllers/Tipos';

@Component({
  selector: 'app-form-metas',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './form-metas.component.html',
  styleUrls: ['./form-metas.component.css']
})
export class FormMetasComponent implements OnInit {


  public campos: string[] = [];
  public meta: IMeta = this.metasDatos.model;
  public tipo: ITipo = this.TipoDatos.model;
  public fg: FormGroup = new FormGroup({});
  public selectedPuesto: IPuesto | null = null;
  public selectedPeriodo: IPeriodo | null = null;
  public selectedTipo:ITipo | null = null;
  
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private dialog: MatDialog,
    public metasDatos: Metas,
    public puestoDatos:Puestos,
    public periodoDatos:Periodos,
    public TipoDatos:Tipos,
    private dialogRef: MatDialogRef<FormMetasComponent>,
    private datService: DatosServiceService,
  ) {
    this.fg = this.fb.group({});
  }

  ngOnInit(): void {
    console.log(this.data.model);
    this.meta = this.data.model;
    this.TipoDatos.getdatos()
    //this.campos = Object.keys(this.meta);
    this.metasDatos.titulos.map((x:string|any)=>{
      let nx:string = x[Object.keys(x)[0]]
      this.campos.push(...Object.keys(x))
      //this.tituloslocal.push(nx)
    })
    this.fg = this.datService.llenarFormGrup(this.meta);
    
    if (this.meta.positionSecuencial != 0){
      this.puestoDatos.Get(this.meta.positionSecuencial.toString()).subscribe((rep:IPuesto)=>{        
        this.selectedPuesto = rep;
        this.fg
      })
    }
    if (this.meta.periodId !=0 ){
        this.periodoDatos.Get(this.meta.periodId.toString()).subscribe((rep:IPeriodo)=>{
          this.selectedPeriodo = rep
        })
    }
    if (this.meta.tiposid!=0){
        this.TipoDatos.Get(this.meta.tiposid.toString())
                      .subscribe((rep:ITipo)=>{
                        this.selectedTipo=rep
                        console.log(rep)
                      })
    }

  }
  onTipoChange(event:any) {
    console.log("cambio el tipo",event)
      let tipo:string = event.target.value
      const partes = tipo.split(":");
      const despuesDeDosPuntos = partes[1];
      let t = this.TipoDatos.arraymodel
                  .find(x=>x.id== Number.parseInt(despuesDeDosPuntos)) ? 
                  this.TipoDatos.arraymodel
                  .find(x=>x.id== Number.parseInt(despuesDeDosPuntos)) :
                  this.TipoDatos.model
      if (t!=null){
        this.selectedTipo=t
      }
      console.log("cambio tipo",event.target.value,this.selectedTipo)
    }
  openSeleccionPuesto() {
    const dialogRef = this.dialog.open(SeleccionPuestoComponent, {
      width: '800px',
      data: {}
    });
 
    dialogRef.afterClosed().subscribe((result:IPuesto) => {
      if (result) {
        this.selectedPuesto = result;
        this.fg.patchValue({ position_secuencial: result.secuencial });        
      }
    });
  }
  openSeleccionPeriodo(){
    const dialogRef = this.dialog.open(SeleccionPeriodoComponent, {
      width: '800px',
      data: {}
    });
 
    dialogRef.afterClosed().subscribe((result:IPeriodo) => {
      if (result) {
        this.selectedPeriodo = result;
        this.fg.patchValue({ periodId: result.id });        
      }
    });   
  }
  cancelar() {
    this.dialogRef.close(null);
  }

  grabar() {
      // Si selectedPuesto y selectedPeriodo puede grabar
    if (this.selectedPeriodo || this.selectedPuesto || (this.selectedTipo?.id!=0)){
    //if (this.selectedPuesto ) {
      this.metasDatos.model = this.fg.value as IMeta  
      let n:number = this.selectedTipo ? this.selectedTipo.id  : 0
      console.log({obj:this.selectedTipo,variable:n})
      this.metasDatos.model.tiposid = n
      let nn:number = this.selectedPuesto ? this.selectedPuesto.secuencial : 0
      this.metasDatos.model.positionSecuencial = nn
      console.log({meta:this.metasDatos.model},{fg:this.fg.value as IMeta}) 
      this.metasDatos.grabar();
      this.dialogRef.close(this.metasDatos.model);
    } else {
      // Show an error message or handle the case when no puesto is selected
      console.error('No se ha seleccionado un puesto');
    }
  }
}
