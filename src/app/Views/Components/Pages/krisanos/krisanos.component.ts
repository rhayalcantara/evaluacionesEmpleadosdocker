import { CommonModule } from '@angular/common';
import { Component, OnInit, Inject  } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { IKri, IKriAno } from 'src/app/Models/Kri/IKri';
import { FormKriAnoComponent } from '../../Forms/form-kri-ano/form-kri-ano.component';
import { IPlan_Anos } from 'src/app/Models/PlanExtrategico/IPlanExtrategico';
import { KriAno } from 'src/app/Controllers/KriAno';

interface DialogData {
    model: IKri;
    anos: IPlan_Anos[];
}

@Component({
  selector: 'app-krisanos',
  templateUrl: './krisanos.component.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatPaginatorModule, MatDialogModule],
  styleUrls: ['./krisanos.component.css']
})
export class KrisanosComponent implements OnInit {
    displayedKrisanos: IKriAno[] = [];   
    totalItems: number = 0;
    pageSize: number = 50;
    pageSizeOptions: number[] = [10, 25, 50, 100];
    pageIndex: number = 0;
    anos: IPlan_Anos[] = [];
    
    kriano: IKriAno = {
        id: 0,
        kriId: this.data.model.id,
        plan_AnosId: 0,
        porcientoValor: '',
        valor: 0,
        inverso: false,
        logro: 0
    }
 
    constructor(
        public dialogmat: MatDialog,
        @Inject(MAT_DIALOG_DATA) public data: DialogData,
        public kriService: KriAno,
    ) {
        this.anos = this.data.anos;
        this.kriService.TRegistros.subscribe(() => {
            this.updateDisplayedData();
        });
    }

    ngOnInit(): void {
        this.kriService.getdatos();
    }

    updateDisplayedData() {
        const startIndex = this.pageIndex * this.pageSize;
        this.totalItems = this.kriService.arraymodel.length;
        this.displayedKrisanos = this.kriService.arraymodel.slice(startIndex, startIndex + this.pageSize);
    }

    getAnoById(planAnosId: number): string {
        const planAno = this.anos.find(a => a.id === planAnosId);
        return planAno ? planAno.ano : '';
    }

    abrirModal(kriano: IKriAno) {
        const dialogRef = this.dialogmat.open(FormKriAnoComponent, {
            width: '800px',
            data: { model: kriano, anos: this.anos }
        });
        dialogRef.afterClosed().subscribe((result: IKriAno) => {
            if (result) {
                this.kriService.getdatos();
            }
        });
    }

    onPageChange(event: PageEvent) {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
        this.updateDisplayedData();
    }

    onEdit(kriano: IKriAno) {
        this.abrirModal(kriano);
    }

    onDelete(kriano: IKriAno) {
        // Implement delete functionality
        throw new Error('Method not implemented.');
    }
}
