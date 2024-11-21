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
    public model = this.empleadoRolController.model;

    constructor(
        public dialogRef: MatDialogRef<FormEmpleadoRolComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { model: IEmpleado },
        private empleadoRolController: EmpleadoRol,
        private rolesController: Roles,
        private datosService: DatosServiceService,
        private empleadoservice:Empleados,
        private cd: ChangeDetectorRef
              

    ) { 
        this.empleadoSeleccionado = this.data.model
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
                    console.table(rep.data)
                    let empleadorol: IEmpleadoRol[] = rep.data;
                    let elemprol: IEmpleadoRol | undefined = empleadorol.find(x => x.empleadoSecuencial == this.empleadoSeleccionado.secuencial);
                    if (elemprol) {
                        this.empleadoRolController.model = elemprol;
                        this.model= elemprol;
                        this.cd.detectChanges()
                    }
                }
            })
   

        if (this.empleadoSeleccionado) {
            this.model.empleadoSecuencial = this.empleadoSeleccionado.secuencial;
            this.model.empleado = this.empleadoSeleccionado;
        }
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
        if (!this.empleadoSeleccionado) {
            this.datosService.showMessage('Debe seleccionar un empleado', 'Error', 'error');
            return;
        }

        if (!this.model.rolId) {
            this.datosService.showMessage('Debe seleccionar un rol', 'Error', 'error');
            return;
        }

        const resultado = await this.empleadoRolController.grabar();
        if (resultado) {
            this.datosService.showMessage("Grabado",this.empleadoRolController.titulomensage,"success")
            this.dialogRef.close()
        }
    }

    cancelar() {
        this.cerrarFormulario.emit();
    }
}
