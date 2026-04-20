import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardEmpleadoComponent2 } from './card-empleado.component';

describe('CardEmpleadoComponent', () => {
  let component: CardEmpleadoComponent2;
  let fixture: ComponentFixture<CardEmpleadoComponent2>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CardEmpleadoComponent2]
    });
    fixture = TestBed.createComponent(CardEmpleadoComponent2);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
