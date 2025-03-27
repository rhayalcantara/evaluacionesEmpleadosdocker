import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { IEstado } from 'src/app/Models/Estado/IEstado';
import { DatosServiceService } from 'src/app/Services/datos-service.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-form-estado',
  templateUrl: './form-estado.component.html',
  styleUrls: ['./form-estado.component.css'],
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, CommonModule]
})
export class FormEstadoComponent implements OnInit {
  fg: FormGroup;
  titulo: string = 'Nuevo Estado';

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<FormEstadoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { model: IEstado },
    private datosService: DatosServiceService
  ) {
    this.fg = this.fb.group({
      id: [''],
      descripcion: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    if (this.data.model.id) {
      this.titulo = 'Editar Estado';
      this.fg.patchValue(this.data.model);
    }
  }

  grabar(): void {
    if (this.fg.valid) {
      const estado: IEstado = this.fg.value;
      this.dialogRef.close(estado);
    } else {
      this.datosService.showMessage('Por favor, complete todos los campos requeridos.', 'Error', 'error');
    }
  }

  cancelar(): void {
    this.dialogRef.close();
  }
}