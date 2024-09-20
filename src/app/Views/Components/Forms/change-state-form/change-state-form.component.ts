import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IPeriodo, IPeriodo_Dts } from 'src/app/Models/Periodos/IPeriodo';
import { IEstado } from 'src/app/Models/Estado/IEstado';
import { Periodos } from 'src/app/Controllers/Periodos';
import { Estado } from 'src/app/Controllers/Estado';
import { firstValueFrom } from 'rxjs';
import { DatosServiceService } from 'src/app/Services/datos-service.service';

@Component({
  selector: 'app-change-state-form',
  templateUrl: './change-state-form.component.html',
  styleUrls: ['./change-state-form.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class ChangeStateFormComponent implements OnInit {
  @Input() activePeriod: IPeriodo_Dts=this.periodosController.InicializaModeloDTS();
  @Output() formClosed = new EventEmitter<void>();
  
  changeStateForm!: FormGroup;
  availableStates: IEstado[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private periodosController: Periodos,
    private estadoController: Estado,
    private Datos:DatosServiceService
  ) {}

  ngOnInit() {
    this.initForm();
    this.loadAvailableStates();
  }

  initForm() {
    this.changeStateForm = this.formBuilder.group({
      newState: ['', Validators.required]
    });
  }

  async loadAvailableStates() {
    try {
      const allStates:IEstado[] = (await firstValueFrom(this.estadoController.Gets())).data;
      this.availableStates = allStates.filter(x => x.id > this.activePeriod.estadoid);
    } catch (error) {
      console.error('Error loading available states:', error);
    }
  }

  async onSubmit() {
    
    if (this.changeStateForm.valid) {

      const newStateId = this.changeStateForm.get('newState')!.value;
      if (newStateId!=null){
        this.activePeriod.estadoid=newStateId
        let pp:IPeriodo={
          id:  this.activePeriod.id,
          descripcion:  this.activePeriod.descripcion,
          fechaInicio:  this.activePeriod.fechaInicio,
          fechaFin:  this.activePeriod.fechaFin,
          activa:  this.activePeriod.activa,
          estadoid:  this.activePeriod.estadoid
        }
        try {
          await firstValueFrom(this.periodosController.Update(pp))
          // console.log('State changed successfully');
          
          this.closeForm();
        } catch (error) {
          console.error('Error changing state:', error);
        }
      }else{
        this.Datos.showMessage("Tiene que selecionar un nuevo estado","Cambio de Estado","error")
      }
    }
   

  }

  closeForm() {
    this.formClosed.emit();
  }
}