export interface IPorcientoDesempenoCompetencia {
    id: number;
    periodId: number;
    descripcion: string; // aqui solo va Desempeno o Competencia
    valor: number;
}

export interface IValoresEvaluacion{
    id: number;
    Titulo: string;
    RangoDesde: number;
    RangoHasta: number;
    valor: number;  
}