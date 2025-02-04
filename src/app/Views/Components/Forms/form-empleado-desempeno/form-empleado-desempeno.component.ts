import { Component, OnInit, Inject, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { IEmpleadoDesempeno } from 'src/app/Models/EmpleadoDesempeno/IEmpleadoDesempeno';
import { DatosServiceService } from 'src/app/Services/datos-service.service';
import { EmpleadoDesempeno } from 'src/app/Controllers/EmpleadoDesempeno';
import { Kri } from 'src/app/Controllers/Kri';
import { Kpi } from 'src/app/Controllers/Kpi';
import { IKri } from 'src/app/Models/Kri/IKri';
import { IKpi } from 'src/app/Models/Kpi/IKpi';
import { SeleccionKriComponent } from '../seleccion-kri/seleccion-kri.component';
import { SeleccionEmpleadoComponent } from '../seleccion-empleado/seleccion-empleado.component';
import { Empleados } from 'src/app/Controllers/Empleados';
import { IEmpleado } from 'src/app/Models/Empleado/IEmpleado';
import { ObjetivoProyectoPerspectiva } from 'src/app/Controllers/ObjetivoProyectoPerspectiva';
import { SeleccionKpiComponent } from '../seleccion-kpi/seleccion-kpi.component';
import { SeleccionObjetivoProyectoComponent } from '../seleccion-objetivo-proyecto/seleccion-objetivo-proyecto.component';
import { IObjetivoProyectoPerspectiva } from 'src/app/Models/ObjetivoProyectoPerspectiva/IObjetivoProyectoPerspectiva';
import { IPeriodo } from 'src/app/Models/Periodos/IPeriodo';
import { Periodos } from 'src/app/Controllers/Periodos';

@Component({
  selector: 'app-form-empleado-desempeno',
  templateUrl: './form-empleado-desempeno.component.html',
  styleUrls: ['./form-empleado-desempeno.component.css'],
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, CommonModule]
})
export class FormEmpleadoDesempenoComponent implements OnInit {

  fg: FormGroup;
  titulo: string = 'Nuevo Desempeño de Empleado';
  kris: IKri[] = [];
  kpis: IKpi[] = [];
  periodos: IPeriodo[] = [];

  selectedKri: IKri = {
    id: 0,
    descripcion: 'Seleccione un KRI',
    objetivoExtrategicoId: 0,
    ponderacion: 0
  };
  selectedKpi: IKpi = {
    id: 0,
    kriId: 0,
    descripcion: 'Seleccione un KPI',
    valor: 0,
    inverso: false
  };
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
    jefeinmediato: '',
    oficina: ''
  };
  selectedObjetivo: IObjetivoProyectoPerspectiva | undefined  = {
    id: 0,
    tipo: 'Objetivos',
    objetivoEstrategicoId: 0,
    descripcion: 'Seleccione un ',
    valor: 0
  };

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<FormEmpleadoDesempenoComponent>,
    private dialogmat: MatDialog,
    public empleadoDesempenoService: EmpleadoDesempeno,
    public kriService: Kri,
    public kpiService: Kpi,
    public empleadocontroller: Empleados,
    public objetivoProyectoService: ObjetivoProyectoPerspectiva,
    public periodocontroller: Periodos,
    @Inject(MAT_DIALOG_DATA) public data: { model: IEmpleadoDesempeno },
    private datosService: DatosServiceService,
    private cd: ChangeDetectorRef,
  ) {
    console.log('data', data);
    //seccion de reccion de datos
    if (data.model.id) {
      
      this.titulo = 'Editar Desempeño de Empleado';
      this.fg = this.fb.group({
        id: data.model.id,
        secuencialId: [data.model.secuencialId, Validators.required],
        kriId: [data.model.kriId, Validators.required],
        kpiId: [data.model.kpiId, Validators.required],
        objetivoProyectoId: [data.model.objetivoProyectoId, Validators.required],
        periodoId: [data.model.periodoId, Validators.required],
        tipoSeleccion: ['']
      });
      // basado en los campos kriid,kpiid,objetivoproyectoid se debe poner en fg.controls.tipoSeleccion el valor correspondiente 
      // que son kri,kpi,objetivo
      if (data.model.kriId) {
        this.kriService.getdatos();
        this.fg.patchValue({ tipoSeleccion: 'kri' });
      } else if (data.model.kpiId) {
        this.kpiService.getdatos();
        this.fg.patchValue({ tipoSeleccion: 'kpi' });
      } else if (data.model.objetivoProyectoId) {
        this.objetivoProyectoService.getdatos();
        this.fg.patchValue({ tipoSeleccion: 'objetivo' });
      }
      
      
      
    } else {
      
      this.titulo = 'Agregar Desempeño de Empleado';
      this.fg = this.fb.group({
        id: [0],
        secuencialId: [0, Validators.required],
        kriId: [0, Validators.required],
        kpiId: [0, Validators.required],
        objetivoProyectoId: [0, Validators.required],
        periodoId: [0, Validators.required],
        tipoSeleccion: ['']
      });
    }
    
    //seccion de busqueda de datos
    this.kriService.TRegistros.subscribe(() => {
      this.kris = this.kriService.arraymodel;
      const foundKri = this.kris.find((kri) => kri.id === data.model.kriId);
      if (foundKri) {
        this.selectedKri = foundKri;
      }
      this.cd.detectChanges();
    });
    this.kpiService.TRegistros.subscribe(() => {
      this.kpis = this.kpiService.arraymodel;
      const foundKpi = this.kpis.find((kpi) => kpi.id === data.model.kpiId);
      if (foundKpi) {
        this.selectedKpi = foundKpi;
      }
      this.cd.detectChanges();
    });
    this.empleadocontroller.TRegistros.subscribe(() => {
      console.log('data.model.secuencialId', data.model.secuencialId);
      if (data.model.secuencialId!=0) {

        this.selectedEmpleado = this.getempleado(data.model.secuencialId);
      }      
      this.cd.detectChanges();
    });    
    this.objetivoProyectoService.TRegistros.subscribe(() => {
      console.log('data.model.objetivoProyectoId', data.model.objetivoProyectoId);
      if (data.model.objetivoProyectoId!=0) {
        this.selectedObjetivo = this.objetivoProyectoService.arraymodel.find((objetivo) => objetivo.id === data.model.objetivoProyectoId);

        this.fg.patchValue({ ObjetivoProyectoId: data.model.objetivoProyectoId });
      }
      this.cd.detectChanges();
    });
    this.periodocontroller.TRegistros.subscribe(() => {
      this.periodos = this.periodocontroller.arraymodel;
      this.cd.detectChanges();
    });
  }

  ngOnInit(): void {
    if (this.data.model.id) {
      this.titulo = 'Editar Desempeño de Empleado';
    }
    this.fg.patchValue(this.data.model);

    this.empleadocontroller.getdatos();
    this.periodocontroller.getdatos();

  }
  getempleado(id: number): IEmpleado | undefined {
    console.log('id', id);
    return this.empleadocontroller.arraymodel.find((empleado) => empleado.secuencial === id);
  }
  buscarEmpleado() {
    const dialogRef = this.dialogmat.open(SeleccionEmpleadoComponent, {
      width: '800px',
      data: {}
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.fg.patchValue({ SecuencialId: result.secuencial });
        this.selectedEmpleado = result;
        console.table(result);
        console.table(this.fg.value);
      }
    });
  }

  onTipoSeleccionChange() {
    const tipoSeleccion = this.fg.get('tipoSeleccion')?.value;
    
    // Reset all related fields
    this.fg.patchValue({
      KriId: 0,
      KpiId: 0,
      ObjetivoProyectoId: 0
    });

    // Reset selected items
    this.selectedKri = {
      id: 0,
      descripcion: 'Seleccione un KRI',
      objetivoExtrategicoId: 0,
      ponderacion: 0
    };
    this.selectedKpi = {
      id: 0,
      kriId: 0,
      descripcion: 'Seleccione un KPI',
      valor: 0,
      inverso: false
    };
  }
  seleccionarKpi() {
    // Similar to seleccionarKri but for KPIs
    const dialogRef = this.dialogmat.open(SeleccionKpiComponent, {
      width: '800px',
      data: { tipo: 'kpi' }
    });
    dialogRef.afterClosed().subscribe((result: IKpi) => {
      if (result) {
        this.selectedKpi = result;
        this.fg.patchValue({ KpiId: result.id });
        console.table(this.fg.value);
      }
      });

    }
  seleccionarKri() {
    const dialogRef = this.dialogmat.open(SeleccionKriComponent, {
      width: '800px',
      data: {}
    });
    dialogRef.afterClosed().subscribe((result: IKri) => {
      if (result) {
        this.selectedKri = result;
        this.fg.patchValue({ KriId: result.id });
        this.kpiService.getdatos();
        console.table(this.fg.value);
      }
    });
  }

  seleccionarObjetivo() {
    // Similar to seleccionarKri but for objectives
    const dialogRef = this.dialogmat.open(SeleccionObjetivoProyectoComponent, {
      width: '800px',
      data: { tipo: 'objetivo' }
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.seleccionarObjetivo
        this.fg.patchValue({ ObjetivoProyectoId: result.id });
        console.table(this.fg.value);
      }
    });
  }

  grabar(): void {
    console.table(this.fg.value);
    if (this.fg.valid) {
      
      const empleadoDesempeno:IEmpleadoDesempeno = this.fg.value;
      this.empleadoDesempenoService.model = empleadoDesempeno;
      this.empleadoDesempenoService.grabar().then(() => {
        this.datosService.showMessage('Desempeño guardado exitosamente', 'Éxito', 'success');
      }).catch((error) => {
        this.datosService.showMessage('Error al guardar el desempeño', 'Error', 'error');
      }).finally(() => {
        this.dialogRef.close(empleadoDesempeno);
      });
    } else {
      this.datosService.showMessage('Por favor, complete todos los campos requeridos.', 'Error', 'error');
    }
  }

  cancelar(): void {
    this.dialogRef.close();
  }
}
