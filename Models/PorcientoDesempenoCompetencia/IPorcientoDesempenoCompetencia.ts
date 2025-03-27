export interface IPorcientoDesempenoCompetencia {
    id: number;
    periodId: number;
    descripcion: string; // aqui solo va Desempeno o Competencia
    valor: number;
}

export interface IValoresEvaluacion{
    id: number;
    titulo: string;
    rangoDesde: number;
    rangoHasta: number;
    valor: number;  
}