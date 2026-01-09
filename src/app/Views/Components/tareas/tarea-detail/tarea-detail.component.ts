import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ITarea } from '../../../../Models/Tarea/ITarea';
import { TareaService } from '../../../../Services/tarea.service';

@Component({
  selector: 'app-tarea-detail',
  templateUrl: './tarea-detail.component.html',
  styleUrls: ['./tarea-detail.component.css']
})
export class TareaDetailComponent implements OnInit {
  tareaForm: FormGroup;
  tareaId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    public router: Router, // Cambiado a público
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
    this.route.paramMap.subscribe(params => {
      this.tareaId = Number(params.get('id'));
      if (this.tareaId) {
        this.tareaService.getTareas().subscribe(
          (tareas: ITarea[]) => {
            const tarea = tareas.find(t => t.id === this.tareaId);
            if (tarea) {
              this.tareaForm.patchValue(tarea);
            } else {
              console.error('Tarea no encontrada');
              this.router.navigate(['/tareas']);
            }
          },
          (error: any) => {
            console.error('Error al obtener la tarea:', error);
          }
        );
      }
    });
  }

  updatePasos(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    if (inputElement && inputElement.value) {
      this.tareaForm.get('pasos')?.setValue(inputElement.value.split(','));
    }
  }

  onSubmit(): void {
    if (this.tareaForm.valid && this.tareaId) {
      const tarea: ITarea = { ...this.tareaForm.value, id: this.tareaId };
      this.tareaService.updateTarea(this.tareaId, tarea).subscribe(
        (response: ITarea) => {
          this.router.navigate(['/tareas']);
        },
        (error: any) => {
          console.error('Error al actualizar la tarea:', error);
        }
      );
    }
  }
}
