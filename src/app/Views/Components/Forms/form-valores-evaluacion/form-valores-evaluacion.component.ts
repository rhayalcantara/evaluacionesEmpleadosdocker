import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { IValoresEvaluacion } from 'src/app/Models/ValoresEvaluacion/IValoresEvaluacion';
import { DatosServiceService } from 'src/app/Services/datos-service.service';
import { CommonModule } from '@angular/common';
import { ValoresEvaluacion } from 'src/app/Controllers/ValoresEvaluacion';

@Component({
  selector: 'app-form-valores-evaluacion',
  templateUrl: './form-valores-evaluacion.component.html',
  styleUrls: ['./form-valores-evaluacion.component.css'],
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, CommonModule]
})
export class FormValoresEvaluacionComponent implements OnInit {
  fg: FormGroup;
  titulo: string = 'Nuevo Valor de Evaluación';

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<FormValoresEvaluacionComponent>,
    public valoresEvaluacionService: ValoresEvaluacion,
    @Inject(MAT_DIALOG_DATA) public data: { model: IValoresEvaluacion },
    private datosService: DatosServiceService
  ) {
    this.fg = this.fb.group({
      id: [0],
      Titulo: ['', Validators.required],
      RangoDesde: ['', [Validators.required, Validators.min(0), Validators.max(100)]],
      RangoHasta: ['', [Validators.required, Validators.min(0), Validators.max(100)]],
      valor: ['', [Validators.required, Validators.min(0), Validators.max(100)]]
    });
  }

  ngOnInit(): void {
    if (this.data.model.id) {
      this.titulo = 'Editar Valor de Evaluación';            
    }
    this.fg.patchValue(this.data.model);
  }

  grabar(): void {
    if (this.fg.valid) {
      const valorEvaluacion: IValoresEvaluacion = this.fg.value;      
      this.valoresEvaluacionService.model = valorEvaluacion;
      this.valoresEvaluacionService.grabar().then(() => {
        this.datosService.showMessage('Valor de evaluación guardado exitosamente', 'Éxito', 'success');
      }).catch((error) => {
        this.datosService.showMessage('Error al guardar el valor de evaluación', 'Error', 'error');
      }).finally(() => {
        this.dialogRef.close(valorEvaluacion);
      });
    } else {
      this.datosService.showMessage('Por favor, complete todos los campos requeridos.', 'Error', 'error');
    }
  }

  cancelar(): void {
    this.dialogRef.close();
  }
}
