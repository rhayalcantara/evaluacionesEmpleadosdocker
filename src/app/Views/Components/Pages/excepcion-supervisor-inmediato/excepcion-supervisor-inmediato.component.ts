import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormExcepcionSupervisorInmediatoComponent } from '../../Forms/form-excepcion-supervisor-inmediato/form-excepcion-supervisor-inmediato.component';
import { ExcepcionSupervisorInmediato } from '../../../../Controllers/ExcepcionSupervisorInmediato';
import { IExcepcionSupervisorInmediato, IExcepcionSupervisorInmediatoDts } from '../../../../Models/Excepcion/IExcepcionSupervisorInmediato';
import { FormsModule } from '@angular/forms';
import { TablesComponent } from '../../tables/tables.component';
import { TableResponse } from 'src/app/Helpers/Interfaces';
import { ComunicacionService } from 'src/app/Services/comunicacion.service';
import { DatosServiceService } from 'src/app/Services/datos-service.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-excepcion-supervisor-inmediato',
  standalone: true,
  imports: [CommonModule,FormsModule,TablesComponent,MatDialogModule],
  templateUrl: './excepcion-supervisor-inmediato.component.html',
  styleUrls: ['./excepcion-supervisor-inmediato.component.css']
})
export class ExcepcionSupervisorInmediatoComponent implements OnInit {
campos: string[]=[];
tituloslocal: string[]=[];
actualpage: number=1;
config: any;


  currentExcepcion: IExcepcionSupervisorInmediato;
  excepciones: IExcepcionSupervisorInmediato[] = [];
  isLoading: boolean = false;
  currentPage: number = 1;
  pageSize: number = 10;

  constructor(public excepcionController: ExcepcionSupervisorInmediato,
                private ServiceComunicacion: ComunicacionService,
                private datos: DatosServiceService,
                private dialog:MatDialog
  ) {
    this.currentExcepcion = this.excepcionController.inicializamodelo();
  }

  async ngOnInit() {
    await this.loadExcepciones();
    this.excepcionController.TRegistros.subscribe({
        next: (rep: number) => {
          console.log("evento#:", rep);
          this.config.totalItems = rep;
          this.ServiceComunicacion.enviarMensaje(this.config);
        }
      });
  
      this.config = {
        id: '',
        itemsPerPage: 5,
        currentPage: 1,
        totalItems: this.excepcionController.totalregistros
      };
  
      this.excepcionController.titulos.map((x: string | any) => {
        let nx: string = x[Object.keys(x)[0]];
        this.campos.push(...Object.keys(x));
        this.tituloslocal.push(nx);
      });
  }

  async loadExcepciones() {
    this.isLoading = true;
    try {
      await this.excepcionController.getdatos();
      this.excepciones = this.excepcionController.arraymodel;
    } catch (error) {
      console.error('Error loading excepciones', error);
      this.excepcionController.showMessage('Error al cargar las excepciones', 'Error', 'error');
    } finally {
      this.isLoading = false;
    }
  }

  async onFormSubmit(excepcion: IExcepcionSupervisorInmediato | undefined) {
    if (excepcion) {
      this.isLoading = true;
      this.excepcionController.model = excepcion;
      try {
        const success = await this.excepcionController.grabar();
        if (success) {
          await this.loadExcepciones();
          this.resetForm();
        }
      } catch (error) {
        console.error('Error saving exception', error);
        this.excepcionController.showMessage('Error al guardar la excepción', 'Error', 'error');
      } finally {
        this.isLoading = false;
      }
    } else {
      this.resetForm();
    }
  }

  resetForm() {
    this.currentExcepcion = this.excepcionController.inicializamodelo();
  }

  editExcepcion(excepcion: IExcepcionSupervisorInmediato) {
    this.currentExcepcion = { ...excepcion };
  }

  cancelEdit() {
    this.excepcionController.cancelar();
    this.resetForm();
  }

  async confirmDelete(excepcion: IExcepcionSupervisorInmediato) {
    if (confirm(`¿Está seguro que desea eliminar la excepción para el empleado ${excepcion.empleadoId}?`)) {
      this.isLoading = true;
      try {
        const success = await this.excepcionController.delete(excepcion.id);
        if (success) {
          await this.loadExcepciones();
        }
      } catch (error) {
        console.error('Error deleting exception', error);
        this.excepcionController.showMessage('Error al eliminar la excepción', 'Error', 'error');
      } finally {
        this.isLoading = false;
      }
    }
  }

  get paginatedExcepciones(): IExcepcionSupervisorInmediato[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.excepciones.slice(startIndex, startIndex + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.excepciones.length / this.pageSize);
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }
  filtro() {
    throw new Error('Method not implemented.');
    }
    term: any;
    agregar() {
        this.excepcionController.model = this.excepcionController.inicializamodelo()
        this.abrirmodalzona();
    }
    pdf() {
    throw new Error('Method not implemented.');
    }
    excel() {
    throw new Error('Method not implemented.');
    }
    actualizaelidtable($event: string) {
        throw new Error('Method not implemented.');
    }
    paginacambio($event: number) {
    throw new Error('Method not implemented.');
    }
    opcion($event: TableResponse) {
    throw new Error('Method not implemented.');
    }
    abrirmodalzona() {
        const dialogRef = this.dialog.open(FormExcepcionSupervisorInmediatoComponent, {
          width: '90%',maxHeight:'80%', data: { model: this.excepcionController.model }
        });
        dialogRef.afterClosed().subscribe((rep: IExcepcionSupervisorInmediatoDts) => {
          if (rep) {
            this.excepcionController.arraymodel.push(rep);
            this.datos.showMessage("Registro Insertado Correctamente", this.excepcionController.titulomensage, "success");
          }
        });
      }
}