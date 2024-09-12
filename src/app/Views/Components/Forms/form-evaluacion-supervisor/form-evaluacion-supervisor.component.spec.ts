import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormEvaluacionSupervisorComponent } from './form-evaluacion-supervisor.component';

describe('FormEvaluacionSupervisorComponent', () => {
  let component: FormEvaluacionSupervisorComponent;
  let fixture: ComponentFixture<FormEvaluacionSupervisorComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FormEvaluacionSupervisorComponent]
    });
    fixture = TestBed.createComponent(FormEvaluacionSupervisorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
