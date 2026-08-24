import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Pestaña "Catálogo y categorías" (Objetivo + CompetenciaCategoriaPuesto)
 * de la pantalla de Configuración de Competencias.
 *
 * ESTE ES UN STUB (T1.3). El contenido lo implementa la tarea T2.2.
 * El contrato de @Input/@Output es fijo: el shell
 * (ConfiguracionCompetenciasComponent) depende de él, así que NO se debe
 * cambiar la firma al implementar la pestaña.
 */
@Component({
  selector: 'app-cc-catalogo-categorias',
  templateUrl: './catalogo-categorias.component.html',
  styleUrls: ['./catalogo-categorias.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class CatalogoCategoriasComponent {
  /** Periodo elegido en el selector del shell. */
  @Input() periodoId!: number;

  /** true cuando el periodo elegido es el periodo activo (para advertencias). */
  @Input() periodoActivo!: boolean;

  /** Se emite tras cada alta, edición o baja para que el shell refresque los contadores. */
  @Output() cambios = new EventEmitter<void>();
}
