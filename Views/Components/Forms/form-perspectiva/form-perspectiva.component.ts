import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { IPerspectiva } from 'src/app/Models/Perspectiva/IPerspectiva';
import { DatosServiceService } from 'src/app/Services/datos-service.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-form-perspectiva',
  templateUrl: './form-perspectiva.component.html',
  styleUrls: ['./form-perspectiva.component.css'],
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, CommonModule]
})
export class FormPerspectivaComponent implements OnInit {
  fg: FormGroup;
  titulo: string = 'Nueva Perspectiva';

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<FormPerspectivaComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { model: IPerspectiva },
    private datosService: DatosServiceService
  ) {
    this.fg = this.fb.group({
      id: [''],
      nombre: ['', Validators.required],
      peso: ['', [Validators.required, Validators.min(0), Validators.max(100)]]
    });
  }

  ngOnInit(): void {
    if (this.data.model.id) {
      this.titulo = 'Editar Perspectiva';
      this.fg.patchValue(this.data.model);
    }
  }

  grabar(): void {
    if (this.fg.valid) {
      const perspectiva: IPerspectiva = this.fg.value;
      this.dialogRef.close(perspectiva);
    } else {
      this.datosService.showMessage('Por favor, complete todos los campos requeridos.', 'Error', 'error');
    }
  }

  cancelar(): void {
    this.dialogRef.close();
  }
}
