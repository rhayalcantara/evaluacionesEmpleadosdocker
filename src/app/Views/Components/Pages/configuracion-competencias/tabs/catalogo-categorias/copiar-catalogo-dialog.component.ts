import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { forkJoin } from 'rxjs';

import { CompetenciaCategoriaPuesto } from 'src/app/Controllers/CompetenciaCategoriaPuesto';
import { Objetivo } from 'src/app/Controllers/Objetivo';
import { IObjetivo, IObjetivoDts } from 'src/app/Models/Objetivo/IObjetivo';
import { IPeriodo } from 'src/app/Models/Periodos/IPeriodo';
import { ICategoriaPuesto } from 'src/app/Models/Puesto/IPuesto';
import { LoggerService } from 'src/app/Services/logger.service';

/** Vínculo competencia ↔ categoría que el plan crearía en el periodo destino. */
export interface IVinculoPlaneado {
  /** Clave nombre|grupo de la competencia; se resuelve al ObjetivoId destino al ejecutar. */
  clave: string;
  nombre: string;
  categoriaPuestoId: number;
  categoria: string;
}

/** Resultado de la previsualización: lo que se crearía y lo que se saltaría. */
export interface IPlanCopiadoCatalogo {
  periodoOrigenId: number;
  periodoOrigenDescripcion: string;
  competenciasOrigen: number;
  competenciasACrear: IObjetivo[];
  competenciasExistentes: string[];
  vinculosOrigen: number;
  vinculosACrear: IVinculoPlaneado[];
  vinculosExistentes: number;
  advertencias: string[];
}

export interface IDatosCopiadoCatalogo {
  periodoDestinoId: number;
  periodoDestinoDescripcion: string;
  periodoDestinoActivo: boolean;
  periodos: IPeriodo[];
  categorias: ICategoriaPuesto[];
  /** Catálogo actual del periodo destino (para detectar lo que ya existe). */
  competenciasDestino: IObjetivoDts[];
  /** Claves `objetivoId|categoriaPuestoId` de los vínculos que ya tiene el destino. */
  vinculosDestino: string[];
}

/**
 * Clave de identidad de una competencia entre periodos: nombre normalizado + grupo.
 *
 * Es exactamente el criterio del INSERT documentado en la §3 de
 * `Docs/proceso-configuracion-competencias-periodo8.md`
 * (`o8.nombre = o7.nombre AND o8.GrupoCompetenciaId = o7.GrupoCompetenciaId`).
 */
export function claveCompetencia(nombre: any, grupoCompetenciaId: any): string {
  return `${(nombre ?? '').toString().trim().toUpperCase()}|${Number(grupoCompetenciaId) || 0}`;
}

/**
 * "Copiar catálogo de otro periodo" — equivalente por interfaz al script SQL del
 * periodo 8: clona las competencias (Objetivo) y sus vínculos con categorías de
 * puesto (CompetenciaCategoriaPuesto) de un periodo a otro.
 *
 * El diálogo SOLO previsualiza: no escribe nada en el API. Al aceptar devuelve el
 * plan y es la pestaña la que ejecuta las altas y vuelve a leer para confirmar.
 */
@Component({
  selector: 'app-cc-copiar-catalogo',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressBarModule,
    MatSelectModule
  ],
  template: `
    <h2 mat-dialog-title>Copiar catálogo de otro periodo</h2>

    <mat-dialog-content class="cp-cuerpo">

      <p class="cp-contexto">
        Destino: <strong>{{ data.periodoDestinoDescripcion }}</strong>
        ({{ data.competenciasDestino.length }} competencia(s) hoy en su catálogo)
      </p>

      <mat-form-field appearance="outline" class="cp-campo">
        <mat-label>Periodo de origen</mat-label>
        <mat-select [(ngModel)]="periodoOrigenId" (selectionChange)="plan = null" name="origen">
          <mat-option *ngFor="let p of periodosOrigen" [value]="p.id">
            {{ p.descripcion }}<span *ngIf="p.activa"> — activo</span>
          </mat-option>
        </mat-select>
      </mat-form-field>

      <button mat-stroked-button color="primary" type="button"
              [disabled]="!periodoOrigenId || cargando" (click)="previsualizar()">
        <mat-icon>visibility</mat-icon>
        Previsualizar
      </button>

      <mat-progress-bar mode="indeterminate" *ngIf="cargando"></mat-progress-bar>

      <p class="cp-error" *ngIf="error">{{ error }}</p>

      <div class="cp-plan" *ngIf="plan">
        <h3>Qué haría el copiado</h3>

        <table class="cp-tabla">
          <tr>
            <td>Competencias en el origen</td>
            <td class="cp-num">{{ plan.competenciasOrigen }}</td>
          </tr>
          <tr class="cp-crea">
            <td>Competencias que se <strong>crearían</strong></td>
            <td class="cp-num">{{ plan.competenciasACrear.length }}</td>
          </tr>
          <tr>
            <td>Competencias que se saltan por existir ya</td>
            <td class="cp-num">{{ plan.competenciasExistentes.length }}</td>
          </tr>
          <tr>
            <td>Vínculos competencia ↔ categoría en el origen</td>
            <td class="cp-num">{{ plan.vinculosOrigen }}</td>
          </tr>
          <tr class="cp-crea">
            <td>Vínculos que se <strong>crearían</strong></td>
            <td class="cp-num">{{ plan.vinculosACrear.length }}</td>
          </tr>
          <tr>
            <td>Vínculos que se saltan por existir ya</td>
            <td class="cp-num">{{ plan.vinculosExistentes }}</td>
          </tr>
        </table>

        <div class="cp-avisos" *ngIf="plan.advertencias.length > 0">
          <p *ngFor="let a of plan.advertencias">
            <mat-icon inline="true">warning</mat-icon> {{ a }}
          </p>
        </div>

        <details *ngIf="plan.competenciasACrear.length > 0">
          <summary>Ver las {{ plan.competenciasACrear.length }} competencias que se crearían</summary>
          <ul>
            <li *ngFor="let c of plan.competenciasACrear">
              {{ c.nombre }} <span class="cp-tenue">({{ vinculosDe(c) }} categoría(s))</span>
            </li>
          </ul>
        </details>

        <details *ngIf="plan.competenciasExistentes.length > 0">
          <summary>Ver las {{ plan.competenciasExistentes.length }} que ya existen</summary>
          <ul><li *ngFor="let n of plan.competenciasExistentes">{{ n }}</li></ul>
        </details>

        <p class="cp-nada"
           *ngIf="plan.competenciasACrear.length === 0 && plan.vinculosACrear.length === 0">
          No hay nada que crear: el destino ya tiene todo lo del origen.
        </p>
      </div>

    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="cancelar()">Cancelar</button>
      <button mat-flat-button color="primary" [disabled]="!puedeEjecutar()" (click)="aceptar()">
        Ejecutar copiado
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .cp-cuerpo { min-width: 560px; }
    .cp-campo { width: 100%; }
    .cp-contexto { margin: 0 0 12px; color: #555; font-size: 13px; }
    .cp-plan { margin-top: 16px; }
    .cp-plan h3 { margin: 0 0 8px; font-size: 15px; }
    .cp-tabla { width: 100%; border-collapse: collapse; font-size: 13px; }
    .cp-tabla td { border-bottom: 1px solid #eee; padding: 5px 6px; }
    .cp-num { text-align: right; font-weight: 600; width: 70px; }
    .cp-crea { background: #e8f5e9; }
    .cp-avisos { margin-top: 12px; background: #fff8e1; border-left: 3px solid #f0ad4e; padding: 8px 10px; }
    .cp-avisos p { margin: 0 0 6px; font-size: 12px; color: #6b4d00; }
    .cp-error { color: #b00020; font-size: 13px; }
    .cp-nada { color: #666; font-style: italic; }
    .cp-tenue { color: #888; }
    details { margin-top: 10px; font-size: 13px; }
    summary { cursor: pointer; }
  `]
})
export class CopiarCatalogoDialogComponent {

  public periodosOrigen: IPeriodo[] = [];
  public periodoOrigenId: number | null = null;
  public plan: IPlanCopiadoCatalogo | null = null;
  public cargando: boolean = false;
  public error: string = '';

  constructor(
    private dialogRef: MatDialogRef<CopiarCatalogoDialogComponent, IPlanCopiadoCatalogo | undefined>,
    @Inject(MAT_DIALOG_DATA) public data: IDatosCopiadoCatalogo,
    private objetivoController: Objetivo,
    private vinculoController: CompetenciaCategoriaPuesto,
    private logger: LoggerService
  ) {
    this.periodosOrigen = (data.periodos ?? []).filter(p => p.id !== data.periodoDestinoId);
  }

  public cancelar(): void {
    this.dialogRef.close(undefined);
  }

  public puedeEjecutar(): boolean {
    return !!this.plan
      && !this.cargando
      && (this.plan.competenciasACrear.length > 0 || this.plan.vinculosACrear.length > 0);
  }

  public aceptar(): void {
    if (this.puedeEjecutar()) {
      this.dialogRef.close(this.plan!);
    }
  }

  /** Cuántos vínculos del plan cuelgan de una competencia que aún no existe. */
  public vinculosDe(competencia: IObjetivo): number {
    if (!this.plan) { return 0; }
    const clave = claveCompetencia(competencia.nombre, competencia.grupoCompetenciaId);
    return this.plan.vinculosACrear.filter(v => v.clave === clave).length;
  }

  /**
   * Arma el plan sin escribir nada.
   *
   * Origen: catálogo completo (`Objetivo.Gets()`) filtrado por periodo, y la matriz
   * de vínculos del periodo origen. Se usa `getMatrizPorPeriodo(origen)` con UN solo
   * argumento a propósito: el helper resuelve él mismo las competencias del periodo,
   * y el segundo parámetro no valida que los ids sean de ese periodo.
   */
  public previsualizar(): void {
    if (!this.periodoOrigenId) { return; }

    const origenId = this.periodoOrigenId;
    this.cargando = true;
    this.error = '';
    this.plan = null;

    forkJoin({
      catalogo: this.objetivoController.Gets(),
      matriz: this.vinculoController.getMatrizPorPeriodo(origenId)
    }).subscribe({
      next: (rep) => {
        this.cargando = false;
        const todas: IObjetivoDts[] = Array.isArray(rep.catalogo?.data) ? rep.catalogo.data : [];
        this.plan = this.armarPlan(origenId, todas, rep.matriz);
        this.logger.info('Catálogo: previsualización de copiado', {
          origen: origenId,
          destino: this.data.periodoDestinoId,
          competenciasACrear: this.plan.competenciasACrear.length,
          vinculosACrear: this.plan.vinculosACrear.length
        });
      },
      error: (err) => {
        this.cargando = false;
        this.error = 'No se pudo leer el periodo de origen: ' +
          (err?.error?.mensaje ?? err?.message ?? 'error desconocido');
        this.logger.error('Catálogo: error previsualizando el copiado', err);
      }
    });
  }

  private armarPlan(origenId: number,
                    catalogoCompleto: IObjetivoDts[],
                    matrizOrigen: Map<number, number[]>): IPlanCopiadoCatalogo {

    const descripcionOrigen = this.periodosOrigen.find(p => p.id === origenId)?.descripcion ?? `Periodo ${origenId}`;
    const origen = catalogoCompleto.filter(c => c.periodoId === origenId);

    // Lo que ya tiene el destino, indexado por nombre + grupo
    const clavesDestino = new Map<string, number>();
    for (const c of this.data.competenciasDestino) {
      clavesDestino.set(claveCompetencia(c.nombre, c.grupoCompetenciaId), c.id);
    }
    const vinculosDestino = new Set<string>(this.data.vinculosDestino ?? []);
    const categoriasConocidas = new Map<number, string>();
    for (const cat of (this.data.categorias ?? [])) {
      categoriasConocidas.set(cat.id, cat.descripcion);
    }

    const competenciasACrear: IObjetivo[] = [];
    const competenciasExistentes: string[] = [];
    const vinculosACrear: IVinculoPlaneado[] = [];
    const advertencias: string[] = [];
    const categoriasHuerfanas = new Set<number>();
    let vinculosOrigen = 0;
    let vinculosExistentes = 0;

    const ordenadas = [...origen].sort((a, b) =>
      (a.grupoCompetenciaId - b.grupoCompetenciaId) || a.nombre.localeCompare(b.nombre)
    );

    for (const comp of ordenadas) {
      const clave = claveCompetencia(comp.nombre, comp.grupoCompetenciaId);
      const idDestino = clavesDestino.get(clave);

      if (idDestino) {
        competenciasExistentes.push(comp.nombre);
      } else if (!competenciasACrear.some(c => claveCompetencia(c.nombre, c.grupoCompetenciaId) === clave)) {
        competenciasACrear.push({
          id: 0,
          grupoCompetenciaId: comp.grupoCompetenciaId,
          nombre: (comp.nombre ?? '').toString().trim(),
          descripcion: comp.descripcion,
          periodoId: this.data.periodoDestinoId,
          estadoId: comp.estadoId,
          fecha: comp.fecha
        } as IObjetivo);
      }

      const categorias = matrizOrigen.get(comp.id) ?? [];
      for (const categoriaId of categorias) {
        vinculosOrigen++;

        if (!categoriasConocidas.has(categoriaId)) {
          categoriasHuerfanas.add(categoriaId);
        }

        // Solo se sabe que el vínculo ya existe cuando la competencia existe en el destino
        if (idDestino && vinculosDestino.has(`${idDestino}|${categoriaId}`)) {
          vinculosExistentes++;
          continue;
        }

        const yaPlaneado = vinculosACrear.some(v => v.clave === clave && v.categoriaPuestoId === categoriaId);
        if (!yaPlaneado) {
          vinculosACrear.push({
            clave,
            nombre: comp.nombre,
            categoriaPuestoId: categoriaId,
            categoria: categoriasConocidas.get(categoriaId) ?? `Categoría ${categoriaId}`
          });
        }
      }
    }

    // ── Advertencias: se muestran siempre, aunque no haya nada que crear ──────────
    if (origen.length === 0) {
      advertencias.push(
        `El periodo de origen "${descripcionOrigen}" no tiene ninguna competencia en el catálogo, ` +
        `así que no hay nada que copiar. Elija otro periodo.`
      );
    }
    if (origen.length > 0 && vinculosOrigen === 0) {
      advertencias.push(
        `El origen tiene competencias pero ningún vínculo con categorías de puesto. Se copiará el ` +
        `catálogo, pero el periodo destino seguirá sin mostrarle competencias a nadie hasta que se ` +
        `marquen las casillas de la matriz.`
      );
    }
    if (this.data.competenciasDestino.length > 0) {
      advertencias.push(
        `El destino ya tiene ${this.data.competenciasDestino.length} competencia(s): esto es una fusión, ` +
        `no un reemplazo. Nada se borra ni se sobrescribe. La igualdad se decide por nombre + grupo ` +
        `(mismo criterio del script SQL del periodo 8), así que si una competencia ya existe con ese ` +
        `nombre se salta y conserva su descripción actual aunque en el origen esté redactada distinto.`
      );
    }
    if (categoriasHuerfanas.size > 0) {
      advertencias.push(
        `El origen tiene vínculos con categorías de puesto que ya no están en el catálogo ` +
        `(ids ${Array.from(categoriasHuerfanas).join(', ')}). Se intentarán crear igual y el API puede rechazarlos.`
      );
    }
    if (this.data.periodoDestinoActivo) {
      advertencias.push(
        `El periodo destino es el ACTIVO: las competencias nuevas quedan visibles de inmediato para ` +
        `las evaluaciones en curso de las categorías que se vinculen.`
      );
    }

    // Advertencia fija: no se puede descartar desde el frontend y hay que verla siempre.
    advertencias.push(
      `Punto ciego conocido: GET /api/Objetivoes hace join con periodo, estado y grupo de competencia, ` +
      `así que una competencia con alguno de esos ids inválido existe en base de datos pero no sale en el ` +
      `listado. Si el destino tuviera filas así, esta previsualización no las ve y el copiado las crearía ` +
      `duplicadas. Solo se puede descartar por SQL.`
    );

    return {
      periodoOrigenId: origenId,
      periodoOrigenDescripcion: descripcionOrigen,
      competenciasOrigen: origen.length,
      competenciasACrear,
      competenciasExistentes,
      vinculosOrigen,
      vinculosACrear,
      vinculosExistentes,
      advertencias
    };
  }
}
