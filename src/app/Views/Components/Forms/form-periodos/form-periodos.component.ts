import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

import { Periodos } from 'src/app/Controllers/Periodos';
import { IPeriodo } from 'src/app/Models/Periodos/IPeriodo';
import { DatosServiceService } from 'src/app/Services/datos-service.service';
import { UtilsService } from 'src/app/Helpers/utils.service';
import { LoggerService } from 'src/app/Services/logger.service';

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
    estadoid: 0,
    tipo: 'final_ano'
  };
  public fg: FormGroup = new FormGroup({});
  public campos: string[] = [];

  constructor(
    public dialogRef: MatDialogRef<FormPeriodosComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private periodoController: Periodos,
    private datService: DatosServiceService,
    private logger: LoggerService,
  ) {
    
  }

  ngOnInit(): void {
  
    this.model = this.data.model;
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

  isSaving = false;

  onSubmit(): void {
    if (this.isSaving) return;
    //this.model = this.fg.value as IPeriodo

     this.model.descripcion = this.fg.controls["descripcion"].value
     this.model.fechaInicio = this.fg.controls["fechaInicio"].value
     this.model.fechaFin = this.fg.controls["fechaFin"].value
     const activaVal = this.fg.controls["activa"]?.value;
     this.model.activa = activaVal === true || activaVal === 'true';
     this.model.tipo = this.fg.controls["tipo"]?.value || 'final_ano';
    this.isSaving = true;
    if (this.model.id === 0) {
      this.periodoController.insert(this.model).subscribe({
        next: (result) => {
          this.isSaving = false;
          this.dialogRef.close(result);
        },
        error: (err) => {
          this.isSaving = false;
          this.logger.error('Error inserting periodo:', err);
          this.datService.showMessage(err.message || 'No se pudo guardar el periodo.', 'Error', 'error');
        }
      });
    } else {
      this.periodoController.Update(this.model).subscribe({
        next: (result) => {
          this.isSaving = false;
          this.dialogRef.close(result);
        },
        error: (err) => {
          this.isSaving = false;
          this.logger.error('Error updating periodo:', err);
          this.datService.showMessage(err.message || 'No se pudo actualizar el periodo.', 'Error', 'error');
        }
      });
    }
  }
}
