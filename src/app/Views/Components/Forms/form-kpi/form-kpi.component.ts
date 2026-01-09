import { Component, OnInit, Inject, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { IKpi } from 'src/app/Models/Kpi/IKpi';
import { DatosServiceService } from 'src/app/Services/datos-service.service';
import { CommonModule } from '@angular/common';
import { Kpi } from 'src/app/Controllers/Kpi';
import { IKri } from 'src/app/Models/Kri/IKri';
import { Kri } from 'src/app/Controllers/Kri';
import { SeleccionKriComponent } from '../seleccion-kri/seleccion-kri.component';

@Component({
  selector: 'app-form-kpi',
  templateUrl: './form-kpi.component.html', 
  styleUrls: ['./form-kpi.component.css'],
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, CommonModule]
})
export class FormKpiComponent implements OnInit {

  fg: FormGroup;
  titulo: string = 'Nuevo KPI';
  kris:IKri[] = [];
  kri: IKri={
    id: 0, descripcion: 'Seleccione un KRI',
    objetivoExtrategicoId: 0,
    ponderacion: 0
  };

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<FormKpiComponent>,
    private dialogmat: MatDialog,
    public kpiservice: Kpi,
    public kriservice: Kri,
    @Inject(MAT_DIALOG_DATA) public data: { model: IKpi },
    private datosService: DatosServiceService,
    private cd: ChangeDetectorRef,
  ) {
    if (data.model.id) {
      this.titulo = 'Editar KPI';
      this.fg = this.fb.group({
        id: data.model.id,
        kriId: [data.model.kriId, Validators.required],
        descripcion: [data.model.descripcion, Validators.required],
        valor: [data.model.valor, [Validators.required, Validators.min(0)]],
        inverso: [data.model.inverso]
      });

    }else{
      this.titulo = 'Agregar KPI';      
      this.fg = this.fb.group({
      id: [0],
      kriId: [0, Validators.required],
      descripcion: ['', Validators.required],
      valor: [0, [Validators.required, Validators.min(0)]],
      inverso: [false]
    });
  }
    this.kriservice.TRegistros.subscribe(() => {
      // al momento de terminar de recibir los kri en el servicio se actualiza aqui el array
      this.kris = this.kriservice.arraymodel;
      this.kri = this.kris.find((kri) => kri.id === data.model.kriId) ?? this.kri;
    })
  }


  ngOnInit(): void {
    if (this.data.model.id) {
      this.titulo = 'Editar KPI';            
    }
    this.fg.patchValue(this.data.model);
    this.kriservice.getdatos()
  }
  // funcion para devolver el descripcion del kri
  getKriName(id: number): string {
    const kri = this.kris.find((kri) => kri.id === id);
    if (kri){
      this.kri = kri;
    }
    
    return kri ? kri.descripcion : '';
  }
  //funcion para abrir el dialogo de seleccion de kri
  selecionkri() {

     const dialogRef = this.dialogmat.open(SeleccionKriComponent, {
    width: '800px',
    data: {  }
  });
  dialogRef.afterClosed().subscribe((result: IKri) => {
    if (result) {
      this.kri = result;
      this.fg.patchValue({ kriId: result.id });
    }
  });
} 

  grabar(): void {
    if (this.fg.valid) {
      const kpi: IKpi = this.fg.value;      
      this.kpiservice.model = kpi;
      this.kpiservice.grabar().then(() => {
        this.datosService.showMessage('KPI guardado exitosamente', 'Éxito', 'success');
      }).catch((error) => {
        this.datosService.showMessage('Error al guardar el KPI', 'Error', 'error');
      }).finally(() => {
        this.dialogRef.close(kpi);
      })
    } else {
      this.datosService.showMessage('Por favor, complete todos los campos requeridos.', 'Error', 'error');
    }
  }

  cancelar(): void {
    this.dialogRef.close();
  }
}
