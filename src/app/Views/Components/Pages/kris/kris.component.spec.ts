import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KrisComponent } from './kris.component';

describe('KrisComponent', () => {
  let component: KrisComponent;
  let fixture: ComponentFixture<KrisComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [KrisComponent]
    });
    fixture = TestBed.createComponent(KrisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
