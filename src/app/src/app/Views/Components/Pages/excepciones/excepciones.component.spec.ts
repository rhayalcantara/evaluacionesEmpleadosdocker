import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExcepcionesComponent } from './excepciones.component';

describe('ExcepcionesComponent', () => {
  let component: ExcepcionesComponent;
  let fixture: ComponentFixture<ExcepcionesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ExcepcionesComponent]
    });
    fixture = TestBed.createComponent(ExcepcionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
