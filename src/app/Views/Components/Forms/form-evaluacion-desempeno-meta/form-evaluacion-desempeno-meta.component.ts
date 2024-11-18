import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { IEvaluacionDesempenoMeta } from 'src/app/Models/EvaluacionDesempenoMeta/IEvaluacionDesempenoMeta';
import { DatosServiceService } from 'src/app/Services/datos-service.service';
import { CommonModule } from '@angular/common';
import { EvaluacionDesempenoMeta } from 'src/app/Controllers/EvaluacionDesempenoMeta';

@Component({
  selector: 'app-form-evaluacion-desempeno-meta',
  templateUrl: './form-evaluacion-desempeno-meta.component.html',
  styleUrls: ['./form-evaluacion-desempeno-meta.component.css'],
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, CommonModule]
})
export class FormEvaluacionDesempenoMetaComponent implements OnInit {
  fg: FormGroup;
  titulo: string = 'Nueva Meta de Evaluación';

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<FormEvaluacionDesempenoMetaComponent>,
    public metaService: EvaluacionDesempenoMeta,
    @Inject(MAT_DIALOG_DATA) public data: { model: IEvaluacionDesempenoMeta },
    private datosService: DatosServiceService
  ) {
    this.fg = this.fb.group({
      Id: [0],
      EvaluacionId: [0],
      Tipo: ['', Validators.required],
      descripcion: ['', Validators.required],
      meta: ['', [Validators.required, Validators.min(0), Validators.max(100)]],
      inverso: [false]
    });
  }

  ngOnInit(): void {
    if (this.data.model.Id) {
      this.titulo = 'Editar Meta de Evaluación';            
    }
    this.fg.patchValue(this.data.model);
    console.log(this.fg.value);
  }

  grabar(): void {
    console.table( this.fg.value);
    if (this.fg.valid) {
      const meta: IEvaluacionDesempenoMeta = this.fg.value;      
      
      this.metaService.model = meta;
      this.metaService.grabar().then(() => {
        this.datosService.showMessage('Meta guardada exitosamente', 'Éxito', 'success');
      }).catch((error) => {
        this.datosService.showMessage('Error al guardar la meta', 'Error', 'error');
      }).finally(() => {
        this.dialogRef.close(meta);
      });
    } else {
      this.datosService.showMessage('Por favor, complete todos los campos requeridos.', 'Error', 'error');
    }
  }

  cancelar(): void {
    this.dialogRef.close();
  }
}
