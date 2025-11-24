import { Component, Inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PlanExtrategico } from 'src/app/Controllers/PlanExtrategico';
import { IPlanExtrategico, IAspiracion } from 'src/app/Models/PlanExtrategico/IPlanExtrategico';
import { IPerspectiva } from 'src/app/Models/Perspectiva/IPerspectiva';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DatosServiceService } from 'src/app/Services/datos-service.service';
import { Aspiracion } from 'src/app/Controllers/Aspiracion';
import { PlanAnos } from 'src/app/Controllers/PlanAnos';
import { Perspectiva } from 'src/app/Controllers/Perspectiva';

@Component({
  selector: 'app-form-plan-estrategico',
  templateUrl: './form-plan-estrategico.component.html',
  styleUrls: ['./form-plan-estrategico.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class FormPlanEstrategicoComponent implements OnInit {
  model: IPlanExtrategico;
  aspiraciones: IAspiracion[] = [];
  perspectivas: IPerspectiva[] = [];
  anoInicio: string = '';

  constructor(private planExtrategicoService: PlanExtrategico,
    public dialogRef: MatDialogRef<FormPlanEstrategicoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { model: IPlanExtrategico },
    private AspirecionesController:Aspiracion,
    private PlananoController:PlanAnos,
    private PerspectivasController: Perspectiva,
    private datosService: DatosServiceService
  ) {
    this.model = this.planExtrategicoService.inicializamodelo();
  }

  ngOnInit(): void {
    if (this.data.model.id) {
      
      this.model = this.data.model
      // obtener los datos complementarios
      // obtener los anos
      this.PlananoController.GetsPlan(this.model.id).subscribe(
        {
          next:(data) => {
            this.model.planAnos = data;
            // obtener el ano inicial
            this.anoInicio = this.data.model.planAnos[0].ano
          }
        })

      this.AspirecionesController.GetsPlan(this.model.id).subscribe( 
        {
          next:(data: IAspiracion[]) => {
            this.aspiraciones = data;
            this.model.aspiraciones = data;
          }

        })

        this.PerspectivasController.GetsPlan(this.model.id).subscribe(
          {
            next: (data: IPerspectiva[]) => {
              this.perspectivas = data;
              this.model.perspectiva = data;
          }
          }
        )

    }
  }

  agregarAspiracion() {
    const nuevaAspiracion: IAspiracion = {
      id: 0,
      planExtrategicoModelId: this.model.id,
      descripcion: '',
      porcientovalor: '',
      valor: 0
    };
    this.aspiraciones.push(nuevaAspiracion);
  }

  eliminarAspiracion(index: number) {
    this.aspiraciones.splice(index, 1);
  }

  agregarPerspectiva() {
    const nuevaPerspectiva: IPerspectiva = {
      id: 0,
      nombre: '',
      planExtrategicoModelId:0,
      peso: 0
    };
    this.perspectivas.push(nuevaPerspectiva);
  }

  eliminarPerspectiva(index: number) {
    this.perspectivas.splice(index, 1);
  }

  async onSubmit() {
    if (this.anoInicio) {
      this.model.planAnos = [{
        id: 0,
        planExtrategicoId: this.model.id,
        ano: this.anoInicio
      }];
      // si estas agregando hay que generar los anos
      if(this.model.id==0){
        // agegar los anos faltantes
        for (let i = 2; i < this.model.cantidad_anos; i++) {
          this.model.planAnos.push({
            id: 0, 
            planExtrategicoId: this.model.id, 
            ano: (parseInt(this.anoInicio) + i-1 ).toString()          
          });
        }
      }else{
        // encaso de que sea actulizando hay que verificar si el año cambio
        if (this.model.planAnos[0].ano !== this.anoInicio) {
          //this.model.planAnos[0].ano = this.anoInicio;
          // hay que modificar los demas anos segun el primero y la cantiada de años
          this.model.planAnos.forEach((ano, index) => {
               ano.ano = (parseInt(this.anoInicio) + index).toString();            
          })                        
        }
      }
    }
    // se actualiza las aspiraciones y las perspectivas
    this.model.aspiraciones = this.aspiraciones;
    this.model.perspectiva = this.perspectivas;
    // se envia a grabar
    const success = await this.planExtrategicoService.grabar();
    if (success) {
      this.model = this.planExtrategicoService.inicializamodelo();
      this.aspiraciones = [];
      this.perspectivas = [];
      this.anoInicio = '';
    }
  }

  onCancel() {
    this.model = this.planExtrategicoService.inicializamodelo();
    this.aspiraciones = [];
    this.perspectivas = [];
    this.anoInicio = '';
  }
}
