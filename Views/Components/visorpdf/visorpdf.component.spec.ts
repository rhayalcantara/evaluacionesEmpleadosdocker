import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisorpdfComponent } from './visorpdf.component';

describe('VisorpdfComponent', () => {
  let component: VisorpdfComponent;
  let fixture: ComponentFixture<VisorpdfComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VisorpdfComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VisorpdfComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
