import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

import { Periodos } from 'src/app/Controllers/Periodos';
import { IPeriodo } from 'src/app/Models/Periodos/IPeriodo';
import { DatosServiceService } from 'src/app/Services/datos-service.service';
import { UtilsService } from 'src/app/Helpers/utils.service';

@Component({
  selector: 'app-form-periodos',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule,ReactiveFormsModule],
  templateUrl: './form-periodos.component.html',
  styleUrls: ['./form-periodos.component.css']
})
export class FormPeriodosComponent implements OnInit {
cancelar() {
  this.dialogRef.close();
}
  model: IPeriodo={
    id: 0,
    descripcion: '',
    fechaInicio: new Date(),
    fechaFin: new Date(),
    activa: false,
    estadoid: 0
  };
  public fg: FormGroup = new FormGroup({});
  public campos: string[] = [];

  constructor(
    public dialogRef: MatDialogRef<FormPeriodosComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private periodoController: Periodos,
    private datService: DatosServiceService,
  ) {
    
  }

  ngOnInit(): void {
  
    this.model = this.data.model;
    console.log({model:this.model})
    this.periodoController.titulos.map((x:string|any)=>{
      let nx:string = x[Object.keys(x)[0]]
      this.campos.push(...Object.keys(x))
      //this.tituloslocal.push(nx)
    })
    this.fg = this.datService.llenarFormGrup(this.model);

    this.fg.controls['fechaInicio'].setValue(UtilsService.formatDateForInput(this.data.model.fechaInicio))
    this.fg.controls['fechaFin'].setValue(UtilsService.formatDateForInput(this.data.model.fechaFin))
    
  }
// Función para formatear la fecha en el formato YYYY-MM-DD

  grabar(): void {
    
  }

  onSubmit(): void {
    //this.model = this.fg.value as IPeriodo

     this.model.descripcion = this.fg.controls["descripcion"].value
     this.model.fechaInicio = this.fg.controls["fechaInicio"].value
     this.model.fechaFin = this.fg.controls["fechaFin"].value
     this.model.activa = false
      console.log({modelo:this.model})
    if (this.model.id === 0) {
      this.periodoController.insert(this.model).subscribe({
        next: (result) => {
          this.dialogRef.close(result);
        },
        error: (err) => {
          console.error('Error inserting periodo:', err.message);
        }
      });
    } else {
      this.periodoController.Update(this.model).subscribe({
        next: (result) => {
          this.dialogRef.close(result);
        },
        error: (err) => {
          console.error('Error updating periodo:', err);
        }
      });
    }
  }
}