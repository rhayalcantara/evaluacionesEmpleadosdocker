import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { ICursoCapacitacion } from 'src/app/Models/Capacitacion/Cursos';
import { DatosServiceService } from 'src/app/Services/datos-service.service';
import { CommonModule } from '@angular/common';
import { CursoCapacitacionController } from 'src/app/Controllers/CursoCapacitacion';

@Component({
  selector: 'app-form-curso-capacitacion',
  templateUrl: './form-curso-capacitacion.component.html',
  styleUrls: ['./form-curso-capacitacion.component.css'],
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, CommonModule]
})
export class FormCursoCapacitacionComponent implements OnInit {
  fg: FormGroup;
  titulo: string = 'Nuevo Curso de Capacitación';

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<FormCursoCapacitacionComponent>,
    public cursoService: CursoCapacitacionController,
    @Inject(MAT_DIALOG_DATA) public data: { model: ICursoCapacitacion },
    private datosService: DatosServiceService
  ) {
    this.fg = this.fb.group({
      id: [0],
      descripcion: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    if (this.data.model.id) {
      this.titulo = 'Editar Curso de Capacitación';            
    }
    this.fg.patchValue(this.data.model);
  }

  grabar(): void {
    if (this.fg.valid) {
      const curso: ICursoCapacitacion = this.fg.value;      
      this.cursoService.model = curso;
      this.cursoService.grabar().then(() => {
        this.datosService.showMessage('Curso guardado exitosamente', 'Éxito', 'success');
      }).catch((error) => {
        this.datosService.showMessage('Error al guardar el curso', 'Error', 'error');
      }).finally(() => {
        this.dialogRef.close(curso);
      });
    } else {
      this.datosService.showMessage('Por favor, complete todos los campos requeridos.', 'Error', 'error');
    }
  }

  cancelar(): void {
    this.dialogRef.close();
  }
}
