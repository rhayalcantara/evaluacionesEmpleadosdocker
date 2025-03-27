import { Component, OnInit, Input, Output, EventEmitter, Inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IExcepcionSupervisorInmediato, IExcepcionSupervisorInmediatoDts } from '../../../../Models/Excepcion/IExcepcionSupervisorInmediato';
import { CommonModule } from '@angular/common';
import { SeleccionEmpleadoComponent } from '../seleccion-empleado/seleccion-empleado.component';
import { SeleccionarDepartamentoComponent } from '../seleccionar-departamento/seleccionar-departamento.component';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { IEmpleado } from 'src/app/Models/Empleado/IEmpleado';
import { IDepartamento } from 'src/app/Models/Departamento/IDepartamento';
import { ExcepcionSupervisorInmediato } from 'src/app/Controllers/ExcepcionSupervisorInmediato';
import { DatosServiceService } from 'src/app/Services/datos-service.service';
import { UtilsService } from 'src/app/Helpers/utils.service';

@Component({
  selector: 'app-form-excepcion-supervisor-inmediato',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './form-excepcion-supervisor-inmediato.component.html',
  styleUrls: ['./form-excepcion-supervisor-inmediato.component.css']
})
export class FormExcepcionSupervisorInmediatoComponent implements OnInit {

  @Input() model: IExcepcionSupervisorInmediatoDts = this.esicontroller.inicializamodeloDts()
  //@Output() formSubmit = new EventEmitter<IExcepcionSupervisorInmediato | undefined>();

  titulo: string = 'Excepción de Supervisor Inmediato';
  public fg: FormGroup;
  public empleadoNombre: string = '';
  public departamentoOriginalNombre: string = '';
  public jefeOriginalNombre: string = '';
  public nuevoDepartamentoNombre: string = '';
  public nuevoJefeNombre: string = '';

  constructor(private fb: FormBuilder,
              private dialog:MatDialog, 
              private esicontroller:ExcepcionSupervisorInmediato,
              public dialogRef: MatDialogRef<IExcepcionSupervisorInmediato>,
              @Inject(MAT_DIALOG_DATA) public data: { model: IExcepcionSupervisorInmediatoDts },
              private datosService: DatosServiceService
  ) {
    this.fg = this.fb.group({
      empleadoId: [0, Validators.required],
      departamentoOriginalId: [0, Validators.required],
      jefeOriginalId: [0, Validators.required],
      nuevoDepartamentoId: [0, Validators.required],
      nuevoJefeId: [0, Validators.required],
      fechaInicio: [new Date(), Validators.required],
      fechaFin: [new Date()]
    });
  }

  ngOnInit(): void {
    this.model = this.data.model
    this.fg.patchValue(this.model);
    this.empleadoNombre = this.model.nombreEmpleado;
    this.departamentoOriginalNombre = this.model.nombrenuevodepartamento;
    this.jefeOriginalNombre = this.model.nombrejefeoriginal;    
    this.nuevoDepartamentoNombre = this.model.nombrenuevodepartamento
    this.nuevoJefeNombre = this.model.nombrenuevojefe
    this.fg.controls['fechaInicio'].setValue(UtilsService.formatDateForInput(this.data.model.fechaInicio.toString()))
    this.fg.controls['fechaFin'].setValue(UtilsService.formatDateForInput(this.data.model.fechaFin.toString()))
  }

  onEmpleadoSelected(empleado: IEmpleado): void {
    this.fg.patchValue({ empleadoId: empleado.secuencial });
    this.fg.patchValue({departamentoOriginalId:empleado.sdept})
    this.fg.patchValue({jefeOriginalId:empleado.jefeinmediatO_SECUENCIAL})
    this.empleadoNombre = empleado.nombreunido;
    this.departamentoOriginalNombre = empleado.departamento;
    this.jefeOriginalNombre = empleado.jefeinmediato;

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
    //agrega el nuevo supervisor con su departamento al formgrup
    this.fg.patchValue({ [field]: jefe.secuencial });
    this.fg.patchValue({nuevoDepartamentoId:jefe.sdept});
    // despliega los nombre del nuevo supervisor y el departamento
    if (field === 'jefeOriginalId') {
      this.jefeOriginalNombre = jefe.nombreunido;
    } else if (field === 'nuevoJefeId') {
      this.nuevoJefeNombre = jefe.nombreunido;
      this.nuevoDepartamentoNombre = jefe.departamento
    }
  }

  grabar(): void {
    if (this.fg.valid) {
      const excepcion: IExcepcionSupervisorInmediatoDts = {
        id: this.model.id,
        excepcionId: 0,
        empleadoId: this.fg.get('empleadoId')?.value || 0,
        departamentoOriginalId: this.fg.get('departamentoOriginalId')?.value || 0,
        jefeOriginalId: this.fg.get('jefeOriginalId')?.value || 0,
        nuevoDepartamentoId: this.fg.get('nuevoDepartamentoId')?.value || 0,
        nuevoJefeId: this.fg.get('nuevoJefeId')?.value || 0,
        fechaInicio: this.fg.get('fechaInicio')?.value || new Date(),
        fechaFin: this.fg.get('fechaFin')?.value || new Date(),
        nombreEmpleado: '',
        nombreDepartmentoriginal: '',
        nombrejefeoriginal: '',
        nombrenuevojefe: '',
        nombrenuevodepartamento: ''
      };
      console.log('Excepción a guardar:', excepcion);
      this.esicontroller.modeldts =excepcion
      this.esicontroller.grabar().then((rep:boolean)=>{
        if(rep){
          this.datosService.showMessage('Grabado',this.esicontroller.titulomensage,'success')
          this.dialogRef.close(this.esicontroller.modeldts)
        }else{
          this.datosService.showMessage('Error al Grabar',this.esicontroller.titulomensage,'error')
        }
      })
      //this.formSubmit.emit(excepcion);
    }
  }

  cancelar(): void {
    this.fg.reset();
    //this.formSubmit.emit(undefined);
    this.dialogRef.close(null);
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