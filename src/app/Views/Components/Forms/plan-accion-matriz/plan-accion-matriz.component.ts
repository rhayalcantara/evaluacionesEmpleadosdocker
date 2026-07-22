import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { IAccionPlan } from 'src/app/Models/Evaluacion/IAccionPlan';

export interface PlanAccionDialogData {
  filas: IAccionPlan[];
  sololectura: boolean;
}

@Component({
  selector: 'app-plan-accion-matriz',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule],
  templateUrl: './plan-accion-matriz.component.html',
  styleUrls: ['./plan-accion-matriz.component.css']
})
export class PlanAccionMatrizComponent {
  public readonly TOTAL_FILAS = 5;
  public filas: IAccionPlan[] = [];
  public sololectura = false;

  constructor(
    private dialogRef: MatDialogRef<PlanAccionMatrizComponent>,
    @Inject(MAT_DIALOG_DATA) data: PlanAccionDialogData | null
  ) {
    this.sololectura = data?.sololectura ?? false;
    const existentes = data?.filas ?? [];
    for (let i = 1; i <= this.TOTAL_FILAS; i++) {
      const previa = existentes.find(f => f.numero === i);
      // Copia defensiva: si el usuario cancela, las filas originales quedan intactas
      this.filas.push(previa ? { ...previa } : {
        numero: i,
        accion: '',
        objetivoCompetenciaTexto: '',
        responsableTexto: '',
        soporteTexto: '',
        recursos: '',
        fechaCierre: null
      });
    }
  }

  public grabar(): void {
    const conContenido = this.filas.filter(f =>
      (f.accion && f.accion.trim()) ||
      (f.objetivoCompetenciaTexto && f.objetivoCompetenciaTexto.trim()) ||
      (f.responsableTexto && f.responsableTexto.trim()) ||
      (f.soporteTexto && f.soporteTexto.trim()) ||
      (f.recursos && f.recursos.trim()) ||
      f.fechaCierre
    );
    this.dialogRef.close(conContenido);
  }

  public cancelar(): void {
    this.dialogRef.close();
  }
}
