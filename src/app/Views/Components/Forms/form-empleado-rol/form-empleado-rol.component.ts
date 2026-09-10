import { Component, OnInit, Output, EventEmitter, Inject, ChangeDetectorRef } from '@angular/core';
import { EmpleadoRol } from 'src/app/Controllers/EmpleadoRol';
import { Empleados } from 'src/app/Controllers/Empleados';
import { Roles } from 'src/app/Controllers/Roles';
import { IEmpleado } from 'src/app/Models/Empleado/IEmpleado';
import { IEmpleadoRol, IRol } from 'src/app/Models/Rol/IRol';
import { DatosServiceService } from 'src/app/Services/datos-service.service';
import { CardEmpleadoComponent } from '../../ViewEmpleado/card-empleado/card-empleado.component';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { IEstado } from 'src/app/Models/Estado/IEstado';
import { ModelResponse } from 'src/app/Models/Usuario/modelResponse';
import { LoggerService } from 'src/app/Services/logger.service';

@Component({
    selector: 'app-form-empleado-rol',
    templateUrl: './form-empleado-rol.component.html',
    styleUrls: ['./form-empleado-rol.component.css'],
    standalone:true,
    imports:[FormsModule,CommonModule,
        ReactiveFormsModule,CardEmpleadoComponent]
})
export class FormEmpleadoRolComponent implements OnInit {
    @Output() cerrarFormulario = new EventEmitter<void>();
    
    public empleadoSeleccionado: IEmpleado;
    public roles: IRol[] = [];
    public model: IEmpleadoRol;
    public isSaving = false;

    constructor(
        public dialogRef: MatDialogRef<FormEmpleadoRolComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { model: IEmpleado },
        private empleadoRolController: EmpleadoRol,
        private rolesController: Roles,
        private datosService: DatosServiceService,
        private empleadoservice:Empleados,
        private cd: ChangeDetectorRef,
        private logger: LoggerService


    ) {
        this.empleadoSeleccionado = this.data.model
        // El controlador es un singleton: si no se reinicia el modelo aqui, el
        // formulario hereda el registro del ultimo empleado editado y al grabar
        // hace un PUT sobre ese id, moviendo el rol de un administrador a otro.
        this.model = this.modeloParaEmpleado();
        this.empleadoRolController.model = this.model;
    }

    // Devuelve un modelo nuevo (id = 0) ligado exclusivamente al empleado seleccionado.
    private modeloParaEmpleado(): IEmpleadoRol {
        const m = this.empleadoRolController.inicializamodelo();
        if (this.empleadoSeleccionado) {
            m.empleadoSecuencial = this.empleadoSeleccionado.secuencial;
            m.empleado = this.empleadoSeleccionado;
        }
        return m;
    }

    ngOnInit() {
        this.cargarRoles();
    }

    async cargarRoles() {
        this.rolesController.Gets().subscribe(response => {
            if (response && response.data) {
                this.roles = response.data;
                // buscar empledorol
                this.buscarEmpleadoRol()
                
            }
        });
    }

    buscarEmpleadoRol() {
        //buscar empleadorol en el controlador
        this.empleadoRolController.Gets().subscribe(
            {
                next:(rep:ModelResponse) => {
                    this.logger.debug('rep.data', rep.data);
                    let empleadorol: IEmpleadoRol[] = rep.data;
                    let elemprol: IEmpleadoRol | undefined = empleadorol.find(x => x.empleadoSecuencial == this.empleadoSeleccionado.secuencial);
                    // Si el empleado ya tiene rol se edita ese registro; si no, se
                    // conserva un modelo nuevo (id = 0) para que grabar haga un INSERT.
                    this.model = elemprol ? elemprol : this.modeloParaEmpleado();
                    this.empleadoRolController.model = this.model;
                    this.cd.detectChanges()
                }
            })
    }

    onRolChange(event: any) {
        const rolId = event.target.value;
        const rolSeleccionado = this.roles.find(r => r.id === Number(rolId));
        if (rolSeleccionado) {
            this.model.rolId = rolSeleccionado.id;
            this.model.rol = rolSeleccionado;
        }
    }

    async guardar() {
        if (this.isSaving) return;

        if (!this.empleadoSeleccionado) {
            this.datosService.showMessage('Debe seleccionar un empleado', 'Error', 'error');
            return;
        }

        if (!this.model.rolId) {
            this.datosService.showMessage('Debe seleccionar un rol', 'Error', 'error');
            return;
        }

        // Salvaguarda: nunca actualizar un registro que pertenezca a otro empleado.
        if (this.model.empleadoSecuencial !== this.empleadoSeleccionado.secuencial) {
            this.datosService.showMessage('El registro de rol no corresponde al empleado seleccionado. Cierre el formulario y vuelva a intentarlo.', 'Error', 'error');
            return;
        }

        this.isSaving = true;
        try {
            this.empleadoRolController.model = this.model;
            const resultado = await this.empleadoRolController.grabar();
            if (resultado) {
                this.datosService.showMessage("Grabado",this.empleadoRolController.titulomensage,"success")
                this.dialogRef.close()
            }
        } finally {
            this.isSaving = false;
        }
    }

    cancelar() {
        this.cerrarFormulario.emit();
    }
}
