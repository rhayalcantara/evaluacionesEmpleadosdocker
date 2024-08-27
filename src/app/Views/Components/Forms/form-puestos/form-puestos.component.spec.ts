import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormPuestosComponent } from './form-puestos.component';

describe('FormPuestosComponent', () => {
  let component: FormPuestosComponent;
  let fixture: ComponentFixture<FormPuestosComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FormPuestosComponent]
    });
    fixture = TestBed.createComponent(FormPuestosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
