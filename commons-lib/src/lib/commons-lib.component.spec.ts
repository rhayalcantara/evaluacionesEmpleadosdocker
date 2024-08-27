import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonsLibComponent } from './commons-lib.component';

describe('CommonsLibComponent', () => {
  let component: CommonsLibComponent;
  let fixture: ComponentFixture<CommonsLibComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CommonsLibComponent]
    });
    fixture = TestBed.createComponent(CommonsLibComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
