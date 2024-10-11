import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IExcepcionSupervisorInmediato } from '../../../../Models/Excepcion/IExcepcionSupervisorInmediato';
import { CommonModule } from '@angular/common';
import { SeleccionEmpleadoComponent } from '../seleccion-empleado/seleccion-empleado.component';
import { SeleccionarDepartamentoComponent } from '../seleccionar-departamento/seleccionar-departamento.component';
import { MatDialog } from '@angular/material/dialog';
import { IEmpleado } from 'src/app/Models/Empleado/IEmpleado';
import { IDepartamento } from 'src/app/Models/Departamento/IDepartamento';

@Component({
  selector: 'app-form-excepcion-supervisor-inmediato',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './form-excepcion-supervisor-inmediato.component.html',
  styleUrls: ['./form-excepcion-supervisor-inmediato.component.css']
})
export class FormExcepcionSupervisorInmediatoComponent implements OnInit {

  @Input() model: IExcepcionSupervisorInmediato = {
    id: '',
    excepcionId: 0,
    empleadoId: 0,
    departamentoOriginalId: 0,
    jefeOriginalId: 0,
    nuevoDepartamentoId: 0,
    nuevoJefeId: 0,
    fechaInicio: new Date(),
    fechaFin: new Date()
  };
  @Output() formSubmit = new EventEmitter<IExcepcionSupervisorInmediato | undefined>();

  titulo: string = 'Excepción de Supervisor Inmediato';
  public fg: FormGroup;
  public empleadoNombre: string = '';
  public departamentoOriginalNombre: string = '';
  public jefeOriginalNombre: string = '';
  public nuevoDepartamentoNombre: string = '';
  public nuevoJefeNombre: string = '';

  constructor(private fb: FormBuilder,
              private dialog:MatDialog
  ) {
    this.fg = this.fb.group({
      empleadoId: [0, Validators.required],
      departamentoOriginalId: [0, Validators.required],
      jefeOriginalId: [0, Validators.required],
      nuevoDepartamentoId: [0, Validators.required],
      nuevoJefeId: [0, Validators.required],
      fechaInicio: [new Date(), Validators.required],
      fechaFin: [new Date(), Validators.required]
    });
  }

  ngOnInit(): void {
    this.fg.patchValue(this.model);
  }

  onEmpleadoSelected(empleado: IEmpleado): void {
    this.fg.patchValue({ empleadoId: empleado.secuencial });
    this.empleadoNombre = empleado.nombreunido;
  }

  onDepartamentoSelected(departamento: IDepartamento, field: string): void {
    this.fg.patchValue({ [field]: departamento.secuencial });
    if (field === 'departamentoOriginalId') {
      this.departamentoOriginalNombre = departamento.nombre;
    } else if (field === 'nuevoDepartamentoId') {
      this.nuevoDepartamentoNombre = departamento.nombre;
    }
  }

  onJefeSelected(jefe: IEmpleado, field: string): void {
    this.fg.patchValue({ [field]: jefe.secuencial });
    if (field === 'jefeOriginalId') {
      this.jefeOriginalNombre = jefe.nombreunido;
    } else if (field === 'nuevoJefeId') {
      this.nuevoJefeNombre = jefe.nombreunido;
    }
  }

  grabar(): void {
    if (this.fg.valid) {
      const excepcion: IExcepcionSupervisorInmediato = {
        id: this.model.id,
        excepcionId: this.model.excepcionId,
        empleadoId: this.fg.get('empleadoId')?.value || 0,
        departamentoOriginalId: this.fg.get('departamentoOriginalId')?.value || 0,
        jefeOriginalId: this.fg.get('jefeOriginalId')?.value || 0,
        nuevoDepartamentoId: this.fg.get('nuevoDepartamentoId')?.value || 0,
        nuevoJefeId: this.fg.get('nuevoJefeId')?.value || 0,
        fechaInicio: this.fg.get('fechaInicio')?.value || new Date(),
        fechaFin: this.fg.get('fechaFin')?.value || new Date()
      };
      console.log('Excepción a guardar:', excepcion);
      this.formSubmit.emit(excepcion);
    }
  }

  cancelar(): void {
    this.fg.reset();
    this.formSubmit.emit(undefined);
  }
  Buscar(quebuscar: string,campo:string) {
    if (quebuscar=='Empleado'){
        const dialogRef = this.dialog.open(SeleccionEmpleadoComponent, {
            width: '100%',maxHeight:'80%', data: { }
        });
        dialogRef.afterClosed().subscribe((rep: IEmpleado) => {
            if (rep) {
                if(campo=='Empleado'){
                    this.onEmpleadoSelected(rep)
                }else{
                    this.onJefeSelected(rep,campo)
                }
            }
        });
    }else{
        const dialogRef = this.dialog.open(SeleccionarDepartamentoComponent, {
            width: '800px', data: { }
        });
        dialogRef.afterClosed().subscribe((rep: IDepartamento) => {
            if (rep) {                
                this.onDepartamentoSelected(rep,campo)                
            }
        });
    }
  }
}