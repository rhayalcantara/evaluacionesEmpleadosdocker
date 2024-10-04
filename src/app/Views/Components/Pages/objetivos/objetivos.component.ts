import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Objetivo } from '../../../../Controllers/Objetivo';
import { IObjetivo } from '../../../../Models/Objetivo/IObjetivo';
import { TablesComponent } from '../../tables/tables.component';
import { TableResponse } from 'src/app/Helpers/Interfaces';
import { FormObjetivosComponent } from '../../Forms/form-objetivos/form-objetivos.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ComunicacionService } from 'src/app/Services/comunicacion.service';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-objetivos',
  templateUrl: './objetivos.component.html',
  styleUrls: ['./objetivos.component.css'],
  standalone: true,
  imports: [CommonModule, TablesComponent, 
          FormObjetivosComponent,MatDialogModule,
        ReactiveFormsModule]
})
export class ObjetivosComponent implements OnInit {
filtro() {
throw new Error('Method not implemented.');
}
  public term:string=""
agregar() {
throw new Error('Method not implemented.');
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

  constructor(
    private ServiceComunicacion:ComunicacionService,
    public objetivoController: Objetivo,
    private cd: ChangeDetectorRef,
    private toastr: MatDialog
  ) { }

  ngOnInit(): void {
    this.loadObjetivos();
    this.objetivoController.TRegistros.subscribe({
      next: (rep: number) => {
        console.log("evento#:", rep);
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
    console.log('los campos',this.campos,'los titulos',this.tituloslocal)
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
    this.selectedObjetivo = this.objetivoController.inicializamodelo();
    this.objetivoController.model = this.objetivoController.inicializamodelo();
    this.abrirmodalzona(this.toastr, this.objetivoController);
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
}