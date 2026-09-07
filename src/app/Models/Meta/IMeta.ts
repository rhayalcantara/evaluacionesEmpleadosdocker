import { IObjetivo } from "../Objetivo/IObjetivo"
import { IPuesto } from "../Puesto/IPuesto"
import { ITipo } from "../Tipo/ITipo"

export interface IMeta{
    id:number
    name:string
    periodId:number
    weight:number
    positionSecuencial:number
    objetivoid:number    
}
export interface IMetaDts extends IMeta{
    position:IPuesto,
    objetivo:IObjetivo
    puesto: string
    departamento:string
    periodo:string
    objj:string
}

export interface IMetadto{
    id:number
    name:string
    periodId:number
    weight:number
    positionSecuencial:number
    objetivoid:number
}

export interface IPuestoConMetas {
    periodId: number;
    cantidadPuestos: number;
  }

/**
 * Resultado de un alta multiple de metas.
 * El proceso no se aborta cuando una fila falla: se cuenta y se sigue con la siguiente.
 */
export interface IResultadoLoteMetas {
    creadas: number
    fallidas: number
    errores: string[]
}

/**
 * Extremo (origen o destino) de un clonado de metas.
 * Si no se indica el puesto se toman/conservan todos los puestos del periodo.
 */
export interface IReferenciaClonadoMetas {
    periodoId: number
    puestoSecuencial?: number
}

/**
 * Previsualizacion del clonado: que filas se crearian y cuales se saltan
 * por existir ya en el destino (misma clave puesto + competencia + descripcion).
 *
 * advertencias: avisos de que la comprobacion de duplicados puede no ser fiable,
 * porque GET /api/Goals no lista los goals de puestos con departamento en 0
 * (ver scripts/clonar_goals_gh_p7_a_p8.py). Se muestran al usuario antes de ejecutar.
 */
export interface IPrevisualizacionClonadoMetas {
    aCrear: IMeta[]
    duplicadas: IMeta[]
    advertencias: string[]
}

/**
 * Resumen por puesto de las metas de un periodo, para el semaforo de peso
 * de la pantalla de Configuracion de Competencias.
 */
export interface IResumenMetasPuesto {
    puestoSecuencial: number
    puesto: string
    departamento: string
    cantidad: number
    pesoTotal: number
}