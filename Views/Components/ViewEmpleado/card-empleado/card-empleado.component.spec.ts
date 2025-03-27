import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardEmpleadoComponent } from './card-empleado.component';

describe('CardEmpleadoComponent', () => {
  let component: CardEmpleadoComponent;
  let fixture: ComponentFixture<CardEmpleadoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CardEmpleadoComponent]
    });
    fixture = TestBed.createComponent(CardEmpleadoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
