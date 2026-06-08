import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Objetivo } from '../../../../Controllers/Objetivo';
import { IObjetivo, IObjetivoDts } from '../../../../Models/Objetivo/IObjetivo';
import { IPeriodo } from '../../../../Models/Periodos/IPeriodo';
import { TablesComponent } from '../../tables/tables.component';
import { TableResponse } from 'src/app/Helpers/Interfaces';
import { FormObjetivosComponent } from '../../Forms/form-objetivos/form-objetivos.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ComunicacionService } from 'src/app/Services/comunicacion.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-objetivos',
  templateUrl: './objetivos.component.html',
  styleUrls: ['./objetivos.component.css'],
  standalone: true,
  imports: [CommonModule, TablesComponent, 
          FormObjetivosComponent,MatDialogModule,
        FormsModule]
})
export class ObjetivosComponent implements OnInit {
filtro() {
    if (this.term!=""){
      this.objetivoController.arraymodel = this.objetivoController.arraymodel.filter(x => {
        return x.descripcion.toLowerCase().includes(this.term.toLowerCase())
          || x.periodo.toLowerCase().includes(this.term.toLowerCase())
          || x.nombre.toLowerCase().includes(this.term.toLowerCase())
          || x.estad.toLowerCase().includes(this.term.toLowerCase())
          || x.grupoc.toLowerCase().includes(this.term.toLowerCase());
      });
    }else{
      this.objetivoController.getdatos()
    }                                
}
  public term:string=""
agregar() {
  this.selectedObjetivo = this.objetivoController.inicializamodelo();
  this.objetivoController.model = this.objetivoController.inicializamodelo();
  this.abrirmodalzona(this.toastr, this.objetivoController);
}
pdf() {
throw new Error('Method not implemented.');
}
excel() {
throw new Error('Method not implemented.');
}
  
  totalregistros: number = 0;
  actualpage: number = 1;
  config: any;
  objetivos: IObjetivo[] = [];
  selectedObjetivo: IObjetivo | null = null;
  isEditing: boolean = false;
  public campos: string[] = []
  public tituloslocal: string[] = []

  periodos: IPeriodo[] = [];
  periodoFiltroId: string = '0';
  mostrarCopia: boolean = false;
  periodoOrigenId: string = '0';
  periodoDestinoId: string = '0';
  copiando: boolean = false;

  constructor(
    private ServiceComunicacion:ComunicacionService,
    public objetivoController: Objetivo,
    private cd: ChangeDetectorRef,
    private toastr: MatDialog
  ) { }

  ngOnInit(): void {
    this.loadObjetivos();
    this.objetivoController.getPeriodos().subscribe((p: IPeriodo[]) => {
      this.periodos = p;
    });
    this.objetivoController.TRegistros.subscribe({
      next: (rep: number) => {
        this.config.totalItems=rep
        this.ServiceComunicacion.enviarMensaje(this.config)
      }
    });
    this.config = {
      id:'',
       itemsPerPage: 2,
       currentPage: 1,
       totalItems: this.objetivoController.totalregistros
     };
    this.objetivoController.titulos.map((x: string | any) => {
      let nx: string = x[Object.keys(x)[0]]
      this.campos.push(...Object.keys(x))
      this.tituloslocal.push(nx)
    })
    this.cd.detectChanges();
  }

  loadObjetivos(): void {
    this.objetivoController.getdatos();
  }

  onSelect(objetivo: IObjetivo): void {
    this.selectedObjetivo = { ...objetivo };
    this.objetivoController.model = objetivo;
    this.isEditing = true;
    this.abrirmodalzona(this.toastr, this.objetivoController);
  }

  onNew(): void {

  }

  abrirmodalzona(t: MatDialog, p: Objetivo) {
    let editando: boolean = false;
    if (p.model.id != 0) {
      editando = true;
    }

    const dialogRef = t.open(FormObjetivosComponent, {
      width: '800px',
      data: { model: p }
    });
    dialogRef.afterClosed().subscribe((rep: IObjetivo) => {
      this.loadObjetivos();
    });
  }

  async onSubmitForm(objetivo: IObjetivo): Promise<void> {
    this.objetivoController.model = objetivo;
    const success = await this.objetivoController.grabar();
    if (success) {
      this.loadObjetivos();
      this.isEditing = false;
      this.selectedObjetivo = null;
    }
  }

  onCancel(): void {
    this.isEditing = false;
    this.selectedObjetivo = null;
  }

  async onDelete(objetivo: IObjetivo): Promise<void> {
    if (confirm('¿Está seguro de que desea eliminar este objetivo?')) {
      const success = await this.objetivoController.delete(objetivo.id);
      if (success) {
        this.loadObjetivos();
      }
    }
  }

  actualizaelidtable($event: string) {
   this.config.id = $event
  }

  paginacambio($event: number) {
    this.objetivoController.actualpage=$event
  }

  opcion($event: TableResponse) {
    if($event.option == 'edit'){
      this.onSelect($event.key as IObjetivo)
    }
  }

  filtrarPorPeriodo(): void {
    const id = +this.periodoFiltroId;
    if (id === 0) {
      this.loadObjetivos();
    } else {
      this.objetivoController.Gets().subscribe({
        next: (rep: any) => {
          this.objetivoController.arraymodel = (rep.data as IObjetivoDts[]).filter(
            (x: IObjetivoDts) => x.periodoId === id
          );
          this.objetivoController.totalregistros = this.objetivoController.arraymodel.length;
          this.cd.detectChanges();
        }
      });
    }
  }

  iniciarCopia(): void {
    this.mostrarCopia = true;
    this.periodoOrigenId = '0';
    this.periodoDestinoId = '0';
  }

  cancelarCopia(): void {
    this.mostrarCopia = false;
  }

  async confirmarCopia(): Promise<void> {
    const origen = +this.periodoOrigenId;
    const destino = +this.periodoDestinoId;
    if (!origen || !destino || origen === destino) return;
    this.copiando = true;
    await this.objetivoController.copiarDePeriodo(origen, destino);
    this.copiando = false;
    this.mostrarCopia = false;
    this.periodoFiltroId = this.periodoDestinoId;
    this.filtrarPorPeriodo();
  }
}
