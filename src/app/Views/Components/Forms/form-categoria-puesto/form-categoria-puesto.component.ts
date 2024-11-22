import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { ICategoriaPuesto } from 'src/app/Models/Puesto/IPuesto';
import { DatosServiceService } from 'src/app/Services/datos-service.service';
import { CommonModule } from '@angular/common';
import { CategoriaPuesto } from 'src/app/Controllers/CategoriaPuesto';

@Component({
  selector: 'app-form-categoria-puesto',
  templateUrl: './form-categoria-puesto.component.html',
  styleUrls: ['./form-categoria-puesto.component.css'],
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, CommonModule]
})
export class FormCategoriaPuestoComponent implements OnInit {
  fg: FormGroup;
  titulo: string = 'Nueva Categoría de Puesto';

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<FormCategoriaPuestoComponent>,
    public categoriaPuestoService: CategoriaPuesto,
    @Inject(MAT_DIALOG_DATA) public data: { model: ICategoriaPuesto },
    private datosService: DatosServiceService
  ) {
    this.fg = this.fb.group({
      id: [0],
      descripcion: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    if (this.data.model.id) {
      this.titulo = 'Editar Categoría de Puesto';            
    }
    this.fg.patchValue(this.data.model);
  }

  grabar(): void {
    if (this.fg.valid) {
      const categoriaPuesto: ICategoriaPuesto = this.fg.value;      
      this.categoriaPuestoService.model = categoriaPuesto;
      this.categoriaPuestoService.grabar().then(() => {
        this.datosService.showMessage('Categoría de puesto guardada exitosamente', 'Éxito', 'success');
      }).catch((error) => {
        this.datosService.showMessage('Error al guardar la categoría de puesto', 'Error', 'error');
      }).finally(() => {
        this.dialogRef.close(categoriaPuesto);
      });
    } else {
      this.datosService.showMessage('Por favor, complete todos los campos requeridos.', 'Error', 'error');
    }
  }

  cancelar(): void {
    this.dialogRef.close();
  }
}
