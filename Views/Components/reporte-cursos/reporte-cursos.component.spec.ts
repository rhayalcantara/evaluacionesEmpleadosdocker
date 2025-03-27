import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReporteCursosComponent } from './reporte-cursos.component';

describe('ReporteCursosComponent', () => {
  let component: ReporteCursosComponent;
  let fixture: ComponentFixture<ReporteCursosComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ReporteCursosComponent]
    });
    fixture = TestBed.createComponent(ReporteCursosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
