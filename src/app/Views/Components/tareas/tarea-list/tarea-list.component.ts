import { Component, OnInit } from '@angular/core';
import { ITarea } from '../../../../Models/Tarea/ITarea';
import { TareaService } from '../../../../Services/tarea.service';
import { LoggerService } from 'src/app/Services/logger.service';

@Component({
  selector: 'app-tarea-list',
  templateUrl: './tarea-list.component.html',
  styleUrls: ['./tarea-list.component.css']
})
export class TareaListComponent implements OnInit {
  tareas: ITarea[] = [];

  constructor(private tareaService: TareaService, private logger: LoggerService) { }

  ngOnInit(): void {
    this.getTareas();
  }

  getTareas(): void {
    this.tareaService.getTareas().subscribe(
      (tareas: ITarea[]) => {
        this.tareas = tareas;
      },
      (error: any) => {
        this.logger.error('Error al obtener las tareas:', error);
      }
    );
  }

  deleteTarea(id: number): void {
    this.tareaService.deleteTarea(id).subscribe(
      () => {
        this.tareas = this.tareas.filter(tarea => tarea.id !== id);
      },
      (error: any) => {
        this.logger.error('Error al eliminar la tarea:', error);
      }
    );
  }
}
