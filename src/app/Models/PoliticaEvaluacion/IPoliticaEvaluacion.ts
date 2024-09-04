export interface IPoliticaEvaluacion{
    id:number
    nombre:string
    tipo:string
    minimoMesesEmpresaDesde:number     
    minimoMesesEmpresaHasta:number     
    permitirEntradaEvaluacion:boolean  

    // Condiciones para promociones e incrementos
    considerarParaIncremento:boolean 
   considerarParaPromocion:boolean  

    // Regla específica en caso de haber sido promovido
    evaluarSoloParaIncremento:boolean 

    // Regla específica en caso de haber tenido incremento y promoción
    evaluarSolo:boolean 
}