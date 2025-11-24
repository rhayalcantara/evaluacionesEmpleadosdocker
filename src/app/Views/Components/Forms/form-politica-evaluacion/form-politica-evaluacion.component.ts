import { Component, OnInit,Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, Validators,ReactiveFormsModule } from '@angular/forms';
import { IPoliticaEvaluacion } from '../../../../Models/PoliticaEvaluacion/IPoliticaEvaluacion';
import { TablesComponent } from '../../tables/tables.component';
import { MatDialogRef,MAT_DIALOG_DATA, MatDialog, } from '@angular/material/dialog';
import { PoliticaEvaluacion } from 'src/app/Controllers/PoliticaEvaluacion';
import { DatosServiceService } from 'src/app/Services/datos-service.service';

@Component({
  selector: 'app-form-politica-evaluacion',
  standalone:true,
  imports: [FormsModule, TablesComponent,ReactiveFormsModule, CommonModule],
  templateUrl: './form-politica-evaluacion.component.html',
  styleUrls: ['./form-politica-evaluacion.component.css']
})
export class FormPoliticaEvaluacionComponent implements OnInit {
  politicaEvaluacionForm: FormGroup;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
      private fb: FormBuilder,
      private dialogRef: MatDialogRef<FormPoliticaEvaluacionComponent>,
      public PE:PoliticaEvaluacion,
      private datService: DatosServiceService,
    ) { this.politicaEvaluacionForm=fb.group({}) }

  ngOnInit(): void {
    //this.initForm();
    this.PE.model = this.data.model
    this.politicaEvaluacionForm = this.datService.llenarFormGrup(this.PE.model);

  }

  // initForm(): void {
  //   this.politicaEvaluacionForm = this.fb.group({
  //     id: [''],
  //     nombre: ['', Validators.required],
  //     descripcion: ['', Validators.required],
  //     // Add more form controls as needed based on IPoliticaEvaluacion interface
  //   });
  // }

  onSubmit(): void {
    if (this.politicaEvaluacionForm.valid) {
      this.PE.model =  this.politicaEvaluacionForm.value as IPoliticaEvaluacion;
      // Here you would typically call a service to save the data
      this.PE.grabar().then((x:boolean)=>{
        if(x){
          this.datService.showMessage("Grabado ",this.PE.titulomensage,"success")
          this.dialogRef.close(this.PE.model)
        }
      })
    }
  }
}
