import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Pestaña "Competencias por puesto" (Goal) de la pantalla de Configuración de Competencias.
 *
 * ESTE ES UN STUB (T1.3). El contenido lo implementa la tarea T2.1.
 * El contrato de @Input/@Output es fijo: el shell
 * (ConfiguracionCompetenciasComponent) depende de él, así que NO se debe
 * cambiar la firma al implementar la pestaña.
 */
@Component({
  selector: 'app-cc-competencias-puesto',
  templateUrl: './competencias-puesto.component.html',
  styleUrls: ['./competencias-puesto.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class CompetenciasPuestoComponent {
  /** Periodo elegido en el selector del shell. */
  @Input() periodoId!: number;

  /** true cuando el periodo elegido es el periodo activo (para advertencias). */
  @Input() periodoActivo!: boolean;

  /** Se emite tras cada alta, edición o baja para que el shell refresque los contadores. */
  @Output() cambios = new EventEmitter<void>();
}
