import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { IException, IExceptionDts } from 'src/app/Models/Excepcion/IExcepcion';
import { DatosServiceService } from 'src/app/Services/datos-service.service';
import { Excepcion } from 'src/app/Controllers/Excepcion';
import { IExcepcionSupervisorInmediato } from 'src/app/Models/Excepcion/IExcepcionSupervisorInmediato';
import { FormExcepcionSupervisorInmediatoComponent } from '../form-excepcion-supervisor-inmediato/form-excepcion-supervisor-inmediato.component';


@Component({
  selector: 'app-excepcion-form',
  standalone: true,
  imports: [CommonModule,ReactiveFormsModule, FormsModule],
  templateUrl: './excepcion-form.component.html',
  styleUrls: ['./excepcion-form.component.css']
})
export class ExcepcionFormComponent implements OnInit {

  public formGroup:FormGroup
  public excepcionmodel:IExceptionDts=this.excepcioncontrol.inicializamodelo()
excepcionForm: any;
  constructor(private fb:FormBuilder,
    
    private excepcioncontrol:Excepcion,
    public dialogRef: MatDialogRef<ExcepcionFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { model: IExceptionDts },
    private datosService: DatosServiceService,
    private dialog: MatDialog
  ){
    this.formGroup=fb.group({})
  }


  ngOnInit(): void {
 //    console.log(this.data.model);
    this.excepcionmodel = this.data.model;
   
    
  }

  BuscarEmpleado() {
    let model:IExcepcionSupervisorInmediato={
      id: 0,
      excepcionId: 0,
      empleadoId: 0,
      departamentoOriginalId: 0,
      jefeOriginalId: 0,
      nuevoDepartamentoId: 0,
      nuevoJefeId: 0,
      fechaInicio: new Date(),
      fechaFin: new Date()
    }
  
    const dialogRef = this.dialog.open(FormExcepcionSupervisorInmediatoComponent, {
      width: '800px', data: { model: model }
    });
    dialogRef.afterClosed().subscribe((rep: IExcepcionSupervisorInmediato) => {
      if (rep) {
      }
    });
  }
agregarExcepcion() {
throw new Error('Method not implemented.');
}
cancelar() {
  throw new Error('Method not implemented.');
}
 

 

 

}