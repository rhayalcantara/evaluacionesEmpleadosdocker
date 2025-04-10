import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatDialogModule } from '@angular/material/dialog';

// Nota: Ya no necesitamos importar los componentes aquí, ya que son standalone
// y se cargan directamente en las rutas de app-routing.module.ts

// Este módulo ya no es necesario, pero lo mantenemos como referencia
// Las rutas ahora están definidas en app-routing.module.ts

@NgModule({
  declarations: [
    // Los componentes standalone no pueden ser declarados en un NgModule
  ],
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    RouterModule.forChild([]) // Rutas vacías ya que las rutas reales están en app-routing.module.ts
  ],
  exports: [
    // Los componentes standalone no pueden ser exportados desde un NgModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA] // Añadir esquema para suprimir errores de elementos desconocidos
})
export class ConsejalModule { }
