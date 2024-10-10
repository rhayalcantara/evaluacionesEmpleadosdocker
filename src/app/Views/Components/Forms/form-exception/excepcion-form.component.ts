import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { IException, IExceptionDts } from 'src/app/Models/Excepcion/IExcepcion';
import { DatosServiceService } from 'src/app/Services/datos-service.service';
import { Excepcion } from 'src/app/Controllers/Excepcion';


@Component({
  selector: 'app-excepcion-form',
  standalone: true,
  imports: [CommonModule,ReactiveFormsModule, FormsModule],
  templateUrl: './excepcion-form.component.html',
  styleUrls: ['./excepcion-form.component.css']
})
export class ExcepcionFormComponent implements OnInit {
BuscarEmpleado() {
throw new Error('Method not implemented.');
}
  public formGroup:FormGroup
  public excepcionmodel:IExceptionDts=this.excepcioncontrol.inicializamodelo()
excepcionForm: any;
  constructor(private fb:FormBuilder,
    private excepcioncontrol:Excepcion,
    public dialogRef: MatDialogRef<ExcepcionFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { model: IExceptionDts },
    private datosService: DatosServiceService
  ){
    this.formGroup=fb.group({})
  }
  ngOnInit(): void {
 //    console.log(this.data.model);
    this.excepcionmodel = this.data.model;
   
    
  }
agregarExcepcion() {
throw new Error('Method not implemented.');
}
cancelar() {
  throw new Error('Method not implemented.');
}
 

 

 

}