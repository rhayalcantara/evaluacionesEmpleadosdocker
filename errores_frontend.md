Build at: 2025-09-19T13:04:45.361Z - Hash: bce4bdf9ffa430d0 - Time: 18022ms

Warning: undefined depends on 'file-saver'. CommonJS or AMD dependencies can cause optimization bailouts.
For more info see: https://angular.io/guide/build#configuring-commonjs-dependencies



Error: src/app/Helpers/utils.service.ts:359:101 - error TS2339: Property 'toFixed' does not exist on type '(evaluacionempleado: IEvaluacion) => number'.

359               [{ text: 'Promedio Objetivos:', bold: true }, {}, { text: `${currentPromedioDesempeno.toFixed(2)}%`, alignment: 'right' }],
                                                                                                      
  ~~~~~~~


Error: src/app/Helpers/utils.service.ts:360:119 - error TS2362: The left-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.

360               [{ text: `Desempeño Objetivo (${(this.porcentajeDesempeno ).toFixed(0)}%):`, bold: true }, {}, { text: (currentDesempenoFinal/100).toFixed(2), alignment: 'right' }],
                                                                                                      
                    ~~~~~~~~~~~~~~~~~~~~~


Error: src/app/Helpers/utils.service.ts:363:100 - error TS2339: Property 'toFixed' does not exist on type '(evaluacionempleado: IEvaluacion) => number'.

363               [{ text: 'Promedio Desempeño de las Competencias' },  { text: currentPromedioCompSup.toFixed(2), alignment: 'right' } , { text: currentPromedioCompColab.toFixed(2), alignment: 'right' }],
                                                                                                      
 ~~~~~~~


Error: src/app/Helpers/utils.service.ts:363:168 - error TS2339: Property 'toFixed' does not exist on type '(evaluacionempleado: IEvaluacion) => number'.

363               [{ text: 'Promedio Desempeño de las Competencias' },  { text: currentPromedioCompSup.toFixed(2), alignment: 'right' } , { text: currentPromedioCompColab.toFixed(2), alignment: 'right' }],
                                                                                                      
                                                                     ~~~~~~~


Error: src/app/Helpers/utils.service.ts:364:103 - error TS2362: The left-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.

364               [{ text: `Desempeño Final (${(this.porcentajeCompetencia ).toFixed(0)}%):` },  { text: (currentCompFinalSup/100).toFixed(2), alignment: 'right' } , { text: (currentCompFinalColab/100).toFixed(2), alignment: 'right' }],
                                                                                                      
    ~~~~~~~~~~~~~~~~~~~


Error: src/app/Helpers/utils.service.ts:364:172 - error TS2362: The left-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.

364               [{ text: `Desempeño Final (${(this.porcentajeCompetencia ).toFixed(0)}%):` },  { text: (currentCompFinalSup/100).toFixed(2), alignment: 'right' } , { text: (currentCompFinalColab/100).toFixed(2), alignment: 'right' }],
                                                                                                      
                                                                         ~~~~~~~~~~~~~~~~~~~~~        


Error: src/app/Helpers/utils.service.ts:365:83 - error TS2365: Operator '+' cannot be applied to types '(evaluacionempleado: import("C:/Proyectos/evaluacionesEmpleadosdocker/src/app/Models/Evaluacion/IEvaluacion").IEvaluacion) => number' and '(evaluacionempleado: import("C:/Proyectos/evaluacionesEmpleadosdocker/src/app/Models/Evaluacion/IEvaluacion").IEvaluacion) => number'.

365               [{ text: 'Total Evaluación (Objetivos + Competencias)' }, { text: ((currentDesempenoFinal + currentCompFinalSup)/100).toFixed(2), alignment: 'right' } , { text: ((currentDesempenoFinal + currentCompFinalColab)/100).toFixed(2), alignment: 'right' }],
                                                                                      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


Error: src/app/Helpers/utils.service.ts:365:178 - error TS2365: Operator '+' cannot be applied to types '(evaluacionempleado: import("C:/Proyectos/evaluacionesEmpleadosdocker/src/app/Models/Evaluacion/IEvaluacion").IEvaluacion) => number' and '(evaluacionempleado: import("C:/Proyectos/evaluacionesEmpleadosdocker/src/app/Models/Evaluacion/IEvaluacion").IEvaluacion) => number'.

365               [{ text: 'Total Evaluación (Objetivos + Competencias)' }, { text: ((currentDesempenoFinal + currentCompFinalSup)/100).toFixed(2), alignment: 'right' } , { text: ((currentDesempenoFinal + currentCompFinalColab)/100).toFixed(2), alignment: 'right' }],
                                                                                                      
                                                                               ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


Error: src/app/Helpers/utils.service.ts:366:98 - error TS2365: Operator '+' cannot be applied to types '(evaluacionempleado: import("C:/Proyectos/evaluacionesEmpleadosdocker/src/app/Models/Evaluacion/IEvaluacion").IEvaluacion) => number' and '(evaluacionempleado: import("C:/Proyectos/evaluacionesEmpleadosdocker/src/app/Models/Evaluacion/IEvaluacion").IEvaluacion) => number'.

366               [{ text: 'Ponderación Evaluación ( 80% Eva Supervisor+20% Autoeva )' }, { text: (((currentDesempenoFinal + currentCompFinalSup)/100)*.8).toFixed(2), alignment: 'right' } , { text: (((currentDesempenoFinal + currentCompFinalColab)/100)*.2).toFixed(2), alignment: 'right' }],
                                                                                                     ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


Error: src/app/Helpers/utils.service.ts:366:198 - error TS2365: Operator '+' cannot be applied to types '(evaluacionempleado: import("C:/Proyectos/evaluacionesEmpleadosdocker/src/app/Models/Evaluacion/IEvaluacion").IEvaluacion) => number' and '(evaluacionempleado: import("C:/Proyectos/evaluacionesEmpleadosdocker/src/app/Models/Evaluacion/IEvaluacion").IEvaluacion) => number'.

366               [{ text: 'Ponderación Evaluación ( 80% Eva Supervisor+20% Autoeva )' }, { text: (((currentDesempenoFinal + currentCompFinalSup)/100)*.8).toFixed(2), alignment: 'right' } , { text: (((currentDesempenoFinal + currentCompFinalColab)/100)*.2).toFixed(2), alignment: 'right' }],
                                                                                                      
                                                                                                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


Error: src/app/Helpers/utils.service.ts:367:130 - error TS2365: Operator '+' cannot be applied to types '(evaluacionempleado: import("C:/Proyectos/evaluacionesEmpleadosdocker/src/app/Models/Evaluacion/IEvaluacion").IEvaluacion) => number' and '(evaluacionempleado: import("C:/Proyectos/evaluacionesEmpleadosdocker/src/app/Models/Evaluacion/IEvaluacion").IEvaluacion) => number'.

367               [{ text: 'Puntuación Final', style: 'resultsTotal',colSpan: 2, bold: true, fillColor: '#D5F5E3' }, {}, { text: ((((currentDesempenoFinal + currentCompFinalSup)/100)*.8)+(((currentDesempenoFinal + currentCompFinalColab)/100)*.2)).toFixed(2), style: 'resultsTotal', bold: true, alignment: 'right', fillColor: '#D5F5E3' }]
                                                                                                      
                               ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


Error: src/app/Helpers/utils.service.ts:367:187 - error TS2365: Operator '+' cannot be applied to types '(evaluacionempleado: import("C:/Proyectos/evaluacionesEmpleadosdocker/src/app/Models/Evaluacion/IEvaluacion").IEvaluacion) => number' and '(evaluacionempleado: import("C:/Proyectos/evaluacionesEmpleadosdocker/src/app/Models/Evaluacion/IEvaluacion").IEvaluacion) => number'.

367               [{ text: 'Puntuación Final', style: 'resultsTotal',colSpan: 2, bold: true, fillColor: '#D5F5E3' }, {}, { text: ((((currentDesempenoFinal + currentCompFinalSup)/100)*.8)+(((currentDesempenoFinal + currentCompFinalColab)/100)*.2)).toFixed(2), style: 'resultsTotal', bold: true, alignment: 'right', fillColor: '#D5F5E3' }]
                                                                                                      
                                                                                        ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


Error: src/app/Helpers/utils.service.ts:379:182 - error TS2339: Property 'toFixed' does not exist on type '(evaluacionempleado: IEvaluacion, supervisor: boolean) => number'.

379             { qr: `Empleado: ${empleado?.nombreunido ?? 'N/A'}\nPeriodo: ${periodo?.descripcion ?? 'N/A'}\nFecha: ${new Date().toLocaleDateString()}\nPuntaje: ${currentTotalCalculo.toFixed(2)}`, fit: '80' },
                                                                                                      
                                                                                   ~~~~~~~


Error: src/app/Helpers/utils.service.ts:465:64 - error TS2349: This expression is not callable.       
  Type 'Number' has no call signatures.

465      return (this.promedioDesempeno(evaluacionempleado) * this.porcentajeDesempeno(evaluacionempleado)) || 0;
                                                                   ~~~~~~~~~~~~~~~~~~~


Error: src/app/Helpers/utils.service.ts:474:78 - error TS2349: This expression is not callable.       
  Type 'Number' has no call signatures.

474       return (this.promedioCompetenciasSupervisor(evaluacionempleado) * this.porcentajeCompetencia(evaluacionempleado)) || 0;
                                                                                 ~~~~~~~~~~~~~~~~~~~~~


Error: src/app/Helpers/utils.service.ts:477:79 - error TS2349: This expression is not callable.       
  Type 'Number' has no call signatures.

477       return (this.promedioCompetenciasColaborador(evaluacionempleado) * this.porcentajeCompetencia(evaluacionempleado)) || 0;
                                                                                  ~~~~~~~~~~~~~~~~~~~~~




** Angular Live Development Server is listening on localhost:4200, open your browser on http://localhost:4200/ **


× Failed to compile.