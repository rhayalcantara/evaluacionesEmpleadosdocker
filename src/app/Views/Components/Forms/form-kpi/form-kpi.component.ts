import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { IKpi } from 'src/app/Models/Kpi/IKpi';
import { DatosServiceService } from 'src/app/Services/datos-service.service';
import { CommonModule } from '@angular/common';
import { Kpi } from 'src/app/Controllers/Kpi';
import { IKri } from 'src/app/Models/Kri/IKri';
import { Kri } from 'src/app/Controllers/Kri';

@Component({
  selector: 'app-form-kpi',
  templateUrl: './form-kpi.component.html', 
  styleUrls: ['./form-kpi.component.css'],
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, CommonModule]
})
export class FormKpiComponent implements OnInit {
  fg: FormGroup;
  titulo: string = 'Nuevo KPI';
  kris:IKri[] = [];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<FormKpiComponent>,
    public kpiservice: Kpi,
    public kriservice: Kri,
    @Inject(MAT_DIALOG_DATA) public data: { model: IKpi },
    private datosService: DatosServiceService
  ) {
    this.fg = this.fb.group({
      id: [0],
      kriId: [0, Validators.required],
      descripcion: ['', Validators.required],
      valor: [0, [Validators.required, Validators.min(0)]]
    });
    this.kriservice.TRegistros.subscribe(() => {
      // al momento de terminar de recibir los kri en el servicio se actualiza aqui el array
      console.log(this.kpiservice.arraymodel)
      this.kris = this.kriservice.arraymodel;
    })
  }

  ngOnInit(): void {
    if (this.data.model.id) {
      this.titulo = 'Editar KPI';            
    }
    this.fg.patchValue(this.data.model);
    console.log(this.fg.value)
    this.kriservice.getdatos()
  }

  grabar(): void {
    if (this.fg.valid) {
      const kpi: IKpi = this.fg.value;      
      console.log(kpi, this.fg.value);
      this.kpiservice.model = kpi;
      this.kpiservice.grabar().then(() => {
        this.datosService.showMessage('KPI guardado exitosamente', 'Éxito', 'success');
      }).catch((error) => {
        this.datosService.showMessage('Error al guardar el KPI', 'Error', 'error');
      }).finally(() => {
        this.dialogRef.close(kpi);
      })
    } else {
      this.datosService.showMessage('Por favor, complete todos los campos requeridos.', 'Error', 'error');
    }
  }

  cancelar(): void {
    this.dialogRef.close();
  }
}
