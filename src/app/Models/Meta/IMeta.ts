
export interface IMeta{
    id:number
    name:string
    periodId:number
    weight:number
    positionSecuencial:number
    tiposid:number
}
export interface IMetaDts extends IMeta{
    puesto: string
    departamento:string
    periodo:string
    Tipo:string
}