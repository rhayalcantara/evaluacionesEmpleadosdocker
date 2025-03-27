import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Metas } from 'src/app/Controllers/Metas';
import { DatosServiceService } from 'src/app/Services/datos-service.service';
import { ComunicacionService } from 'src/app/Services/comunicacion.service';
import { IMeta, IMetaDts } from 'src/app/Models/Meta/IMeta';
import { IPuesto } from 'src/app/Models/Puesto/IPuesto';
import { SeleccionPuestoComponent } from '../seleccion-puesto/seleccion-puesto.component';
import { IPeriodo } from 'src/app/Models/Periodos/IPeriodo';
import { SeleccionPeriodoComponent } from '../seleccion-periodo/seleccion-periodo.component';
import { Puestos } from 'src/app/Controllers/Puestos';
import { Periodos } from 'src/app/Controllers/Periodos';
import { ITipo } from 'src/app/Models/Tipo/ITipo';
import { Tipos } from 'src/app/Controllers/Tipos';
import { IGrupoCompetencia } from 'src/app/Controllers/GrupoCompetencia';
import { IObjetivo } from 'src/app/Models/Objetivo/IObjetivo';
import { Objetivo } from 'src/app/Controllers/Objetivo';

@Component({
  selector: 'app-form-metas',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './form-metas.component.html',
  styleUrls: ['./form-metas.component.css']
})
export class FormMetasComponent implements OnInit {

  public Objetivos:IObjetivo[]=[]
  public campos: string[] = [];
  public meta: IMeta = this.metasDatos.model;
  public metadts:IMetaDts =  this.metasDatos.inicializamodeloDts()
  // public tipo: ITipo = this.TipoDatos.model;
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
    public Objetivocontrolador:Objetivo,
    private dialogRef: MatDialogRef<FormMetasComponent>,
    private datService: DatosServiceService,
  ) {
    this.fg = this.fb.group({});
  }

  ngOnInit(): void {
    console.log(this.data.model);
    this.meta = this.data.model;
    this.metadts=this.data.model;
    // si se esta agregando se le pone el periodo activo
    if (this.meta.id == 0){
      //obtener el periodo activo de localstore
      this.selectedPeriodo = JSON.parse(localStorage.getItem('periodo') ?? "")
      console.table(this.selectedPeriodo)
      if (this.selectedPeriodo!=undefined){
        this.meta.periodId=this.selectedPeriodo.id
        console.table(this.meta)
      }
    }
    //this.TipoDatos.getdatos()
    this.loadObjetivos()
    //this.campos = Object.keys(this.meta);
    this.metasDatos.titulos.map((x:string|any)=>{
      let nx:string = x[Object.keys(x)[0]]
      this.campos.push(...Object.keys(x))
      //this.tituloslocal.push(nx)
    })
    this.fg = this.datService.llenarFormGrup(this.meta);
    
    if (this.meta.positionSecuencial != 0){
      console.log('llego',this.metadts.position)
      this.selectedPuesto=this.metadts.position
      /*this.puestoDatos.Get(this.meta.positionSecuencial.toString()).subscribe((rep:IPuesto)=>{        
        this.selectedPuesto = rep;
        this.fg
      })*/
    }
  
    if (this.meta.periodId !=0 ){
        this.periodoDatos.Get(this.meta.periodId.toString()).subscribe((rep:IPeriodo)=>{
          this.selectedPeriodo = rep
        })
    }
    if (this.meta.objetivoid!=0){
        // busca en el array de objetivos el que tenga el id == this.meta.objetivoid

    }

  }
  loadObjetivos(): void {
    // Assuming there's a method in the controller to get grupos de competencia
    this.metasDatos.getObjetivos().subscribe((objetivo: IObjetivo[]) => {
      this.Objetivos = objetivo;
    });
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
      this.meta = this.fg.value as IMeta;
      this.metasDatos.model = this.fg.value as IMeta  
      let n:number = this.selectedTipo ? this.selectedTipo.id  : 0
      console.log('la meta a grabar',this.metasDatos.model)
      //this.metasDatos.model.tiposid = n
      let nn:number = this.selectedPuesto ? this.selectedPuesto.secuencial : 0
      this.metasDatos.model.positionSecuencial = nn
      this.meta.positionSecuencial = nn
      console.log({meta:this.metasDatos.model},{fg:this.fg.value as IMeta}) 
      this.metasDatos.grabar();
      this.dialogRef.close(this.metasDatos.model);
    } else {
      // Show an error message or handle the case when no puesto is selected
      console.error('No se ha seleccionado un puesto');
    }
  }

  onGrupoCompetenciaSelect(event: any): void {
    const selectedObjetivoId = event.target.value;
    this.fg.patchValue({ objetivoId: selectedObjetivoId });
  }
}
