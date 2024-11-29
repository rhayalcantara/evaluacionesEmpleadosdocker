import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResultadoEvaluacionComponent } from './resultado-evaluacion.component';

describe('ResultadoEvaluacionComponent', () => {
  let component: ResultadoEvaluacionComponent;
  let fixture: ComponentFixture<ResultadoEvaluacionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ResultadoEvaluacionComponent]
    });
    fixture = TestBed.createComponent(ResultadoEvaluacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
