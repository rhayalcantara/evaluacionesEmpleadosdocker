/**
 * Batería dura de B3 — Controllers/Bitacora.ts (el constructor no la ve).
 * Correr: npx ng test --watch=false --browsers=ChromeHeadless --include=src/app/Controllers/Bitacora.spec.ts
 */
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Bitacora } from './Bitacora';
import { DatosServiceService } from '../Services/datos-service.service';
import { LoggerService } from '../Services/logger.service';
import { IBitacoraEvento } from '../Models/Bitacora/IBitacora';

const DESC = 'Situación: reunión de cierre. Acción: entregó el informe a tiempo. Resultado: aprobado.';
const ev = (o: Partial<IBitacoraEvento> = {}): IBitacoraEvento => ({
  id: 0, empleadoSecuencial: 525, registradoPorSecuencial: 55, fechaEvento: '2026-09-05', tipo: 'Logro', impacto: 'Alto',
  descripcion: DESC, activo: true, competencias: [{ id: 0, bitacoraEventoId: 0, objetivoId: 59 }], ...o
});

describe('Controllers/Bitacora', () => {
  let svc: Bitacora; let http: HttpTestingController; let base: string;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [Bitacora, DatosServiceService, LoggerService]
    });
    svc = TestBed.inject(Bitacora);
    http = TestBed.inject(HttpTestingController);
    base = TestBed.inject(DatosServiceService).URL + '/api/BitacoraEventos';
  });
  afterEach(() => http.verify());

  it('listar arma la query solo con filtros con valor', () => {
    let out: IBitacoraEvento[] = [];
    svc.listar({ empleadoSecuencial: 525, tipo: 'Logro', desde: null, hasta: '', objetivoId: undefined }).subscribe(r => out = r);
    const req = http.expectOne(r => r.url.startsWith(base) && r.method === 'GET');
    expect(req.request.urlWithParams).toContain('empleadoid=525');
    expect(req.request.urlWithParams).toContain('tipo=Logro');
    expect(req.request.urlWithParams).not.toContain('desde');
    expect(req.request.urlWithParams).not.toContain('hasta');
    expect(req.request.urlWithParams).not.toContain('objetivoid');
    req.flush([ev({ id: 1 })]);
    expect(out.length).toBe(1);
  });

  it('listar sin colaborador emite error sin HTTP', (done) => {
    svc.listar({ empleadoSecuencial: 0 }).subscribe({ next: () => fail('no debía emitir'), error: (e) => { expect(String(e.message || e)).toContain('colaborador'); done(); } });
    http.expectNone(r => r.url.startsWith(base));
  });

  it('obtener hace GET por id', () => {
    let out: IBitacoraEvento | undefined;
    svc.obtener(9).subscribe(r => out = r);
    http.expectOne(`${base}/9`).flush(ev({ id: 9 }));
    expect(out?.id).toBe(9);
  });

  it('guardar inválido emite error con los mensajes y no llama al API', (done) => {
    svc.guardar(ev({ descripcion: 'corta', competencias: [] })).subscribe({
      next: () => fail('no debía emitir'),
      error: (e) => { const m = String(e.message || e); expect(m).toContain('30 caracteres'); expect(m).toContain('competencia'); done(); }
    });
    http.expectNone(r => r.url.startsWith(base));
  });

  it('guardar con id 0 hace POST y emite la respuesta normalizada', () => {
    let out: IBitacoraEvento | undefined;
    svc.guardar(ev({ descripcion: '  ' + DESC + '  ', fechaEvento: '2026-09-05T00:00:00' })).subscribe(r => out = r);
    const req = http.expectOne(base);
    expect(req.request.method).toBe('POST');
    const body = JSON.parse(req.request.body);
    expect(body.descripcion).toBe(DESC);
    expect(body.fechaEvento).toBe('2026-09-05');
    expect(body.competencias[0].id).toBe(0);
    req.flush(ev({ id: 33 }));
    expect(out?.id).toBe(33);
  });

  it('guardar con id > 0 hace PUT y emite el evento enviado', () => {
    let out: IBitacoraEvento | undefined;
    svc.guardar(ev({ id: 7, tipo: 'Conducta' })).subscribe(r => out = r);
    const req = http.expectOne(`${base}/7`);
    expect(req.request.method).toBe('PUT');
    expect(JSON.parse(req.request.body).competencias[0].bitacoraEventoId).toBe(7);
    req.flush(null, { status: 204, statusText: 'No Content' });
    expect(out?.id).toBe(7); expect(out?.tipo).toBe('Conducta');
  });

  it('eliminar hace DELETE con secuencial y emite true', () => {
    let out = false;
    svc.eliminar(7, 55).subscribe(r => out = r);
    const req = http.expectOne(r => r.url.startsWith(`${base}/7`) && r.method === 'DELETE');
    expect(req.request.urlWithParams).toContain('secuencial=55');
    req.flush(null, { status: 204, statusText: 'No Content' });
    expect(out).toBeTrue();
  });

  it('resumen y equipo arman las URLs', () => {
    svc.resumen(525, 8).subscribe();
    const r1 = http.expectOne(r => r.url.startsWith(`${base}/resumen`));
    expect(r1.request.urlWithParams).toContain('empleadoid=525'); expect(r1.request.urlWithParams).toContain('periodoid=8');
    r1.flush([]);
    svc.equipo(55).subscribe();
    const r2 = http.expectOne(r => r.url.startsWith(`${base}/equipo`));
    expect(r2.request.urlWithParams).toContain('supervisor=55');
    expect(r2.request.urlWithParams).not.toContain('desde'); expect(r2.request.urlWithParams).not.toContain('hasta');
    r2.flush([]);
    svc.equipo(55, '2026-09-01', '2026-09-30').subscribe();
    const r3 = http.expectOne(r => r.url.startsWith(`${base}/equipo`));
    expect(r3.request.urlWithParams).toContain('desde=2026-09-01'); expect(r3.request.urlWithParams).toContain('hasta=2026-09-30');
    r3.flush([]);
  });

  it('catalogoCompetencias cachea, filtra por periodo, mapea y ordena', () => {
    const urlObj = TestBed.inject(DatosServiceService).URL + '/api/Objetivoes';
    const objetivos = [
      { id: 62, nombre: 'Trabajo en equipo', periodoId: 8, grupoCompetenciaId: 2, grupoCompetencia: { id: 2, nombre: 'Desarrollo' } },
      { id: 60, nombre: 'Enfoque a resultados', periodoId: 8, grupoCompetenciaId: 1, grupoCompetencia: { id: 1, nombre: 'Orientación' } },
      { id: 59, nombre: 'Enfoque al socio', periodoId: 8, grupoCompetenciaId: 1, grupoCompetencia: { id: 1, nombre: 'Orientación' } },
      { id: 1, nombre: 'Enfoque al socio', periodoId: 7, grupoCompetenciaId: 1, grupoCompetencia: null }
    ];
    let a: any[] = []; let b: any[] = [];
    svc.catalogoCompetencias(8).subscribe(r => a = r);
    svc.catalogoCompetencias(8).subscribe(r => b = r);
    const req = http.expectOne(urlObj);
    req.flush({ exito: 200, mensaje: '', count: 4, data: objetivos });
    expect(a.map(x => x.objetivoId)).toEqual([59, 60, 62]);
    expect(a[0]).toEqual({ objetivoId: 59, nombre: 'Enfoque al socio', grupoId: 1, grupo: 'Orientación' });
    expect(b.length).toBe(3);
    let c: any[] = [];
    svc.catalogoCompetencias(7).subscribe(r => c = r);
    http.expectNone(urlObj);
    expect(c.map(x => x.objetivoId)).toEqual([1]); expect(c[0].grupo).toBe('');
    svc.limpiarCacheCatalogo();
    svc.catalogoCompetencias(8).subscribe();
    http.expectOne(urlObj).flush({ exito: 200, mensaje: '', count: 0, data: [] });
  });

  it('guardar no manda fechaRegistro nula ni registradoPorNombre, y convierte Date a YYYY-MM-DD (ronda 2)', () => {
    const e = ev({ fechaRegistro: null, registradoPorNombre: 'X' });
    (e as any).fechaEvento = new Date(2026, 8, 5);
    svc.guardar(e).subscribe();
    const req = http.expectOne(base);
    const body = JSON.parse(req.request.body);
    expect('fechaRegistro' in body).toBeFalse();
    expect('registradoPorNombre' in body).toBeFalse();
    expect(body.fechaEvento).toBe('2026-09-05');
    req.flush(ev({ id: 44 }));
    svc.guardar(ev({ id: 5, fechaRegistro: '2026-09-06T09:00:00' })).subscribe();
    const put = http.expectOne(`${base}/5`);
    expect(JSON.parse(put.request.body).fechaRegistro).toBe('2026-09-06T09:00:00');
    put.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('periodoActivo hace GET crudo', () => {
    let out: any;
    svc.periodoActivo().subscribe(r => out = r);
    http.expectOne(TestBed.inject(DatosServiceService).URL + '/api/Periods/activo').flush({ id: 8, descripcion: 'Medio', fechaInicio: '2026-06-01T00:00:00', fechaFin: '2026-12-31T00:00:00', tipo: 'medio_ano' });
    expect(out.id).toBe(8);
  });

  it('atajos y mensajeError', () => {
    const n = svc.nuevo(525, 55);
    expect(n.empleadoSecuencial).toBe(525); expect(n.registradoPorSecuencial).toBe(55); expect(n.id).toBe(0);
    expect(svc.validar(ev()).valido).toBeTrue();
    expect(Object.keys(svc.filasExcel([ev({ id: 1 })], 'X')[0]).length).toBe(8);
    expect(svc.mensajeError({ error: { mensaje: 'X' } })).toBe('X');
    expect(svc.mensajeError(new Error('Y'))).toBe('Y');
    expect(svc.mensajeError(null)).toBe('Error desconocido');
  });
});
