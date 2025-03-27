import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { RolCategoriaPuesto } from 'src/app/Controllers/RolCategoriaPuesto';
import { CategoriaPuesto } from 'src/app/Controllers/CategoriaPuesto';
import { IRolCategoriaPuesto, IRolCategoriaPuestoDet } from 'src/app/Models/RolCategoriaPuesto/IRolCategoriaPuesto';
import { ICategoriaPuesto } from 'src/app/Models/Puesto/IPuesto';

@Component({
  selector: 'app-form-rol-categoria-puesto',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  templateUrl: './form-rol-categoria-puesto.component.html',
  styleUrls: ['./form-rol-categoria-puesto.component.css']
})
export class FormRolCategoriaPuestoComponent implements OnInit {
  form: FormGroup;
  categoriasPuesto: ICategoriaPuesto[] = [];
  categoriasSeleccionadas: number[] = [];
  categoriasDisponibles: ICategoriaPuesto[] = [];

  constructor(
    private fb: FormBuilder,
    private rolCategoriaService: RolCategoriaPuesto,
    private categoriaPuestoService: CategoriaPuesto,
    public dialogRef: MatDialogRef<FormRolCategoriaPuestoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { model: IRolCategoriaPuesto }
  ) {
    this.form = this.fb.group({
      id: [0],
      descripcion: ['', Validators.required],
      categorias: [[], Validators.required] // Initialize as empty array and make it required
    });
  }

  ngOnInit() {
    // Load categorias first
    this.loadCategoriasPuesto();
    
    if (this.data.model) {
      // Set form values
      this.form.patchValue({
        id: this.data.model.id,
        descripcion: this.data.model.descripcion
      });
      
      // Set selected categories
      if (this.data.model.categorias) {
        this.categoriasSeleccionadas = this.data.model.categorias.map(c => c.categoriaPuestoId);
        this.form.patchValue({
          categorias: this.categoriasSeleccionadas
        });
      }
    }
  }

  loadCategoriasPuesto() {
    this.categoriaPuestoService.Gets().subscribe({
      next: (response) => {
        console.log('Categorias loaded:', response);
        this.categoriasPuesto = response.data;
        this.updateCategoriasDisponibles();
      },
      error: (error) => {
        console.error('Error loading Categorias Puesto:', error);
      }
    });
  }

  updateCategoriasDisponibles() {
    // Get all categorias that are not used in other rolCategoriaPuesto
    this.rolCategoriaService.Gets().subscribe({
      next: (response) => {
        const usedCategorias = new Set<number>();
        
        // Collect all used categorias except for the current rolCategoriaPuesto
        response.data.forEach((rol: IRolCategoriaPuesto) => {
          if (rol.id !== this.data.model.id) {
            rol.categorias.forEach((cat: IRolCategoriaPuestoDet) => {
              usedCategorias.add(cat.categoriaPuestoId);
            });
          }
        });

        // Filter available categorias
        this.categoriasDisponibles = this.categoriasPuesto.filter(
          cat => !usedCategorias.has(cat.id) || this.categoriasSeleccionadas.includes(cat.id)
        );

        console.log('Categorias disponibles:', this.categoriasDisponibles);
      },
      error: (error) => {
        console.error('Error loading Rol Categorias:', error);
      }
    });
  }

  onSubmit() {
    if (this.form.valid) {
      const formValue = this.form.value;
      const selectedCategorias = formValue.categorias as number[];
      
      const rolCategoriaPuesto: IRolCategoriaPuesto = {
        id: formValue.id,
        descripcion: formValue.descripcion,
        categorias: selectedCategorias.map(catId => ({
          id: 0,
          categoriaPuestoId: catId,
          rolCategoriaPuestoId: formValue.id
        }))        
      };
      //console.log('a grabar',rolCategoriaPuesto)
      this.rolCategoriaService.model = rolCategoriaPuesto;
      this.rolCategoriaService.grabar().then(
        (success) => {
          if (success) {
            this.dialogRef.close(rolCategoriaPuesto);
          }
        }
      );
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
