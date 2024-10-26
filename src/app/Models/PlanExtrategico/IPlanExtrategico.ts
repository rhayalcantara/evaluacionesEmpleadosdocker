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
    PlanExtrategicoId: number;
    ano:string
}

export interface IAspiracion{
    id: number; 
    planextrategicoid: number;
    descripcion: string; 
    porcientovalor: string;
    valor:number
}