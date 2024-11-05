import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

import { KriAno } from 'src/app/Controllers/KriAno';

import { DatosServiceService } from 'src/app/Services/datos-service.service';
import { IKriAno } from 'src/app/Models/Kri/IKri';
import { PlanAnos } from 'src/app/Controllers/PlanAnos';
import { IPlan_Anos } from 'src/app/Models/PlanExtrategico/IPlanExtrategico';

@Component({
  selector: 'app-form-kri-ano',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, ReactiveFormsModule],
  templateUrl: './form-kri-ano.component.html',
  styleUrls: ['./form-kri-ano.component.css']
})
export class FormKriAnoComponent implements OnInit {


  model: IKriAno = {
    id: 0,
    kriId: 0,
    plan_AnosId: 0,
    porcientoValor: '',
    valor: 0,
    inverso: false,
    logro: 0
  };
  Anos:IPlan_Anos[]=[]
  public fg: FormGroup = new FormGroup({});
  public campos: string[] = [];

  constructor(
    public dialogRef: MatDialogRef<FormKriAnoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private kriAnoController: KriAno,
    private datService: DatosServiceService,
  ) {}

  ngOnInit(): void {
    this.Anos = this.data.anos
    this.model = this.data.model;
    console.log({model: this.model});
    this.kriAnoController.titulos.map((x: string|any) => {
      let nx: string = x[Object.keys(x)[0]];
      this.campos.push(...Object.keys(x));
    });
    this.fg = this.datService.llenarFormGrup(this.model);
  }

  onSubmit(): void {
    //this.model.kriId = this.fg.controls["kriId"].value;
    this.model.plan_AnosId = this.fg.controls["plan_AnosId"].value;
    this.model.porcientoValor = this.fg.controls["porcientoValor"].value;
    this.model.valor = this.fg.controls["valor"].value;
    this.model.inverso = this.fg.controls["inverso"].value;
    this.model.logro = this.fg.controls["logro"].value;

    console.log({modelo: this.model});
    this.kriAnoController.model = this.model
    this.kriAnoController.grabar().then((result) => {
      if(result){
        this.datService.showMessage('Datos guardados correctamente',this.kriAnoController.titulomensage, 'success');
        this.dialogRef.close(result);
      }
    })
    .catch((error) => {
           this.datService.showMessage('Error al guardar los datos', this.kriAnoController.titulomensage, 'error'); 
    })
  }
  cancelar() {
    this.dialogRef.close();
  }
}
