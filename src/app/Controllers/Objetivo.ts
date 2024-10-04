import { EventEmitter, Injectable, Output } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IObjetivo, IGrupoCompetencia, IObjetivoDts } from '../Models/Objetivo/IObjetivo';
import { IPeriodo } from '../Models/Periodos/IPeriodo';
import { IEstado } from '../Models/Estado/IEstado';
import { DatosServiceService } from '../Services/datos-service.service';
import { ModelResponse } from '../Models/Usuario/modelResponse';

@Injectable({
  providedIn: 'root'
})
export class Objetivo {
    rutaapi: string = this.datos.URL + '/api/Objetivoes';
    titulomensage: string = 'Objetivos';
  
    titulos=[
      {grupoc: 'Grupo Competencia'},
      {nombre: 'Nombre'},
      {descripcion:'Descripcion'},
      {periodo:'Periodo'},
      {estad:'Estado'},
      {fecha:'Fecha'}
   ]

    public model: IObjetivo = this.inicializamodelo();
    public arraymodel: IObjetivoDts[] = [];
    public totalregistros: number = 0;
    public actualpage:number=0;
    @Output() TRegistros = new EventEmitter<number>();

    constructor(private datos: DatosServiceService) {}

    public inicializamodelo(): IObjetivo {
      return {
        id: 0,
        grupoCompetenciaId: 0,
        nombre: "",
        descripcion: "",
        periodoId: 0,
        estadoId: 0,
        fecha: new Date().toISOString().split('T')[0]
      };
    }

    public getdatos(): void {
      this.Gets().subscribe({
        next: (rep: ModelResponse) => {
          console.log('llegaron los datos', rep.data);
          this.totalregistros = rep.count;
          this.arraymodel = rep.data;
          this.TRegistros.emit(this.totalregistros) 
        }
      });
    }

    public Gets(): Observable<ModelResponse> {
      return this.datos.getdatos<ModelResponse>(this.rutaapi);
    }
  
    public Get(id: string): Observable<IObjetivo> {
      return this.datos.getbyid<IObjetivo>(`${this.rutaapi}/${id}`);
    }

    public insert(obj: IObjetivo): Observable<IObjetivo> {
      return this.datos.insertardatos<IObjetivo>(this.rutaapi, obj);
    }
  
    public Update(obj: IObjetivo): Observable<IObjetivo> {
      return this.datos.updatedatos<IObjetivo>(`${this.rutaapi}/${obj.id}`, obj);
    }
  
    public async grabar(): Promise<boolean> {
      return new Promise<boolean>(async (resolve) => {
        if (this.model.id === 0) {
          this.insert(this.model).subscribe({
            next: (rep: IObjetivo) => {
              this.model = rep;
              this.datos.showMessage('Registro Insertado Correctamente', this.titulomensage, "success");
              resolve(true);
            },
            error: (err: Error) => {
              this.datos.showMessage('Error: ' + err.message, this.titulomensage, 'error');
              resolve(false);
            }
          });
        } else {
          this.Update(this.model).subscribe({
            next: (rep: IObjetivo) => {
              this.datos.showMessage('Registro Actualizado Correctamente', this.titulomensage, "success");
              resolve(true);
            },
            error: (err: Error) => {
              this.datos.showMessage('Error: ' + err.message, this.titulomensage, 'error');
              resolve(false);
            }
          });
        }
      });
    }

    public async delete(id: number): Promise<boolean> {
      return new Promise<boolean>((resolve) => {
        this.datos.delbyid(`${this.rutaapi}/${id}`).subscribe({
          next: () => {
            this.datos.showMessage('Registro Eliminado Correctamente', this.titulomensage, "success");
            resolve(true);
          },
          error: (err: Error) => {
            this.datos.showMessage('Error: ' + err.message, this.titulomensage, 'error');
            resolve(false);
          }
        });
      });
    }

    public getPeriodos(): Observable<IPeriodo[]> {
      return this.datos.getdatos<ModelResponse>(this.datos.URL + '/api/Periods').pipe(
        map((response: ModelResponse) => response.data as IPeriodo[])
      );
    }

    public getEstados(): Observable<IEstado[]> {
      return this.datos.getdatos<ModelResponse>(this.datos.URL + '/api/Estadoes').pipe(
        map((response: ModelResponse) => response.data as IEstado[])
      );
    }

    public getGruposCompetencia(): Observable<IGrupoCompetencia[]> {
      return this.datos.getdatos<ModelResponse>(this.datos.URL + '/api/GrupoCompetencias').pipe(
        map((response: ModelResponse) => response.data as IGrupoCompetencia[])
      );
    }
}