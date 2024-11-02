import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Kri } from 'src/app/Controllers/Kri';
import { IKri } from 'src/app/Models/Kri/IKri';
import { FormKriComponent } from '../../Forms/form-kri/form-kri.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-kris',
  standalone:true,
  imports:[CommonModule, ReactiveFormsModule],
  templateUrl: './kris.component.html',
  styleUrls: ['./kris.component.css']
})
export class KrisComponent implements OnInit, OnDestroy {
  kris: IKri[] = [];
  showForm = false;
  private subscription: Subscription;

  constructor(private kriService: Kri,
              private dialogmat:MatDialog
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
        console.log('los kris',response);
        
        this.kris = response.data;
      },
      error: (error) => {
        console.error('Error loading KRIs:', error);
      }
    });
  }

  onAdd() {
    this.kriService.model = this.kriService.inicializamodelo();
    this.showForm = true;
    this.dialogmat.open(FormKriComponent);
  }

  onDelete(kri: IKri) {
    if (confirm('¿Está seguro que desea eliminar este KRI?')) {
      // Since there's no delete method in the service, we might need to implement it
      console.log('Delete KRI:', kri);
      this.loadKris();
    }
  }

  onEdit(kri: IKri) {
    this.kriService.model = { ...kri };
    this.showForm = true;
  }

  onViewYears(kri: IKri) {
    // This functionality will be implemented later
    console.log('View years for KRI:', kri);
  }
}
