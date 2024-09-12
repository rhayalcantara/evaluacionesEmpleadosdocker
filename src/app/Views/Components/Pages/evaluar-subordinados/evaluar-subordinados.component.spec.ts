import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EvaluarSubordinadosComponent } from './evaluar-subordinados.component';

describe('EvaluarSubordinadosComponent', () => {
  let component: EvaluarSubordinadosComponent;
  let fixture: ComponentFixture<EvaluarSubordinadosComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EvaluarSubordinadosComponent]
    });
    fixture = TestBed.createComponent(EvaluarSubordinadosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
