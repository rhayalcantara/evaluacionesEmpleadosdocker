import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PlanExtrategico } from 'src/app/Controllers/PlanExtrategico';
import { IPlanExtrategico, IAspiracion } from 'src/app/Models/PlanExtrategico/IPlanExtrategico';
import { IPerspectiva } from 'src/app/Models/Perspectiva/IPerspectiva';

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

  constructor(private planExtrategicoService: PlanExtrategico) {
    this.model = this.planExtrategicoService.inicializamodelo();
  }

  ngOnInit(): void {
  }

  agregarAspiracion() {
    const nuevaAspiracion: IAspiracion = {
      id: 0,
      planextrategicoid: this.model.id,
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
      Nombre: '',
      planextrategicoid:0,
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
        PlanExtrategicoId: this.model.id,
        ano: this.anoInicio
      }];
      // si estas agregando hay que generar los anos
      if(this.model.id==0){
        // agegar los anos faltantes
        for (let i = 2; i < this.model.cantidad_anos; i++) {
          this.model.planAnos.push({
            id: 0, 
            PlanExtrategicoId: this.model.id, 
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
    this.model.perspectiva = this.perspectivas;
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
