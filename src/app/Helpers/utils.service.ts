import { Injectable } from '@angular/core';
import { BehaviorSubject, firstValueFrom, Observable } from 'rxjs';
import { DatosServiceService } from '../Services/datos-service.service';
import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "pdfmake/build/vfs_fonts";
// import { IProductDts } from '../Models/Product/IProduct';
import { MatDialog } from '@angular/material/dialog';
import { IEvaluacion, IEvaluacionDesempenoMeta } from '../Models/Evaluacion/IEvaluacion';
import { IEmpleado } from '../Models/Empleado/IEmpleado';
import { IPeriodo } from '../Models/Periodos/IPeriodo';
import { HttpClient } from '@angular/common/http';
import { Evaluacion } from '../Controllers/Evaluacion';
import * as JSZip from 'jszip';


//(<any>pdfMake).vfs = pdfFonts.pdfMake.vfs;

@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  public logoBase64: string = '';

  constructor(
    private tool:DatosServiceService,
    public EvaluacionController: Evaluacion,
    private http: HttpClient
    ){
      this.loadLogoAsBase64();
       this.evaluacionempleado = this.EvaluacionController.inicializamodelo();
    }

  private loadLogoAsBase64() {
    this.http.get('assets/LOGO-COOPASPIRE.png', { responseType: 'blob' }).subscribe(blob => {
      const reader = new FileReader();
      reader.onloadend = () => {
        this.logoBase64 = reader.result as string;
      };
      reader.readAsDataURL(blob);
    });
  }
 public evaluacionempleado: IEvaluacion ={
    id: 0,
    periodId: 0,
    empleadoSecuencial: 0,
    totalCalculo: 0,
    fechaRepuestas: '',
    observacion: '',
    evaluacionGoals: [],
    evaluacionDesempenoMetas: [],
    goalEmpleadoRespuestas: [],
    puntuaciondesempenocolaborador: 0,
    puntuacioncompetenciacolaborador: 0,
    totalcolaborador: 0,
    puntuaciondesempenosupervidor: 0,
    puntuacioncompetenciasupervisor: 0,
    totalsupervisor: 0,
    estadoevaluacion: '',
    entrevistaConSupervisor: false,
    aceptaEnDisgusto: false,
    comentarioDisgusto: '',
    porcentajeDesempeno: 0,
    porcentajeCompetencia: 0
  }
  public supervisor:boolean=false;
  static  formatDateForInput(d: string): string {
    let date = new Date(d)

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Los meses en JavaScript van de 0-11
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }


  static automappesimple<T>(obj_source:any,obj_destiny:any){
    
    let campos:string[]=Object.keys(obj_destiny)
    campos.map(ele=>{
      if (typeof(obj_destiny[ele])=='object' && 
        Object.prototype.toString.call(obj_destiny[ele])!='[object Date]' )
      {
        
        if (!Array.isArray(obj_source[ele]))
        {
          let incampos = Object.keys(obj_destiny[ele])
          for (let incontrol of incampos){
            obj_destiny[ele][incontrol]=obj_source[ele][incontrol]
          }
        }
      }
      else
      {
        obj_destiny[ele] = obj_source[ele]
      }    
            
    })
  }

static  generaNss() {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < charactersLength; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}
 static downloadAsPDF(pagos:any[],titulo:string,titulos:any[],Orientacion:string):any {
      let result:string=''
      let campos:string[]=[]
    
      titulos.map(x=>{
        campos.push(...Object.keys(x))
      })
     
      let titulos1:any[]=[];
      let titulos2:any[]=[]; 
      let titulos3:any[]=[];
      let conwhit:string[]=[];
      //let porciento:string=(125/campos.length).toFixed(2);
      let n:number=0;

      titulos.forEach(x=>{
        n++;        
  
        if (n==1){
          titulos2.push({text:titulo, style: 'subheader',colSpan:campos.length, alignment: 'center'})
          conwhit.push(`*`);
        }else{
          titulos2.push({text:''})
          conwhit.push(`auto`);      
        }
       titulos3.push({text: x[Object.keys(x)[0]],style: 'tableHeader', alignment: 'center' })
        
      })
  
    var array :any[][] = []
  
    pagos.map(p=>{
      let rww:any[]=[]
      campos.map(x=>{
        rww.push({text:`${p[x]}`,fontSize:8})
      })
      array.push(rww)
    })    
  
    const documentDefinition:any = { 
        pageSize: 'LETTER',
        pageMargins: [ 40, 60, 10, 60 ],
        //pageOrientation: 'landscape',
        pageOrientation:Orientacion,
        footer: function(currentPage:number) { 
          return [
              {text: 'Rhay Alcantara Programador (809-303-8210)',fontSize:8 ,alignment:  'center' },
              {text: 'Pag:'+currentPage.toString() ,alignment:  'right',margin: [ 0, 0, 50, 0 ] }  ]
        },
        content:[
          {
          text: 'CoopAspire',
          fontSize: 16,
          alignment: 'center',
          color: '#047886'
        },
        {
          text: titulo,
          fontSize: 14,
          alignment: 'center',
          margin:[0,0,0,10]
        },
        {
          layout: 'lightHorizontalLines',
          style:'tableExample',
          table:{
          widths: [...conwhit],
          headerRows: 1,        
          body: [ titulos3,
          ...array]
          }
        }
   ], 	styles: {
		header: {
			fontSize: 18,
			bold: true,
			margin: [0, 0, 0, 10]
		},
		subheader: {
			fontSize: 16,
			bold: true,
			margin: [0, 10, 0, 5]
		},
		tableExample: {
			margin: [10, 5, 10, 15]
		},
		tableHeader: {
			bold: true,
			fontSize: 13,
			color: 'black'
		}
	},
	defaultStyle: {
		// alignment: 'justify'
	}
    };
 
    const pdfDocGenerator = pdfMake.createPdf(documentDefinition);
    // return null
    return pdfDocGenerator
      
      // pdfMake.createPdf(documentDefinition).open();
      //.download(); 
      // pdfMake.createPdf(documentDefinition).getDataUrl().then((dataUrl) => {
      //   const dialogRef = this.toastr.open(VisorpdfComponent,{width:"85%" ,height:"70%" ,data:{url:dataUrl}}); 
      //   dialogRef.afterClosed().subscribe(result => {
      //   })
      // }, err => {
      //   console.error(err);
      // });
       
    }
  static  capitalizeFirstLetter(texto:string):string {
      return texto.charAt(0).toUpperCase() + texto.slice(1);
    }


  

   async generatePDFEvaluacion(evaluacionempleado: IEvaluacion,
                               empleado: IEmpleado, 
                               periodo: IPeriodo): Promise<void> {
     if (!evaluacionempleado) {
        this.tool.showMessage("No hay datos de evaluación para generar el PDF.", "PDF", "warning");
        return;
     }    
     
     this.evaluacionempleado = await  firstValueFrom(this.EvaluacionController.GetEvaluacionePorEmpleadoyPeriodo(empleado.secuencial, periodo.id))
      /*
      .subscribe({
        next: (rep: IEvaluacion) => {
          evaluacionempleado = rep;     
             
        },
        error: (err: Error) => {
          console.error('Error al obtener la evaluación:', err);
         }
      });*/
     
     // Obtener valores calculados como números
     const currentPromedioDesempeno = this.promedioDesempeno(this.evaluacionempleado);
     const currentDesempenoFinal = this.desempenoFinal(this.evaluacionempleado);
     const currentPromedioCompColab = this.promedioCompetenciasColaborador(this.evaluacionempleado);
     const currentPromedioCompSup = this.promedioCompetenciasSupervisor(this.evaluacionempleado);
     const currentCompFinalColab = this.competenciaFinalColaborador(this.evaluacionempleado);
     const currentCompFinalSup = this.competenciaFinalSupervisor(this.evaluacionempleado);
     const currentTotalCalculo = this.totalCalculo(this.evaluacionempleado, this.supervisor);

    try {
      // --- Contenido Competencias ---
      let competenciasContent: any[] = [];
      if (this.evaluacionempleado.evaluacionGoals && this.evaluacionempleado.evaluacionGoals.length > 0) {
          competenciasContent = this.evaluacionempleado.evaluacionGoals.map((goal: any) => {
              const respuesta = (this.evaluacionempleado.goalEmpleadoRespuestas || []).find(r => r.goalId === goal.goalId); // Usar goalId
              const evalEmpleado = respuesta?.repuesta ?? 'N/A';
              const evalSupervisor = respuesta?.repuestasupervisor ?? 'N/A';
              const evaluationText =  `Evaluación Empleado: ${evalEmpleado} - Evaluación Supervisor: ${evalSupervisor}` ;
              const nombre = goal.goal?.objetivo?.nombre ?? 'Competencia sin nombre';
              const descripcion = goal.goal?.objetivo?.descripcion ?? 'Sin descripción';
              let observacion = respuesta?.observacion ?? 'Sin observación';
              let observacionSupervisor = respuesta?.observacionsupervisor ?? 'Sin observación';
              const observacionempleado = `Comentario Empleado : ${observacion}`;
              const observacionsupervisor = `Comentario Supervisor : ${observacionSupervisor}`;	
             
              return [
                  { text: nombre, style: 'goalHeader' },
                  { text: descripcion, style: 'goalDescription' },
                  { text: evaluationText },
                  { text: observacionempleado },
                  { text: observacionsupervisor },
                  { text: '\n' }
              ];
          }).flat();
      } else {
          competenciasContent.push({ text: 'No hay competencias definidas.', italics: true, margin: [0, 5, 0, 10] });
      }


      // --- Contenido Cursos ---
      const cursosContent = this.evaluacionempleado.evaluacionCursoCapacitacions && this.evaluacionempleado.evaluacionCursoCapacitacions.length > 0 ? [
        { text: 'Cursos de Capacitación Sugeridos:', style: 'sectionHeader' },
        {
          ul: this.evaluacionempleado.evaluacionCursoCapacitacions.map(curso =>
            `${curso.cursoCapacitacion?.descripcion ?? 'Curso desconocido'} - Por qué: ${curso.porque || 'No especificado'}`
          )
        },
        { text: '\n' }
      ] : [];

      // --- Contenido Objetivos ---
  
      let objetivosTableBody: any[] = [];
      if (this.evaluacionempleado.evaluacionDesempenoMetas && this.evaluacionempleado.evaluacionDesempenoMetas.length > 0) {
          objetivosTableBody = [
              [ 'Tipo', 'Descripción', 'Meta', 'Peso', 'Logro', '%' ].map(h => ({ text: h, style: 'tableHeader' })),
              ...(this.evaluacionempleado.evaluacionDesempenoMetas.map(item => [
                  item.tipo || '',
                  item.descripcion || '',
                  item.meta?.toString() || 'N/A',
                  (item.peso?.toString() ?? '0') + '%',
                  item.evaluacioneDesempenoMetaRespuestas?.logro?.toString() || '0',
                  this.calculatePercentage(item) + '%'
              ]))
          ];
      }

      // --- Contenido Principal ---
      const content: any[] = [
         {
          columns: [
            { text: periodo?.descripcion ?? 'Periodo no especificado', style: 'header', width: '*' },
            { image: this.logoBase64 || '', width: 100, alignment: 'right' }
          ]
        },
        {
          text: [
            { text: 'Empleado: ', bold: true }, empleado?.nombreunido ?? 'N/A', '\n',
            { text: 'Departamento: ', bold: true }, empleado?.departamento ?? 'N/A', '\n',
            { text: 'Periodo: ', bold: true }, periodo?.descripcion ?? 'N/A', '\n',
            { text: 'Fecha Generación: ', bold: true }, new Date().toLocaleDateString(), '\n\n'
          ]
        },
        // --- Tabla Objetivos (Condicional) ---
        ...(objetivosTableBody.length > 0 ? [
            { table: { widths: ['*'], body: [[{ text: 'Objetivos de Desempeño', style: 'categoryHeader' }]] }, layout: 'noBorders', margin: [0, 10, 0, 5] },
            {
              table: { headerRows: 1, widths: ['auto', '*', 'auto', 'auto', 'auto', 'auto'], body: objetivosTableBody },
              layout: 'lightHorizontalLines'
            },
        ] : [{ text: 'No hay objetivos de desempeño definidos.', italics: true, margin: [0, 10, 0, 10] }]), // Mensaje si no hay objetivos

        // --- Tabla Competencias (Condicional) ---
         { table: { widths: ['*'], body: [[{ text: 'Competencias', style: 'categoryHeader' }]] }, layout: 'noBorders', margin: [0, 15, 0, 5] },
         ...competenciasContent, // Ya incluye mensaje si está vacío
        // ******** INICIO: SALTO DE PÁGINA ********
        { text: '', pageBreak: 'before' },
        // ******** FIN: SALTO DE PÁGINA ********

        // --- Tabla Resultados --- Ponderación Evaluación (20% Autoeva + 80% Eva Supervisor)
        {
          table: {
            widths: ['*', 'auto', 'auto'],
            body: [
              [{ text: `RESULTADOS OBJETIVOS (${(this.porcentajeDesempeno).toFixed(0)}%)`, style: 'resultsHeader', colSpan: 3, alignment: 'center', fillColor: '#3498DB', color: 'white' }, {}, {}],
              [{ text: 'Total Peso:', bold: true }, {}, { text: '100%', alignment: 'right' }],
              [{ text: 'Promedio Objetivos:', bold: true }, {}, { text: `${currentPromedioDesempeno.toFixed(2)}%`, alignment: 'right' }],
              [{ text: `Desempeño Objetivo (${(this.porcentajeDesempeno ).toFixed(0)}%):`, bold: true }, {}, { text: (currentDesempenoFinal/100).toFixed(2), alignment: 'right' }],
              [{ text: `RESULTADOS COMPETENCIAS (${(this.porcentajeCompetencia ).toFixed(0)}%)`, style: 'resultsHeader', colSpan: 3, alignment: 'center', fillColor: '#3498DB', color: 'white' }, {}, {}],
              [{ text: `COMPETENCIAS (${(this.porcentajeCompetencia).toFixed(0)}%)`, style: 'resultsSubHeader', fillColor: '#EAECEE' },  { text: 'Evaluación Supervisor', style: 'resultsSubHeader', alignment: 'right', fillColor: '#EAECEE' } , { text: 'Autoevaluación', style: 'resultsSubHeader', alignment: 'right', fillColor: '#EAECEE' }],
              [{ text: 'Promedio Desempeño de las Competencias' },  { text: currentPromedioCompSup.toFixed(2), alignment: 'right' } , { text: currentPromedioCompColab.toFixed(2), alignment: 'right' }],
              [{ text: `Desempeño Final (${(this.porcentajeCompetencia ).toFixed(0)}%):` },  { text: (currentCompFinalSup/100).toFixed(2), alignment: 'right' } , { text: (currentCompFinalColab/100).toFixed(2), alignment: 'right' }],
              [{ text: 'Total Evaluación (Objetivos + Competencias)' }, { text: ((currentDesempenoFinal + currentCompFinalSup)/100).toFixed(2), alignment: 'right' } , { text: ((currentDesempenoFinal + currentCompFinalColab)/100).toFixed(2), alignment: 'right' }],
              [{ text: 'Ponderación Evaluación ( 80% Eva Supervisor+20% Autoeva )' }, { text: (((currentDesempenoFinal + currentCompFinalSup)/100)*.8).toFixed(2), alignment: 'right' } , { text: (((currentDesempenoFinal + currentCompFinalColab)/100)*.2).toFixed(2), alignment: 'right' }],
              [{ text: 'Puntuación Final', style: 'resultsTotal',colSpan: 2, bold: true, fillColor: '#D5F5E3' }, {}, { text: ((((currentDesempenoFinal + currentCompFinalSup)/100)*.8)+(((currentDesempenoFinal + currentCompFinalColab)/100)*.2)).toFixed(2), style: 'resultsTotal', bold: true, alignment: 'right', fillColor: '#D5F5E3' }]
            ]
          },
          layout: 'lightHorizontalLines', style: 'resultsTable'
        },
        // --- Cursos y Comentarios ---
        ...cursosContent,
        { text: 'Comentario Adicional:', style: 'sectionHeader' },
        { text: this.evaluacionempleado.observacion || 'Sin comentarios adicionales.', margin: [0, 0, 0, 20] },
        // --- Firmas ---
        {
          columns: [
            { qr: `Empleado: ${empleado?.nombreunido ?? 'N/A'}\nPeriodo: ${periodo?.descripcion ?? 'N/A'}\nFecha: ${new Date().toLocaleDateString()}\nPuntaje: ${currentTotalCalculo.toFixed(2)}`, fit: '80' },
            { text: '', width: '*' },
            {
              stack: [
                { text: '\n\n\n_________________________', style: 'signatureLine' },
                { text: 'Firma del Empleado', style: 'signatureText' },
                 { text: `Fecha: ${this.evaluacionempleado.fechaRepuestas ? new Date(evaluacionempleado.fechaRepuestas).toLocaleDateString() : '_______________'}`, style: 'signatureText' }
              ], width: 'auto' 
            },
            { text: '', width: '*' },
            {
              stack: [
                { text: '\n\n\n_________________________', style: 'signatureLine' },
                { text: 'Firma del Supervisor', style: 'signatureText' },
                 { text: `Fecha: _______________`, style: 'signatureText' }
              ], width: 'auto'
            }
          ],
          margin: [0, 40, 0, 0]
        }
      ];

      // --- Definición del Documento ---
      const docDefinition: any = {
        content,
        styles: {
          header: { fontSize: 18, bold: true, alignment: 'center', margin: [0, 0, 0, 15], color: '#1a237e' },
          categoryHeader: { fontSize: 12, bold: true, alignment: 'left', color: 'white', fillColor: '#5DADE2', margin: [0, 5, 0, 5] },
          tableHeader: { fontSize: 10, bold: true, fillColor: '#AEB6BF', color: 'black', alignment: 'center' },
          goalHeader: { fontSize: 11, bold: true, margin: [0, 8, 0, 2], alignment: 'left' },
          goalDescription: { fontSize: 9, italics: true, margin: [0, 0, 0, 4], alignment: 'left' },
          sectionHeader: { fontSize: 12, bold: true, margin: [0, 15, 0, 5], alignment: 'left', color: '#1A5276' },
          resultsTable: { margin: [0, 15, 0, 15] },
          resultsHeader: { fontSize: 12, bold: true, color: 'white', margin: [0, 4, 0, 4] },
          resultsSubHeader: { fontSize: 10, bold: true, margin: [0, 2, 0, 2] },
          resultsTotal: { fontSize: 11, bold: true, margin: [0, 4, 0, 4] },
          signatureLine: { margin: [0, 0, 0, 2], alignment: 'center' },
          signatureText: { fontSize: 9, alignment: 'center' }
        },
        defaultStyle: { alignment: 'justify', fontSize: 10 }
      };

      pdfMake.createPdf(docDefinition).download(`evaluacion_${empleado?.nombreunido ?? 'empleado'}_${periodo?.descripcion ?? 'periodo'}.pdf`);
    } catch (error) {
      console.error('Error detallado al generar el PDF:', error);
      this.tool.showMessage('Error al generar el PDF. Verifique la consola para más detalles.', "PDF", 'error');
    }
  }

  async generatePDFEvaluacionBlob(evaluacionempleado: IEvaluacion,
                                  empleado: IEmpleado,
                                  periodo: IPeriodo): Promise<Blob> {
    if (!evaluacionempleado) {
      throw new Error("No hay datos de evaluación para generar el PDF.");
    }

    this.evaluacionempleado = await firstValueFrom(this.EvaluacionController.GetEvaluacionePorEmpleadoyPeriodo(empleado.secuencial, periodo.id));

    // Obtener valores calculados como números
    const currentPromedioDesempeno = this.promedioDesempeno(this.evaluacionempleado);
    const currentDesempenoFinal = this.desempenoFinal(this.evaluacionempleado);
    const currentPromedioCompColab = this.promedioCompetenciasColaborador(this.evaluacionempleado);
    const currentPromedioCompSup = this.promedioCompetenciasSupervisor(this.evaluacionempleado);
    const currentCompFinalColab = this.competenciaFinalColaborador(this.evaluacionempleado);
    const currentCompFinalSup = this.competenciaFinalSupervisor(this.evaluacionempleado);
    const currentTotalCalculo = this.totalCalculo(this.evaluacionempleado, this.supervisor);

    try {
      // --- Contenido Competencias ---
      let competenciasContent: any[] = [];
      if (this.evaluacionempleado.evaluacionGoals && this.evaluacionempleado.evaluacionGoals.length > 0) {
          competenciasContent = this.evaluacionempleado.evaluacionGoals.map((goal: any) => {
              const respuesta = (this.evaluacionempleado.goalEmpleadoRespuestas || []).find(r => r.goalId === goal.goalId);
              const evalEmpleado = respuesta?.repuesta ?? 'N/A';
              const evalSupervisor = respuesta?.repuestasupervisor ?? 'N/A';
              const evaluationText =  `Evaluación Empleado: ${evalEmpleado} - Evaluación Supervisor: ${evalSupervisor}` ;
              const nombre = goal.goal?.objetivo?.nombre ?? 'Competencia sin nombre';
              const descripcion = goal.goal?.objetivo?.descripcion ?? 'Sin descripción';
              let observacion = respuesta?.observacion ?? 'Sin observación';
              let observacionSupervisor = respuesta?.observacionsupervisor ?? 'Sin observación';
              const observacionempleado = `Comentario Empleado : ${observacion}`;
              const observacionsupervisor = `Comentario Supervisor : ${observacionSupervisor}`;

              return [
                  { text: nombre, style: 'goalHeader' },
                  { text: descripcion, style: 'goalDescription' },
                  { text: evaluationText },
                  { text: observacionempleado },
                  { text: observacionsupervisor },
                  { text: '\n' }
              ];
          }).flat();
      } else {
          competenciasContent.push({ text: 'No hay competencias definidas.', italics: true, margin: [0, 5, 0, 10] });
      }

      // --- Contenido Cursos ---
      const cursosContent = this.evaluacionempleado.evaluacionCursoCapacitacions && this.evaluacionempleado.evaluacionCursoCapacitacions.length > 0 ? [
        { text: 'Cursos de Capacitación Sugeridos:', style: 'sectionHeader' },
        {
          ul: this.evaluacionempleado.evaluacionCursoCapacitacions.map(curso =>
            `${curso.cursoCapacitacion?.descripcion ?? 'Curso desconocido'} - Por qué: ${curso.porque || 'No especificado'}`
          )
        },
        { text: '\n' }
      ] : [];

      // --- Contenido Objetivos ---
      let objetivosTableBody: any[] = [];
      if (this.evaluacionempleado.evaluacionDesempenoMetas && this.evaluacionempleado.evaluacionDesempenoMetas.length > 0) {
          objetivosTableBody = [
              [ 'Tipo', 'Descripción', 'Meta', 'Peso', 'Logro', '%' ].map(h => ({ text: h, style: 'tableHeader' })),
              ...(this.evaluacionempleado.evaluacionDesempenoMetas.map(item => [
                  item.tipo || '',
                  item.descripcion || '',
                  item.meta?.toString() || 'N/A',
                  (item.peso?.toString() ?? '0') + '%',
                  item.evaluacioneDesempenoMetaRespuestas?.logro?.toString() || '0',
                  this.calculatePercentage(item) + '%'
              ]))
          ];
      }

      // --- Contenido Principal ---
      const content: any[] = [
         {
          columns: [
            { text: periodo?.descripcion ?? 'Periodo no especificado', style: 'header', width: '*' },
            { image: this.logoBase64 || '', width: 100, alignment: 'right' }
          ]
        },
        {
          text: [
            { text: 'Empleado: ', bold: true }, empleado?.nombreunido ?? 'N/A', '\n',
            { text: 'Departamento: ', bold: true }, empleado?.departamento ?? 'N/A', '\n',
            { text: 'Periodo: ', bold: true }, periodo?.descripcion ?? 'N/A', '\n',
            { text: 'Fecha Generación: ', bold: true }, new Date().toLocaleDateString(), '\n\n'
          ]
        },
        // --- Tabla Objetivos (Condicional) ---
        ...(objetivosTableBody.length > 0 ? [
            { table: { widths: ['*'], body: [[{ text: 'Objetivos de Desempeño', style: 'categoryHeader' }]] }, layout: 'noBorders', margin: [0, 10, 0, 5] },
            {
              table: { headerRows: 1, widths: ['auto', '*', 'auto', 'auto', 'auto', 'auto'], body: objetivosTableBody },
              layout: 'lightHorizontalLines'
            },
        ] : [{ text: 'No hay objetivos de desempeño definidos.', italics: true, margin: [0, 10, 0, 10] }]),

        // --- Tabla Competencias (Condicional) ---
         { table: { widths: ['*'], body: [[{ text: 'Competencias', style: 'categoryHeader' }]] }, layout: 'noBorders', margin: [0, 15, 0, 5] },
         ...competenciasContent,
        // ******** INICIO: SALTO DE PÁGINA ********
        { text: '', pageBreak: 'before' },
        // ******** FIN: SALTO DE PÁGINA ********

        // --- Tabla Resultados ---
        {
          table: {
            widths: ['*', 'auto', 'auto'],
            body: [
              [{ text: `RESULTADOS OBJETIVOS (${(this.porcentajeDesempeno).toFixed(0)}%)`, style: 'resultsHeader', colSpan: 3, alignment: 'center', fillColor: '#3498DB', color: 'white' }, {}, {}],
              [{ text: 'Total Peso:', bold: true }, {}, { text: '100%', alignment: 'right' }],
              [{ text: 'Promedio Objetivos:', bold: true }, {}, { text: `${currentPromedioDesempeno.toFixed(2)}%`, alignment: 'right' }],
              [{ text: `Desempeño Objetivo (${(this.porcentajeDesempeno ).toFixed(0)}%):`, bold: true }, {}, { text: (currentDesempenoFinal/100).toFixed(2), alignment: 'right' }],
              [{ text: `RESULTADOS COMPETENCIAS (${(this.porcentajeCompetencia ).toFixed(0)}%)`, style: 'resultsHeader', colSpan: 3, alignment: 'center', fillColor: '#3498DB', color: 'white' }, {}, {}],
              [{ text: `COMPETENCIAS (${(this.porcentajeCompetencia).toFixed(0)}%)`, style: 'resultsSubHeader', fillColor: '#EAECEE' },  { text: 'Evaluación Supervisor', style: 'resultsSubHeader', alignment: 'right', fillColor: '#EAECEE' } , { text: 'Autoevaluación', style: 'resultsSubHeader', alignment: 'right', fillColor: '#EAECEE' }],
              [{ text: 'Promedio Desempeño de las Competencias' },  { text: currentPromedioCompSup.toFixed(2), alignment: 'right' } , { text: currentPromedioCompColab.toFixed(2), alignment: 'right' }],
              [{ text: `Desempeño Final (${(this.porcentajeCompetencia ).toFixed(0)}%):` },  { text: (currentCompFinalSup/100).toFixed(2), alignment: 'right' } , { text: (currentCompFinalColab/100).toFixed(2), alignment: 'right' }],
              [{ text: 'Total Evaluación (Objetivos + Competencias)' }, { text: ((currentDesempenoFinal + currentCompFinalSup)/100).toFixed(2), alignment: 'right' } , { text: ((currentDesempenoFinal + currentCompFinalColab)/100).toFixed(2), alignment: 'right' }],
              [{ text: 'Ponderación Evaluación ( 80% Eva Supervisor+20% Autoeva )' }, { text: (((currentDesempenoFinal + currentCompFinalSup)/100)*.8).toFixed(2), alignment: 'right' } , { text: (((currentDesempenoFinal + currentCompFinalColab)/100)*.2).toFixed(2), alignment: 'right' }],
              [{ text: 'Puntuación Final', style: 'resultsTotal',colSpan: 2, bold: true, fillColor: '#D5F5E3' }, {}, { text: ((((currentDesempenoFinal + currentCompFinalSup)/100)*.8)+(((currentDesempenoFinal + currentCompFinalColab)/100)*.2)).toFixed(2), style: 'resultsTotal', bold: true, alignment: 'right', fillColor: '#D5F5E3' }]
            ]
          },
          layout: 'lightHorizontalLines', style: 'resultsTable'
        },
        // --- Cursos y Comentarios ---
        ...cursosContent,
        { text: 'Comentario Adicional:', style: 'sectionHeader' },
        { text: this.evaluacionempleado.observacion || 'Sin comentarios adicionales.', margin: [0, 0, 0, 20] },
        // --- Firmas ---
        {
          columns: [
            { qr: `Empleado: ${empleado?.nombreunido ?? 'N/A'}\nPeriodo: ${periodo?.descripcion ?? 'N/A'}\nFecha: ${new Date().toLocaleDateString()}\nPuntaje: ${currentTotalCalculo.toFixed(2)}`, fit: '80' },
            { text: '', width: '*' },
            {
              stack: [
                { text: '\n\n\n_________________________', style: 'signatureLine' },
                { text: 'Firma del Empleado', style: 'signatureText' },
                 { text: `Fecha: ${this.evaluacionempleado.fechaRepuestas ? new Date(evaluacionempleado.fechaRepuestas).toLocaleDateString() : '_______________'}`, style: 'signatureText' }
              ], width: 'auto'
            },
            { text: '', width: '*' },
            {
              stack: [
                { text: '\n\n\n_________________________', style: 'signatureLine' },
                { text: 'Firma del Supervisor', style: 'signatureText' },
                 { text: `Fecha: _______________`, style: 'signatureText' }
              ], width: 'auto'
            }
          ],
          margin: [0, 40, 0, 0]
        }
      ];

      // --- Definición del Documento ---
      const docDefinition: any = {
        content,
        styles: {
          header: { fontSize: 18, bold: true, alignment: 'center', margin: [0, 0, 0, 15], color: '#1a237e' },
          categoryHeader: { fontSize: 12, bold: true, alignment: 'left', color: 'white', fillColor: '#5DADE2', margin: [0, 5, 0, 5] },
          tableHeader: { fontSize: 10, bold: true, fillColor: '#AEB6BF', color: 'black', alignment: 'center' },
          goalHeader: { fontSize: 11, bold: true, margin: [0, 8, 0, 2], alignment: 'left' },
          goalDescription: { fontSize: 9, italics: true, margin: [0, 0, 0, 4], alignment: 'left' },
          sectionHeader: { fontSize: 12, bold: true, margin: [0, 15, 0, 5], alignment: 'left', color: '#1A5276' },
          resultsTable: { margin: [0, 15, 0, 15] },
          resultsHeader: { fontSize: 12, bold: true, color: 'white', margin: [0, 4, 0, 4] },
          resultsSubHeader: { fontSize: 10, bold: true, margin: [0, 2, 0, 2] },
          resultsTotal: { fontSize: 11, bold: true, margin: [0, 4, 0, 4] },
          signatureLine: { margin: [0, 0, 0, 2], alignment: 'center' },
          signatureText: { fontSize: 9, alignment: 'center' }
        },
        defaultStyle: { alignment: 'justify', fontSize: 10 }
      };

      // Generar PDF como blob
      return new Promise<Blob>((resolve, reject) => {
        const pdfDocGenerator = pdfMake.createPdf(docDefinition);
        pdfDocGenerator.getBlob((blob: Blob) => {
          resolve(blob);
        });
      });
    } catch (error) {
      console.error('Error detallado al generar el PDF blob:', error);
      throw new Error('Error al generar el PDF blob. Verifique la consola para más detalles.');
    }
  }

  calculatePercentage(item: IEvaluacionDesempenoMeta): string {
    if (!item.evaluacioneDesempenoMetaRespuestas) return '0.00';
    const logro = item.evaluacioneDesempenoMetaRespuestas.logro || 0;
    const meta = item.meta || 1;
    const inverso = item.inverso || false;
    if (meta === 0 && !inverso) return '0.00';
    if (logro === 0 && inverso) return '0.00';
    if (logro === 0 && !inverso) return '0.00';
    const percentage = inverso ? (meta / logro) * 100 : (logro / meta) * 100;
    return percentage.toFixed(2);
  }

  calculateResult(item: IEvaluacionDesempenoMeta): string {
    const percentage = parseFloat(this.calculatePercentage(item));
    const peso = item.peso || 0;
    return ((percentage * peso) / 100).toFixed(2);
  }

// --- Getters para cálculos (devuelven number) ---
  get porcentajeDesempeno(): number {
    return Number(this.EvaluacionController.porcentajeDesempeno) || 30;
  }
  get porcentajeCompetencia(): number {
    return Number(this.EvaluacionController.porcentajeCompetencia) || 70;
  }

  promedioDesempeno(evaluacionempleado: IEvaluacion): number {
     const metas = evaluacionempleado?.evaluacionDesempenoMetas || [];
     if (metas.length === 0) return 0;
     const sumaPorcentajes = metas.reduce((sum, item) => {
        const perc = parseFloat(this.calculatePercentage(item));
        return sum + (isNaN(perc) ? 0 : perc);
     }, 0);
     const avg = sumaPorcentajes / metas.length;
     return isNaN(avg) ? 0 : avg;
  }
   desempenoFinal(evaluacionempleado: IEvaluacion): number {
     return (this.promedioDesempeno(evaluacionempleado) * this.porcentajeDesempeno) || 0;
   }
   promedioCompetenciasSupervisor(evaluacionempleado: IEvaluacion): number {
      return Number(evaluacionempleado?.puntuacioncompetenciasupervisor) || 0;
   }
    promedioCompetenciasColaborador(evaluacionempleado: IEvaluacion): number {
      return Number(evaluacionempleado?.puntuacioncompetenciacolaborador) || 0;
   }
   competenciaFinalSupervisor(evaluacionempleado: IEvaluacion): number {
      return (this.promedioCompetenciasSupervisor(evaluacionempleado) * this.porcentajeCompetencia) || 0;
   }
    competenciaFinalColaborador(evaluacionempleado: IEvaluacion): number {
      return (this.promedioCompetenciasColaborador(evaluacionempleado) * this.porcentajeCompetencia) || 0;
   }
   totalCalculo(evaluacionempleado: IEvaluacion, supervisor: boolean): number {
      const compFinal = supervisor ? this.competenciaFinalSupervisor(evaluacionempleado) : this.competenciaFinalColaborador(evaluacionempleado);
      const total = (Number(this.desempenoFinal(evaluacionempleado)) || 0) + (Number(compFinal) || 0);
      return isNaN(total) ? 0 : total;
   }

/*
  
  porcentajeDesempeno(evaluacionempleado: IEvaluacion): number {
    return Number(evaluacionempleado.porcentajeDesempeno) || 0.2;
  }
  porcentajeCompetencia(evaluacionempleado: IEvaluacion): number {
    return Number(evaluacionempleado.porcentajeCompetencia) || 0.7;
  }
  promedioDesempeno(evaluacionempleado: IEvaluacion): number {
     const metas = evaluacionempleado?.evaluacionDesempenoMetas || [];
     if (metas.length === 0) return 0;
     const sumaPorcentajes = metas.reduce((sum, item) => {
        const perc = parseFloat(this.calculatePercentage(item));
        return sum + (isNaN(perc) ? 0 : perc);
     }, 0);
     const avg = sumaPorcentajes / metas.length;
     return isNaN(avg) ? 0 : avg;
  }
   desempenoFinal(evaluacionempleado: IEvaluacion): number {
     return (this.promedioDesempeno(evaluacionempleado) * this.porcentajeDesempeno(evaluacionempleado)) || 0;
   }
   promedioCompetenciasSupervisor(evaluacionempleado: IEvaluacion): number {
      return Number(evaluacionempleado?.puntuacioncompetenciasupervisor) || 0;
   }
    promedioCompetenciasColaborador(evaluacionempleado: IEvaluacion): number {
      return Number(evaluacionempleado?.puntuacioncompetenciacolaborador) || 0;
   }
   competenciaFinalSupervisor(evaluacionempleado: IEvaluacion): number {
      return (this.promedioCompetenciasSupervisor(evaluacionempleado) * this.porcentajeCompetencia) || 0;
   }
    competenciaFinalColaborador(evaluacionempleado: IEvaluacion): number {
      return (this.promedioCompetenciasColaborador(evaluacionempleado) * this.porcentajeCompetencia(evaluacionempleado)) || 0;
   }
   totalCalculo(evaluacionempleado: IEvaluacion, supervisor: boolean): number {
      const compFinal = supervisor ? this.competenciaFinalSupervisor(evaluacionempleado) : this.competenciaFinalColaborador(evaluacionempleado);
      const total = (Number(this.desempenoFinal(evaluacionempleado)) || 0) + (Number(compFinal) || 0);
      return isNaN(total) ? 0 : total;
   }*/

/*
    static generatePDF(action = 'open',invoice:IProductDts[]) {
      let campos:string[] = Object.keys(invoice[0])
      let i:number = 0
      let docDefinition:any = {
        content: [
          {
            text: 'CoopAspire',
            fontSize: 16,
            alignment: 'center',
            color: '#047886'
          },
          {
            text: 'Productos de Inventario',
            fontSize: 20,
            bold: true,
            alignment: 'center',
            decoration: 'underline',
            color: 'skyblue'
          },
          
          {
            table: {
              headerRows: 1,
              widths: ['*', 'auto', 'auto', 'auto','auto', 'auto', 'auto'],
              body: [
                ['Product', 'Tipo', 'Modelo','Marca','Serial','Referencia', 'Existencia'],
                ...invoice.map(p => ([p.descripcion,p.product_Type,p.modelo,p.marca,p.serial,p.referencia,p.existencia_actual])),
                [{text: 'Total ', colSpan: 7}, {}, {},{}, {},{}, invoice.reduce((sum, p)=> sum + (1), 0).toFixed(2)]
              ]
            }
          },
        ],
        styles: {
          sectionHeader: {
            bold: true,
            decoration: 'underline',
            fontSize: 14,
            margin: [0, 15,0, 15]          
          }
        }
      };
      if(action==='download'|| action ==='print' || action ==='open){
        // pdfMake.createPdf(docDefinition)[action]();
      }
  
    }
*/


private message = new BehaviorSubject<string>('');
public customMessage = this.message.asObservable();

public changeMessage(msg: string): void {
  this.message.next(msg);
}


}
