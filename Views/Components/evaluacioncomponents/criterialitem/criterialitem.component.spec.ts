import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CriterialitemComponent } from './criterialitem.component';

describe('CriterialitemComponent', () => {
  let component: CriterialitemComponent;
  let fixture: ComponentFixture<CriterialitemComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CriterialitemComponent]
    });
    fixture = TestBed.createComponent(CriterialitemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
