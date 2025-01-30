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
import { Evaluacion } from 'src/app/Controllers/Evaluacion';
import { firstValueFrom } from 'rxjs';
import { IPeriodo } from 'src/app/Models/Periodos/IPeriodo';

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
  periodoactual:IPeriodo = {} as IPeriodo;

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
    public evaluacioncontroller:Evaluacion,
    @Inject(MAT_DIALOG_DATA) public data: { model: IEvaluacionDesempenoMeta },
    private datosService: DatosServiceService,
    private cd: ChangeDetectorRef
  ) {
    this.fg = this.fb.group({
      id: [0],
      evaluacionId: [0],
      tipo: ['', Validators.required],
      descripcion: ['', Validators.required],
      meta: ['', [Validators.required, Validators.min(0), Validators.max(100)]],
      peso: ['', [Validators.required, Validators.min(1), Validators.max(100)]],
      inverso: [false],
      secuencialId: [0, Validators.required] // Using secuencialId for employee reference
    });
  }

  ngOnInit(): void {
    //obtener el periodo actual del localstorage
    this.periodoactual = localStorage.getItem('periodo') ? JSON.parse(localStorage.getItem('periodo') || '{}') : {} as IPeriodo;

    if (this.data.model.id) {
      this.titulo = 'Editar Meta de Evaluación';            
    }
    this.fg.patchValue(this.data.model);
    this.fg.controls['secuencialId'].setValue(this.data.model.evaluacion?.empleado?.secuencial);
    console.log('Llego al formulario',this.fg.value);
    this.empleadocontroller.getdatos();
    this.selectedEmpleado = this.data.model.evaluacion?.empleado;

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
    //console.table(this.fg.value);
    if (this.fg.valid) {
      //console.log('Grabando meta',this.fg.value);
      const meta: IEvaluacionDesempenoMeta ={
        id: this.fg.get('id')?.value,
        evaluacionId: this.fg.get('evaluacionId')?.value,
        tipo: this.fg.get('tipo')?.value,
        descripcion: this.fg.get('descripcion')?.value,
        meta: this.fg.get('meta')?.value,
        peso:  this.fg.get('peso')?.value,
        inverso: this.fg.get('inverso')?.value      
      }
      // si la meta es nueva hay que buscar la evaluacion del empleado esta se obtiene con el secuencialId y periodoid 
      if (meta.id === 0) {
        // se busca la evaluacion del empleado en el controlados de evaluaciones 
        firstValueFrom(this.evaluacioncontroller.GetEvaluacionePorEmpleadoyPeriodo(this.selectedEmpleado?.secuencial || 0,  this.periodoactual.id)).then((evaluacion) => {
          if (evaluacion) {
            meta.evaluacionId = evaluacion.id;
            //meta.evaluacion = evaluacion;
            this.grabarsub(meta)
          } else {
            this.datosService.showMessage('No se encontró la evaluación del empleado para el periodo actual', 'Error', 'error');
            return;
          }
        });
 
  
      }else{
        this.grabarsub(meta);
      }

    } else {
      this.datosService.showMessage('Por favor, complete todos los campos requeridos.', 'Error', 'error');
    }
  }

  grabarsub(meta:IEvaluacionDesempenoMeta): void {
    console.log('Grabando meta',meta);
    this.metaService.model = meta;
    this.metaService.grabar().then(() => {
      this.datosService.showMessage('Meta guardada exitosamente', 'Éxito', 'success');
    }).catch((error) => {
      this.datosService.showMessage('Error al guardar la meta', 'Error', 'error');
    }).finally(() => {
      this.dialogRef.close(meta);
    });
  }

  cancelar(): void {
    this.dialogRef.close();
  }
}
