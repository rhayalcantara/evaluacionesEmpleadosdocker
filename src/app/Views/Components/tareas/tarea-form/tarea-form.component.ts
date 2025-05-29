import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ITarea } from '../../../../Models/Tarea/ITarea';
import { TareaService } from 'src/app/Services/tarea.service';

@Component({
  selector: 'app-tarea-form',
  templateUrl: './tarea-form.component.html',
  styleUrls: ['./tarea-form.component.css']
})
export class TareaFormComponent implements OnInit {
  tareaForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private tareaService: TareaService
  ) {
    this.tareaForm = this.fb.group({
      descripcion: ['', Validators.required],
      pasos: [[], Validators.required],
      fechaInicio: ['', Validators.required],
      fechaPropuestaEntrega: ['', Validators.required],
      fechaTerminada: [''],
      estado: ['', Validators.required],
      empleadoId: ['', Validators.required]
    });
  }

  ngOnInit(): void {
  }

  onSubmit(): void {
    if (this.tareaForm.valid) {
      const tarea: ITarea = this.tareaForm.value;
      this.tareaService.createTarea(tarea).subscribe(
        (response: ITarea) => {
          console.log('Tarea creada:', response);
          // Redirigir a la lista de tareas o mostrar un mensaje de éxito
        },
        (error: any) => {
          console.error('Error al crear la tarea:', error);
          // Mostrar un mensaje de error
        }
      );
    }
  }
}
