export interface IPoliticaEvaluacion{
    id:number
    nombre:string
    tipo:string
    MinimoMesesEmpresaDesde:number     
    MinimoMesesEmpresaHasta:number     
    PermitirEntradaEvaluacion:boolean  

    // Condiciones para promociones e incrementos
   ConsiderarParaIncremento:boolean 
   ConsiderarParaPromocion:boolean  

    // Regla específica en caso de haber sido promovido
    EvaluarSoloParaIncremento:boolean 

    // Regla específica en caso de haber tenido incremento y promoción
    EvaluarSolo:boolean 
}