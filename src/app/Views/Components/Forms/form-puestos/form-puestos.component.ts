import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Puestos } from 'src/app/Controllers/Puestos';
import { DatosServiceService } from 'src/app/Services/datos-service.service';
import { ComunicacionService } from 'src/app/Services/comunicacion.service';
import { IPuesto } from 'src/app/Models/Puesto/IPuesto';
import { Departamento } from 'src/app/Controllers/Departamento';

@Component({
  selector: 'app-form-puestos',
  standalone: true,
  imports: [FormsModule,ReactiveFormsModule ,CommonModule],
  templateUrl: './form-puestos.component.html',
  styleUrls: ['./form-puestos.component.css']
})
export class FormPuestosComponent implements OnInit {

  public campos:string[]=[];
  public puesto:IPuesto=this.puestodatos.model
  public fg:FormGroup = new FormGroup({})
  constructor(
    @Inject(MAT_DIALOG_DATA) public data:any,
    private fb: FormBuilder,
    private toastr: MatDialog,
    public puestodatos:Puestos, 
    public departamentos:Departamento,   
    private dialogre:MatDialogRef<FormPuestosComponent>,
    private Dat:DatosServiceService,
    private ServiceComunicacion:ComunicacionService,) 
    {
      this.fg=this.fb.group({});
    }
  ngOnInit(): void {
    console.log(this.data.model)
    this.puesto = this.data.model
    this.departamentos.getdatos()

    this.campos=Object.keys(this.puesto);
    this.fg= this.Dat.llenarFormGrup(this.puesto)

  }
  onChange($event: Event) {
    
  }
  cancelar() {
    this.dialogre.close(null)
  }
  grabar() {
    this.puestodatos.model.secuencial = +this.fg.controls['secuencial'].value
    this.puestodatos.model.descripcion = this.fg.controls['descripcion'].value    
    this.puestodatos.model.departmentsecuencial=+this.fg.controls['departmentsecuencial'].value        
    this.puestodatos.grabar()
    this.dialogre.close(this.puestodatos.model)
  }
}
