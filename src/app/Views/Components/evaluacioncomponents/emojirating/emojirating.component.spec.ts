import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmojiratingComponent } from './emojirating.component';

describe('EmojiratingComponent', () => {
  let component: EmojiratingComponent;
  let fixture: ComponentFixture<EmojiratingComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EmojiratingComponent]
    });
    fixture = TestBed.createComponent(EmojiratingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
