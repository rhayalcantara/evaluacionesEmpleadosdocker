import { IPerspectiva } from "../Perspectiva/IPerspectiva";

export interface IPlanExtrategico{
    id: number;
    descripcion:string; 
    cantidad_anos:number;
    planAnos:IPlan_Anos[];	
    perspectiva:IPerspectiva[];
    aspiraciones: IAspiracion[];
}
export interface IPlanExtrategicoCreate{
    id: number;
    descripcion:string; 
    cantidad_anos:number;

}
export interface IPlan_Anos{
    id: number;
    planExtrategicoId: number;
    ano:string
}

export interface IAspiracion{
    id: number; 
    planExtrategicoModelId: number;
    descripcion: string; 
    porcientovalor: string;
    valor:number
}

export interface IObjetivoEstrategico {
    id: number
    perspectivaId: number
    descripcion: string
    perspectiva: IPerspectiva
}

export interface IObjetivoExtrategicoAno {
    id: number;
    objetivoExtrategicoId: number;
    descripcion:string;
    plan_AnosId: number;
    porcientovalor: string ;
    valor: number;
    inverso: boolean ;
    logro: number;

    objetivoEstrategico: IObjetivoEstrategico 
    planano: IPlan_Anos
}

