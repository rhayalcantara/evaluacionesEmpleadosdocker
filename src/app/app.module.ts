import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DashboardComponent } from './Views/Components/Pages/dashboard/dashboard.component';
import { NavmenuComponent } from './Views/Components/navmenu/navmenu.component';

// Import other components as needed

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    NavmenuComponent,
    // Declare other components here
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    CommonModule,
    // Add other necessary modules here
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
