import { Component, OnInit, Input, Output, EventEmitter, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TablesComponent } from '../../tables/tables.component';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ITipo } from '../../../../Models/Tipo/ITipo';
import { Tipos } from '../../../../Controllers/Tipos';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DatosServiceService } from 'src/app/Services/datos-service.service';
import { ComunicacionService } from 'src/app/Services/comunicacion.service';

@Component({
  selector: 'app-form-tipos',
  standalone: true,
  imports: [FormsModule,TablesComponent,CommonModule,ReactiveFormsModule],
  templateUrl: './form-tipos.component.html',
  styleUrls: ['./form-tipos.component.css']
})
export class FormTiposComponent implements OnInit {
  public campos:string[]=[];
  public tipo:ITipo=this.tiposController.model
  public fg:FormGroup = new FormGroup({})



  constructor(
    @Inject(MAT_DIALOG_DATA) public data:any,
      private fb: FormBuilder, 
      private tiposController: Tipos,
      private toastr: MatDialog,   
      private dialogre:MatDialogRef<FormTiposComponent>,
      private Dat:DatosServiceService,
      private ServiceComunicacion:ComunicacionService) 
      {
       this.fg = this.fb.group({});
      }

  ngOnInit() {
    this.tipo = this.data.model
    

    this.campos=Object.keys(this.tipo);
    this.fg= this.Dat.llenarFormGrup(this.tipo)
  }
  cancelar() {
    this.dialogre.close(null)
  }
  grabar() {
    
    this.tiposController.model = this.fg.value as ITipo
    this.tiposController.grabar()
    this.dialogre.close(this.tiposController.model)
  }

}
