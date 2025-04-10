import { EventEmitter, Injectable, OnInit, Output } from "@angular/core";
import { DatosServiceService } from "../Services/datos-service.service";
import { ModelResponse } from "../Models/Usuario/modelResponse";
import { firstValueFrom, map, Observable } from 'rxjs';
import { IConsejal, IConsejalTeam } from "../Models/Consejal/Iconsejal"; // Importar IConsejal y IConsejalTeam

// Asumimos una interfaz DTO simple para la actualización, similar a EmpleadoRol
// Podría necesitar ajustes según la API real
export interface IConsejalDTs {
    id: number;
    identificacion?: string | null;
    nombreunido?: string | null;
    // consejal_Team no se suele enviar en el DTO de actualización del Consejal principal,
    // usualmente hay endpoints separados para manejar la relación.
    // Si se necesita enviar, se añadiría aquí.
}


@Injectable({
    providedIn: 'root'
})
export class ConsejalController implements OnInit { // Cambiar nombre de clase
    rutaapi: string = this.datos.URL + '/api/Consejals' // Cambiar ruta API
    titulomensage: string = 'Consejales' // Cambiar título
    public model: IConsejal = this.inicializamodelo() // Usar IConsejal
    public titulos = [ // Ajustar o eliminar títulos si no aplican
        { identificacion: 'Identificación' },
        { nombreunido: 'Nombre' }
    ]

    public estado: string = '`' // Mantener o ajustar según necesidad
    public totalregistros: number = 0
    public actualpage: number = 1
    public pagesize: number = 10
    public filtro: string = ''
    public arraymodel: IConsejal[] = [] // Usar IConsejal[]

    public operationSuccessful: boolean = false;
    @Output() TRegistros = new EventEmitter<number>();

    constructor(
        private datos: DatosServiceService
    ) { }

    ngOnInit(): void {
        this.filtro = ""
        this.estado = ""
        this.actualpage = 1
        this.pagesize = 10
        this.getdatos()
    }

    public inicializamodelo(): IConsejal { // Implementar inicialización para IConsejal
        return {
            id: 0,
            identificacion: '',
            nombreunido: '',
            consejal_Team: [] // Inicializar el array vacío
        }
    }

    public getdatos() {
        this.Gets()
            .subscribe({
                next: (rep: ModelResponse) => {
                    this.totalregistros = rep.count
                    this.arraymodel = []
                    this.arraymodel = rep.data
                    this.TRegistros.emit(this.totalregistros)
                }
            })
    }

    // Eliminar métodos específicos de EmpleadoRol si no aplican a Consejal
    // public getEmpleadoRolesPorEmpleado...
    // public getEmpleadoRolesPorRol...

    public filtrar() {
        this.Gets().subscribe(
            (m: ModelResponse) => {
                this.totalregistros = m.count
                this.TRegistros.emit(this.totalregistros)
                this.arraymodel = []
                this.arraymodel = m.data
            }
        )
    }

    public Gets(): Observable<ModelResponse> {
        return this.datos.getdatos<ModelResponse>(this.rutaapi)
    }

    public Get(id: string): Observable<IConsejal> { // Usar IConsejal
        return this.datos.getbyid<IConsejal>(this.rutaapi + `/${id}`)
    }

    public GetCount(): Observable<number> {
        return this.datos.getdatoscount(this.rutaapi + `/count`)
    }

    public insert(obj: IConsejal): Observable<IConsejal> { // Usar IConsejal
        return this.datos.insertardatos<IConsejal>(this.rutaapi, obj);
    }

    public Update(obj: IConsejal): Observable<IConsejalDTs> { // Usar IConsejal y IConsejalDTs
        let objdts: IConsejalDTs = { // Crear DTO para la actualización
            id: obj.id,
            identificacion: obj.identificacion,
            nombreunido: obj.nombreunido
            // No incluir consejal_Team aquí a menos que la API lo requiera explícitamente para la actualización del Consejal
        }
        return this.datos.updatedatos<IConsejalDTs>(this.rutaapi + `/${objdts.id}`, objdts);
    }

    // Método para manejar la relación consejal_Team (Ejemplo: Añadir un empleado al equipo)
    public addEmpleadoToTeam(teamMember: IConsejalTeam): Observable<IConsejalTeam> {
        // Asumiendo un endpoint como /api/Consejals/{consejalId}/team
        // O un endpoint dedicado /api/Consejal_team
        const teamApiUrl = this.datos.URL + '/api/Consejal_team'; // Ajustar según la API real
        return this.datos.insertardatos<IConsejalTeam>(teamApiUrl, teamMember);
    }

    // Método para manejar la relación consejal_Team (Ejemplo: Eliminar un empleado del equipo)
    public removeEmpleadoFromTeam(teamMemberId: number): Observable<any> {
         // Asumiendo un endpoint dedicado /api/Consejal_team/{teamMemberId}
        const teamApiUrl = this.datos.URL + '/api/Consejal_team'; // Ajustar según la API real
        return this.datos.delbyid(teamApiUrl + `/${teamMemberId}`);
    }

    public delete(id: number): Observable<any> { // Añadir método delete
        return this.datos.delbyid(this.rutaapi + `/${id}`);
    }


    public async grabar(): Promise<boolean> { // Adaptar lógica de grabar
        return new Promise<boolean>(async (resolve) => {
            if (this.model.id == 0) {
                // Guardar una copia del equipo antes de insertar
                const equipoOriginal = [...this.model.consejal_Team];
                
                // Limpiar el array de equipo para la inserción inicial
                // (ya que muchos backends no manejan la inserción de relaciones en cascada)
                this.model.consejal_Team = [];
                
                // inserta el registro principal
                await firstValueFrom(this.insert(this.model)).then(
                    async (rep: IConsejal) => { // Usar IConsejal
                        // Actualizar el modelo local con la respuesta, incluyendo el ID asignado
                        this.model = rep;
                        
                        // Ahora que tenemos el ID del consejal, podemos guardar los miembros del equipo
                        if (equipoOriginal.length > 0) {
                            try {
                                // Guardar cada miembro del equipo
                                for (const miembro of equipoOriginal) {
                                    miembro.consejalId = this.model.id; // Asignar el ID del consejal recién creado
                                    await firstValueFrom(this.addEmpleadoToTeam(miembro));
                                }
                                
                                // Recargar el consejal completo con su equipo
                                await firstValueFrom(this.Get(this.model.id.toString())).then(consejalCompleto => {
                                    this.model = consejalCompleto;
                                });
                                
                            } catch (error) {
                                console.error('Error al guardar el equipo del consejal:', error);
                                // Continuar a pesar del error en el equipo
                            }
                        }
                        
                        this.datos.showMessage('Registro Insertado Correctamente', this.titulomensage, "success");
                        this.getdatos(); // Actualizar la lista
                        resolve(true);
                    },
                    (err: Error) => {
                        this.datos.showMessage('Error:' + err.message, this.titulomensage, 'error');
                        resolve(false);
                    }
                );
            } else {
                // actualiza el registro
                await firstValueFrom(this.Update(this.model)).then(
                    (rep: IConsejalDTs) => { // Usar IConsejalDTs
                        // Actualizar el modelo local con los datos enviados si la API no devuelve el objeto completo
                        // this.model.identificacion = rep.identificacion; // Si rep es IConsejalDTs
                        // this.model.nombreunido = rep.nombreunido;
                        this.datos.showMessage('Registro Actualizado Correctamente', this.titulomensage, "success");
                        this.getdatos(); // Actualizar la lista
                        resolve(true);
                    },
                    (err: Error) => {
                        this.datos.showMessage('Error:' + err.message, this.titulomensage, 'error');
                        resolve(false);
                    }
                );
            }
        });
    }
}
