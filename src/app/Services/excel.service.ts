import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import * as FileSaver from 'file-saver';
import * as XLSX from 'xlsx-js-style';
import { LoadingComponent } from '../Views/Components/loading/loading.component';
import { CellObject, WorkSheet, Range, ColInfo } from 'xlsx-js-style'; // Importar tipos necesarios
import { IReporte01 } from '../Models/Evaluacion/IEvaluacion'; // Importar la interfaz necesaria

const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
const EXCEL_EXTENSION = '.xlsx';

@Injectable() // Asegurarse que @Injectable() está presente
export class ExcelService {
constructor(private toastr: MatDialog) { } // Corregido el nombre de la variable a 'toastr' como estaba originalmente

public exportAsExcelFile(json: any[], excelFileName: string): void {
  const dialogRef = this.toastr.open(LoadingComponent,{data:{}});
  const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(json);
  const workbook: XLSX.WorkBook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
  const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  this.saveAsExcelFile(excelBuffer, excelFileName);
  dialogRef.close();
}

private saveAsExcelFile(buffer: any, fileName: string): void {
   const data: Blob = new Blob([buffer], {type: EXCEL_TYPE});
   FileSaver.saveAs(data, fileName + '_export_' + new  Date().getTime() + EXCEL_EXTENSION);
}

// --- NUEVA FUNCIÓN PARA REPORTE 1 CON FORMATO ---
public exportReporte1AsExcelFile(jsonData: IReporte01[], excelFileName: string): void { // Especificar tipo IReporte01[]
  const dialogRef = this.toastr.open(LoadingComponent, { data: {} });

  try {
    // 1. Definir Cabeceras
    const headers = [
      'ID', 'Colaborador', 'OFICINA', 'INICIO CONTRATO', 'Departamento', 'Posición', 'Supervisor', 'Estatus',
      'Total Puntuación Objetivo', 'Resultado Objetivo %', 'Autoevaluación Competencias', 'Autoevaluación Competencias (70%)', // Ajustado 30% a 70% según componente
      'Resultado Final Autoevaluación (30%+70%)', '20% Autoevaluación Resultados', 'Competencia Superior', 'Evaluación del Superior (70%)', // Ajustado según componente
      'Resultado Final Evaluación', '80% Resultados Evaluación', 'Puntuación General (20%+80%)'
    ];

    // Mapear jsonData (IReporte01[]) a un array de arrays para aoa_to_sheet
    const data = jsonData.map(item => [
        item.identificacion || '',
        item.colaborador || '',
        item.oficina || '',
        item.fechA_INGRESO || '', // Asegúrate que el formato de fecha sea adecuado o formatéalo aquí si es necesario
        item.departamento || '',
        item.posision || '',
        item.supervisor || '', 
        item.estatus_evaluacion || '',
        item.puntuaciondesempenocolaborador ?? '', // 'Total Puntuación Objetivo'
        item.objetivo30 ?? '',                     // 'Resultado Objetivo %' (30%)
        item.puntuacioncompetenciacolaborador ?? '', // 'Autoevaluación Competencias'
        item.autocompetencia70 ?? '',              // 'Autoevaluación Competencias (70%)'
        item.autoevaluacion ?? '',                 // 'Resultado Final Autoevaluación (30%+70%)'
        item.autoevaluacion20 ?? '',               // '20% Autoevaluación Resultados'
        item.puntuacioncompetenciasupervisor ?? '', // 'Competencia Superior'
        item.compSuper70 ?? '',                    // 'Evaluación del Superior (70%)'
        item.superevaluacion ?? '',                // 'Resultado Final Evaluación'
        item.superevaluacion80 ?? '',              // '80% Resultados Evaluación'
        item.totalCalculo ?? ''                    // 'Puntuación General (20%+80%)'
    ]);


    // 2. Crear Hoja de Cálculo (Worksheet) con los datos (incluyendo cabeceras)
    const ws: WorkSheet = XLSX.utils.aoa_to_sheet([headers, ...data]); // Pasar cabeceras y datos mapeados

    // 3. Definir Estilos (Basado en la imagen)
    const headerStyle = {
      fill: { fgColor: { rgb: "FFFF00" } }, // Amarillo
      font: { bold: true },
      alignment: { horizontal: 'center', vertical: 'center' }
    };
    const subHeaderStyle = { // Para las cabeceras grises
        fill: { fgColor: { rgb: "D3D3D3" } }, // Gris claro
        font: { bold: true },
        alignment: { horizontal: 'center', vertical: 'center' }
    };
     const yellowCellStyle = { // Para celdas específicas amarillas
        fill: { fgColor: { rgb: "FFFFE0" } } // Amarillo claro
    };


    // 4. Aplicar Estilos a las Cabeceras (Fila 1)
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1'); // Obtener rango de la hoja
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C }); // Fila 0 (primera fila)
      if (ws[cellAddress]) {
        // Aplicar estilo amarillo a todas las cabeceras por defecto
        ws[cellAddress].s = headerStyle;

        // Aplicar estilo gris a cabeceras específicas (Ajustar índices según cabeceras reales)
        // Columnas K, L, M, N (índices 10, 11, 12, 13) -> Autoevaluación
        if (C >= 10 && C <= 13) {
             ws[cellAddress].s = { ...headerStyle, fill: { fgColor: { rgb: "D3D3D3" } } }; // Gris
        }
         // Columnas P, Q, R, S (índices 15, 16, 17, 18) -> Evaluación Superior
         if (C >= 15 && C <= 18) {
             ws[cellAddress].s = { ...headerStyle, fill: { fgColor: { rgb: "D3D3D3" } } }; // Gris
        }
      }
    }

     // 5. Aplicar Estilo Amarillo a Celdas Específicas (Columna J y L -> ahora J y L son Objetivo 30% y Autocomp 70%)
     // Basado en la imagen original, las columnas amarillas son J (Resultado Objetivo %) y L (Autoevaluación Competencias 30% - que ahora mapea a autocompetencia70)
     // Ajustamos los índices: J es 9, L es 11
     for (let R = 1; R <= range.e.r; ++R) {
        const cellAddressJ = XLSX.utils.encode_cell({ r: R, c: 9 }); // Columna J (índice 9) - Resultado Objetivo %
        const cellAddressL = XLSX.utils.encode_cell({ r: R, c: 11 }); // Columna L (índice 11) - Autoevaluación Competencias (70%)
        if (ws[cellAddressJ]) ws[cellAddressJ].s = yellowCellStyle;
        if (ws[cellAddressL]) ws[cellAddressL].s = yellowCellStyle;
     }


    // 6. Ajustar Ancho de Columnas (Aproximado, ajustar según necesidad)
    const colWidths: ColInfo[] = [
      { wch: 15 }, // ID
      { wch: 35 }, // Colaborador
      { wch: 25 }, // OFICINA
      { wch: 15 }, // INICIO CONTRATO
      { wch: 20 }, // Departamento
      { wch: 30 }, // Posición
      { wch: 30 }, // Supervisor
      { wch: 20 }, // Estatus
      { wch: 15 }, // Total Puntuación Objetivo
      { wch: 15 }, // Resultado Objetivo %
      { wch: 18 }, // Autoevaluación Competencias
      { wch: 18 }, // Autoevaluación Competencias (70%)
      { wch: 20 }, // Resultado Final Autoevaluación (30%+70%)
      { wch: 18 }, // 20% Autoevaluación Resultados
      { wch: 18 }, // Competencia Superior
      { wch: 18 }, // Evaluación del Superior (70%)
      { wch: 18 }, // Resultado Final Evaluación
      { wch: 18 }, // 80% Resultados Evaluación
      { wch: 20 }  // Puntuación General (20%+80%)
    ];
    ws['!cols'] = colWidths;

    // 7. Habilitar Autofilro en las cabeceras
    ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { c: 0, r: 0 }, e: { c: headers.length - 1, r: 0 } }) };


    // 8. Crear Libro de Trabajo (Workbook) y Guardar
    const workbook: XLSX.WorkBook = { Sheets: { 'Reporte Evaluacion': ws }, SheetNames: ['Reporte Evaluacion'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    this.saveAsExcelFile(excelBuffer, excelFileName);

  } catch (error) {
    console.error("Error al generar el archivo Excel:", error);
    // Aquí podrías mostrar un mensaje de error al usuario si lo deseas
    // Ejemplo: this.toastr.open(ErrorComponent, { data: { message: 'Error al generar Excel' } });
  } finally {
    dialogRef.close();
  }
}

}
