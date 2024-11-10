import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, Input, ViewChild, ChangeDetectorRef } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Kpi } from 'src/app/Controllers/Kpi';
import { IKpi } from 'src/app/Models/Kpi/IKpi';
import { FormKpiComponent } from '../../Forms/form-kpi/form-kpi.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent, MatPaginator } from '@angular/material/paginator';
import { Kri } from 'src/app/Controllers/Kri';
import { IKri } from 'src/app/Models/Kri/IKri';

@Component({
  selector: 'app-kpis',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatPaginatorModule,MatDialogModule],
  templateUrl: './kpis.component.html',
  styleUrls: ['./kpis.component.css']
})
export class KpisComponent implements OnInit, OnDestroy {
  @Input() kriId: number = 0;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  krises: IKri[] = [];
  kri: IKri = {
    id: 0,
    objetivoExtrategicoId: 0,
    descripcion: '',
    ponderacion: 0
  }
  kpis: IKpi[] = [];
  displayedKpis: IKpi[] = [];
  showForm = false;
  private subscription: Subscription;

  // Pagination settings
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50];
  pageIndex = 0;
  totalItems = 0;

  constructor(
    private kpiService: Kpi,
    private kriService: Kri,
    private dialogmat: MatDialog,
    private cd: ChangeDetectorRef,
  ) {
    this.subscription = this.kpiService.TRegistros.subscribe(() => {
      console.log('KPIs updated', this.kpiService.arraymodel);
      this.kpis = this.kpiService.arraymodel;
      this.totalItems = this.displayedKpis.length;
        this.updateDisplayedKpis();
    });
    this.kriService.TRegistros.subscribe(() => {
      console.log('KRIs updated', this.kriService.arraymodel);
      this.krises = this.kriService.arraymodel;
      this.cd.detectChanges();
    });
  }

  ngOnInit() {
    this.kriService.getdatos();
    this.kpiService.getdatos();
  }
  getKriDescripcion(kriId: number): string {
    const kri = this.krises.find(kri => kri.id === kriId);
    return kri ? kri.descripcion : '';
  }
  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  loadKpis() {
    this.kpiService.Gets().subscribe({
      next: (response) => {
        console.log('los kpis', response);
        this.kpis = response.data;
        
        if (this.kriId != 0) {
          this.kpis = this.kpis.filter(kpi => kpi.kriId === this.kriId);
        }
        
        this.totalItems = this.kpis.length;
        this.updateDisplayedKpis();
      },
      error: (error) => {
        console.error('Error loading KPIs:', error);
      }
    });
  }

  updateDisplayedKpis() {
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.displayedKpis = this.kpis.slice(startIndex, endIndex);
  }

  onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updateDisplayedKpis();
  }

  onAdd() {
    this.kpiService.model = this.kpiService.inicializamodelo();
    this.showForm = true;
    this.kpiService.model.kriId = this.kriId;
    this.abrirformulario(this.kpiService.model);
  }

  onDelete(kpi: IKpi) {
    if (confirm('¿Está seguro que desea eliminar este KPI?')) {
      console.log('Delete KPI:', kpi);
      this.loadKpis();
    }
  }

  abrirformulario(kpi: IKpi) {
    const dialogRef = this.dialogmat.open(FormKpiComponent, {
      width: '800px',
      data: { model: kpi }
    });
    dialogRef.afterClosed().subscribe((result: IKpi) => {
      if (result) {
        this.loadKpis();
      }
    });
  }

  onEdit(kpi: IKpi) {
    this.kpiService.model = { ...kpi };
    this.showForm = true;
    this.abrirformulario(kpi);
  }
}
