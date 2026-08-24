import { EventEmitter, Injectable, Output } from '@angular/core';
import { combineLatest, map, of, Observable } from 'rxjs';
import { DatosServiceService } from '../Services/datos-service.service';
import { LoggerService } from '../Services/logger.service';
import { ICompetenciaCategoriaPuesto } from '../Models/CompetenciaCategoriaPuesto/ICompetenciaCategoriaPuesto';
import { Objetivo } from './Objetivo';
import { IObjetivoDts } from '../Models/Objetivo/IObjetivo';

/**
 * Controlador del vínculo competencia <-> categoría de puesto.
 *
 * Endpoint: /api/CompetenciaCategoriaPuestoes (GET / GET{id} / POST / PUT{id} / DELETE{id}).
 *
 * A diferencia de otros recursos, el GET del API devuelve el arreglo plano y no el
 * envoltorio ModelResponse, por eso `Gets()` normaliza la respuesta y entrega siempre
 * un arreglo tipado.
 */
@Injectable({
    providedIn: 'root'
})
export class CompetenciaCategoriaPuesto {
    rutaapi: string = this.datos.URL + '/api/CompetenciaCategoriaPuestoes'
    titulomensage: string = 'Competencia por Categoría de Puesto'

    public titulos = [
        { objetivoId: 'Competencia' },
        { categoriaPuestoId: 'Categoría de Puesto' }
    ]

    public model: ICompetenciaCategoriaPuesto = this.inicializamodelo()
    public arraymodel: ICompetenciaCategoriaPuesto[] = []
    public totalregistros: number = 0
    public actualpage: number = 1
    public pagesize: number = 10

    @Output() TRegistros = new EventEmitter<number>();

    constructor(
        private datos: DatosServiceService,
        private logger: LoggerService,
        private objetivos: Objetivo
    ) { }

    public inicializamodelo(): ICompetenciaCategoriaPuesto {
        return {
            id: 0,
            objetivoId: 0,
            categoriaPuestoId: 0
        }
    }

    /** Carga el listado completo en `arraymodel` y actualiza `totalregistros`. */
    public getdatos(): void {
        this.Gets().subscribe({
            next: (rep: ICompetenciaCategoriaPuesto[]) => {
                this.arraymodel = rep
                this.totalregistros = rep.length
                this.TRegistros.emit(this.totalregistros)
            },
            error: (err: Error) => {
                this.logger.error('Error al cargar los vínculos competencia-categoría', err)
            }
        })
    }

    /** GET /api/CompetenciaCategoriaPuestoes */
    public Gets(): Observable<ICompetenciaCategoriaPuesto[]> {
        return this.datos.getdatos<ICompetenciaCategoriaPuesto[]>(this.rutaapi).pipe(
            map((rep: any) => this.normalizar(rep))
        )
    }

    /** GET /api/CompetenciaCategoriaPuestoes/{id} */
    public Get(id: number): Observable<ICompetenciaCategoriaPuesto> {
        return this.datos.getbyid<ICompetenciaCategoriaPuesto>(`${this.rutaapi}/${id}`)
    }

    /** POST /api/CompetenciaCategoriaPuestoes */
    public insert(obj: ICompetenciaCategoriaPuesto): Observable<ICompetenciaCategoriaPuesto> {
        return this.datos.insertardatos<ICompetenciaCategoriaPuesto>(this.rutaapi, obj)
    }

    /**
     * PUT /api/CompetenciaCategoriaPuestoes/{id}
     *
     * OJO: el API responde `204 NoContent`, o sea que este Observable emite `null`,
     * NO la entidad actualizada. No hagas `.subscribe(v => v.id)`; si necesitas la fila
     * después de actualizar, vuelve a leerla con `Get(id)` o `Gets()`.
     * (El `POST`, en cambio, sí devuelve la fila creada con su `id`.)
     */
    public Update(obj: ICompetenciaCategoriaPuesto): Observable<any> {
        return this.datos.updatedatos<ICompetenciaCategoriaPuesto>(`${this.rutaapi}/${obj.id}`, obj)
    }

    /** DELETE /api/CompetenciaCategoriaPuestoes/{id} */
    public Delete(id: number): Observable<any> {
        return this.datos.delbyid(`${this.rutaapi}/${id}`)
    }

    /**
     * Graba el modelo actual: inserta si `id` es 0, actualiza en caso contrario.
     * Devuelve true si la operación terminó bien.
     */
    public async grabar(): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            if (this.model.id === 0) {
                this.insert(this.model).subscribe({
                    next: (rep: ICompetenciaCategoriaPuesto) => {
                        this.model = rep
                        this.datos.showMessage('Registro Insertado Correctamente', this.titulomensage, 'success')
                        this.getdatos()
                        resolve(true)
                    },
                    error: (err: Error) => {
                        this.logger.error('Error al insertar el vínculo competencia-categoría', err)
                        this.datos.showMessage('Error: ' + err.message, this.titulomensage, 'error')
                        resolve(false)
                    }
                })
            } else {
                this.Update(this.model).subscribe({
                    next: () => {
                        this.datos.showMessage('Registro Actualizado Correctamente', this.titulomensage, 'success')
                        this.getdatos()
                        resolve(true)
                    },
                    error: (err: Error) => {
                        this.logger.error('Error al actualizar el vínculo competencia-categoría', err)
                        this.datos.showMessage('Error: ' + err.message, this.titulomensage, 'error')
                        resolve(false)
                    }
                })
            }
        })
    }

    /**
     * Vínculos de una categoría de puesto.
     * El API no tiene filtro propio, así que se filtra en el cliente sobre el GET completo.
     */
    public getPorCategoria(categoriaPuestoId: number): Observable<ICompetenciaCategoriaPuesto[]> {
        return this.Gets().pipe(
            map((vinculos: ICompetenciaCategoriaPuesto[]) =>
                vinculos.filter(x => x.categoriaPuestoId === categoriaPuestoId)
            )
        )
    }

    /**
     * Matriz de vinculación de un periodo: por cada competencia (ObjetivoId) del periodo,
     * el arreglo de CategoriaPuestoId vinculadas.
     *
     * El API de vínculos no expone filtro por periodo (devuelve TODOS los vínculos de
     * TODOS los periodos), por eso el recorte se hace en el cliente. Este método resuelve
     * él mismo las competencias del periodo pidiéndoselas al controlador `Objetivo` y
     * filtrando por `periodoId`, así que `getMatrizPorPeriodo(8)` ya devuelve solo lo del
     * periodo 8, sin depender de que el llamador sepa hacer el filtro.
     *
     * Toda competencia del periodo queda en el mapa aunque no tenga ningún vínculo (con
     * arreglo vacío), para que la matriz pueda pintar la fila completa. Las categorías
     * repetidas se descartan.
     *
     * @param periodoId Periodo cuyas competencias se van a mapear.
     * @param objetivosDelPeriodo Atajo opcional: si el llamador YA tiene los ObjetivoId del
     *        periodo, se usan tal cual y se ahorra la lectura del catálogo. Si se omite o
     *        se pasa vacío, se resuelven internamente.
     */
    public getMatrizPorPeriodo(periodoId: number, objetivosDelPeriodo?: number[]): Observable<Map<number, number[]>> {
        const objetivos$: Observable<number[]> =
            (objetivosDelPeriodo && objetivosDelPeriodo.length > 0)
                ? of(objetivosDelPeriodo)
                : this.competenciasDelPeriodo(periodoId)

        return combineLatest([objetivos$, this.Gets()]).pipe(
            map(([idsObjetivos, vinculos]) => {
                const matriz = new Map<number, number[]>()
                const objetivos = new Set<number>(idsObjetivos)

                // Las competencias del periodo arrancan con su lista vacía
                objetivos.forEach(objetivoId => matriz.set(objetivoId, []))

                for (const vinculo of vinculos) {
                    // Se descarta lo que pertenece a competencias de otros periodos
                    if (!objetivos.has(vinculo.objetivoId)) {
                        continue
                    }
                    const categorias = matriz.get(vinculo.objetivoId)
                    if (categorias && !categorias.includes(vinculo.categoriaPuestoId)) {
                        categorias.push(vinculo.categoriaPuestoId)
                    }
                }

                this.logger.debug('Matriz de competencias por categoría armada', {
                    periodoId,
                    competencias: matriz.size,
                    vinculosTotales: vinculos.length
                })
                return matriz
            })
        )
    }

    /**
     * Ids de las competencias del catálogo (tabla Objetivo) que pertenecen a un periodo.
     * El GET de `/api/Objetivoes` sí viene envuelto en ModelResponse, de ahí el `data`.
     */
    private competenciasDelPeriodo(periodoId: number): Observable<number[]> {
        return this.objetivos.Gets().pipe(
            map((rep: any) => {
                const catalogo: IObjetivoDts[] = Array.isArray(rep)
                    ? rep
                    : (rep && Array.isArray(rep.data) ? rep.data : [])
                if (catalogo.length === 0) {
                    this.logger.warn('El catálogo de competencias vino vacío al armar la matriz')
                }
                return catalogo
                    .filter(x => x.periodoId === periodoId)
                    .map(x => x.id)
            })
        )
    }

    /**
     * El API devuelve el arreglo plano, pero se tolera también el envoltorio
     * ModelResponse por si el endpoint cambia de forma más adelante.
     */
    private normalizar(respuesta: any): ICompetenciaCategoriaPuesto[] {
        if (Array.isArray(respuesta)) {
            return respuesta as ICompetenciaCategoriaPuesto[]
        }
        if (respuesta && Array.isArray(respuesta.data)) {
            return respuesta.data as ICompetenciaCategoriaPuesto[]
        }
        this.logger.warn('Respuesta inesperada de /api/CompetenciaCategoriaPuestoes')
        return []
    }
}
