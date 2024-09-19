import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupervisorGoalsComponent } from './supervisor-goals.component';

describe('SupervisorGoalsComponent', () => {
  let component: SupervisorGoalsComponent;
  let fixture: ComponentFixture<SupervisorGoalsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SupervisorGoalsComponent]
    });
    fixture = TestBed.createComponent(SupervisorGoalsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
