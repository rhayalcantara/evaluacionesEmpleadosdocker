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
import { LoggerService } from 'src/app/Services/logger.service';

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
    private datosService: DatosServiceService,
    private logger: LoggerService
  ) {
    this.model = this.planExtrategicoService.inicializamodelo();
  }

  ngOnInit(): void {
    this.logger.debug('🔵 FormPlanEstrategico ngOnInit ejecutado');
    this.logger.debug('📋 Data recibida:', this.data);
    this.logger.debug('🆔 Model ID:', this.data.model?.id);

    if (this.data.model.id) {
      this.logger.debug('✅ Entrando a cargar datos - ID válido:', this.data.model.id);

      this.model = this.data.model
      // obtener los datos complementarios
      // obtener los anos
      this.PlananoController.GetsPlan(this.model.id).subscribe(
        {
          next:(data) => {
            this.model.planAnos = data;
            // obtener el ano inicial - con validación defensiva
            if (data && data.length > 0) {
              this.anoInicio = data[0].ano;
            }
          },
          error: (error) => {
            this.logger.error('Error cargando años del plan:', error);
            this.datosService.showMessage('Error cargando años del plan', 'Error', 'error');
          }
        })

      this.AspirecionesController.GetsPlan(this.model.id).subscribe(
        {
          next:(data: IAspiracion[]) => {
            this.logger.debug('Aspiraciones cargadas:', data);
            this.logger.debug('Verificando IDs de aspiraciones cargadas:');
            data.forEach((a, index) => {
              this.logger.debug(`  Aspiración ${index}: id=${a.id}, planExtrategicoModelId=${a.planExtrategicoModelId}`);
            });
            this.aspiraciones = data;
            this.model.aspiraciones = data;
          },
          error: (error) => {
            this.logger.error('Error cargando aspiraciones:', error);
            this.datosService.showMessage('Error cargando aspiraciones', 'Error', 'error');
          }
        })

        this.PerspectivasController.GetsPlan(this.model.id).subscribe(
          {
            next: (data: IPerspectiva[]) => {
              this.logger.debug('Perspectivas cargadas:', data);
              this.logger.debug('Verificando IDs de perspectivas cargadas:');
              data.forEach((p, index) => {
                this.logger.debug(`  Perspectiva ${index}: id=${p.id}, planExtrategicoModelId=${p.planExtrategicoModelId}`);
              });
              this.perspectivas = data;
              this.model.perspectiva = data;
            },
            error: (error) => {
              this.logger.error('Error cargando perspectivas:', error);
              this.datosService.showMessage('Error cargando perspectivas', 'Error', 'error');
            }
          }
        )

    } else {
      this.logger.debug('⚠️ No hay ID - Modo creación nuevo Plan Estratégico');
    }
  }

  agregarAspiracion() {
    const nuevaAspiracion: IAspiracion = {
      id: 0,
      planExtrategicoId: this.model.id,
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
      planExtrategicoModelId: this.model.id, // Usar el ID del plan actual
      peso: 0
    };
    this.perspectivas.push(nuevaPerspectiva);
  }

  eliminarPerspectiva(index: number) {
    this.perspectivas.splice(index, 1);
  }

  async onSubmit() {
    this.logger.debug('📤 Iniciando onSubmit');
    this.logger.debug('📊 Estado actual - Model ID:', this.model.id);
    this.logger.debug('📊 Aspiraciones en memoria:', this.aspiraciones);
    this.logger.debug('📊 Perspectivas en memoria:', this.perspectivas);

    if (this.anoInicio) {
      // MODO CREACIÓN - Generar años desde cero
      if(this.model.id == 0){
        this.logger.debug('🆕 Modo creación - Generando años');
        this.model.planAnos = [{
          id: 0,
          planExtrategicoId: this.model.id,
          ano: this.anoInicio
        }];
        // Agregar los años faltantes
        for (let i = 2; i <= this.model.cantidad_anos; i++) {
          this.model.planAnos.push({
            id: 0,
            planExtrategicoId: this.model.id,
            ano: (parseInt(this.anoInicio) + i - 1).toString()
          });
        }
        this.logger.debug('✅ Años generados:', this.model.planAnos);
      } else {
        // MODO EDICIÓN - Solo actualizar años si cambió el año inicial
        this.logger.debug('✏️ Modo edición - Verificando si cambió año inicial');
        this.logger.debug('Año actual en BD:', this.model.planAnos[0]?.ano);
        this.logger.debug('Año nuevo:', this.anoInicio);

        if (this.model.planAnos && this.model.planAnos.length > 0) {
          if (this.model.planAnos[0].ano !== this.anoInicio) {
            this.logger.debug('⚠️ Año inicial cambió - Actualizando años');
            // Actualizar todos los años según el nuevo año inicial
            this.model.planAnos.forEach((ano, index) => {
              ano.ano = (parseInt(this.anoInicio) + index).toString();
            });
            this.logger.debug('✅ Años actualizados:', this.model.planAnos);
          } else {
            this.logger.debug('ℹ️ Año inicial no cambió - Manteniendo años existentes');
          }
        }
      }
    }
    // Asegurar que todas las aspiraciones tengan el ID correcto del plan
    this.logger.debug('🔧 Asignando IDs a aspiraciones y perspectivas');
    this.logger.debug('  Model ID que se va a asignar:', this.model.id);

    this.aspiraciones.forEach((a, index) => {
      this.logger.debug(`  ANTES - Aspiración ${index}: id=${a.id}, planExtrategicoId=${a.planExtrategicoId}, planExtrategicoModelId=${a.planExtrategicoModelId}`);
      a.planExtrategicoId = this.model.id;
      a.planExtrategicoModelId = this.model.id;
      this.logger.debug(`  DESPUÉS - Aspiración ${index}: id=${a.id}, planExtrategicoId=${a.planExtrategicoId}, planExtrategicoModelId=${a.planExtrategicoModelId}`);
    });

    this.perspectivas.forEach((p, index) => {
      this.logger.debug(`  ANTES - Perspectiva ${index}: id=${p.id}, planExtrategicoModelId=${p.planExtrategicoModelId}`);
      p.planExtrategicoModelId = this.model.id;
      this.logger.debug(`  DESPUÉS - Perspectiva ${index}: id=${p.id}, planExtrategicoModelId=${p.planExtrategicoModelId}`);
    });

    // Asignar los arrays al modelo
    this.model.aspiraciones = this.aspiraciones;
    this.model.perspectiva = this.perspectivas;

    this.logger.debug('📦 Datos finales antes de grabar:');
    this.logger.debug('  - Descripción:', this.model.descripcion);
    this.logger.debug('  - Cantidad años:', this.model.cantidad_anos);
    this.logger.debug('  - PlanAnos:', this.model.planAnos);
    this.logger.debug('  - Aspiraciones:', this.model.aspiraciones);
    this.logger.debug('  - Perspectivas:', this.model.perspectiva);

    // Asignar el model del componente al service antes de grabar
    this.planExtrategicoService.model = this.model;

    // se envia a grabar
    this.logger.debug('💾 Llamando a grabar()...');
    const success = await this.planExtrategicoService.grabar();
    if (success) {
      this.model = this.planExtrategicoService.inicializamodelo();
      this.aspiraciones = [];
      this.perspectivas = [];
      this.anoInicio = '';
      // Cerrar el modal después de guardar exitosamente
      this.dialogRef.close(true);
    }
  }

  onCancel() {
    this.model = this.planExtrategicoService.inicializamodelo();
    this.aspiraciones = [];
    this.perspectivas = [];
    this.anoInicio = '';
    // Cerrar el modal sin enviar datos
    this.dialogRef.close();
  }
}
