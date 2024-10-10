import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IGoalEmpleadoRespuesta } from 'src/app/Models/Evaluacion/IEvaluacion';

@Component({
  selector: 'app-emojirating',
  standalone:true,
  imports:[FormsModule,CommonModule],
  templateUrl: './emojirating.component.html',
  styleUrls: ['./emojirating.component.css']
})
export class EmojiratingComponent implements OnInit{
  selecion:number=0
  valorSeleccionado: number=0;
  constructor(){}

  @Input() supervisor:Boolean=false
  @Input() goalempleadorepuesta:IGoalEmpleadoRespuesta ={
    id: 0,
    evaluacionId: 0,
    goalId: 0,
    repuesta: 0,
    repuestasupervisor: 0,
    weight: 0,
    observacion: ''
  }

  ngOnInit(): void {
    if(this.supervisor){
      this.valorSeleccionado=this.goalempleadorepuesta.repuestasupervisor
    }else{
      this.valorSeleccionado=this.goalempleadorepuesta.repuesta
    }
    
  }
  @Output() selecionemoji = new EventEmitter<IGoalEmpleadoRespuesta>();
  getEmoji(value: number): string {
    const emojis = ['😔', '😐', '🙂', '😄', '😁'];
    return emojis[value - 1];
  }
  
  cambiovalor(valor: number) {
    if (this.valorSeleccionado === valor) {
      // Si el valor ya estaba seleccionado, lo deseleccionamos
      this.valorSeleccionado = 0;
    } else {
      // Si es un nuevo valor, lo seleccionamos
      this.valorSeleccionado = valor;
    }
    if (this.supervisor){
      this.goalempleadorepuesta.repuestasupervisor = this.valorSeleccionado
    }else {
      this.goalempleadorepuesta.repuesta = this.valorSeleccionado
    }
    
    this.selecionemoji.emit(this.goalempleadorepuesta)
    // Actualizar todos los checkboxes
    for (let i = 1; i <= 5; i++) {
      const checkbox = document.getElementById(`jobKnowledgeCheck${i}`) as HTMLInputElement;
      if (checkbox) {
        checkbox.checked = (i === this.valorSeleccionado);
      }
    }

    //console.log('Valor seleccionado:', this.valorSeleccionado);
  }
}
