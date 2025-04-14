import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { ConsejalClaveController } from '../../../../../Controllers/ConsejalClaveController';
import { IConsejalClave } from '../../../../../Models/Consejal/Iconsejal';
import { DatosServiceService } from '../../../../../Services/datos-service.service';

@Component({
  selector: 'app-consejal-clave-form',
  templateUrl: './consejal-clave-form.component.html',
  styleUrls: ['./consejal-clave-form.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ]
})
export class ConsejalClaveFormComponent implements OnInit {

  claveForm: FormGroup;
  consejalId: number;
  isLoading = false;
  isEditMode = false; // Para saber si estamos creando o editando (si aplica)
  existingClaveData: IConsejalClave | null = null;

  constructor(
    private fb: FormBuilder,
    private consejalClaveController: ConsejalClaveController,
    public dialogRef: MatDialogRef<ConsejalClaveFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { consejalId: number },
    private datosService: DatosServiceService // O un servicio de notificaciones
  ) {
    this.consejalId = data.consejalId;
    this.claveForm = this.fb.group({
      usuario: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
      // Podrías añadir confirmación de contraseña si es necesario
      // confirmPassword: ['', Validators.required]
    }/*, { validator: this.checkPasswords }*/); // Descomentar si añades confirmación
  }

  ngOnInit(): void {
    // Cargar datos existentes si ya hay una clave para este consejal
    this.loadExistingData();
  }

  // Opcional: Validador para confirmar contraseña
  /*
  checkPasswords(group: FormGroup) {
    const pass = group.get('password')?.value;
    const confirmPass = group.get('confirmPassword')?.value;
    return pass === confirmPass ? null : { notSame: true };
  }
  */

  // Cargar datos si ya existe una clave
  loadExistingData(): void {
    this.isLoading = true;
    // Buscar por consejalId
    this.consejalClaveController.GetByConsejalId(this.consejalId).subscribe({
      next: (clave) => {
        if (clave) {
          this.isEditMode = true;
          this.existingClaveData = clave;
          this.claveForm.patchValue({
            usuario: clave.usuario
            // No rellenar password por seguridad
          });
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading existing key data:', error);
        this.isLoading = false;
        // Si es un 404 (no encontrado), simplemente continuamos en modo creación
        // Para otros errores, podríamos mostrar un mensaje
        if (error.status !== 404) {
          this.datosService.showMessage('Error al cargar datos existentes', 'Error', 'error');
        }
      }
    });
  }

  onSave(): void {
    if (this.claveForm.invalid) {
      this.claveForm.markAllAsTouched(); // Marcar campos como tocados para mostrar errores
      return;
    }

    this.isLoading = true;
    const formData = this.claveForm.value;

    const claveData: IConsejalClave = {
      id: this.existingClaveData ? this.existingClaveData.id : 0, // Usar ID existente si se edita
      consejalId: this.consejalId,
      usuario: formData.usuario,
      password: formData.password, // ¡Considerar seriamente hashear la contraseña antes de enviarla!
      consejal: null // No es necesario enviar el objeto consejal completo
    };

    // Usar el método Save del controlador
    this.consejalClaveController.Save(claveData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.datosService.showMessage('Credenciales guardadas correctamente.', 'Éxito', 'success');
        this.dialogRef.close(true); // Cerrar el diálogo indicando éxito
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error saving credentials:', error);
        this.datosService.showMessage('Error al guardar las credenciales.', 'Error', 'error');
        // No cerrar el diálogo en caso de error para que el usuario pueda reintentar
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false); // Cerrar el diálogo sin guardar
  }
}
