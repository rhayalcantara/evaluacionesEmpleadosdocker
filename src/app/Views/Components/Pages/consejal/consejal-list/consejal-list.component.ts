import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConsejalController } from '../../../../../Controllers/ConsejalController';
import { IConsejal } from '../../../../../Models/Consejal/Iconsejal';
import { ComunicacionService } from '../../../../../Services/comunicacion.service';
import { DatosServiceService } from '../../../../../Services/datos-service.service';
import { ModelResponse } from '../../../../../Models/Usuario/modelResponse';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-consejal-list',
  templateUrl: './consejal-list.component.html',
  styleUrls: ['./consejal-list.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [ConsejalController, ComunicacionService, DatosServiceService]
})
export class ConsejalListComponent implements OnInit {

  consejales: IConsejal[] = [];
  loading: boolean = true;
  error: string | null = null;

  constructor(
    private consejalController: ConsejalController,
    private router: Router,
    private comunicacionService: ComunicacionService, // Para títulos, etc.
    private datosService: DatosServiceService // Para manejar datos globales si es necesario
  ) { }

  ngOnInit(): void {
    // Usar enviarMensaje en lugar de setTitulo
    this.comunicacionService.enviarMensaje({ titulo: "Listado de Concejales" });
    this.loadConsejales();
  }

  loadConsejales(): void {
    this.loading = true;
    this.error = null;
    // Asegurarnos de que consejales siempre sea un array, incluso antes de la respuesta
    this.consejales = [];
    
    // Usar Gets() que devuelve ModelResponse
    this.consejalController.Gets().subscribe(
      (response: ModelResponse) => {
        // Verificar que response y response.data existen
        if (response && response.data) {
          // Extraer datos del ModelResponse y asegurarnos de que sea un array
          this.consejales = Array.isArray(response.data) ? response.data as IConsejal[] : [];
          // Podrías querer usar response.count para paginación si es necesario
        } else {
          // Si no hay datos, asegurarnos de que consejales sea un array vacío
          this.consejales = [];
        }
        this.loading = false;
      },
      (error: HttpErrorResponse) => { // Tipar el error
        console.error('Error fetching consejales:', error);
        this.error = error.message || 'Error desconocido al cargar los consejales';
        this.loading = false;
        // Asegurarnos de que consejales sea un array vacío en caso de error
        this.consejales = [];
        // Manejar error (mostrar mensaje al usuario, e.g., usando datosService.showMessage)
        this.datosService.showMessage(`Error al cargar consejales: ${error.message}`, 'Error', 'error');
      }
    );
  }

  editConsejal(id: number | undefined): void {
    if (id !== undefined) {
      this.router.navigate(['/consejal/edit', id]);
    }
  }

  deleteConsejal(id: number | undefined): void {
    if (id !== undefined && confirm('¿Está seguro de que desea eliminar este consejal?')) {
      this.consejalController.delete(id).subscribe(
        () => {
          // Éxito al eliminar
          this.loadConsejales(); // Recargar la lista
          // Mostrar mensaje de éxito
        },
        (error) => {
          console.error('Error deleting consejal:', error);
          // Manejar error (mostrar mensaje al usuario)
        }
      );
    }
  }

  createConsejal(): void {
    this.router.navigate(['/consejal/new']);
  }
}
