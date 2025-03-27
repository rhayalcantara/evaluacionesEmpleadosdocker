import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IPeriodoEvaluacion } from 'src/app/Models/PeriodoEvaluacion/IPeriodoEvaluacion';


@Component({
  selector: 'app-form-periodo-evaluacion',
  templateUrl: './form-periodo-evaluacion.component.html',
  styleUrls: ['./form-periodo-evaluacion.component.css']
})
export class FormPeriodoEvaluacionComponent implements OnInit {
  @Input() periodoEvaluacion: IPeriodoEvaluacion | null = null;
  @Output() formSubmit = new EventEmitter<IPeriodoEvaluacion>();

  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      id: [null],
      periodId: [null, Validators.required],
      positionSecuential: [null, Validators.required],
      goalId: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    if (this.periodoEvaluacion) {
      this.form.patchValue(this.periodoEvaluacion);
    }
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.formSubmit.emit(this.form.value);
    }
  }
}