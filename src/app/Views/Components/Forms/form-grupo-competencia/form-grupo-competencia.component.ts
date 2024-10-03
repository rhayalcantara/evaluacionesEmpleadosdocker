import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { IGrupoCompetencia } from 'src/app/Models/GrupoCompetencia/IGrupoCompetencia';

@Component({
  selector: 'app-form-grupo-competencia',
  templateUrl: './form-grupo-competencia.component.html',
  styleUrls: ['./form-grupo-competencia.component.css'],
  standalone: true,
  imports: [FormsModule,CommonModule]
})
export class FormGrupoCompetenciaComponent implements OnInit {
  model: IGrupoCompetencia = {
    id: 0, nombre: '',
    description: ''
  };
  constructor(
    public dialogRef: MatDialogRef<FormGrupoCompetenciaComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { model: IGrupoCompetencia }
  ) {}
  ngOnInit(): void {
    this.model = this.data.model
  }
  onSubmit(form: NgForm): void {
    if (form.valid) {
      console.log('Formulario enviado', this.model);
      // Aquí puedes agregar la lógica para guardar el grupo de competencia
      this.dialogRef.close(this.model)
    }
  }

  onCancel(): void {
    console.log('Formulario cancelado');
    // Aquí puedes agregar la lógica para cerrar el formulario o limpiar los campos
    this.dialogRef.close(null)
  }
}