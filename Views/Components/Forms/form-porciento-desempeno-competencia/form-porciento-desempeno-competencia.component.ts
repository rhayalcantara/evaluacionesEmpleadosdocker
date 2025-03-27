import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { PorcientoDesempenoCompetencia } from 'src/app/Controllers/PorcientoDesempenoCompetencia';
import { IPorcientoDesempenoCompetencia } from 'src/app/Models/PorcientoDesempenoCompetencia/IPorcientoDesempenoCompetencia';

@Component({
  selector: 'app-form-porciento-desempeno-competencia',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule],
  templateUrl: './form-porciento-desempeno-competencia.component.html',
  styleUrls: ['./form-porciento-desempeno-competencia.component.css']
})
export class FormPorcientoDesempenoCompetenciaComponent implements OnInit {
  form: FormGroup;
  isEdit: boolean = false;

  constructor(
    private fb: FormBuilder,
    private service: PorcientoDesempenoCompetencia,
    public dialogRef: MatDialogRef<FormPorcientoDesempenoCompetenciaComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { model: IPorcientoDesempenoCompetencia }
  ) {
    this.form = this.fb.group({
      id: [0],
      PeriodId: [0, [Validators.required]],
      descripcion: ['', [Validators.required]],
      valor: [0, [Validators.required, Validators.min(0), Validators.max(100)]]
    });
  }

  ngOnInit() {
    if (this.data.model.id !== 0) {
      this.isEdit = true;
      this.form.patchValue(this.data.model);
    }
  }

  async onSubmit() {
    if (this.form.valid) {
      const formData = this.form.value;
      this.service.model = formData;
      
      const success = await this.service.grabar();
      if (success) {
        this.dialogRef.close(formData);
      }
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
