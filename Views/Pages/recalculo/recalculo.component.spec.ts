import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecalculoComponent } from './recalculo.component';

describe('RecalculoComponent', () => {
  let component: RecalculoComponent;
  let fixture: ComponentFixture<RecalculoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RecalculoComponent]
    });
    fixture = TestBed.createComponent(RecalculoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
