import { Component, OnInit, Inject, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { IEvaluacionDesempenoMeta } from 'src/app/Models/EvaluacionDesempenoMeta/IEvaluacionDesempenoMeta';
import { DatosServiceService } from 'src/app/Services/datos-service.service';
import { CommonModule } from '@angular/common';
import { EvaluacionDesempenoMeta } from 'src/app/Controllers/EvaluacionDesempenoMeta';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { SeleccionEmpleadoComponent } from '../seleccion-empleado/seleccion-empleado.component';
import { Empleados } from 'src/app/Controllers/Empleados';
import { IEmpleado } from 'src/app/Models/Empleado/IEmpleado';

@Component({
  selector: 'app-form-evaluacion-desempeno-meta',
  templateUrl: './form-evaluacion-desempeno-meta.component.html',
  styleUrls: ['./form-evaluacion-desempeno-meta.component.css'],
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, CommonModule, MatButtonModule, MatSelectModule]
})
export class FormEvaluacionDesempenoMetaComponent implements OnInit {
  fg: FormGroup;
  titulo: string = 'Nueva Meta de Evaluación';
  tipoOptions: string[] = ['KRI', 'KPI', 'OBJETIVO', 'PROYECTO'];
  selectedEmpleado: IEmpleado | undefined = {
    secuencial: 0,
    codigousuario: '',
    nombreunido: 'Seleccione un empleado',
    identificacion: '',
    sdept: 0,
    departamento: '',
    codigoestado: '',
    scargo: 0,
    cargo: '',
    esjefatura: 0,
    tienejefe: 0,
    nivel: 0,
    fechapostulacion: '',
    jefeinmediatO_SECUENCIAL: 0,
    jefeinmediato: ''
  };

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<FormEvaluacionDesempenoMetaComponent>,
    private dialogmat: MatDialog,
    public metaService: EvaluacionDesempenoMeta,
    public empleadocontroller: Empleados,
    @Inject(MAT_DIALOG_DATA) public data: { model: IEvaluacionDesempenoMeta },
    private datosService: DatosServiceService,
    private cd: ChangeDetectorRef
  ) {
    this.fg = this.fb.group({
      Id: [0],
      EvaluacionId: [0],
      tipo: ['', Validators.required],
      descripcion: ['', Validators.required],
      meta: ['', [Validators.required, Validators.min(0), Validators.max(100)]],
      peso: ['', [Validators.required, Validators.min(1), Validators.max(100)]],
      inverso: [false],
      secuencialId: [0, Validators.required] // Using secuencialId for employee reference
    });
  }

  ngOnInit(): void {
    if (this.data.model.Id) {
      this.titulo = 'Editar Meta de Evaluación';            
    }
    this.fg.patchValue(this.data.model);
    this.empleadocontroller.getdatos();

    this.empleadocontroller.TRegistros.subscribe(() => {
      if (this.fg.get('secuencialId')?.value) {
        this.selectedEmpleado = this.getempleado(this.fg.get('secuencialId')?.value);
      }      
      this.cd.detectChanges();
    });
  }

  getempleado(id: number): IEmpleado | undefined {
    return this.empleadocontroller.arraymodel.find((empleado) => empleado.secuencial === id);
  }

  buscarEmpleado(): void {
    const dialogRef = this.dialogmat.open(SeleccionEmpleadoComponent, {
      width: '800px',
      data: {}
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.fg.patchValue({ secuencialId: result.secuencial });
        this.selectedEmpleado = result;
        console.table(result);
        console.table(this.fg.value);
      }
    });
  }

  grabar(): void {
    console.table(this.fg.value);
    if (this.fg.valid) {
      const meta: IEvaluacionDesempenoMeta = this.fg.value;      
      
      this.metaService.model = meta;
      this.metaService.grabar().then(() => {
        this.datosService.showMessage('Meta guardada exitosamente', 'Éxito', 'success');
      }).catch((error) => {
        this.datosService.showMessage('Error al guardar la meta', 'Error', 'error');
      }).finally(() => {
        this.dialogRef.close(meta);
      });
    } else {
      this.datosService.showMessage('Por favor, complete todos los campos requeridos.', 'Error', 'error');
    }
  }

  cancelar(): void {
    this.dialogRef.close();
  }
}
