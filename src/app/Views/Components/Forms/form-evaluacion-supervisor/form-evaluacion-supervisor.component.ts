import { CommonModule } from '@angular/common';
import { Component, Inject, Input, OnInit, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CardEmpleadoComponent } from '../../ViewEmpleado/card-empleado/card-empleado.component';
import { FormEvaluationEmployeComponent } from '../FormEvaluationEmploye/FormEvaluationEmploye.component';
import { FormEvaluationMedioAnoComponent } from '../form-evaluation-medio-ano/form-evaluation-medio-ano.component';
import { IEmpleado } from 'src/app/Models/Empleado/IEmpleado';
import { IPeriodo } from 'src/app/Models/Periodos/IPeriodo';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Evaluacion } from 'src/app/Controllers/Evaluacion';
import { IEvaluacion } from 'src/app/Models/Evaluacion/IEvaluacion';
import { DatosServiceService } from 'src/app/Services/datos-service.service';

@Component({
  selector: 'app-form-evaluacion-supervisor',
  standalone:true,
  imports:[FormsModule,CommonModule,ReactiveFormsModule,
    FormEvaluationEmployeComponent,FormEvaluationMedioAnoComponent],
  templateUrl: './form-evaluacion-supervisor.component.html',
  styleUrls: ['./form-evaluacion-supervisor.component.css']
})
export class FormEvaluacionSupervisorComponent implements OnInit{
  public empleado!:IEmpleado;
  public periodo!:IPeriodo;
  public subordinado!:IEmpleado;
  public puntuacionFinal: number=0;

  @ViewChild(FormEvaluationEmployeComponent)
  private formEvaluationEmploye?: FormEvaluationEmployeComponent;

  // Formulario de medio año. Antes solo existía la referencia al formulario final,
  // así que en periodos medio_ano "Guardar Avance" no hacía nada.
  @ViewChild(FormEvaluationMedioAnoComponent)
  private formMedioAno?: FormEvaluationMedioAnoComponent;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data:any,
    private dialogre:MatDialogRef<FormEvaluacionSupervisorComponent>,
    private evaluacionController: Evaluacion,
    private datos: DatosServiceService
  ){}

  ngOnInit(): void {
    this.empleado=this.data.empleado;
    this.periodo=this.data.periodo;
    this.subordinado=this.data.subordinado;
  }

  onPuntuacion(event:number){
    this.puntuacionFinal=event;
  }

  actualizapuntuacion(){
  }

  cancelar(){
    this.dialogre.close(null);
  }

  /**
   * Guardar Avance — ejecuta el submit del formulario hijo (valida y graba,
   * dejando estado 'EvaluadoPorSupervisor'). Equivale al botón "Grabar" del hijo.
   */
  public onGuardarAvance(): void {
    if (this.formMedioAno) {
      this.formMedioAno.onSubmit();
    } else if (this.formEvaluationEmploye) {
      this.formEvaluationEmploye.onSubmit();
    }
  }

  /**
   * Aprobar Autoevaluación — graba sin exigir que todos los campos del supervisor
   * estén completos, cambiando el estado a 'EvaluadoPorSupervisor'.
   */
  public onAprobarAutoevaluacion(): void {
    this.onGuardarAvance();
  }

  /**
   * Enviar al Colaborador — cambia el estado a 'Enviado' para que el colaborador
   * pueda aceptarla.
   *
   * Medio año: el hijo graba lo que hay en pantalla y pone 'Enviado' en la misma
   * operación (someterAlColaborador). La versión anterior releía la evaluación
   * del API y la grababa como 'Enviado', descartando lo no guardado: 61 evaluaciones
   * del periodo 8 llegaron al colaborador sin calificación del supervisor.
   *
   * Evaluación final: se exige que exista un avance grabado ('EvaluadoPorSupervisor')
   * antes de enviar, para no repetir la misma pérdida.
   */
  public async onSometerColaborador(): Promise<void> {
    if (!this.empleado?.secuencial || !this.periodo?.id) {
      this.datos.showMessage('No se pudo determinar el empleado o el periodo.', 'Enviar al Colaborador', 'warning');
      return;
    }

    if (this.formMedioAno) {
      const ok = await this.formMedioAno.someterAlColaborador();
      if (ok) {
        this.datos.showMessage(
          'La evaluación fue grabada y enviada al colaborador para su aceptación.',
          'Enviar al Colaborador',
          'success'
        );
        this.dialogre.close('enviado');
      }
      return;
    }

    this.evaluacionController.GetEvaluacionePorEmpleadoyPeriodo(
      this.empleado.secuencial,
      this.periodo.id
    ).subscribe({
      next: (rep: IEvaluacion) => {
        const ev: IEvaluacion = rep;
        if (ev.estadoevaluacion !== 'EvaluadoPorSupervisor') {
          this.datos.showMessage(
            'Primero pulse "Guardar Avance" para grabar su evaluación; luego podrá enviarla al colaborador.',
            'Enviar al Colaborador',
            'warning'
          );
          return;
        }
        const faltan = this.evaluacionController.competenciasSinCalificarSupervisor(ev);
        if (faltan > 0) {
          this.datos.showMessage(this.evaluacionController.mensajeCompetenciasSinCalificar(faltan), 'Enviar al Colaborador', 'warning');
          return;
        }
        ev.estadoevaluacion = 'Enviado';
        this.evaluacionController.Update(ev).subscribe({
          next: () => {
            this.datos.showMessage(
              'La evaluación fue enviada al colaborador para su aceptación.',
              'Enviar al Colaborador',
              'success'
            );
            this.dialogre.close('enviado');
          },
          error: (err: any) => {
            this.datos.showMessage('Error al enviar la evaluación al colaborador.', 'Enviar al Colaborador', 'error');
          }
        });
      },
      error: (err: any) => {
        this.datos.showMessage('No se encontró la evaluación. Guarde un avance primero.', 'Enviar al Colaborador', 'warning');
      }
    });
  }
}
