export interface IPorcientoDesempenoCompetencia {
    id: number;
    PeriodId: number;
    descripcion: string;
    valor: number;
}

export interface IValoresEvaluacion{
    id: number;
    Titulo: string;
    RangoDesde: number;
    RangoHasta: number;
    valor: number;  
}