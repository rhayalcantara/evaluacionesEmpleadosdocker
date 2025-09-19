import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { UtilsService } from './utils.service';
import { DatosServiceService } from '../Services/datos-service.service';
import { MatDialog } from '@angular/material/dialog';
import { IEvaluacion } from '../Models/Evaluacion/IEvaluacion';
import { IEmpleado } from '../Models/Empleado/IEmpleado';
import { IPeriodo } from '../Models/Periodos/IPeriodo';

describe('UtilsService', () => {
  let service: UtilsService;
  let datosService: DatosServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        UtilsService,
        { provide: DatosServiceService, useValue: { showMessage: () => {} } },
        { provide: MatDialog, useValue: {} }
      ]
    });
    service = TestBed.inject(UtilsService);
    datosService = TestBed.inject(DatosServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('generatePDFEvaluacion', () => {
    it('should call showMessage when evaluacionempleado is not provided', () => {
      spyOn(datosService, 'showMessage');
      service.generatePDFEvaluacion(null as any, {} as IEmpleado, {} as IPeriodo);
      expect(datosService.showMessage).toHaveBeenCalledWith('No hay datos de evaluación para generar el PDF.', 'PDF', 'warning');
    });

    // Add more tests here to cover the PDF generation logic
  });
});
