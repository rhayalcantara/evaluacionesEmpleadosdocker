import { EventEmitter, Injectable, Output } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';
import { IExcepcionSupervisorInmediato, IExcepcionSupervisorInmediatoDts } from '../Models/Excepcion/IExcepcionSupervisorInmediato';
import { DatosServiceService } from '../Services/datos-service.service';
import { ModelResponse } from '../Models/Usuario/modelResponse';

@Injectable({
  providedIn: 'root'
})
export class ExcepcionSupervisorInmediato {
    rutaapi: string = this.datos.URL + '/api/ExcepcionSupervisorInmediatoes'
    titulomensage: string = 'Excepciones de Supervisor Inmediato'
  
    public model: IExcepcionSupervisorInmediato = this.inicializamodelo();
    public modeldts:IExcepcionSupervisorInmediatoDts = this.inicializamodeloDts();

    titulos = [      
      { nombreEmpleado: 'Empleado' },
      { nombreDepartmentoriginal: 'Departamento Original' },
      { nombrejefeoriginal: 'Jefe Original' },
      { nombrenuevodepartamento: 'Nuevo Departamento' },
      { nombrenuevojefe: 'Nuevo Jefe' },
      { fechaInicio: 'Fecha Inicio' },
      { fechaFin: 'Fecha Fin' }
    ]
    public estado: string = ''
    public totalregistros: number = 0
    public actualpage: number = 1
    public pagesize: number = 10
    public filtro: string = ''
    public arraymodel: IExcepcionSupervisorInmediatoDts[] = []
    public arraytotal: IExcepcionSupervisorInmediato[] = []
    public operationSuccessful: boolean = false;
    @Output() TRegistros = new EventEmitter<number>();
   
    constructor(
      private datos: DatosServiceService
    ) {}

    ngOnInit(): void {
      this.filtro = ""
      this.estado = ""
      this.actualpage = 1
      this.pagesize = 10
      this.getdatos()
    }

    public inicializamodelo(): IExcepcionSupervisorInmediato {
      return {
        id: 0,
        excepcionId: 0,
        empleadoId: 0,
        departamentoOriginalId: 0,
        jefeOriginalId: 0,
        nuevoDepartamentoId: 0,
        nuevoJefeId: 0,
        fechaInicio: new Date(),
        fechaFin: new Date()
      }
    }

    public inicializamodeloDts():IExcepcionSupervisorInmediatoDts{
      let cd:IExcepcionSupervisorInmediatoDts={
        nombreEmpleado: '',
        nombreDepartmentoriginal: '',
        nombrejefeoriginal: '',
        nombrenuevojefe: '',
        nombrenuevodepartamento: '',
        id: 0,
        excepcionId: 0,
        empleadoId: 0,
        departamentoOriginalId: 0,
        jefeOriginalId: 0,
        nuevoDepartamentoId: 0,
        nuevoJefeId: 0,
        fechaInicio: new Date(),
        fechaFin:  new Date()
      }
      return cd;
    }

    public async getdatos(): Promise<void> {
      try {
        const rep: ModelResponse = await firstValueFrom(this.Gets());
        console.log('llegaron los datos', rep.count)
        this.totalregistros = rep.count
        this.pagesize = rep.count
        this.arraymodel = rep.data   
        this.arraytotal = rep.data
        // Ordenar por fecha de inicio (puedes cambiar esto según tus necesidades)
        this.arraymodel.sort((a, b) => new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime())
        console.log('datos', this.arraymodel)     
        this.TRegistros.emit(this.totalregistros)
      } catch (error) {
        console.error('Error fetching data:', error);
        this.showMessage('Error al cargar los datos', this.titulomensage, 'error');
        throw error;
      }
    }

    public Gets(): Observable<ModelResponse> {
      console.log(this.rutaapi)
      return this.datos.getdatos<ModelResponse>(this.rutaapi)
    }
  
    public Get(id: string): Observable<IExcepcionSupervisorInmediatoDts> {
      return this.datos.getbyid<IExcepcionSupervisorInmediatoDts>(this.rutaapi + `/${id}`)
    }

    public GetCount(): Observable<number> {
      return this.datos.getdatoscount(this.rutaapi + `/count`)
    }
  
    public insert(obj: IExcepcionSupervisorInmediatoDts): Observable<IExcepcionSupervisorInmediatoDts> {  
     // console.log('llego a insert en excepción supervisor inmediato', obj)
       return this.datos.insertardatos<IExcepcionSupervisorInmediatoDts>(this.rutaapi, obj)
       
    }
  
    public Update(obj: IExcepcionSupervisorInmediato): Observable<IExcepcionSupervisorInmediato> {
      return this.datos.updatedatos<IExcepcionSupervisorInmediato>(this.rutaapi + `/${obj.id}`, obj)
    }
  
    public async grabar(): Promise<boolean> {
      return new Promise<boolean>(async (resolve) => {
        try {
          if (this.modeldts.id === 0) {
            // inserta el registro
            
            const rep: IExcepcionSupervisorInmediatoDts = await firstValueFrom(this.insert(this.modeldts));
            console.log(rep)
            this.model = rep
            this.arraymodel.push(rep);
            this.arraytotal.push(rep);
            this.totalregistros++;
            this.TRegistros.emit(this.totalregistros);
            this.showMessage('Registro Insertado Correctamente', this.titulomensage, "success")
            resolve(true)
          } else {
            // actualiza el registro
            console.log(this.model)
            const rep: IExcepcionSupervisorInmediato = await firstValueFrom(this.Update(this.model));
            console.log('se actualizó la excepción:', rep)
            let m = this.arraymodel.find(x => x.id === this.model.id)
            if (m !== undefined) {
              Object.assign(m, this.model)
            }
            this.showMessage('Registro Actualizado Correctamente', this.titulomensage, "success")
            resolve(true)
          }
        } catch (err) {
          console.error('Error al grabar:', err);
          this.showMessage('Error al grabar: ' + (err instanceof Error ? err.message : String(err)), this.titulomensage, 'error')
          resolve(false)
        }
      })
    }

    public cancelar(): void {
      this.model = this.inicializamodelo();
    }

    public async delete(id: number): Promise<boolean> {
      try {
        await firstValueFrom(this.datos.delbyid(this.rutaapi + `/${id}`));
        this.arraymodel = this.arraymodel.filter(x => x.id !== id);
        this.arraytotal = this.arraytotal.filter(x => x.id !== id);
        this.totalregistros--;
        this.TRegistros.emit(this.totalregistros);
        this.showMessage('Registro Eliminado Correctamente', this.titulomensage, "success");
        return true;
      } catch (err) {
        console.error('Error al eliminar:', err);
        this.showMessage('Error al eliminar: ' + (err instanceof Error ? err.message : String(err)), this.titulomensage, 'error');
        return false;
      }
    }

    public showMessage(message: string, title: string, type: string): void {
      this.datos.showMessage(message, title, type);
    }
}