import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EvaluarequipoconsejalComponent } from './evaluarequipoconsejal.component';

describe('EvaluarequipoconsejalComponent', () => {
  let component: EvaluarequipoconsejalComponent;
  let fixture: ComponentFixture<EvaluarequipoconsejalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvaluarequipoconsejalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EvaluarequipoconsejalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
