import { Component, Inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Roles } from 'src/app/Controllers/Roles';
import { IRol } from 'src/app/Models/Rol/IRol';
import { ComunicacionService } from 'src/app/Services/comunicacion.service';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DatosServiceService } from 'src/app/Services/datos-service.service';


@Component({
  selector: 'app-form-roles',
  standalone: true,
  imports: [FormsModule,ReactiveFormsModule ,CommonModule],  
  templateUrl: './form-roles.component.html',
  styleUrls:  ['./form-roles.component.css']
})
export class FormRolesComponent implements OnInit {
  fg: FormGroup;
  ;
 
  public term: string='';
  public campos:string[]=[]
  public tituloslocal:string[]=[]

  constructor(
    @Inject(MAT_DIALOG_DATA) public data:any,
    private dialogre:MatDialogRef<FormRolesComponent>,
    private Dat:DatosServiceService,
    private formBuilder: FormBuilder,
    public roles: Roles
  ) {
    this.fg = this.formBuilder.group({});
  }

  ngOnInit(): void {
    this.roles.model = this.data.model
    this.campos=Object.keys(this.roles.model);
    this.fg= this.Dat.llenarFormGrup(this.roles.model)
  }

  grabar(): void {
    this.roles.model = this.fg.value as IRol
    this.roles.grabar()
    this.dialogre.close(this.roles.model)
  }
  cancelar() {
    this.dialogre.close(null)
  }
}