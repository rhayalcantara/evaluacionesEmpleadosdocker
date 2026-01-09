import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConsejalClaveFormComponent } from '../consejal-clave-form/consejal-clave-form.component';
import { ConsejalController } from '../../../../../Controllers/ConsejalController';
import { IConsejal, IConsejalClave, IConsejalTeam } from '../../../../../Models/Consejal/Iconsejal';
import { ComunicacionService } from '../../../../../Services/comunicacion.service';
import { DatosServiceService } from '../../../../../Services/datos-service.service';
import { SeleccionEmpleadoComponent } from '../../../Forms/seleccion-empleado/seleccion-empleado.component';
import { IEmpleado } from '../../../../../Models/Empleado/IEmpleado';
import { HttpErrorResponse } from '@angular/common/http';
import { Empleados } from  '../../../../../Controllers/Empleados'
import { ConsejalClaveController } from 'src/app/Controllers/ConsejalClaveController';

@Component({
  selector: 'app-consejal-form',
  templateUrl: './consejal-form.component.html',
  styleUrls: ['./consejal-form.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, ConsejalClaveFormComponent],
  providers: [ConsejalController, ComunicacionService, DatosServiceService]
})
export class ConsejalFormComponent implements OnInit {
crearusuario(consejal: IConsejal) {
  // Abrir el diálogo para crear/editar credenciales
  const dialogRef = this.dialog.open(ConsejalClaveFormComponent, {
    width: '500px',
    data: { consejalId: this.consejal.id }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      // Si el resultado es true, significa que se guardaron las credenciales
      this.datosService.showMessage('Credenciales guardadas correctamente', 'Éxito', 'success');
    }
  });
}
  consejal: IConsejal;
  isNew: boolean = true;
  loading: boolean = false;
  saving: boolean = false;
  empleadosSeleccionados: IEmpleado[] = []; // Para mostrar información de los empleados
  consejalclave: IConsejalClave= this.consejalclaveController.inicializamodelo(); // Inicializar el modelo de ConsejalClave
  
  constructor(
    private consejalController: ConsejalController,
    private route: ActivatedRoute,
    private router: Router,
    private comunicacionService: ComunicacionService,
    private datosService: DatosServiceService,
    private dialog: MatDialog,
    private empleado:Empleados,
    private consejalclaveController: ConsejalClaveController
  ) {
    // Inicializar el modelo
    this.consejal = this.consejalController.inicializamodelo();
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    
    if (id) {
      this.isNew = false;
      this.loadConsejal(id);
      this.comunicacionService.enviarMensaje({ titulo: "Editar Consejero" });
    } else {
      this.isNew = true;
      this.comunicacionService.enviarMensaje({ titulo: "Nuevo Consejero" });
    }
  }
 getconsejalclave(){
  this.consejalclaveController.Getconsejalid(this.consejal.id.toString())
  .subscribe(
    (data: IConsejalClave) => {
      this.consejalclave = data;
    },
    (error: HttpErrorResponse) => {
      console.error('Error fetching consejal clave:', error);
      this.datosService.showMessage(`Error al cargar Consejero Clave: ${error.message}`, 'Error', 'error');
    }
  )
 }
  loadConsejal(id: string): void {
    this.loading = true;
    this.consejalController.Get(id).subscribe(
      (data: IConsejal) => {
        this.consejal = data;
        this.loading = false;
        // Aquí podrías cargar la información de los empleados asociados
        this.loadEmpleadosInfo();
        this.getconsejalclave()
      },
      (error: HttpErrorResponse) => {
        console.error('Error fetching consejal:', error);
        this.loading = false;
        this.datosService.showMessage(`Error al cargar Consejero: ${error.message}`, 'Error', 'error');
      }
    );
  }

  // Método para cargar información de empleados (simulado)
  loadEmpleadosInfo(): void {
    // En un caso real, aquí harías una llamada al servicio de empleados
    // para obtener la información completa de cada empleado en consejal_Team
    // Por ahora, solo inicializamos el array
    this.empleadosSeleccionados = [];
  }

  openEmpleadoSelector(): void {
    const dialogRef = this.dialog.open(SeleccionEmpleadoComponent, {
      width: '800px',
      data: { title: 'Seleccionar Empleado' }
    });

    dialogRef.afterClosed().subscribe((empleado: IEmpleado) => {
      if (empleado) {
        this.addEmpleadoToTeam(empleado);
      }
    });
  }

  addEmpleadoToTeam(empleado: IEmpleado): void {
    // Verificar si el empleado ya está en el equipo
    const exists = this.consejal.consejal_Team.some(
      team => team.empleadoSecuencial === empleado.secuencial
    );

    if (!exists) {
      // Crear nuevo miembro del equipo
      const newTeamMember: IConsejalTeam = {
        id: 0, // ID temporal, se asignará en el servidor
        consejalId: this.consejal.id,
        empleadoSecuencial: empleado.secuencial,
        empleado: this.empleado.inicializamodelo()
      };

      // Añadir al array local
      this.consejal.consejal_Team.push(newTeamMember);
      
      // Añadir a la lista de empleados seleccionados para mostrar
      this.empleadosSeleccionados.push(empleado);

      // Si el consejal ya existe (tiene ID), podemos guardar el nuevo miembro directamente
      if (this.consejal.id !== 0) {
        this.consejalController.addEmpleadoToTeam(newTeamMember).subscribe(
          (response: IConsejalTeam) => {
            // Actualizar el ID asignado por el servidor
            const index = this.consejal.consejal_Team.findIndex(
              t => t.empleadoSecuencial === newTeamMember.empleadoSecuencial
            );
            if (index !== -1) {
              this.consejal.consejal_Team[index].id = response.id;
            }
            this.datosService.showMessage('Empleado añadido al equipo', 'Éxito', 'success');
          },
          (error: HttpErrorResponse) => {
            console.error('Error adding employee to team:', error);
            // Eliminar del array local si falla
            this.consejal.consejal_Team = this.consejal.consejal_Team.filter(
              t => t.empleadoSecuencial !== newTeamMember.empleadoSecuencial
            );
            this.empleadosSeleccionados = this.empleadosSeleccionados.filter(
              e => e.secuencial !== empleado.secuencial
            );
            this.datosService.showMessage(`Error al añadir empleado: ${error.message}`, 'Error', 'error');
          }
        );
      }
    } else {
      this.datosService.showMessage('Este empleado ya está en el equipo', 'Información', 'info');
    }
  }

  removeEmpleadoFromTeam(teamMember: IConsejalTeam, index: number): void {
    if (teamMember.id !== 0 && this.consejal.id !== 0) {
      // Si ya tiene ID, eliminar del servidor
      this.consejalController.removeEmpleadoFromTeam(teamMember.id).subscribe(
        () => {
          // Eliminar del array local
          this.consejal.consejal_Team.splice(index, 1);
          this.empleadosSeleccionados.splice(index, 1);
          this.datosService.showMessage('Empleado eliminado del equipo', 'Éxito', 'success');
        },
        (error: HttpErrorResponse) => {
          console.error('Error removing employee from team:', error);
          this.datosService.showMessage(`Error al eliminar empleado: ${error.message}`, 'Error', 'error');
        }
      );
    } else {
      // Si no tiene ID, solo eliminar del array local
      this.consejal.consejal_Team.splice(index, 1);
      this.empleadosSeleccionados.splice(index, 1);
    }
  }

  async saveConsejal(): Promise<void> {
    this.saving = true;
    
    try {
      // Asignar el modelo al controlador
      this.consejalController.model = this.consejal;
      
      // Usar el método grabar del controlador
      const success = await this.consejalController.grabar();
      
      if (success) {
        // Si es nuevo, actualizar el ID y cambiar a modo edición
        if (this.isNew) {
          this.isNew = false;
          this.consejal = this.consejalController.model; // Actualizar con el modelo del controlador que tiene el ID
        }
        
        // Navegar de vuelta a la lista
        this.router.navigate(['/consejal']);
      }
    } catch (error) {
      console.error('Error saving consejal:', error);
      this.datosService.showMessage(`Error al guardar: ${error}`, 'Error', 'error');
    } finally {
      this.saving = false;
    }
  }

  cancel(): void {
    this.router.navigate(['/consejal']);
  }
}
