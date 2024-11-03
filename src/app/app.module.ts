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
import { FromObjetivoExtrategicoComponent } from './Views/Components/Forms/from-objetivo-extrategico/from-objetivo-extrategico.component';
import { KrisComponent } from './Views/Components/Pages/kris/kris.component';
import { FormKriComponent } from './Views/Components/Forms/form-kri/form-kri.component';

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    NavmenuComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatPaginatorModule,
    FormKriComponent
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
