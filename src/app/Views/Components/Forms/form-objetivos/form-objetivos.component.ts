import { Component, OnInit, Input, Output, EventEmitter, Inject, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { IObjetivo, IGrupoCompetencia } from '../../../../Models/Objetivo/IObjetivo';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Objetivo } from 'src/app/Controllers/Objetivo';
import { DatosServiceService } from 'src/app/Services/datos-service.service';
import { IPeriodo } from 'src/app/Models/Periodos/IPeriodo';
import { IEstado } from 'src/app/Models/Estado/IEstado';

@Component({
  selector: 'app-form-objetivos',
  templateUrl: './form-objetivos.component.html',
  styleUrls: ['./form-objetivos.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class FormObjetivosComponent implements OnInit {
  cancelar() {
    this.dialogRef.close(null)
  }
  @Input() objetivo: IObjetivo | null = null;
  @Output() submitForm = new EventEmitter<IObjetivo>();

  objetivoForm!: FormGroup;
  periodos: IPeriodo[] = [];
  estados: IEstado[] = [];
  gruposCompetencia: IGrupoCompetencia[] = [];

  constructor(
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<FormObjetivosComponent>,
    private objetivoController: Objetivo, 
    private dat: DatosServiceService,
    private cd: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.objetivoController = this.data.model;
    this.objetivo = this.objetivoController.model;
    this.initForm();
    this.loadPeriodos();
    this.loadEstados();
    this.loadGruposCompetencia();
    console.log('Fecha formateada:', this.data.model.fecha, this.formatDateForInput(this.objetivo.fecha));
    this.objetivoForm.patchValue({
      fecha: this.formatDateForInput(this.objetivo.fecha)
    });
    this.cd.detectChanges();
  }

  initForm(): void {
    this.objetivoForm = this.fb.group({
      id: [this.objetivo ? this.objetivo.id : 0],
      nombre: [this.objetivo ? this.objetivo.nombre : '', Validators.required],
      descripcion: [this.objetivo ? this.objetivo.descripcion : '', Validators.required],
      periodoId: [this.objetivo ? this.objetivo.periodoId : null, Validators.required],
      estadoId: [this.objetivo ? this.objetivo.estadoId : null, Validators.required],
      grupocompetenciaid: [this.objetivo ? this.objetivo.grupocompetenciaid : null, Validators.required],
      fecha: [this.objetivo ? this.objetivo.fecha : '', Validators.required]
    });
  }

  loadPeriodos(): void {
    // Assuming there's a method in the controller to get periods
    this.objetivoController.getPeriodos().subscribe((periodos: IPeriodo[]) => {
      this.periodos = periodos;
    });
  }

  loadEstados(): void {
    // Assuming there's a method in the controller to get estados
    this.objetivoController.getEstados().subscribe((estados: IEstado[]) => {
      this.estados = estados;
    });
  }

  loadGruposCompetencia(): void {
    // Assuming there's a method in the controller to get grupos de competencia
    this.objetivoController.getGruposCompetencia().subscribe((grupos: IGrupoCompetencia[]) => {
      this.gruposCompetencia = grupos;
    });
  }

  onPeriodoSelect(event: any): void {
    const selectedPeriodoId = event.target.value;
    this.objetivoForm.patchValue({ periodoId: selectedPeriodoId });
  }

  onEstadoSelect(event: any): void {
    const selectedEstadoId = event.target.value;
    this.objetivoForm.patchValue({ estadoId: selectedEstadoId });
  }

  onGrupoCompetenciaSelect(event: any): void {
    const selectedGrupoCompetenciaId = event.target.value;
    this.objetivoForm.patchValue({ grupocompetenciaid: selectedGrupoCompetenciaId });
  }

  private formatDateForInput(d: string): string {
    let date = new Date(d)
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onSubmit(): void {
    if (this.objetivoForm.valid) {
      this.objetivoController.model = this.objetivoForm.value;
      this.objetivoController.grabar().then((rep) => {
        if (rep) {
          this.submitForm.emit(this.objetivoForm.value);
          this.dat.showMessage("Grabado con éxito", "Objetivo", "success");
        } else {
          this.dat.showMessage("Error al grabar", "Objetivo", "error");
        }
      });
    }
    this.dialogRef.close();
  }
}