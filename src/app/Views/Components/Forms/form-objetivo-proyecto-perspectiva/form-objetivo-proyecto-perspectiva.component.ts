import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { IObjetivoProyectoPerspectiva } from 'src/app/Models/ObjetivoProyectoPerspectiva/IObjetivoProyectoPerspectiva';
import { DatosServiceService } from 'src/app/Services/datos-service.service';
import { CommonModule } from '@angular/common';
import { ObjetivoProyectoPerspectiva } from 'src/app/Controllers/ObjetivoProyectoPerspectiva';

@Component({
  selector: 'app-form-objetivo-proyecto-perspectiva',
  templateUrl: './form-objetivo-proyecto-perspectiva.component.html',
  styleUrls: ['./form-objetivo-proyecto-perspectiva.component.css'],
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, CommonModule]
})
export class FormObjetivoProyectoPerspectivaComponent implements OnInit {
  fg: FormGroup;
  titulo: string = 'Nuevo '+this.objetivoService.model.tipo;
  tipoOptions: string[] = ['Objetivos', 'Proyecto'];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<FormObjetivoProyectoPerspectivaComponent>,
    public objetivoService: ObjetivoProyectoPerspectiva,
    @Inject(MAT_DIALOG_DATA) public data: { model: IObjetivoProyectoPerspectiva },
    private datosService: DatosServiceService
  ) {
    this.fg = this.fb.group({
      id: [0],
      tipo: ['Objetivos', Validators.required],
      objetivoEstrategicoId: [0],
      descripcion: [''],
      valor: [0, [Validators.required, Validators.min(0), Validators.max(100)]]
    });
  }

  ngOnInit(): void {
    this.objetivoService.model = this.data.model;
    if (this.data.model.id) {
      this.titulo = 'Editar ';+this.objetivoService.model.tipo            
    }
    this.fg.patchValue(this.data.model);
  }

  grabar(): void {
    if (this.fg.valid) {
      const objetivo: IObjetivoProyectoPerspectiva = this.fg.value;      
      this.objetivoService.model = objetivo;
      this.objetivoService.grabar().then(() => {
        this.datosService.showMessage('Objetivo/Proyecto guardado exitosamente', 'Éxito', 'success');
      }).catch((error) => {
        this.datosService.showMessage('Error al guardar el Objetivo/Proyecto', 'Error', 'error');
      }).finally(() => {
        this.dialogRef.close(objetivo);
      });
    } else {
      this.datosService.showMessage('Por favor, complete todos los campos requeridos.', 'Error', 'error');
    }
  }

  cancelar(): void {
    this.dialogRef.close();
  }
}
