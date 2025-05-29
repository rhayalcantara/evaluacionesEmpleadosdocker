import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatPaginatorModule } from '@angular/material/paginator';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DashboardComponent } from './Views/Components/Pages/dashboard/dashboard.component';
import { NavmenuComponent } from './Views/Components/navmenu/navmenu.component';
import { FileUploadComponent } from './archivoextras/file-upload-component';
import { FileUploadPageComponent } from './Views/Components/Pages/file-upload-page/file-upload-page.component';
import { ResultadoEvaluacionComponent } from './Views/Components/Pages/resultado-evaluacion/resultado-evaluacion.component';
import { ReporteCursosComponent } from './Views/Components/reporte-cursos/reporte-cursos.component';
import { TareaListComponent } from './Views/Components/tareas/tarea-list/tarea-list.component';
import { TareaFormComponent } from './Views/Components/tareas/tarea-form/tarea-form.component';
import { TareaDetailComponent } from './Views/Components/tareas/tarea-detail/tarea-detail.component';

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    NavmenuComponent,
    FileUploadComponent,
    FileUploadPageComponent,
    TareaListComponent,
    TareaFormComponent,
    TareaDetailComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatPaginatorModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
