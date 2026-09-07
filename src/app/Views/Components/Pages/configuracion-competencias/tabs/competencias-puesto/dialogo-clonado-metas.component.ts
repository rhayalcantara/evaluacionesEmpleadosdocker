import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';

import { Metas } from 'src/app/Controllers/Metas';
import { IPrevisualizacionClonadoMetas, IResultadoLoteMetas } from 'src/app/Models/Meta/IMeta';
import { IPeriodo } from 'src/app/Models/Periodos/IPeriodo';
import { IPuesto } from 'src/app/Models/Puesto/IPuesto';
import { LoggerService } from 'src/app/Services/logger.service';

/** Datos que el componente de la pestaña entrega al diálogo. */
export interface IDatosDialogoClonado {
  periodoDestinoId: number;
  periodoDestinoNombre: string;
  periodoDestinoActivo: boolean;
  /** Puesto preseleccionado como destino (el elegido en la pestaña), o null. */
  puestoDestinoSecuencial: number | null;
  /** Catálogos ya cargados por la pestaña, para no volver a pedirlos al API. */
  periodos: IPeriodo[];
  puestos: IPuesto[];
}

/** Lo que el diálogo devuelve al cerrarse tras ejecutar un clonado. */
export interface IResultadoDialogoClonado {
  ejecutado: boolean;
  resultado: IResultadoLoteMetas;
}

/**
 * Diálogo de clonado de competencias por puesto (Goal).
 *
 * Flujo obligatorio, en dos pasos y sin atajos:
 *   1. El usuario elige origen (periodo + puesto opcional) y destino (puesto opcional;
 *      el periodo destino es siempre el que está abierto en la pantalla).
 *   2. "Previsualizar" llama a `Metas.previsualizarClonado`, que NO escribe nada.
 *   3. Solo cuando hay una previsualización en pantalla —y el usuario ha marcado que
 *      leyó las advertencias, si las hay— se habilita "Ejecutar clonado".
 *
 * Cualquier cambio en los selectores invalida la previsualización: nunca se ejecuta
 * un clonado con un cálculo que ya no corresponde a lo que se ve.
 */
@Component({
  selector: 'app-cc-dialogo-clonado-metas',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatCheckboxModule,
    MatFormFieldModule, MatIconModule, MatProgressBarModule, MatSelectModule
  ],
  styles: [`
    .dc { display:block; min-width:520px; max-width:720px; }
    .dc-fila { display:flex; gap:12px; flex-wrap:wrap; }
    .dc-campo { flex:1 1 220px; }
    .dc-caja { border-radius:4px; padding:10px 12px; margin:10px 0; font-size:13px; }
    .dc-aviso { background:#fff8e1; border-left:4px solid #f9a825; }
    .dc-peligro { background:#ffebee; border-left:4px solid #c62828; }
    .dc-info { background:#e8f0fe; border-left:4px solid #1a73e8; }
    .dc-caja ul { margin:6px 0 0 0; padding-left:18px; }
    .dc-caja li { margin-bottom:6px; }
    .dc-cifras { display:flex; gap:24px; margin:10px 0; }
    .dc-cifra { text-align:center; }
    .dc-cifra b { display:block; font-size:22px; line-height:1.1; }
    .dc-cifra span { font-size:12px; color:#5f6368; }
    .dc-lista { max-height:170px; overflow:auto; border:1px solid #e0e0e0; border-radius:4px; font-size:12px; }
    .dc-lista div { padding:4px 8px; border-bottom:1px solid #f1f1f1; }
    .dc-titulo-bloque { font-weight:600; font-size:13px; margin-top:14px; }
  `],
  template: `
    <h2 mat-dialog-title>Clonar competencias</h2>

    <mat-dialog-content class="dc">

      <p class="dc-caja dc-info">
        Destino: <b>{{ data.periodoDestinoNombre }}</b>
        <span *ngIf="destinoPuesto"> — puesto {{ nombrePuesto(destinoPuesto) }}</span>
        <span *ngIf="!destinoPuesto"> — todos los puestos del origen (se conserva el puesto de cada fila)</span>
      </p>

      <div class="dc-fila">
        <mat-form-field appearance="outline" class="dc-campo">
          <mat-label>Periodo de origen</mat-label>
          <mat-select [(ngModel)]="origenPeriodo" (selectionChange)="invalidarPrevisualizacion()">
            <mat-option *ngFor="let p of data.periodos" [value]="p.id">{{ p.descripcion }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="dc-campo">
          <mat-label>Puesto de origen</mat-label>
          <mat-select [(ngModel)]="origenPuesto" (selectionChange)="invalidarPrevisualizacion()">
            <mat-option [value]="null">Todos los puestos del periodo</mat-option>
            <mat-option *ngFor="let p of data.puestos" [value]="p.secuencial">
              {{ p.descripcion }} ({{ p.secuencial }})
            </mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="dc-campo">
          <mat-label>Puesto de destino</mat-label>
          <mat-select [(ngModel)]="destinoPuesto" (selectionChange)="invalidarPrevisualizacion()">
            <mat-option [value]="null">Conservar el puesto de cada fila</mat-option>
            <mat-option *ngFor="let p of data.puestos" [value]="p.secuencial">
              {{ p.descripcion }} ({{ p.secuencial }})
            </mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <!-- Aviso fijo del clonado de periodo completo (nota 4 de la Fase 1) -->
      <div class="dc-caja dc-aviso" *ngIf="clonadoDePeriodoCompleto">
        <b>Clonado de periodo completo.</b>
        No ha declarado ni puesto de origen ni puesto de destino, así que se copiará
        <b>únicamente lo que el API lista</b> en <code>GET /api/Goals</code>. Ese listado
        no incluye las metas de los puestos cuyo departamento está en 0, de modo que puede
        copiarse de menos sin que nada lo indique. Si necesita un puesto concreto, decláre&#8203;lo arriba.
      </div>

      <!-- Aviso informativo: el clonado conserva el objetivoid del origen -->
      <div class="dc-caja dc-aviso" *ngIf="origenPeriodo && origenPeriodo !== data.periodoDestinoId">
        Está clonando <b>entre periodos distintos</b>. Las filas conservan el
        <code>objetivoid</code> del periodo de origen: las competencias del destino
        seguirán apuntando al catálogo del periodo {{ origenPeriodo }}.
      </div>

      <div class="dc-caja dc-peligro" *ngIf="data.periodoDestinoActivo">
        El periodo de destino es el <b>activo</b>: las filas que cree pueden entrar en
        evaluaciones que ya estén en curso.
      </div>

      <mat-progress-bar mode="indeterminate" *ngIf="previsualizando || ejecutando"></mat-progress-bar>
      <p *ngIf="previsualizando" class="dc-caja dc-info">
        Calculando… la previsualización <b>solo lee</b>: no se escribe nada hasta que pulse
        “Ejecutar clonado”. Puede tardar, porque el API tiene que revisar las metas ya existentes
        para saber cuáles se saltarían por duplicado; espere a que termine antes de cerrar.
      </p>

      <div class="dc-caja dc-peligro" *ngIf="errorMensaje">
        <b>Error del API:</b> {{ errorMensaje }}
      </div>

      <!-- Resultado de la previsualización -->
      <ng-container *ngIf="previsualizacion">

        <div class="dc-cifras">
          <div class="dc-cifra"><b>{{ previsualizacion.aCrear.length }}</b><span>se crearían</span></div>
          <div class="dc-cifra"><b>{{ previsualizacion.duplicadas.length }}</b><span>se saltan (ya existen)</span></div>
          <div class="dc-cifra"><b>{{ previsualizacion.advertencias.length }}</b><span>advertencias</span></div>
        </div>

        <!-- Las advertencias se muestran SIEMPRE, aunque no haya nada que crear -->
        <div class="dc-caja dc-peligro" *ngIf="previsualizacion.advertencias.length > 0">
          <b>Advertencias de la previsualización</b>
          <ul>
            <li *ngFor="let a of previsualizacion.advertencias">{{ a }}</li>
          </ul>
        </div>

        <p class="dc-caja dc-aviso" *ngIf="previsualizacion.aCrear.length === 0">
          No hay nada que crear con esta combinación de origen y destino: o el origen no
          tiene filas visibles para el API, o todas existen ya en el destino.
        </p>

        <ng-container *ngIf="previsualizacion.aCrear.length > 0">
          <div class="dc-titulo-bloque">Filas que se crearían (primeras {{ muestra.length }})</div>
          <div class="dc-lista">
            <div *ngFor="let m of muestra">
              Puesto {{ m.positionSecuencial }} · competencia {{ m.objetivoid }} · peso {{ m.weight }} —
              {{ m.name.length > 90 ? (m.name | slice:0:90) + '…' : m.name }}
            </div>
          </div>
        </ng-container>

        <mat-checkbox *ngIf="requiereConfirmarAvisos" [(ngModel)]="avisosLeidos" color="warn">
          He leído las advertencias y quiero continuar de todos modos.
        </mat-checkbox>

      </ng-container>

    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="cerrar()" [disabled]="ejecutando">Cerrar</button>
      <button mat-stroked-button color="primary" (click)="previsualizar()"
              [disabled]="previsualizando || ejecutando || !origenPeriodo">
        <mat-icon>visibility</mat-icon> Previsualizar
      </button>
      <button mat-raised-button color="warn" (click)="ejecutar()" [disabled]="!puedeEjecutar">
        <mat-icon>content_copy</mat-icon> Ejecutar clonado
      </button>
    </mat-dialog-actions>
  `
})
export class DialogoClonadoMetasComponent {

  public origenPeriodo: number | null = null;
  public origenPuesto: number | null = null;
  public destinoPuesto: number | null = null;

  public previsualizacion: IPrevisualizacionClonadoMetas | null = null;
  public previsualizando: boolean = false;
  public ejecutando: boolean = false;
  public avisosLeidos: boolean = false;
  public errorMensaje: string = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: IDatosDialogoClonado,
    private dialogRef: MatDialogRef<DialogoClonadoMetasComponent>,
    private metasController: Metas,
    private logger: LoggerService
  ) {
    this.destinoPuesto = data.puestoDestinoSecuencial;
    // Origen por defecto: el periodo inmediatamente anterior al destino, que es el
    // caso real (configurar el periodo nuevo a partir del anterior).
    const anteriores = (data.periodos ?? [])
      .filter(p => p.id < data.periodoDestinoId)
      .sort((a, b) => b.id - a.id);
    this.origenPeriodo = anteriores.length > 0 ? anteriores[0].id : null;
  }

  /** Primeras filas de la previsualización, solo para que el usuario vea qué se copia. */
  public get muestra() {
    return (this.previsualizacion?.aCrear ?? []).slice(0, 25);
  }

  /** true si ni el origen ni el destino declaran puesto (clonado de periodo completo). */
  public get clonadoDePeriodoCompleto(): boolean {
    return this.origenPuesto == null && this.destinoPuesto == null;
  }

  /** Hay algo que el usuario deba confirmar explícitamente antes de escribir. */
  public get requiereConfirmarAvisos(): boolean {
    if (!this.previsualizacion) { return false; }
    return this.previsualizacion.advertencias.length > 0 || this.clonadoDePeriodoCompleto;
  }

  /**
   * El botón de ejecutar solo se habilita cuando hay una previsualización vigente,
   * con filas que crear, y el usuario ha aceptado los avisos si los hay.
   */
  public get puedeEjecutar(): boolean {
    if (!this.previsualizacion || this.previsualizando || this.ejecutando) { return false; }
    if (this.previsualizacion.aCrear.length === 0) { return false; }
    if (this.requiereConfirmarAvisos && !this.avisosLeidos) { return false; }
    return true;
  }

  public nombrePuesto(secuencial: number | null): string {
    if (secuencial == null) { return ''; }
    const p = (this.data.puestos ?? []).find(x => x.secuencial === secuencial);
    return p ? `${p.descripcion} (${secuencial})` : `${secuencial}`;
  }

  /**
   * Cualquier cambio en los selectores tira la previsualización: lo que se ve en
   * pantalla dejaría de corresponder con lo que se ejecutaría.
   */
  public invalidarPrevisualizacion(): void {
    this.previsualizacion = null;
    this.avisosLeidos = false;
    this.errorMensaje = '';
  }

  /** Paso 1: calcula qué se crearía y qué se saltaría. No escribe nada. */
  public previsualizar(): void {
    if (this.previsualizando || this.ejecutando) { return; }
    if (!this.origenPeriodo) { return; }

    if (this.origenPeriodo === this.data.periodoDestinoId &&
        (this.origenPuesto ?? null) === (this.destinoPuesto ?? null)) {
      this.errorMensaje = 'El origen y el destino son el mismo periodo y el mismo puesto: no hay nada que clonar.';
      return;
    }

    this.invalidarPrevisualizacion();
    this.previsualizando = true;

    this.metasController.previsualizarClonado(
      { periodoId: this.origenPeriodo, puestoSecuencial: this.origenPuesto ?? undefined },
      { periodoId: this.data.periodoDestinoId, puestoSecuencial: this.destinoPuesto ?? undefined }
    ).subscribe({
      next: (rep: IPrevisualizacionClonadoMetas) => {
        this.previsualizando = false;
        this.previsualizacion = rep;
      },
      error: (err: any) => {
        this.previsualizando = false;
        this.errorMensaje = this.mensajeError(err);
        this.logger.error('Clonado de metas: falló la previsualización', err instanceof Error ? err : undefined);
      }
    });
  }

  /**
   * Paso 2: inserta las filas ya aprobadas.
   * `ejecutarClonado` delega en `insertarLote`, que es un `defer`: cada suscripción
   * reejecuta el lote entero. Por eso hay UNA sola suscripción y el botón queda
   * bloqueado por `ejecutando` mientras dura.
   */
  public ejecutar(): void {
    if (!this.puedeEjecutar) { return; }

    const filas = this.previsualizacion!.aCrear;
    this.ejecutando = true;
    this.errorMensaje = '';
    this.logger.info('Clonado de metas: ejecutando', { filas: filas.length });

    this.metasController.ejecutarClonado(filas).subscribe({
      next: (resultado: IResultadoLoteMetas) => {
        this.ejecutando = false;
        this.dialogRef.close({ ejecutado: true, resultado } as IResultadoDialogoClonado);
      },
      error: (err: any) => {
        this.ejecutando = false;
        this.errorMensaje = this.mensajeError(err);
        this.logger.error('Clonado de metas: falló la ejecución', err instanceof Error ? err : undefined);
      }
    });
  }

  public cerrar(): void {
    if (this.ejecutando) { return; }
    this.dialogRef.close(null);
  }

  /** Mensaje real del API; solo se cae a un texto genérico si no viene nada. */
  private mensajeError(err: any): string {
    return err?.error?.mensaje
        ?? err?.error?.title
        ?? (typeof err?.error === 'string' ? err.error : null)
        ?? err?.message
        ?? 'El API no devolvió ningún detalle del error.';
  }
}
