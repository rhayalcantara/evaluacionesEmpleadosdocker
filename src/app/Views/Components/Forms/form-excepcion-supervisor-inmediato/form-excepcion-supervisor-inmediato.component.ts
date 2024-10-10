import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IExcepcionSupervisorInmediato } from '../../../../Models/Excepcion/IExcepcionSupervisorInmediato';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DatosServiceService } from 'src/app/Services/datos-service.service';

@Component({
  selector: 'app-form-excepcion-supervisor-inmediato',
  standalone:true,
  imports:[CommonModule,FormsModule,ReactiveFormsModule],
  templateUrl: './form-excepcion-supervisor-inmediato.component.html',
  styleUrls: ['./form-excepcion-supervisor-inmediato.component.css']
})
export class FormExcepcionSupervisorInmediatoComponent implements OnInit {
  titulo: string = 'Excepción de Supervisor Inmediato';
  fg: FormGroup;
  //public modelo:IExcepcionSupervisorInmediato
  constructor(private fb: FormBuilder,   
    public dialogRef: MatDialogRef<FormExcepcionSupervisorInmediatoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { model: IExcepcionSupervisorInmediato },
    private datosService: DatosServiceService) {
    this.fg = this.fb.group({
      id: [''],
      excepcionId: ['', Validators.required],
      empleadoId: ['', Validators.required],
      departamentoOriginalId: ['', Validators.required],
      jefeOriginalId: ['', Validators.required],
      nuevoDepartamentoId: ['', Validators.required],
      nuevoJefeId: ['', Validators.required],
      fechaInicio: ['', Validators.required],
      fechaFin: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Initialize form or load data if needed
  }

  grabar(): void {
    if (this.fg.valid) {
      const excepcion: IExcepcionSupervisorInmediato = this.fg.value;
      console.log('Excepción a guardar:', excepcion);
      // Here you would typically call a service to save the data
      // For example: this.excepcionService.save(excepcion).subscribe(...)
    }
  }

  cancelar(): void {
    // Reset the form or navigate back
    this.fg.reset();
    // Or use router to navigate back: this.router.navigate(['/path-to-list'])
  }
}