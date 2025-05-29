import { Component, OnInit } from '@angular/core';
import { ITarea } from '../../../../Models/Tarea/ITarea';
import { TareaService } from '../../../../Services/tarea.service';

@Component({
  selector: 'app-tarea-list',
  templateUrl: './tarea-list.component.html',
  styleUrls: ['./tarea-list.component.css']
})
export class TareaListComponent implements OnInit {
  tareas: ITarea[] = [];

  constructor(private tareaService: TareaService) { }

  ngOnInit(): void {
    this.getTareas();
  }

  getTareas(): void {
    this.tareaService.getTareas().subscribe(
      (tareas: ITarea[]) => {
        this.tareas = tareas;
      },
      (error: any) => {
        console.error('Error al obtener las tareas:', error);
      }
    );
  }

  deleteTarea(id: number): void {
    this.tareaService.deleteTarea(id).subscribe(
      () => {
        this.tareas = this.tareas.filter(tarea => tarea.id !== id);
        console.log('Tarea eliminada con éxito');
      },
      (error: any) => {
        console.error('Error al eliminar la tarea:', error);
      }
    );
  }
}
