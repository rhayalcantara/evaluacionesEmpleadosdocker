import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, Input, ViewChild } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Kri } from 'src/app/Controllers/Kri';
import { IKri, IKriAno } from 'src/app/Models/Kri/IKri';
import { FormKriComponent } from '../../Forms/form-kri/form-kri.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent, MatPaginator } from '@angular/material/paginator';
import { KrisanosComponent } from '../krisanos/krisanos.component';
import { IPlan_Anos } from 'src/app/Models/PlanExtrategico/IPlanExtrategico';

@Component({
  selector: 'app-kris',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatPaginatorModule,MatDialogModule],
  templateUrl: './kris.component.html',
  styleUrls: ['./kris.component.css']
})
export class KrisComponent implements OnInit, OnDestroy {
  @Input() ObjectivoEstrategicoId: number = 0;
  @Input() anos:IPlan_Anos[]=[]
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  
  kris: IKri[] = [];
  displayedKris: IKri[] = [];
  showForm = false;
  private subscription: Subscription;

  // Pagination settings
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50];
  pageIndex = 0;
  totalItems = 0;

  constructor(
    private kriService: Kri,
    private dialogmat: MatDialog
  ) {
    this.subscription = this.kriService.TRegistros.subscribe(() => {
      this.loadKris();
      this.showForm = false;
    });
  }

  ngOnInit() {
    this.loadKris();
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  loadKris() {
    this.kriService.Gets().subscribe({
      next: (response) => {
        this.kris = response.data;
        
        if (this.ObjectivoEstrategicoId != 0) {
          this.kris = this.kris.filter(kri => kri.objetivoExtrategicoId === this.ObjectivoEstrategicoId);
        }
        
        this.totalItems = this.kris.length;
        this.updateDisplayedKris();
      },
      error: (error) => {
        console.error('Error loading KRIs:', error);
      }
    });
  }

  updateDisplayedKris() {
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.displayedKris = this.kris.slice(startIndex, endIndex);
  }

  onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updateDisplayedKris();
  }

  onAdd() {
    this.kriService.model = this.kriService.inicializamodelo();
    this.showForm = true;
    this.kriService.model.objetivoExtrategicoId = this.ObjectivoEstrategicoId;
    // abrir el formulario con el modelo inicializado
    this.abrirformulario(this.kriService.model);
  }

  onDelete(kri: IKri) {
    if (confirm('¿Está seguro que desea eliminar este KRI?')) {
      // Since there's no delete method in the service, we might need to implement it
      this.loadKris();
    }
  }

  abrirformulario(kri: IKri) {
    const dialogRef = this.dialogmat.open(FormKriComponent, {
      width: '800px',
      data: { model: kri }
    });
    dialogRef.afterClosed().subscribe((result: IKri) => {
      if (result) {
        this.loadKris();
      }
    });
  }

  onEdit(kri: IKri) {
    this.kriService.model = { ...kri };
    this.showForm = true;
    // abril el formulario con el kri recibido
    this.abrirformulario(kri);
  }

  onViewYears(kri: IKri) {
    // This functionality will be implemented later
    const dialogRef = this.dialogmat.open(KrisanosComponent, {
      width: '800px',
      data: { model: kri,anos:this.anos}
    });
    dialogRef.afterClosed().subscribe((result: IKriAno) => {
      if (result) {
        //this.loadKris();
      }
    });
    //KrisanosComponent
  }
}
