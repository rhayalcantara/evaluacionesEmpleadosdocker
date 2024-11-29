import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { CardEmpleadoComponent } from '../ViewEmpleado/card-empleado/card-empleado.component';
import { EmojiratingComponent } from '../evaluacioncomponents/emojirating/emojirating.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    CardEmpleadoComponent,
    EmojiratingComponent
  ],
  exports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    CardEmpleadoComponent,
    EmojiratingComponent
  ]
})
export class SharedModule { }
