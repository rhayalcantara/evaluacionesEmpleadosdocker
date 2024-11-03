import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { IKri } from 'src/app/Models/Kri/IKri';
import { DatosServiceService } from 'src/app/Services/datos-service.service';
import { CommonModule } from '@angular/common';
import { Kri } from 'src/app/Controllers/Kri';


@Component({
  selector: 'app-form-kri',
  templateUrl: './form-kri.component.html',
  styleUrls: ['./form-kri.component.css'],
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, CommonModule]
})
export class FormKriComponent implements OnInit {
  fg: FormGroup;
  titulo: string = 'Nuevo KRI';

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<FormKriComponent>,
    public kriservice:Kri,
    @Inject(MAT_DIALOG_DATA) public data: { model: IKri },
    private datosService: DatosServiceService
  ) {
    this.fg = this.fb.group({
      id: [0],
      objetivoExtrategicoId: [0],
      descripcion: ['', Validators.required],
      ponderacion: ['', [Validators.required, Validators.min(0), Validators.max(100)]]
    });
  }

  ngOnInit(): void {
    
    if (this.data.model.id) {
      this.titulo = 'Editar KRI';            
    }
    this.fg.patchValue(this.data.model);
    console.log(this.fg.value)
  }

  grabar(): void {
    if (this.fg.valid) {
      const kri: IKri = this.fg.value;      
      console.log(kri,this.fg.value);
      this.kriservice.model = kri;
      this.kriservice.grabar().then(() => {
               this.datosService.showMessage('KRI guardado exitosamente', 'Éxito', 'success');
      }).catch((error) => {
               this.datosService.showMessage('Error al guardar el KRI', 'Error', 'error');
      }).finally(() => {
               // Optional: Add any cleanup or final actions here
               this.dialogRef.close(kri);
      })
      //this.dialogRef.close(kri);
    } else {
      this.datosService.showMessage('Por favor, complete todos los campos requeridos.', 'Error', 'error');
    }
  }

  cancelar(): void {
    this.dialogRef.close();
  }
}
