import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CardEmpleadoComponent } from "../../ViewEmpleado/card-empleado/card-empleado.component";
import { IEmpleado } from 'src/app/Models/Empleado/IEmpleado';
import { Empleados } from 'src/app/Controllers/Empleados';
import { Usuario } from 'src/app/Helpers/Interfaces';
import { IPeriodo } from 'src/app/Models/Periodos/IPeriodo';
import { Evaluacion } from 'src/app/Controllers/Evaluacion';
import { IEvaluacion } from 'src/app/Models/Evaluacion/IEvaluacion';
import { ModelResponse } from 'src/app/Models/Usuario/modelResponse';
import { DatosServiceService } from 'src/app/Services/datos-service.service';
import { FormEvaluacionSupervisorComponent } from '../../Forms/form-evaluacion-supervisor/form-evaluacion-supervisor.component';

export interface IEstadoSubordinado {
  estadoAutoevaluacion: string;
  totalCalculo: number | null;
  puedeEvaluar: boolean;
  puedeEnviar: boolean;
}

@Component({
  selector: 'app-evaluar-subordinados',
  templateUrl: './evaluar-subordinados.component.html',
  styleUrls: ['./evaluar-subordinados.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule,
    CardEmpleadoComponent]
})
export class EvaluarSubordinadosComponent implements OnInit {
  onDepartamentoChange() {
    throw new Error('Method not implemented.');
  }

  periodo: IPeriodo = {
    id: 1,
    descripcion: 'Evaluacion de Medio Año 2024',
    fechaInicio: new Date('2024-01-01'),
    fechaFin: new Date('2024-06-30'),
    activa: true,
    estadoid: 0
  }
  public searchTerm: string = '';

  public empleado: IEmpleado = {
    secuencial: 0,
    codigousuario: '',
    nombreunido: '',
    identificacion: '',
    sdept: 0,
    departamento: '',
    codigoestado: '',
    scargo: 0,
    cargo: '',
    esjefatura: 0,
    tienejefe: 0,
    nivel: 0,
    fechapostulacion: '',
    jefeinmediatO_SECUENCIAL: 0,
    jefeinmediato: '',
    oficina: ''
  }
  public subordinado: IEmpleado = {
    secuencial: 0,
    codigousuario: '',
    nombreunido: '',
    identificacion: '',
    sdept: 0,
    departamento: '',
    codigoestado: '',
    scargo: 0,
    cargo: '',
    esjefatura: 0,
    tienejefe: 0,
    nivel: 0,
    fechapostulacion: '',
    jefeinmediatO_SECUENCIAL: 0,
    jefeinmediato: '',
    oficina: ''
  }

  /** Map of empleado.secuencial → evaluation state/score */
  public estadosSubordinados: Map<number, IEstadoSubordinado> = new Map();

  constructor(
    public empl: Empleados,
    private evaluacion: Evaluacion,
    private datos: DatosServiceService,
    private dialog: MatDialog
  ) {
    this.usuario = JSON.parse(localStorage.getItem('usuario') ?? "")
  }
  public usuario: Usuario

  ngOnInit(): void {
    // busca el periodo en localstore
    const storedPeriodo = localStorage.getItem("periodo");
    if (storedPeriodo) {
      this.periodo = JSON.parse(storedPeriodo);
    }

    this.empl.GetByUsuario(this.usuario.codigo).subscribe((rep: IEmpleado) => {
      this.empl.model = rep;
      this.empl.getsubordinados(this.periodo);
      this.empleado = rep;
      // After subordinates load, fetch their evaluation states
      this.cargarEstadosSubordinados();
    });
  }

  /** Waits briefly for arraymodelsubordinados to populate then fetches states */
  private cargarEstadosSubordinados(): void {
    // Use a short polling approach since getsubordinados is async internally
    const poll = setInterval(() => {
      if (this.empl.arraymodelsubordinados && this.empl.arraymodelsubordinados.length > 0) {
        clearInterval(poll);
        this.empl.arraymodelsubordinados.forEach(emp => {
          this.cargarEstadoEmpleado(emp);
        });
      }
    }, 300);

    // Safety: stop polling after 10 seconds
    setTimeout(() => clearInterval(poll), 10000);
  }

  public cargarEstadoEmpleado(emp: IEmpleado): void {
    if (!this.periodo || !this.periodo.id || !emp.secuencial) return;

    this.evaluacion.GetEvaluacionEstadoDts(this.periodo.id, emp.secuencial).subscribe({
      next: (rep: ModelResponse) => {
        if (rep && rep.data && Array.isArray(rep.data) && rep.data.length > 0 && rep.data[0]) {
          const estado: string = rep.data[0].estadoEvaluacion || 'Pendiente';
          const total: number | null = rep.data[0].totalCalculo ?? null;
          const puedeEvaluar = !(estado === 'Pendiente' || estado === 'Completado' || estado === 'Enviado');
          const puedeEnviar = estado === 'EvaluadoPorSupervisor';
          this.estadosSubordinados.set(emp.secuencial, { estadoAutoevaluacion: estado, totalCalculo: total, puedeEvaluar, puedeEnviar });
        } else {
          this.estadosSubordinados.set(emp.secuencial, { estadoAutoevaluacion: 'Pendiente', totalCalculo: null, puedeEvaluar: true, puedeEnviar: false });
        }
      },
      error: () => {
        this.estadosSubordinados.set(emp.secuencial, { estadoAutoevaluacion: 'Pendiente', totalCalculo: null, puedeEvaluar: true, puedeEnviar: false });
      }
    });
  }

  public getEstado(secuencial: number): IEstadoSubordinado {
    return this.estadosSubordinados.get(secuencial) ?? { estadoAutoevaluacion: '...', totalCalculo: null, puedeEvaluar: false, puedeEnviar: false };
  }

  public openEvaluationForm(emp: IEmpleado): void {
    const dialogRef = this.dialog.open(FormEvaluacionSupervisorComponent, {
      width: '100%',
      height: '90%',
      disableClose: true,
      data: { empleado: emp, periodo: this.periodo, titutlo: 'Evaluacion Equipo' }
    });
    dialogRef.afterClosed().subscribe(() => {
      // Refresh state for this employee
      this.cargarEstadoEmpleado(emp);
    });
  }

  public enviarEvaluacion(emp: IEmpleado): void {
    this.evaluacion.GetEvaluacionePorEmpleadoyPeriodo(emp.secuencial, this.periodo.id).subscribe({
      next: (rep: IEvaluacion) => {
        const t: IEvaluacion = rep;
        t.estadoevaluacion = 'Enviado';
        this.evaluacion.Update(t).subscribe({
          next: () => {
            this.datos.showMessage('Enviado', 'Envio de Evaluacion', 'success');
            this.estadosSubordinados.set(emp.secuencial, {
              estadoAutoevaluacion: 'Enviado',
              totalCalculo: this.estadosSubordinados.get(emp.secuencial)?.totalCalculo ?? null,
              puedeEvaluar: false,
              puedeEnviar: false
            });
          }
        });
      }
    });
  }

  searchSubordinados(): void {
    if (!this.searchTerm.trim()) {
      this.empl.getsubordinados(this.periodo);
      setTimeout(() => {
        this.empl.arraymodelsubordinados.forEach(emp => this.cargarEstadoEmpleado(emp));
      }, 500);
    } else {
      this.empl.arraymodelsubordinados = this.empl.arraymodelsubordinados.filter(subordinado =>
        subordinado.nombreunido.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        subordinado.departamento.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        subordinado.cargo.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
  }
}
