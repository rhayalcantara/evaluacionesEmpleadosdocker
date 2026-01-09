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
import { LoadingComponent } from '../../loading/loading.component';

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
  term: string="";

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
    this.excepcionController.titulos.map((x: string | any) => {
      let nx: string = x[Object.keys(x)[0]];
      this.campos.push(...Object.keys(x));
      this.tituloslocal.push(nx);
    });
    this.excepcionController.TRegistros.subscribe({
      next: (rep: number) => {
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
    await this.loadExcepciones();

  

  }

  async loadExcepciones() {
    this.isLoading = true;
    const dialogRef = this.dialog.open(LoadingComponent, {
      width: '340px',
      height: '180px', 
    });      
    try {
      await this.excepcionController.getdatos();
      this.excepciones = this.excepcionController.arraymodel;
    } catch (error) {
      console.error('Error loading excepciones', error);
      this.excepcionController.showMessage('Error al cargar las excepciones', 'Error', 'error');
    } finally {
      this.isLoading = false;
      dialogRef.close()
    }
  }



  resetForm() {
    this.currentExcepcion = this.excepcionController.inicializamodelo();
  }

 






  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }


  filtro() {
       if (this.term.length > 0) {
        this.excepcionController.arraymodel = this.excepcionController.arraymodel.filter(x=> x.empleadoId)
       }
    }
    
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
      this.config.id = $event;
    }
    paginacambio($event: number) {
      this.excepcionController.actualpage = $event;
    }
    opcion(event: TableResponse) {
  
      const acct: any = {
        edit: this.edita,
        del: this.delete
      };
  
      const handler = acct[event.option](event.key, this.excepcionController, this.dialog);
      handler.then((rep: IExcepcionSupervisorInmediato) => {
        this.excepcionController.getdatos();
      }, (err: Error) => {
        this.datos.showMessage("Error: " + err.message, "Error", "error");
      });
    }
    delete(estado: IExcepcionSupervisorInmediato, p: ExcepcionSupervisorInmediato, t: MatDialog): Promise<any> {
      return new Promise((resolve, reject) => { resolve(estado); });
    }
    edita(estado: IExcepcionSupervisorInmediatoDts, p: ExcepcionSupervisorInmediato, t: MatDialog): Promise<any> {
      return new Promise((resolve: any, reject: any) => {
        p.model = estado;
  
        const dialogRef = t.open(FormExcepcionSupervisorInmediatoComponent, {
          width: '800px', data: { model: p.model }
        });
        dialogRef.afterClosed().subscribe((result: IExcepcionSupervisorInmediato) => {
          if (result) {
            resolve(result);
          } else {
            resolve(null);
          }
        });
      });
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
