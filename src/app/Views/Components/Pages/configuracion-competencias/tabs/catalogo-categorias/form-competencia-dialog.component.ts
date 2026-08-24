import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { IEstado } from 'src/app/Models/Estado/IEstado';
import { IGrupoCompetencia, IObjetivo } from 'src/app/Models/Objetivo/IObjetivo';

/** Datos que el componente de la pestaña le entrega al diálogo. */
export interface IDatosFormCompetencia {
  /** Competencia a editar; null para un alta. */
  competencia: IObjetivo | null;
  periodoId: number;
  periodoDescripcion: string;
  periodoActivo: boolean;
  grupos: IGrupoCompetencia[];
  estados: IEstado[];
}

/**
 * Alta / edición de una competencia del catálogo (tabla Objetivo).
 *
 * El diálogo NO escribe en el API: valida y devuelve el payload plano listo para
 * `Objetivo.insert()` o `Objetivo.Update()`. Quien guarda —y quien vuelve a leer
 * del API para confirmar que la escritura se procesó de verdad— es la pestaña,
 * que es la dueña del estado de la pantalla.
 *
 * La descripción de una competencia en este sistema son dos o más párrafos
 * largos (los literales "a) Yo escucho..." / "b) Yo realizo..."), por eso el
 * campo es un textarea alto y no un input de una línea.
 */
@Component({
  selector: 'app-cc-form-competencia',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule
  ],
  template: `
    <h2 mat-dialog-title>{{ esEdicion ? 'Editar competencia' : 'Nueva competencia' }}</h2>

    <mat-dialog-content class="fc-cuerpo">

      <p class="fc-contexto">
        Periodo: <strong>{{ data.periodoDescripcion }}</strong>
        <span *ngIf="data.periodoActivo" class="fc-aviso">
          <mat-icon inline="true">warning</mat-icon>
          Es el periodo activo: el cambio puede afectar evaluaciones en curso.
        </span>
      </p>

      <mat-form-field appearance="outline" class="fc-campo">
        <mat-label>Grupo de competencia</mat-label>
        <mat-select [(ngModel)]="grupoCompetenciaId" name="grupo">
          <mat-option *ngFor="let g of data.grupos" [value]="g.id">{{ g.nombre }}</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="fc-campo">
        <mat-label>Nombre de la competencia</mat-label>
        <input matInput [(ngModel)]="nombre" name="nombre" maxlength="200" />
        <mat-hint>{{ nombre.length }}/200</mat-hint>
      </mat-form-field>

      <mat-form-field appearance="outline" class="fc-campo">
        <mat-label>Descripción (uno o varios párrafos)</mat-label>
        <textarea matInput [(ngModel)]="descripcion" name="descripcion" rows="12"
                  class="fc-textarea"></textarea>
        <mat-hint>Se muestra tal cual al empleado. Los saltos de línea separan los párrafos.</mat-hint>
      </mat-form-field>

      <div class="fc-fila">
        <mat-form-field appearance="outline" class="fc-medio">
          <mat-label>Estado</mat-label>
          <mat-select [(ngModel)]="estadoId" name="estado">
            <mat-option *ngFor="let e of data.estados" [value]="e.id">{{ e.descripcion }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="fc-medio">
          <mat-label>Fecha</mat-label>
          <input matInput type="date" [(ngModel)]="fecha" name="fecha" />
        </mat-form-field>
      </div>

      <p class="fc-error" *ngIf="error">{{ error }}</p>

    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="cancelar()">Cancelar</button>
      <button mat-flat-button color="primary" [disabled]="!esValido()" (click)="aceptar()">
        {{ esEdicion ? 'Guardar cambios' : 'Crear competencia' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .fc-cuerpo { display: flex; flex-direction: column; min-width: 520px; }
    .fc-campo, .fc-medio { width: 100%; }
    .fc-fila { display: flex; gap: 12px; }
    .fc-textarea { min-height: 220px; line-height: 1.45; }
    .fc-contexto { margin: 0 0 12px; color: #555; font-size: 13px; }
    .fc-aviso { display: block; margin-top: 4px; color: #b26a00; }
    .fc-error { color: #b00020; font-size: 13px; margin: 0; }
  `]
})
export class FormCompetenciaDialogComponent {

  public esEdicion: boolean = false;
  public grupoCompetenciaId: number = 0;
  public nombre: string = '';
  public descripcion: string = '';
  public estadoId: number = 6;
  public fecha: string = '';
  public error: string = '';

  constructor(
    private dialogRef: MatDialogRef<FormCompetenciaDialogComponent, IObjetivo | undefined>,
    @Inject(MAT_DIALOG_DATA) public data: IDatosFormCompetencia
  ) {
    const c = data.competencia;
    this.esEdicion = !!c && c.id > 0;
    this.grupoCompetenciaId = c?.grupoCompetenciaId ?? (data.grupos[0]?.id ?? 0);
    this.nombre = c?.nombre ?? '';
    this.descripcion = c?.descripcion ?? '';
    this.estadoId = c?.estadoId ?? 6;
    this.fecha = this.aFechaDeInput(c?.fecha);
  }

  /** El API devuelve "2025-02-01T00:00:00"; el input type="date" pide "2025-02-01". */
  private aFechaDeInput(valor: string | undefined): string {
    const texto = (valor ?? '').toString();
    if (texto.length >= 10) { return texto.substring(0, 10); }
    return new Date().toISOString().substring(0, 10);
  }

  public esValido(): boolean {
    return this.grupoCompetenciaId > 0
      && this.nombre.trim().length > 0
      && this.descripcion.trim().length > 0
      && this.fecha.length === 10;
  }

  public cancelar(): void {
    this.dialogRef.close(undefined);
  }

  public aceptar(): void {
    if (!this.esValido()) {
      this.error = 'Complete el grupo, el nombre, la descripción y la fecha.';
      return;
    }

    // Payload plano: el API no necesita el objeto anidado `grupoCompetencia`, igual
    // que en Objetivo.copiarDePeriodo. El cast evita repetir la rama del modelo.
    const payload = {
      id: this.data.competencia?.id ?? 0,
      grupoCompetenciaId: this.grupoCompetenciaId,
      nombre: this.nombre.trim(),
      descripcion: this.descripcion,
      periodoId: this.data.periodoId,
      estadoId: this.estadoId,
      fecha: this.fecha
    } as IObjetivo;

    this.dialogRef.close(payload);
  }
}
