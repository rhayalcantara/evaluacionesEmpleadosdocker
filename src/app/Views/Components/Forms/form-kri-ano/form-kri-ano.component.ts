import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

import { KriAno } from 'src/app/Controllers/KriAno';
import { IKriAno } from 'src/app/Models/PlanExtrategico/IPlanExtrategico';
import { DatosServiceService } from 'src/app/Services/datos-service.service';

@Component({
  selector: 'app-form-kri-ano',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, ReactiveFormsModule],
  templateUrl: './form-kri-ano.component.html',
  styleUrls: ['./form-kri-ano.component.css']
})
export class FormKriAnoComponent implements OnInit {
  cancelar() {
    this.dialogRef.close();
  }

  model: IKriAno = {
    id: 0,
    kriId: 0,
    plan_AnosId: 0,
    porcientoValor: '',
    valor: 0,
    inverso: false,
    logro: 0
  };

  public fg: FormGroup = new FormGroup({});
  public campos: string[] = [];

  constructor(
    public dialogRef: MatDialogRef<FormKriAnoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private kriAnoController: KriAno,
    private datService: DatosServiceService,
  ) {}

  ngOnInit(): void {
    this.model = this.data.model;
    console.log({model: this.model});
    this.kriAnoController.titulos.map((x: string|any) => {
      let nx: string = x[Object.keys(x)[0]];
      this.campos.push(...Object.keys(x));
    });
    this.fg = this.datService.llenarFormGrup(this.model);
  }

  onSubmit(): void {
    this.model.kriId = this.fg.controls["kriId"].value;
    this.model.plan_AnosId = this.fg.controls["plan_AnosId"].value;
    this.model.porcientoValor = this.fg.controls["porcientoValor"].value;
    this.model.valor = this.fg.controls["valor"].value;
    this.model.inverso = this.fg.controls["inverso"].value;
    this.model.logro = this.fg.controls["logro"].value;

    console.log({modelo: this.model});
    
    if (this.model.id === 0) {
      this.kriAnoController.insert(this.model).subscribe({
        next: (result) => {
          this.dialogRef.close(result);
        },
        error: (err) => {
          console.error('Error inserting KRI Año:', err.message);
        }
      });
    } else {
      this.kriAnoController.Update(this.model).subscribe({
        next: (result) => {
          this.dialogRef.close(result);
        },
        error: (err) => {
          console.error('Error updating KRI Año:', err);
        }
      });
    }
  }
}
