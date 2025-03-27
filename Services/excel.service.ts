import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import * as FileSaver from 'file-saver';
import * as XLSX from 'xlsx';
import { LoadingComponent } from '../Views/Components/loading/loading.component';

const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
const EXCEL_EXTENSION = '.xlsx';
@Injectable()
export class ExcelService {
constructor(private  toastr: MatDialog) { }
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
}


