import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { of } from 'rxjs';
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
        {
          provide: DatosServiceService,
          // getdatos() se necesita porque UtilsService inyecta Evaluacion, que en su
          // constructor llama PorcientoDesempenoCompetencia.Gets() -> datos.getdatos(...)
          useValue: { showMessage: () => {}, getdatos: () => of({ data: [], count: 0, exito: true, mensaje: '' }) }
        },
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

  describe('loadLogoAsBase64', () => {
    it('should fetch assets/LOGO-COOPASPIRE.png as a blob and populate logoBase64 with a data URL', (done) => {
      const httpMock = TestBed.inject(HttpTestingController);
      const req = httpMock.expectOne('assets/LOGO-COOPASPIRE.png');
      expect(req.request.method).toBe('GET');

      const blob = new Blob(['fake-logo-bytes'], { type: 'image/png' });
      req.flush(blob);

      // FileReader.readAsDataURL resuelve de forma asincrona (onloadend)
      setTimeout(() => {
        expect(service.logoBase64).toContain('data:');
        done();
      }, 100);
    });
  });
});
